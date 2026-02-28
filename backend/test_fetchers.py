"""
Test all 10 fetchers with real API calls — AI agents theme.
"""
import sys
import os
import time
import logging
import traceback

# Ensure we can import from this directory
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("test_fetchers")

from fetchers import FETCHERS, fetch_all, extract_content

# ---------------------------------------------------------------------------
# Test profile — all 10 sources enabled, AI agents theme, low thresholds
# ---------------------------------------------------------------------------
TEST_PROFILE = {
    "field": "AI / ML",
    "sources": [
        {
            "id": "reddit_ai",
            "type": "reddit",
            "subreddits": ["MachineLearning", "LocalLLaMA", "artificial"],
            "hours_back": 168,  # 1 week
            "min_score": 5,
            "enabled": True,
        },
        {
            "id": "hn_agents",
            "type": "hackernews",
            "filter": "AI agents OR LLM agents OR agentic",
            "min_points": 5,
            "enabled": True,
        },
        {
            "id": "ai_blogs",
            "type": "rss",
            "feeds": {
                "openai": "https://openai.com/blog/rss/",
                "anthropic": "https://www.anthropic.com/feed.xml",
                "google_ai": "https://blog.google/technology/ai/rss/",
                "deepmind": "https://deepmind.google/blog/rss.xml",
            },
            "hours_back": 168,  # 1 week
            "enabled": True,
        },
        {
            "id": "arxiv_ai",
            "type": "arxiv",
            "categories": ["cs.AI", "cs.LG", "cs.CL"],
            "hours_back": 168,  # 1 week
            "enabled": True,
        },
        {
            "id": "x_keywords",
            "type": "twitter",
            "keywords": ["AI agents", "agentic AI"],
            "lang": "en",
            "enabled": True,
        },
        {
            "id": "x_accounts",
            "type": "twitter_accounts",
            "accounts": ["AnthropicAI", "OpenAI"],
            "enabled": True,
        },
        {
            "id": "podcasts",
            "type": "podcast",
            "shows": [{"name": "Latent Space", "feed_url": None}],
            "hours_back": 168,  # 1 week
            "enabled": True,
        },
        {
            "id": "youtube_ai",
            "type": "youtube",
            "channels": {"Two Minute Papers": "UCbfYPyITQ-7l4upoX8nvctg"},
            "hours_back": 168,  # 1 week
            "enabled": True,
        },
        {
            "id": "pubmed_ai",
            "type": "pubmed",
            "query": "AI agents OR large language model agents",
            "max_results": 10,
            "enabled": True,
        },
        {
            "id": "exa_agents",
            "type": "exa",
            "query": "AI agents breakthroughs",
            "category": "news",
            "enabled": True,
        },
    ],
}


def format_engagement(item) -> str:
    """Format engagement metrics from metadata."""
    m = item.metadata
    parts = []
    if "score" in m:
        parts.append(f"score={m['score']}")
    if "points" in m:
        parts.append(f"pts={m['points']}")
    if "comments" in m:
        parts.append(f"comments={m['comments']}")
    if "likes" in m:
        parts.append(f"likes={m['likes']}")
    if "retweets" in m:
        parts.append(f"rt={m['retweets']}")
    if "views" in m and m["views"]:
        parts.append(f"views={m['views']}")
    return ", ".join(parts) if parts else "—"


