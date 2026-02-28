"""
Cortex — Exa-based Discovery Pipeline Orchestrator.

Profile → Stage 2 (discovery agent via CortexAgent loop) → Stage 3 (deep research) → topic folders.

Uses the existing CortexAgent tool-calling loop with stage-specific system prompts
and restricted tool sets.
"""
import json
import logging
import os
import re
from datetime import datetime, timedelta
from pathlib import Path

import yaml
from dotenv import load_dotenv
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"
MINIMAX_MODEL = "MiniMax-M2.5"

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TOPICS_DIR = DATA_DIR / "topics"
PROFILES_DIR = DATA_DIR / "profiles"

MAX_TOOL_ROUNDS = 20  # discovery agent needs many rounds (multiple searches + fetches)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_think_tags(text: str) -> str:
    return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL).strip()


def _extract_json(raw: str):
    """Extract JSON from LLM response. Handles <think> tags and code fences."""
    text = _strip_think_tags(raw)
    if "```" in text:
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for pattern in [r"(\[[\s\S]*\])", r"(\{[\s\S]*\})"]:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    raise ValueError(f"Could not extract JSON from response: {text[:300]}...")


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    if len(slug) > 60:
        slug = slug[:60].rsplit("-", 1)[0]
    return slug.strip("-")


# ---------------------------------------------------------------------------
# Stage 2 tools — exa_search with days_back, web_fetch
# ---------------------------------------------------------------------------

async def _exa_search(query: str, max_results: int = 5, days_back: int | None = None) -> str:
    """Exa search with optional date filtering."""
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        return "Error: EXA_API_KEY not set"
    try:
        from exa_py import Exa
        exa = Exa(api_key=api_key)

        kwargs = {}
        if days_back is not None:
            kwargs["start_published_date"] = (
                datetime.now() - timedelta(days=days_back)
            ).strftime("%Y-%m-%dT%H:%M:%SZ")

        results = exa.search(
            query,
            type="auto",
            num_results=min(max_results, 10),
            exclude_domains=["youtube.com"],
            contents={
                "highlights": {"num_sentences": 3, "highlights_per_url": 2},
                "summary": {"query": query},
            },
            **kwargs,
        )
    except Exception as e:
        return f"Error: Exa search failed: {e}"

    if not results.results:
        return f"No results found for '{query}'"

    lines = [f"## Search Results for '{query}'", ""]
    for i, r in enumerate(results.results, 1):
        lines.append(f"### {i}. {r.title or 'No title'}")
        if r.url:
            lines.append(f"URL: {r.url}")
        date_str = getattr(r, "published_date", None) or "no date"
        lines.append(f"Published: {date_str}")
        if hasattr(r, "summary") and r.summary:
            lines.append(f"Summary: {r.summary[:300]}")
        if hasattr(r, "highlights") and r.highlights:
            for h in r.highlights[:2]:
                lines.append(f"> {h[:300]}")
        lines.append("---")
    return "\n".join(lines)


async def _web_fetch(url: str) -> str:
    """Fetch and extract text from a URL."""
    if not url:
        return "Error: Missing URL"
    try:
        import httpx
        async with httpx.AsyncClient(
            follow_redirects=True, timeout=30,
            headers={"User-Agent": "Mozilla/5.0 (compatible; Cortex/1.0)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        return f"Error fetching {url}: {e}"
    try:
        import trafilatura
        content = trafilatura.extract(html, include_links=True, output_format="txt")
    except ImportError:
        content = re.sub(r"<[^>]+>", " ", html)
        content = re.sub(r"\s+", " ", content).strip()
    if not content or len(content.strip()) < 50:
        return f"Page returned empty or minimal content: {url}"
    if len(content) > 15000:
        content = content[:15000] + "\n\n... (truncated)"
    return content


# ---------------------------------------------------------------------------
# Tool schemas for Stage 2
# ---------------------------------------------------------------------------

STAGE2_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "exa_search",
            "description": "Search the web using Exa semantic search. Returns results with titles, URLs, summaries, and highlights. Use days_back to limit to recent results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "max_results": {"type": "integer", "description": "Max results (default: 5)", "default": 5},
                    "days_back": {"type": "integer", "description": "Only include results from the last N days"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_fetch",
            "description": "Fetch a web page and return its content as clean text. Use to verify substance before including a candidate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to fetch"},
                },
                "required": ["url"],
            },
        },
    },
]

STAGE2_HANDLERS = {
    "exa_search": _exa_search,
    "web_fetch": _web_fetch,
}


# ---------------------------------------------------------------------------
# Stage 2 system prompt
# ---------------------------------------------------------------------------

