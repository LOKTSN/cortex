"""
Cortex — Discovery pipeline orchestration.

Fetch → Extract → Embed/Dedup/Cluster → Rank (LLM) → Synthesize (LLM) → Write topic folders.
"""
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

import yaml
from dotenv import load_dotenv
from openai import OpenAI

from models import RawItem, TopicCluster
from fetchers import fetch_all, extract_content
from embedding import run_embedding_pipeline, update_embedding_index

logger = logging.getLogger(__name__)

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"
MINIMAX_MODEL = "MiniMax-M2.5"


def _strip_think_tags(text: str) -> str:
    """Strip <think>...</think> reasoning blocks from MiniMax responses."""
    return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL).strip()

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TOPICS_DIR = DATA_DIR / "topics"
PROFILES_DIR = DATA_DIR / "profiles"


# ---------------------------------------------------------------------------
# Profile loading
# ---------------------------------------------------------------------------

def load_profile(profile_id: str = "default") -> dict:
    """Load a user profile from data/profiles/<id>/.

    Supports two formats:
    - config.json (new): structured with interests/discovery/sources sections
    - profile.yaml (legacy): flat format with inline sources list
    """
    json_path = PROFILES_DIR / profile_id / "config.json"
    yaml_path = PROFILES_DIR / profile_id / "profile.yaml"

    if json_path.exists():
        raw = json.loads(json_path.read_text())
        return _normalize_config(raw)
    elif yaml_path.exists():
        return yaml.safe_load(yaml_path.read_text())
    else:
        raise FileNotFoundError(f"No config found in {PROFILES_DIR / profile_id}")


def _normalize_config(raw: dict) -> dict:
    """Convert config.json format to the flat profile dict the pipeline expects."""
    interests = raw.get("interests", {})
    discovery = raw.get("discovery", {})

    # Convert sources dict → list with id/type fields
    sources_list = []
    # Map config key → fetcher type (most are 1:1, some differ)
    type_map = {
        "reddit": "reddit",
        "hackernews": "hackernews",
        "arxiv": "arxiv",
        "rss": "rss",
        "substack": "substack",
        "blogs": "blog",
        "exa": "exa",
        "newsletters": "newsletter",
        "pubmed": "pubmed",
        "twitter": "twitter",
        "twitter_accounts": "twitter_accounts",
        "podcasts": "podcast",
        "youtube": "youtube",
    }
    for key, cfg in raw.get("sources", {}).items():
        source = dict(cfg)
        source["id"] = key
        source["type"] = type_map.get(key, key)
        sources_list.append(source)

    return {
        "field": interests.get("field", ""),
        "focus_areas": interests.get("topics", []),
        "level": interests.get("level", "advanced"),
        "depth": interests.get("depth", "technical"),
        "sources": sources_list,
        # Pass through discovery params
        "relevance_threshold": discovery.get("relevance_threshold", 0.5),
        "max_topics": discovery.get("max_topics", 15),
        "n_clusters": discovery.get("n_clusters", 12),
        "timeframe_hours": discovery.get("timeframe_hours", 168),
    }


# ---------------------------------------------------------------------------
# Content extraction (batch, parallel)
# ---------------------------------------------------------------------------