def test_individual_fetchers():
    """Test each fetcher individually to isolate errors."""
    results = {}

    for source_cfg in TEST_PROFILE["sources"]:
        source_type = source_cfg["type"]
        source_id = source_cfg["id"]
        fetcher = FETCHERS.get(source_type)

        print(f"\n{'='*70}")
        print(f"  {source_type.upper()} ({source_id})")
        print(f"{'='*70}")

        start = time.time()
        try:
            items = fetcher(source_cfg)
            elapsed = time.time() - start
            results[source_id] = {
                "type": source_type,
                "count": len(items),
                "elapsed": elapsed,
                "error": None,
                "sample_title": items[0].title[:60] if items else "—",
            }

            if not items:
                print(f"  0 items returned ({elapsed:.1f}s)")
                print(f"  Reason: No matching items (thresholds, time window, or empty feed)")
            else:
                print(f"  {len(items)} items ({elapsed:.1f}s)")
                print()
                for i, item in enumerate(items[:3]):
                    print(f"  [{i+1}] {item.title[:80]}")
                    print(f"      url: {item.url[:80]}")
                    print(f"      ts:  {item.timestamp}")
                    print(f"      eng: {format_engagement(item)}")
                    snippet = item.content_snippet[:100].replace("\n", " ") if item.content_snippet else "(none)"
                    print(f"      snippet: {snippet}")
                    raw = "yes" if item.raw_content else "no"
                    print(f"      raw_content: {raw}")
                    print(f"      metadata keys: {sorted(item.metadata.keys())}")
                    print()

        except Exception as e:
            elapsed = time.time() - start
            results[source_id] = {
                "type": source_type,
                "count": 0,
                "elapsed": elapsed,
                "error": str(e),
                "sample_title": "ERROR",
            }
            print(f"  ERROR ({elapsed:.1f}s): {e}")
            traceback.print_exc()

    return results


def test_extract_content():
    """Test trafilatura content extraction on a known URL."""
    print(f"\n{'='*70}")
    print(f"  CONTENT EXTRACTION TEST")
    print(f"{'='*70}")
    test_url = "https://www.anthropic.com/news/claude-4-0"
    start = time.time()
    text = extract_content(test_url, max_chars=500)
    elapsed = time.time() - start
    if text:
        print(f"  extract_content({test_url[:50]}...)")
        print(f"  Result: {len(text)} chars in {elapsed:.1f}s")
        print(f"  Preview: {text[:200]}...")
    else:
        print(f"  extract_content returned None ({elapsed:.1f}s)")
        print(f"  (URL may not have extractable article content)")


def test_fetch_all():
    """Test the full dispatcher."""
    print(f"\n{'='*70}")
    print(f"  FETCH_ALL DISPATCHER TEST")
    print(f"{'='*70}")
    start = time.time()
    items = fetch_all(TEST_PROFILE)
    elapsed = time.time() - start
    print(f"  Total: {len(items)} items in {elapsed:.1f}s")

    by_source = {}
    for it in items:
        by_source.setdefault(it.source_type, []).append(it)
    for st in sorted(by_source):
        print(f"    {st}: {len(by_source[st])}")
    return items


def print_summary(results):
    """Print summary table."""
    print(f"\n{'='*70}")
    print(f"  SUMMARY TABLE")
    print(f"{'='*70}")
    print(f"  {'Source':<20} {'Type':<18} {'Items':>6} {'Time':>6}  {'Status':<30}")
    print(f"  {'-'*20} {'-'*18} {'-'*6} {'-'*6}  {'-'*30}")
    total = 0
    for sid, r in results.items():
        status = r["error"] if r["error"] else (r["sample_title"] if r["count"] > 0 else "0 items (empty/filtered)")
        total += r["count"]
        print(f"  {sid:<20} {r['type']:<18} {r['count']:>6} {r['elapsed']:>5.1f}s  {status[:30]}")
    print(f"  {'-'*20} {'-'*18} {'-'*6}")
    print(f"  {'TOTAL':<20} {'':18} {total:>6}")

    # Data quality check
    print(f"\n  DATA QUALITY NOTES:")
    for sid, r in results.items():
        if r["error"]:
            print(f"  !! {sid}: {r['error']}")
        elif r["count"] == 0:
            print(f"  -- {sid}: no items returned")


if __name__ == "__main__":
    print("=" * 70)
    print("  CORTEX FETCHER TEST — AI AGENTS THEME")
    print("  Testing all 10 source types with real API calls")
    print("=" * 70)

    # Test each fetcher individually
    results = test_individual_fetchers()

    # Test content extraction
    test_extract_content()

    # Print summary
    print_summary(results)