STAGE2_SYSTEM_PROMPT = """You are the Discovery Agent for Cortex, an editorial discovery engine.

Today is {today}. You are searching for developments from the last {time_window}.

Your job is to find developments that materially matter within a monitoring scope, filter noise aggressively, and output a ranked list of candidates worth deeper investigation.

You are NOT a news aggregator. You are NOT a summarizer. You are a skeptical editorial desk that decides what deserves attention.

## Input

You receive a monitoring task with:
- task_text: an editorial brief describing what to monitor and what matters
- allowed_source_families: where to search
- constraints: max_candidates, prefer_primary_sources

## How to Search

Use exa_search with MULTIPLE targeted queries. Never rely on one broad search.

IMPORTANT: Always pass days_back={time_window_days} to exa_search to limit results to the monitoring window.

Search strategy:
1. Break the task_text into 3-5 concrete search angles:
   - Search by subtheme (e.g., "agent framework release 2026")
   - Search by actor (e.g., "LangChain announcement", "OpenAI agents SDK")
   - Search by release type (e.g., "open source LLM tool launch")
   - Search by source class (e.g., "arxiv agent orchestration paper")
2. Run each search separately with exa_search (always with days_back={time_window_days})
3. Use web_fetch to read the most promising results — verify they have substance
4. Compare primary sources against secondary coverage

## How to Filter

Be aggressive. Prefer missing a marginal item over including junk.

Kill these:
- SEO listicles and "top 10" articles
- Shallow summaries that add no new information
- Generic AI hype with no specific development
- Duplicate coverage of the same underlying event
- Tiny feature updates with no downstream consequence

Keep these:
- Notable framework/tool releases
- Important papers with novel results
- Production-grade open-source launches
- Benchmark shifts
- Emerging failure modes or architectural patterns

## How to Rank

Rank by materiality, not by attention or buzz.

## Output Format

Output ONLY a valid JSON array. No markdown, no prose, no explanation outside the JSON.

Each candidate:
{{
  "candidate_id": "cand_001",
  "title": "Short descriptive title",
  "item_type": "framework_release | paper | tool_launch | benchmark | trending",
  "date": "YYYY-MM-DD or null",
  "summary": "2-3 sentences. What happened.",
  "why_it_matters": "1-2 sentences. Why this matters for the monitoring scope.",
  "importance_score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "source_evidence": [
    {{"url": "...", "title": "...", "source_type": "primary | secondary"}}
  ],
  "github_url": "https://github.com/... or null"
}}

Sort by importance_score descending.

## Rules

- Do NOT write files
- Do NOT produce long prose or markdown reports
- Do NOT include more candidates than the max_candidates constraint
- DO search thoroughly — use at least 3 different exa_search queries
- DO use web_fetch to verify substance before including a candidate
- DO deduplicate — one candidate per underlying development
"""


# ---------------------------------------------------------------------------
# Stage 3: Synthesize candidates into topic folders (direct LLM, no agent loop)
# ---------------------------------------------------------------------------

SYNTHESIS_PROMPT = """Write a concise synthesis of this development for a personalized learning feed.

Topic: {title}
Summary: {summary}
Why it matters: {why_it_matters}
Sources: {sources_text}
User level: {level}
Depth: {depth}

Guidelines:
- Start with a one-paragraph TL;DR
- Then 2-3 key insights or developments
- Adapt language to the user's level ({level}) and depth ({depth})
- End with "Why this matters" (one sentence)
- Use markdown formatting
- Keep it under 400 words"""