def extract_content_batch(items: list[RawItem]) -> list[RawItem]:
    """Extract full article text for link-based items using trafilatura.

    Skips items that already have raw_content (tweets, self-posts, abstracts).
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    # Identify items needing extraction
    needs_extraction = []
    for item in items:
        if item.raw_content:
            continue  # already has content
        if item.source_type in ("twitter", "twitter_accounts"):
            continue  # tweets ARE the content
        if item.content_snippet and len(item.content_snippet) > 300:
            continue  # good enough snippet
        needs_extraction.append(item)

    if not needs_extraction:
        return items

    logger.info("Extracting content for %d items...", len(needs_extraction))

    def _extract(item: RawItem) -> tuple[RawItem, str | None]:
        text = extract_content(item.url)
        return item, text

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(_extract, item): item for item in needs_extraction}
        for future in as_completed(futures):
            try:
                item, text = future.result(timeout=30)
                if text:
                    item.raw_content = text
            except Exception as e:
                logger.debug("Content extraction failed for %s: %s", futures[future].url, e)

    extracted = sum(1 for it in needs_extraction if it.raw_content)
    logger.info("Extracted content for %d/%d items", extracted, len(needs_extraction))
    return items


# ---------------------------------------------------------------------------
# LLM: Rank clusters by relevance
# ---------------------------------------------------------------------------

def rank_clusters(
    clusters: list[TopicCluster],
    profile: dict,
    threshold: float = 0.5,
) -> list[TopicCluster]:
    """Score each cluster against user profile using MiniMax M2.5. Filter + sort."""
    if not clusters or not MINIMAX_API_KEY:
        logger.warning("No API key or no clusters — skipping LLM ranking")
        return clusters

    client = OpenAI(api_key=MINIMAX_API_KEY, base_url=MINIMAX_BASE_URL)

    field = profile.get("field", "")
    focus_areas = ", ".join(profile.get("focus_areas", []))
    level = profile.get("level", "advanced")

    # Build cluster summaries for the prompt
    cluster_summaries = []
    for i, cluster in enumerate(clusters):
        titles = [it.title for it in cluster.items[:5]]
        snippets = [it.content_snippet[:150] for it in cluster.items[:3] if it.content_snippet]
        cluster_summaries.append(
            f"[{i}] {cluster.representative_title}\n"
            f"  Sources: {len(cluster.items)} items\n"
            f"  Titles: {'; '.join(titles)}\n"
            f"  Snippets: {' | '.join(snippets)}"
        )

    prompt = f"""You are a content relevance scorer for a personalized news feed.

User profile:
- Field: {field}
- Focus areas: {focus_areas}
- Level: {level}

Score each topic cluster 0.0-1.0 for relevance to someone working in {field}. Consider:
- Direct match to focus areas ({focus_areas}) → score 0.7-1.0
- General importance to the {field} field (major releases, policy changes, industry news) → score 0.5-0.8
- Tangentially related or educational content → score 0.3-0.5
- Completely unrelated to {field} → score 0.0-0.2

Also provide a one-sentence reason.

Topics to score:
{chr(10).join(cluster_summaries)}

Respond with ONLY a JSON array. Each element: {{"index": N, "score": 0.0-1.0, "reason": "..."}}.
No other text."""

    try:
        response = client.chat.completions.create(
            model=MINIMAX_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        text = _strip_think_tags(response.choices[0].message.content)
        # Extract JSON from response (handle markdown code blocks)
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        scores = json.loads(text)

        for entry in scores:
            idx = entry["index"]
            if 0 <= idx < len(clusters):
                clusters[idx].relevance_score = entry["score"]
                clusters[idx].relevance_reason = entry.get("reason", "")

    except Exception as e:
        logger.error("LLM ranking failed: %s", e)
        # Fallback: keep all clusters with default score
        for c in clusters:
            c.relevance_score = 0.7
            c.relevance_reason = "LLM ranking unavailable"
        return clusters

    # Filter and sort
    ranked = [c for c in clusters if c.relevance_score >= threshold]
    ranked.sort(key=lambda c: c.relevance_score, reverse=True)
    logger.info("Ranked: %d clusters above threshold %.1f", len(ranked), threshold)
    return ranked


# ---------------------------------------------------------------------------
# LLM: Synthesize topic
# ---------------------------------------------------------------------------

def synthesize_topic(cluster: TopicCluster, profile: dict) -> str:
    """Generate synthesis.md content for a topic cluster using MiniMax M2.5."""
    if not MINIMAX_API_KEY:
        # Fallback: concatenate snippets
        lines = [f"# {cluster.representative_title}\n"]
        for item in cluster.items:
            lines.append(f"- **{item.title}** ({item.source_type})")
            if item.content_snippet:
                lines.append(f"  {item.content_snippet[:200]}")
        return "\n".join(lines)

    client = OpenAI(api_key=MINIMAX_API_KEY, base_url=MINIMAX_BASE_URL)

    level = profile.get("level", "advanced")
    depth = profile.get("depth", "technical")

    # Gather source content
    source_texts = []
    for item in cluster.items[:6]:  # cap at 6 sources to stay within context
        parts = [f"Source ({item.source_type}): {item.title}"]
        if item.raw_content:
            parts.append(item.raw_content[:1500])
        elif item.content_snippet:
            parts.append(item.content_snippet[:500])
        source_texts.append("\n".join(parts))

    prompt = f"""Write a concise synthesis of this topic for a personalized learning feed.

Topic: {cluster.representative_title}
User level: {level}
Depth: {depth}

Source material:
{chr(10).join(source_texts)}

Guidelines:
- Start with a one-paragraph TL;DR
- Then 2-3 key insights or developments
- Adapt language to the user's level ({level}) and depth ({depth})
- If sources conflict, note the disagreement
- End with "Why this matters" (one sentence)
- Use markdown formatting
- Keep it under 400 words"""

    try:
        response = client.chat.completions.create(
            model=MINIMAX_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return _strip_think_tags(response.choices[0].message.content)
    except Exception as e:
        logger.error("Synthesis failed for '%s': %s", cluster.representative_title, e)
        # Fallback
        lines = [f"# {cluster.representative_title}\n"]
        for item in cluster.items:
            lines.append(f"- **{item.title}** ({item.source_type})")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Topic folder writer
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    """Generate a URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    if len(slug) > 60:
        slug = slug[:60].rsplit("-", 1)[0]
    return slug.strip("-")


def _categorize(cluster: TopicCluster) -> str:
    """Guess a category for the topic based on source types."""
    source_types = {item.source_type for item in cluster.items}
    # Check for engagement spikes → breaking
    max_score = max(
        (item.metadata.get("score", 0) + item.metadata.get("points", 0))
        for item in cluster.items
    )
    if max_score > 500:
        return "breaking"
    if "arxiv" in source_types or "pubmed" in source_types:
        return "paper"
    if any(item.source_type == "reddit" and item.metadata.get("flair", "").startswith("[R]")
           for item in cluster.items):
        return "paper"
    if any(st in source_types for st in ("podcast", "youtube")):
        return "podcast"
    return "trending"