async def _synthesize_candidate(candidate: dict, profile: dict) -> str:
    """Generate synthesis.md for a single candidate."""
    client = AsyncOpenAI(api_key=MINIMAX_API_KEY, base_url=MINIMAX_BASE_URL)

    sources_text = "\n".join(
        f"- {s.get('title', 'Untitled')} ({s.get('source_type', 'unknown')}): {s.get('url', '')}"
        for s in candidate.get("source_evidence", [])
    )

    prompt = SYNTHESIS_PROMPT.format(
        title=candidate.get("title", ""),
        summary=candidate.get("summary", ""),
        why_it_matters=candidate.get("why_it_matters", ""),
        sources_text=sources_text,
        level=profile.get("level", "advanced"),
        depth=profile.get("depth", "technical"),
    )

    try:
        resp = await client.chat.completions.create(
            model=MINIMAX_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return _strip_think_tags(resp.choices[0].message.content)
    except Exception as e:
        logger.error("Synthesis failed for '%s': %s", candidate.get("title"), e)
        return f"# {candidate.get('title', 'Unknown')}\n\n{candidate.get('summary', '')}"


def _write_topic_folder(candidate: dict, synthesis: str) -> str | None:
    """Write meta.yaml + synthesis.md + raw_sources.md for a candidate."""
    date_str = candidate.get("date") or datetime.now().strftime("%Y-%m-%d")
    slug = _slugify(candidate.get("title", "unknown"))
    folder_name = f"{date_str}_{slug}"
    folder_path = TOPICS_DIR / folder_name

    if folder_path.exists():
        logger.info("Topic folder already exists: %s", folder_name)
        return None

    folder_path.mkdir(parents=True, exist_ok=True)

    # Map item_type to category
    type_to_cat = {
        "framework_release": "trending",
        "paper": "paper",
        "tool_launch": "trending",
        "benchmark": "paper",
        "trending": "trending",
    }
    category = type_to_cat.get(candidate.get("item_type", ""), "trending")

    # Extract tags from title
    stop_words = {"with", "from", "that", "this", "will", "have", "been", "the",
                  "and", "for", "new", "its", "are", "was", "has"}
    words = candidate.get("title", "").lower().split()
    words = [re.sub(r"[^\w-]", "", w) for w in words]
    tags = sorted({w for w in words if len(w) > 3 and w not in stop_words})[:8]

    # --- meta.yaml ---
    sources_list = []
    for s in candidate.get("source_evidence", []):
        sources_list.append({
            "url": s.get("url", ""),
            "type": s.get("source_type", "secondary"),
            "title": s.get("title", ""),
        })

    meta = {
        "title": candidate.get("title", "Unknown"),
        "slug": slug,
        "date": date_str,
        "category": category,
        "sources": sources_list,
        "relevance_score": round(candidate.get("importance_score", 0.5), 2),
        "relevance_reason": candidate.get("why_it_matters", ""),
        "tags": tags,
        "status": "new",
        "generated": {
            "synthesis": True,
            "audio": False,
            "video": False,
            "jingle": False,
            "diagrams": [],
        },
    }

    (folder_path / "meta.yaml").write_text(
        yaml.dump(meta, default_flow_style=False, allow_unicode=True)
    )

    # --- synthesis.md ---
    (folder_path / "synthesis.md").write_text(synthesis)

    # --- raw_sources.md ---
    raw_lines = [f"# Raw Sources — {candidate.get('title', '')}\n"]
    for s in candidate.get("source_evidence", []):
        raw_lines.append(f"## {s.get('title', 'Untitled')}")
        raw_lines.append(f"- **URL**: {s.get('url', '')}")
        raw_lines.append(f"- **Type**: {s.get('source_type', 'unknown')}")
        raw_lines.append("")
    raw_lines.append(f"\n## Candidate Summary\n{candidate.get('summary', '')}")
    raw_lines.append(f"\n## Why It Matters\n{candidate.get('why_it_matters', '')}")

    (folder_path / "raw_sources.md").write_text("\n".join(raw_lines))

    logger.info("Wrote topic folder: %s (%d sources)", folder_name, len(sources_list))
    return folder_name


# ---------------------------------------------------------------------------
# Agent loop (minimal, stage-specific)
# ---------------------------------------------------------------------------

async def _run_agent_loop(
    system_prompt: str,
    user_message: str,
    tools_schema: list[dict],
    handlers: dict,
    max_rounds: int = MAX_TOOL_ROUNDS,
) -> str:
    """Run a tool-calling loop with MiniMax M2.5. Returns final text response."""
    client = AsyncOpenAI(api_key=MINIMAX_API_KEY, base_url=MINIMAX_BASE_URL)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    for _round in range(max_rounds):
        resp = await client.chat.completions.create(
            model=MINIMAX_MODEL,
            messages=messages,
            tools=tools_schema,
            temperature=0.5,
        )
        choice = resp.choices[0]

        if not choice.message.tool_calls:
            return choice.message.content or ""

        messages.append(choice.message.model_dump())

        for tc in choice.message.tool_calls:
            fn_name = tc.function.name
            try:
                args = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                args = {}

            handler = handlers.get(fn_name)
            if handler:
                try:
                    result = await handler(**args)
                    logger.info("Tool %s(%s) → %d chars", fn_name,
                                args.get("query", args.get("url", ""))[:60], len(result))
                except Exception as e:
                    result = f"Error executing {fn_name}: {e}"
            else:
                result = f"Error: Unknown tool '{fn_name}'"

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": str(result)[:10000],  # cap tool results
            })

    # Exceeded max rounds — force JSON output
    messages.append({
        "role": "user",
        "content": "You have used all available search rounds. Stop searching. Output your final JSON array of candidates NOW. Output ONLY the JSON array, nothing else.",
    })
    resp = await client.chat.completions.create(
        model=MINIMAX_MODEL,
        messages=messages,
        temperature=0.3,
    )
    return resp.choices[0].message.content or ""