def write_topic_folder(
    cluster: TopicCluster,
    synthesis: str,
    profile: dict,
) -> str | None:
    """Write a topic folder: meta.yaml + synthesis.md + raw_sources.md.

    Returns the slug (folder name) or None on failure.
    """
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = _slugify(cluster.representative_title)
    folder_name = f"{date_str}_{slug}"
    folder_path = TOPICS_DIR / folder_name

    # Dedup: don't overwrite existing topic folder
    if folder_path.exists():
        logger.info("Topic folder already exists: %s", folder_name)
        return None

    folder_path.mkdir(parents=True, exist_ok=True)

    # --- meta.yaml ---
    sources_list = []
    for item in cluster.items:
        source_entry = {
            "url": item.url,
            "type": item.source_type,
            "title": item.title,
        }
        if item.metadata.get("score"):
            source_entry["score"] = item.metadata["score"]
        if item.metadata.get("points"):
            source_entry["points"] = item.metadata["points"]
        sources_list.append(source_entry)

    # Collect tags from metadata
    tags = set()
    for item in cluster.items:
        if item.metadata.get("flair"):
            tags.add(item.metadata["flair"].strip("[]").lower())
        if item.metadata.get("category"):
            tags.add(item.metadata["category"])
    _STOP_WORDS = {"with", "from", "that", "this", "will", "have", "been", "were",
                   "what", "when", "where", "which", "their", "there", "about",
                   "between", "through", "first", "after", "before", "other",
                   "more", "also", "into", "over", "than", "them", "each",
                   "enabling", "accelerating", "update", "based"}
    # Strip punctuation from tags
    tags = {re.sub(r"[^\w-]", "", t) for t in tags}
    tags.discard("")
    if not tags:
        # Extract keywords from title
        words = cluster.representative_title.lower().split()
        words = [re.sub(r"[^\w-]", "", w) for w in words]
        tags = {w for w in words if len(w) > 3 and w not in _STOP_WORDS}

    meta = {
        "title": cluster.representative_title,
        "slug": slug,
        "date": date_str,
        "category": _categorize(cluster),
        "sources": sources_list,
        "relevance_score": round(cluster.relevance_score, 2),
        "relevance_reason": cluster.relevance_reason,
        "tags": sorted(tags)[:8],
        "status": "new",
        "generated": {
            "synthesis": True,
            "audio": False,
            "video": False,
            "jingle": False,
            "diagrams": [],
        },
    }

    (folder_path / "meta.yaml").write_text(yaml.dump(meta, default_flow_style=False, allow_unicode=True))

    # --- synthesis.md ---
    (folder_path / "synthesis.md").write_text(synthesis)

    # --- raw_sources.md ---
    raw_lines = [f"# Raw Sources — {cluster.representative_title}\n"]
    for item in cluster.items:
        raw_lines.append(f"## {item.title}")
        raw_lines.append(f"- **Source**: {item.source_type} ({item.source_id})")
        raw_lines.append(f"- **URL**: {item.url}")
        raw_lines.append(f"- **Date**: {item.timestamp.isoformat()}")
        if item.metadata:
            raw_lines.append(f"- **Metadata**: {json.dumps(item.metadata)}")
        if item.raw_content:
            raw_lines.append(f"\n### Content\n{item.raw_content[:2000]}")
        elif item.content_snippet:
            raw_lines.append(f"\n### Snippet\n{item.content_snippet}")
        raw_lines.append("")

    (folder_path / "raw_sources.md").write_text("\n".join(raw_lines))

    logger.info("Wrote topic folder: %s (%d sources)", folder_name, len(cluster.items))
    return folder_name


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_discovery(
    profile_id: str = "default",
    relevance_threshold: float = 0.3,
    max_topics: int = 15,
    n_clusters: int = 8,
) -> dict:
    """Run the full discovery pipeline.

    Returns: {status, topics_created: [slug, ...], stats: {fetched, deduped, clustered, ...}}
    """
    stats = {}

    # 1. Load profile
    profile = load_profile(profile_id)
    logger.info("Loaded profile: %s (field=%s, %d sources)",
                profile_id, profile.get("field"), len(profile.get("sources", [])))

    # Use discovery params from config if not overridden by caller
    if relevance_threshold == 0.5 and "relevance_threshold" in profile:
        relevance_threshold = profile["relevance_threshold"]
    if max_topics == 15 and "max_topics" in profile:
        max_topics = profile["max_topics"]
    if n_clusters == 12 and "n_clusters" in profile:
        n_clusters = profile["n_clusters"]

    # 2. Fetch from all enabled sources
    logger.info("=== STEP 1: FETCH ===")
    raw_items = fetch_all(profile)
    stats["fetched"] = len(raw_items)
    logger.info("Fetched %d raw items", len(raw_items))

    if not raw_items:
        return {"status": "done", "topics_created": [], "stats": stats}

    # 3. Extract content for link-based items
    logger.info("=== STEP 2: EXTRACT ===")
    raw_items = extract_content_batch(raw_items)
    stats["with_content"] = sum(1 for it in raw_items if it.raw_content)

    # 4. Embed, dedup, novelty check, relevance filter, cluster
    logger.info("=== STEP 3-4: EMBED + CLUSTER ===")
    topics_dir = str(TOPICS_DIR)
    data_dir = str(DATA_DIR)
    clusters = run_embedding_pipeline(
        raw_items, profile, topics_dir, data_dir=data_dir, n_clusters=n_clusters
    )
    stats["clusters"] = len(clusters)

    if not clusters:
        return {"status": "done", "topics_created": [], "stats": stats}

    # 5. LLM rank clusters by relevance
    logger.info("=== STEP 5: RANK ===")
    ranked = rank_clusters(clusters, profile, threshold=relevance_threshold)
    ranked = ranked[:max_topics]
    stats["ranked"] = len(ranked)

    # 6. Synthesize and write topic folders
    logger.info("=== STEP 6: SYNTHESIZE + WRITE ===")
    topics_created = []
    new_topic_embeddings = {}

    for cluster in ranked:
        synthesis = synthesize_topic(cluster, profile)
        slug = write_topic_folder(cluster, synthesis, profile)
        if slug:
            topics_created.append(slug)
            if cluster.embedding:
                new_topic_embeddings[slug] = cluster.embedding

    # 7. Update persistent embedding index
    if new_topic_embeddings:
        update_embedding_index(data_dir, new_topic_embeddings)

    stats["topics_created"] = len(topics_created)
    logger.info("=== DONE: %d topics created ===", len(topics_created))

    return {
        "status": "done",
        "topics_created": topics_created,
        "stats": stats,
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    result = run_discovery()
    print(json.dumps(result, indent=2))