# ---------------------------------------------------------------------------
# Profile → Task Message
# ---------------------------------------------------------------------------

def _build_task_message(profile: dict) -> str:
    """Convert user profile into a Stage 2 task message."""
    field = profile.get("field", "AI / ML")
    focus_areas = profile.get("focus_areas", [])
    level = profile.get("level", "advanced")
    depth = profile.get("depth", "technical")
    time_window = profile.get("time_window", "7d")

    # Build editorial brief from profile
    focus_text = ", ".join(focus_areas) if focus_areas else field
    task_text = (
        f"Monitor developments in {field}, specifically: {focus_text}. "
        f"The user is {level}-level and wants {depth} coverage. "
        f"Focus on practical developments: new tools, framework releases, important papers, "
        f"benchmark results, and production patterns. "
        f"Filter out hype, listicles, and shallow commentary."
    )

    # Source families from profile
    source_families = []
    for src in profile.get("sources", []):
        if src.get("enabled", True):
            source_families.append(src.get("type", src.get("id", "unknown")))
    if not source_families:
        source_families = ["arxiv", "github", "hackernews", "news_media", "company_blogs"]

    days = int(time_window.rstrip("d")) if isinstance(time_window, str) else 7
    max_candidates = profile.get("max_topics", 8)

    return json.dumps({
        "task_text": task_text,
        "allowed_source_families": source_families,
        "constraints": {
            "max_candidates": max_candidates,
            "prefer_primary_sources": True,
            "time_window_days": days,
        },
    }, indent=2)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

async def run_exa_discovery(profile_id: str = "default") -> dict:
    """Run the Exa-based discovery pipeline.

    Returns: {status, topics_created: [slug, ...], stats: {candidates, ...}}
    """
    from discovery import load_profile

    stats = {}

    # 1. Load profile
    profile = load_profile(profile_id)
    logger.info("Loaded profile: %s (field=%s)", profile_id, profile.get("field"))

    time_window = "7d"
    # Check profile for time window
    for src in profile.get("sources", []):
        if src.get("type") == "exa" and src.get("time_window"):
            time_window = src["time_window"]
            break

    days = int(time_window.rstrip("d")) if isinstance(time_window, str) else 7

    # 2. Build Stage 2 system prompt with date injection
    today = datetime.now().strftime("%Y-%m-%d")
    system_prompt = STAGE2_SYSTEM_PROMPT.format(
        today=today,
        time_window=time_window,
        time_window_days=days,
    )

    # 3. Build task message from profile
    task_message = _build_task_message(profile)
    logger.info("=== STAGE 2: DISCOVERY ===")
    logger.info("Task message: %s", task_message[:200])

    # 4. Run Stage 2 agent
    raw_response = await _run_agent_loop(
        system_prompt=system_prompt,
        user_message=task_message,
        tools_schema=STAGE2_TOOLS_SCHEMA,
        handlers=STAGE2_HANDLERS,
        max_rounds=MAX_TOOL_ROUNDS,
    )

    # 5. Parse candidates JSON
    try:
        candidates = _extract_json(raw_response)
        if isinstance(candidates, dict):
            candidates = [candidates]
    except ValueError as e:
        logger.error("Failed to parse Stage 2 output: %s", e)
        logger.error("Raw response: %s", raw_response[:500])
        return {"status": "error", "error": str(e), "topics_created": [], "stats": stats}

    stats["candidates"] = len(candidates)
    logger.info("Stage 2 found %d candidates", len(candidates))

    if not candidates:
        return {"status": "done", "topics_created": [], "stats": stats}

    # 6. Stage 3: Synthesize each candidate and write topic folders
    logger.info("=== STAGE 3: SYNTHESIZE + WRITE ===")
    topics_created = []

    for i, candidate in enumerate(candidates):
        title = candidate.get("title", f"candidate_{i}")
        logger.info("Synthesizing [%d/%d]: %s", i + 1, len(candidates), title)

        synthesis = await _synthesize_candidate(candidate, profile)
        slug = _write_topic_folder(candidate, synthesis)
        if slug:
            topics_created.append(slug)

    stats["topics_created"] = len(topics_created)
    logger.info("=== DONE: %d topics created ===", len(topics_created))

    return {
        "status": "done",
        "topics_created": topics_created,
        "stats": stats,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    result = asyncio.run(run_exa_discovery())
    print(json.dumps(result, indent=2))
