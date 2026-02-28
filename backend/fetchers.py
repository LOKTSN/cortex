"""
Cortex — Source fetchers for the discovery pipeline.

Each fetcher takes a source config dict (from profile.yaml) and returns list[RawItem].
One source failing never kills the pipeline.
"""
import os
import re
import time
import logging
import requests
import httpx
import feedparser
import trafilatura
from xml.etree import ElementTree as ET
from datetime import datetime, timedelta, timezone
from time import mktime
from dotenv import load_dotenv

import socket
import dns.resolver
from youtube_transcript_api import YouTubeTranscriptApi

from models import RawItem

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logger = logging.getLogger(__name__)

TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
EXA_API_KEY = os.getenv("EXA_API_KEY", "")

USER_AGENT = "cortex-discovery/1.0"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_html(text: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def extract_content(url: str, max_chars: int = 3000) -> str | None:
    """Extract article text from a URL using trafilatura."""
    try:
        html = trafilatura.fetch_url(url)
        if html:
            text = trafilatura.extract(html, include_comments=False)
            if text and len(text) > 100:
                return text[:max_chars]
    except Exception:
        pass
    return None


def _parse_twitter_date(date_str: str) -> datetime:
    """Parse Twitter's createdAt format."""
    for fmt in (
        "%a %b %d %H:%M:%S %z %Y",       # classic Twitter format
        "%Y-%m-%dT%H:%M:%S.%fZ",          # ISO
        "%Y-%m-%dT%H:%M:%SZ",             # ISO no ms
    ):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return datetime.now(tz=timezone.utc)


def _parse_pubmed_date(date_str: str) -> datetime:
    """Parse PubMed date strings like '2026 Feb 28' or '2026 Feb'."""
    for fmt in ("%Y %b %d", "%Y %b", "%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return datetime.now(tz=timezone.utc)


def _parse_exa_date(date_str: str | None) -> datetime:
    """Parse Exa publishedDate."""
    if not date_str:
        return datetime.now(tz=timezone.utc)
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return datetime.now(tz=timezone.utc)


def _feed_entry_date(entry) -> datetime | None:
    """Extract datetime from a feedparser entry."""
    try:
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            return datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)
        if hasattr(entry, "updated_parsed") and entry.updated_parsed:
            return datetime.fromtimestamp(mktime(entry.updated_parsed), tz=timezone.utc)
    except (OverflowError, OSError, ValueError):
        pass
    return None


# ---------------------------------------------------------------------------
# Fetchers
# ---------------------------------------------------------------------------

def fetch_reddit(source: dict) -> list[RawItem]:
    """Fetch top posts from subreddits, filtered by score and recency."""
    items = []
    hours = source.get("hours_back", 24)
    min_score = source.get("min_score", 10)
    max_results = source.get("max_results", 100)
    cutoff = time.time() - (hours * 3600)

    # Map hours_back to reddit time filter
    if hours <= 24:
        t_filter = "day"
    elif hours <= 168:
        t_filter = "week"
    elif hours <= 720:
        t_filter = "month"
    else:
        t_filter = "year"

    for subreddit in source.get("subreddits", []):
        try:
            resp = requests.get(
                f"https://www.reddit.com/r/{subreddit}/top.json",
                params={"limit": max_results, "t": t_filter},
                headers={"User-Agent": USER_AGENT},
                timeout=15,
            )
            if resp.status_code != 200:
                logger.warning("Reddit r/%s returned %s", subreddit, resp.status_code)
                continue
            for child in resp.json().get("data", {}).get("children", []):
                d = child["data"]
                if d["created_utc"] >= cutoff and d["score"] >= min_score and not d.get("stickied"):
                    items.append(RawItem(
                        title=d["title"],
                        url=d["url"],
                        source_type="reddit",
                        source_id=source["id"],
                        timestamp=datetime.fromtimestamp(d["created_utc"], tz=timezone.utc),
                        metadata={
                            "score": d["score"],
                            "comments": d["num_comments"],
                            "subreddit": subreddit,
                            "author": d["author"],
                            "flair": d.get("link_flair_text"),
                        },
                        content_snippet=d.get("selftext", "")[:500],
                        raw_content=None,
                    ))
        except Exception as e:
            logger.error("Reddit r/%s error: %s", subreddit, e)
        time.sleep(2)  # rate limit between subreddit calls
    return items


def fetch_hackernews(source: dict) -> list[RawItem]:
    """Fetch recent HN stories matching filter, above min_points.
    Note: HN Algolia doesn't support OR boolean — we split on ' OR ' and query each term."""
    hours = source.get("hours_back", 24)
    cutoff = int((datetime.now(tz=timezone.utc) - timedelta(hours=hours)).timestamp())
    min_points = source.get("min_points", 10)
    max_results = source.get("max_results", 30)
    raw_filter = source.get("filter", "")

    # Split on " OR " — Algolia ANDs all words, so we need separate queries
    terms = [t.strip() for t in raw_filter.split(" OR ")] if raw_filter else [""]

    seen_ids = set()
    items = []
    for term in terms:
        try:
            resp = requests.get(
                "https://hn.algolia.com/api/v1/search",
                params={
                    "query": term,
                    "tags": "story",
                    "numericFilters": f"points>{min_points},created_at_i>{cutoff}",
                    "hitsPerPage": max_results,
                },
                timeout=15,
            )
            resp.raise_for_status()
        except Exception as e:
            logger.error("HN fetch error for '%s': %s", term, e)
            continue

        for h in resp.json().get("hits", []):
            hn_id = h["objectID"]
            if hn_id in seen_ids:
                continue
            seen_ids.add(hn_id)
            items.append(RawItem(
                title=h.get("title", ""),
                url=h.get("url") or f"https://news.ycombinator.com/item?id={hn_id}",
                source_type="hackernews",
                source_id=source["id"],
                timestamp=datetime.fromisoformat(h["created_at"].replace("Z", "+00:00")),
                metadata={
                    "points": h.get("points", 0),
                    "comments": h.get("num_comments", 0),
                    "author": h.get("author", ""),
                    "hn_id": hn_id,
                },
                content_snippet="",
                raw_content=None,
            ))
    return items


def fetch_rss(source: dict) -> list[RawItem]:
    """Fetch entries from RSS feeds, filtered by recency."""
    hours = source.get("hours_back", 24)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    items = []

    for name, url in source.get("feeds", {}).items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                pub = _feed_entry_date(entry)
                if pub and pub > cutoff:
                    items.append(RawItem(
                        title=entry.get("title", ""),
                        url=entry.get("link", ""),
                        source_type="rss",
                        source_id=source["id"],
                        timestamp=pub,
                        metadata={"feed_name": name, "author": entry.get("author", "")},
                        content_snippet=_strip_html(entry.get("summary", ""))[:500],
                        raw_content=None,
                    ))
        except Exception as e:
            logger.error("RSS error (%s): %s", name, e)
    return items


def fetch_arxiv(source: dict) -> list[RawItem]:
    """Fetch papers from arxiv export API by category."""
    hours = source.get("hours_back", 48)
    max_results = source.get("max_results", 30)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    items = []

    for cat in source.get("categories", []):
        try:
            resp = requests.get(
                "https://export.arxiv.org/api/query",
                params={
                    "search_query": f"cat:{cat}",
                    "sortBy": "submittedDate",
                    "sortOrder": "descending",
                    "max_results": max_results,
                },
                timeout=15,
            )
            resp.raise_for_status()
            feed = feedparser.parse(resp.text)
            for entry in feed.entries:
                pub = _feed_entry_date(entry)
                if pub and pub > cutoff:
                    items.append(RawItem(
                        title=entry.get("title", "").replace("\n", " ").strip(),
                        url=entry.get("link", ""),
                        source_type="arxiv",
                        source_id=source["id"],
                        timestamp=pub,
                        metadata={"category": cat, "authors": entry.get("author", "")},
                        content_snippet=_strip_html(entry.get("summary", ""))[:500],
                        raw_content=None,
                    ))
        except Exception as e:
            logger.error("arxiv error (%s): %s", cat, e)
        time.sleep(3)  # arxiv asks for 3s between API calls
    return items


def fetch_twitter(source: dict) -> list[RawItem]:
    """Fetch tweets matching keyword search via TwitterAPI.io."""
    if not TWITTER_API_KEY:
        logger.warning("Twitter API key not set, skipping twitter fetch")
        return []

    query_parts = [f'"{kw}"' for kw in source.get("keywords", [])]
    query = " OR ".join(query_parts) + " -is:retweet"
    if source.get("lang"):
        query += f" lang:{source['lang']}"

    try:
        resp = requests.get(
            "https://api.twitterapi.io/twitter/tweet/advanced_search",
            params={"query": query, "queryType": "Latest"},
            headers={"X-API-Key": TWITTER_API_KEY},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error("Twitter search error: %s", e)
        return []

    items = []
    for tweet in resp.json().get("tweets", []):
        items.append(RawItem(
            title=tweet.get("text", "")[:120],
            url=tweet.get("url", ""),
            source_type="twitter",
            source_id=source["id"],
            timestamp=_parse_twitter_date(tweet.get("createdAt", "")),
            metadata={
                "likes": tweet.get("likeCount", 0),
                "retweets": tweet.get("retweetCount", 0),
                "views": tweet.get("viewCount"),
                "author": tweet.get("author", {}).get("userName", ""),
                "verified": tweet.get("author", {}).get("isBlueVerified"),
            },
            content_snippet=tweet.get("text", ""),
            raw_content=tweet.get("text"),
        ))
    return items


def fetch_twitter_accounts(source: dict) -> list[RawItem]:
    """Fetch recent tweets from specific accounts via TwitterAPI.io."""
    if not TWITTER_API_KEY:
        logger.warning("Twitter API key not set, skipping twitter_accounts fetch")
        return []

    query = " OR ".join(f"from:{acc}" for acc in source.get("accounts", []))

    try:
        resp = requests.get(
            "https://api.twitterapi.io/twitter/tweet/advanced_search",
            params={"query": query, "queryType": "Latest"},
            headers={"X-API-Key": TWITTER_API_KEY},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error("Twitter accounts error: %s", e)
        return []

    items = []
    for tweet in resp.json().get("tweets", []):
        author = tweet.get("author", {}).get("userName", "")
        items.append(RawItem(
            title=f"@{author}: {tweet.get('text', '')[:100]}",
            url=tweet.get("url", ""),
            source_type="twitter_accounts",
            source_id=source["id"],
            timestamp=_parse_twitter_date(tweet.get("createdAt", "")),
            metadata={
                "likes": tweet.get("likeCount", 0),
                "retweets": tweet.get("retweetCount", 0),
                "views": tweet.get("viewCount"),
                "author": author,
            },
            content_snippet=tweet.get("text", ""),
            raw_content=tweet.get("text"),
        ))
    return items


# ---------------------------------------------------------------------------
# Podcast transcript helpers
# ---------------------------------------------------------------------------

_PODCAST_NS = "https://podcastindex.org/namespace/1.0"
_TRANSCRIPT_TYPE_PRIORITY = ["text/plain", "text/vtt", "application/x-subrip", "text/html"]


def _parse_transcript_text(text: str, mime_type: str) -> str:
    """Parse transcript content based on MIME type, returning clean text."""
    if mime_type == "text/plain":
        return text
    elif mime_type in ("text/vtt", "application/x-subrip"):
        lines = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("WEBVTT") or line.startswith("NOTE") or line.startswith("STYLE"):
                continue
            if "-->" in line:
                continue
            if line.isdigit():
                continue
            line = re.sub(r"<[^>]+>", "", line).strip()
            if line:
                lines.append(line)
        return " ".join(lines)
    elif mime_type == "text/html":
        import html as html_mod
        return html_mod.unescape(_strip_html(text))
    return text


def _fetch_transcript(url: str, mime_type: str) -> str | None:
    """Download and parse a single transcript file."""
    try:
        resp = requests.get(url, timeout=30, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        text = _parse_transcript_text(resp.text, mime_type)
        return text.strip() if text and text.strip() else None
    except Exception as e:
        logger.debug("Failed to fetch transcript from %s: %s", url, e)
        return None


def _extract_transcript_urls(feed_content: bytes) -> dict[str, tuple[str, str]]:
    """Parse RSS XML to find <podcast:transcript> URLs per episode.

    Returns dict mapping episode title -> (url, mime_type).
    Does NOT download transcripts — caller fetches on demand.
    """
    try:
        root = ET.fromstring(feed_content)
    except ET.ParseError as e:
        logger.debug("XML parse error for transcript extraction: %s", e)
        return {}

    urls: dict[str, tuple[str, str]] = {}
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        if not title:
            continue

        transcript_tags = item.findall(f"{{{_PODCAST_NS}}}transcript")
        if not transcript_tags:
            continue

        # Pick best format by priority
        best_url = None
        best_type = None
        for preferred in _TRANSCRIPT_TYPE_PRIORITY:
            for tag in transcript_tags:
                if tag.get("type") == preferred:
                    best_url = tag.get("url")
                    best_type = preferred
                    break
            if best_url:
                break

        # Fallback: take whatever is available
        if not best_url and transcript_tags:
            best_url = transcript_tags[0].get("url")
            best_type = transcript_tags[0].get("type", "text/plain")

        if best_url:
            urls[title] = (best_url, best_type)

    return urls


def fetch_podcast(source: dict) -> list[RawItem]:
    """Fetch recent podcast episodes, resolving feed URLs via iTunes if needed.

    Does a second XML parse pass to extract transcripts from <podcast:transcript>
    tags (Podcasting 2.0 namespace). Transcript text stored in raw_content.
    Only downloads transcripts for episodes that pass the recency filter.
    """
    hours = source.get("hours_back", 48)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    items = []

    for show in source.get("shows", []):
        feed_url = show.get("feed_url")
        if not feed_url:
            feed_url = _resolve_podcast_feed(show.get("name", ""))
            show["feed_url"] = feed_url  # cache for next run
        if not feed_url:
            continue
        try:
            # Fetch feed content once, parse with both feedparser and ET
            resp = requests.get(feed_url, timeout=30, headers={"User-Agent": USER_AGENT})
            resp.raise_for_status()
            feed_content = resp.content

            # Parse metadata with feedparser
            feed = feedparser.parse(feed_content)

            # Second pass: extract transcript URLs via XML (no downloads yet)
            transcript_urls = _extract_transcript_urls(feed_content)
            if transcript_urls:
                logger.info("  %d episodes have transcript tags for %s",
                            len(transcript_urls), show.get("name", ""))

            for entry in feed.entries:
                pub = _feed_entry_date(entry)
                if pub and pub > cutoff:
                    audio_url = None
                    if hasattr(entry, "enclosures") and entry.enclosures:
                        audio_url = entry.enclosures[0].get("href")

                    # Download transcript only for episodes that pass the filter
                    ep_title = entry.get("title", "")
                    transcript = None
                    url_info = transcript_urls.get(ep_title.strip())
                    if url_info:
                        transcript = _fetch_transcript(url_info[0], url_info[1])
                        if transcript:
                            transcript = transcript[:3000]

                    items.append(RawItem(
                        title=ep_title,
                        url=entry.get("link", ""),
                        source_type="podcast",
                        source_id=source["id"],
                        timestamp=pub,
                        metadata={
                            "show": show.get("name", ""),
                            "duration": entry.get("itunes_duration"),
                            "audio_url": audio_url,
                            "has_transcript": transcript is not None,
                        },
                        content_snippet=_strip_html(entry.get("summary", ""))[:500],
                        raw_content=transcript,
                    ))
        except Exception as e:
            logger.error("Podcast error (%s): %s", show.get("name"), e)
    return items


def _resolve_podcast_feed(name: str) -> str | None:
    """Find RSS feed URL via iTunes Search API (no auth)."""
    try:
        resp = requests.get(
            "https://itunes.apple.com/search",
            params={"term": name, "media": "podcast", "limit": 1},
            timeout=10,
        )
        results = resp.json().get("results", [])
        return results[0]["feedUrl"] if results else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# YouTube: DNS bypass + Invidious discovery + transcript extraction
# ---------------------------------------------------------------------------

_original_getaddrinfo = socket.getaddrinfo
_yt_dns_cache: dict[str, str] = {}
_YT_BYPASS_DOMAINS = {"www.youtube.com", "youtube.com"}


def _resolve_via_public_dns(host: str) -> str:
    """Resolve a hostname via Google public DNS, bypassing /etc/hosts."""
    if host not in _yt_dns_cache:
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
        answers = resolver.resolve(host, "A")
        _yt_dns_cache[host] = str(answers[0])
    return _yt_dns_cache[host]


def _patched_getaddrinfo(host, port, *args, **kwargs):
    """Monkey-patched getaddrinfo that bypasses /etc/hosts for youtube domains only."""
    if host in _YT_BYPASS_DOMAINS:
        host = _resolve_via_public_dns(host)
    return _original_getaddrinfo(host, port, *args, **kwargs)


socket.getaddrinfo = _patched_getaddrinfo

_INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
]

_ytt_api = YouTubeTranscriptApi()


def _discover_videos_invidious(channel_id: str, limit: int = 10) -> list[dict]:
    """Get recent videos from a channel via Invidious API, trying multiple instances."""
    for instance in _INVIDIOUS_INSTANCES:
        try:
            resp = requests.get(
                f"{instance}/api/v1/channels/{channel_id}/videos",
                params={"sort_by": "newest"},
                timeout=15,
            )
            resp.raise_for_status()
            videos = resp.json()
            if isinstance(videos, dict):
                videos = videos.get("videos", [])
            return [
                {
                    "video_id": v["videoId"],
                    "title": v["title"],
                    "published": v.get("published", 0),
                    "length_seconds": v.get("lengthSeconds", 0),
                    "description": v.get("description", ""),
                }
                for v in videos[:limit]
            ]
        except Exception as e:
            logger.warning("Invidious %s failed for %s: %s", instance, channel_id, e)
            continue
    logger.error("All Invidious instances failed for channel %s", channel_id)
    return []


def _discover_videos_rss(channel_id: str) -> list[dict]:
    """Fallback: discover videos via YouTube RSS feed (needs DNS bypass)."""
    try:
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        feed = feedparser.parse(url)
        if feed.bozo and not feed.entries:
            logger.warning("YouTube RSS feed error for %s: %s", channel_id, feed.bozo_exception)
            return []
        return [
            {
                "video_id": getattr(entry, "yt_videoid", ""),
                "title": entry.get("title", ""),
                "published": _feed_entry_date(entry),
                "length_seconds": 0,
                "description": _strip_html(entry.get("summary", ""))[:500],
            }
            for entry in feed.entries
            if getattr(entry, "yt_videoid", "")
        ]
    except Exception as e:
        logger.warning("YouTube RSS discovery failed for %s: %s", channel_id, e)
        return []


def _get_transcript(video_id: str) -> str | None:
    """Get transcript for a video via youtube-transcript-api (uses DNS bypass)."""
    try:
        transcript = _ytt_api.fetch(video_id, languages=["en"])
        return " ".join(snippet.text for snippet in transcript)
    except Exception as e:
        logger.debug("Transcript unavailable for %s: %s", video_id, e)
        return None


def fetch_youtube(source: dict) -> list[RawItem]:
    """Fetch recent videos from YouTube channels with transcripts.

    Discovery: tries Invidious API first (no youtube.com needed), falls back
    to YouTube RSS feed (uses DNS bypass to work around /etc/hosts block).
    Transcripts: youtube-transcript-api with DNS bypass."""
    items = []
    hours = source.get("hours_back", 168)
    max_results = source.get("max_results", 10)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)

    for name, channel_id in source.get("channels", {}).items():
        try:
            # Try Invidious first, fall back to YouTube RSS
            videos = _discover_videos_invidious(channel_id, limit=max_results)
            if not videos:
                logger.info("Invidious failed for %s, trying YouTube RSS", name)
                videos = _discover_videos_rss(channel_id)
            if not videos:
                logger.warning("No videos found for YouTube channel %s (%s)", name, channel_id)
                continue

            for v in videos:
                video_id = v["video_id"]
                published = v.get("published")
                if isinstance(published, datetime):
                    ts = published
                elif isinstance(published, (int, float)) and published > 0:
                    ts = datetime.fromtimestamp(published, tz=timezone.utc)
                else:
                    ts = datetime.now(tz=timezone.utc)

                if ts < cutoff:
                    continue  # skip videos older than hours_back

                transcript = _get_transcript(video_id)

                items.append(RawItem(
                    title=v["title"],
                    url=f"https://www.youtube.com/watch?v={video_id}",
                    source_type="youtube",
                    source_id=source["id"],
                    timestamp=ts,
                    metadata={
                        "channel": name,
                        "video_id": video_id,
                        "length_seconds": v.get("length_seconds", 0),
                        "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                        "has_transcript": transcript is not None,
                    },
                    content_snippet=v.get("description", "")[:500],
                    raw_content=transcript,
                ))
                time.sleep(0.5)  # be polite to youtube-transcript-api
        except Exception as e:
            logger.error("YouTube error (%s): %s", name, e)
    return items


def fetch_pubmed(source: dict) -> list[RawItem]:
    """Fetch recent PubMed articles matching a query. Uses httpx (SSL works better than requests for ncbi)."""
    query = source.get("query", "")
    max_results = source.get("max_results", 20)
    hours = source.get("hours_back", 168)
    reldate = max(1, hours // 24)  # PubMed uses days

    try:
        search_resp = httpx.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            params={
                "db": "pubmed", "term": query, "retmax": max_results,
                "sort": "pub_date", "retmode": "json",
                "datetype": "pdat", "reldate": reldate,
            },
            timeout=15.0,
        )
        search_resp.raise_for_status()
        ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []
    except Exception as e:
        logger.error("PubMed search error: %s", e)
        return []

    try:
        fetch_resp = httpx.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
            params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"},
            timeout=15.0,
        )
        fetch_resp.raise_for_status()
        results = fetch_resp.json().get("result", {})
    except Exception as e:
        logger.error("PubMed summary error: %s", e)
        return []

    items = []
    for pmid in ids:
        if pmid not in results:
            continue
        r = results[pmid]
        items.append(RawItem(
            title=r.get("title", ""),
            url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            source_type="pubmed",
            source_id=source["id"],
            timestamp=_parse_pubmed_date(r.get("pubdate", "")),
            metadata={
                "pmid": pmid,
                "journal": r.get("fulljournalname", ""),
                "authors": [a.get("name", "") for a in r.get("authors", [])],
            },
            content_snippet="",
            raw_content=None,
        ))
    return items


def fetch_exa(source: dict) -> list[RawItem]:
    """Fetch results from Exa semantic search."""
    if not EXA_API_KEY:
        logger.warning("Exa API key not set, skipping exa fetch")
        return []

    query = source.get("query", "")
    category = source.get("category", "news")
    hours = source.get("hours_back", 24)
    max_results = source.get("max_results", 20)
    start_date = (datetime.now(tz=timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT00:00:00Z")

    body = {
        "query": query,
        "category": category,
        "startPublishedDate": start_date,
        "numResults": max_results,
        "type": "auto",
        "contents": {"highlights": True, "summary": True},
    }
    if source.get("include_domains"):
        body["includeDomains"] = source["include_domains"]

    try:
        resp = requests.post(
            "https://api.exa.ai/search",
            json=body,
            headers={"x-api-key": EXA_API_KEY},
            timeout=20,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error("Exa fetch error: %s", e)
        return []

    items = []
    for r in resp.json().get("results", []):
        highlights = r.get("highlights", [])
        items.append(RawItem(
            title=r.get("title", ""),
            url=r.get("url", ""),
            source_type="exa",
            source_id=source["id"],
            timestamp=_parse_exa_date(r.get("publishedDate")),
            metadata={"author": r.get("author"), "exa_id": r.get("id")},
            content_snippet=highlights[0] if highlights else "",
            raw_content=r.get("text"),
        ))
    return items

def fetch_substack(source: dict) -> list[RawItem]:
    """Fetch posts from Substack publications via RSS feeds.
    Each publication exposes a feed at {base_url}/feed."""
    hours = source.get("hours_back", 168)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    items = []

    for name, base_url in source.get("publications", {}).items():
        feed_url = base_url.rstrip("/") + "/feed"
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                pub = _feed_entry_date(entry)
                if pub and pub > cutoff:
                    # Substack puts full HTML in content[0].value for free posts
                    raw_html = ""
                    if entry.get("content"):
                        raw_html = entry.content[0].get("value", "")

                    raw_text = _strip_html(raw_html) if raw_html else None

                    items.append(RawItem(
                        title=entry.get("title", ""),
                        url=entry.get("link", ""),
                        source_type="substack",
                        source_id=source["id"],
                        timestamp=pub,
                        metadata={
                            "publication": name,
                            "author": entry.get("author", ""),
                            "has_full_content": bool(raw_text),
                        },
                        content_snippet=_strip_html(entry.get("summary", ""))[:500],
                        raw_content=raw_text[:3000] if raw_text else None,
                    ))
        except Exception as e:
            logger.error("Substack error (%s): %s", name, e)
        time.sleep(1)  # polite delay between publications
    return items


def fetch_blog(source: dict) -> list[RawItem]:
    """Fetch posts from curated AI/ML blogs via RSS/Atom feeds.

    Like fetch_rss but with source_type='blog' and richer content extraction:
    tries entry.content[0].value for full HTML, falls back to entry.summary.
    """
    hours = source.get("hours_back", 168)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours)
    items = []

    for name, url in source.get("feeds", {}).items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                pub = _feed_entry_date(entry)
                if pub and pub > cutoff:
                    # Try full content first, fall back to summary
                    raw_html = ""
                    if getattr(entry, "content", None):
                        raw_html = entry.content[0].get("value", "")
                    if not raw_html:
                        raw_html = entry.get("summary", "")

                    raw_text = _strip_html(raw_html) if raw_html else None

                    items.append(RawItem(
                        title=entry.get("title", ""),
                        url=entry.get("link", ""),
                        source_type="blog",
                        source_id=source["id"],
                        timestamp=pub,
                        metadata={
                            "blog": name,
                            "author": entry.get("author", ""),
                        },
                        content_snippet=_strip_html(entry.get("summary", ""))[:500],
                        raw_content=raw_text[:3000] if raw_text else None,
                    ))
        except Exception as e:
            logger.error("Blog error (%s): %s", name, e)
    return items


def fetch_newsletter(source: dict) -> list[RawItem]:
    """Fetch newsletter content from web archives (TLDR, The Batch)."""
    items = []
    hours = source.get("hours_back", 72)

    for newsletter in source.get("newsletters", []):
        ntype = newsletter.get("type")
        try:
            if ntype == "tldr":
                items.extend(_fetch_tldr(newsletter, source["id"], hours))
            elif ntype == "deeplearning_batch":
                items.extend(_fetch_batch(newsletter, source["id"]))
        except Exception as e:
            logger.error("Newsletter error (%s): %s", newsletter.get("name"), e)
    return items


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
}


def _httpx_fetch(url: str, timeout: int = 15) -> str | None:
    """Fetch a URL using httpx with HTTP/2 and browser-like headers.
    Falls back to trafilatura if httpx fails."""
    try:
        with httpx.Client(http2=True, follow_redirects=True, timeout=timeout) as client:
            resp = client.get(url, headers=_BROWSER_HEADERS)
            if resp.status_code == 200 and len(resp.text) > 100:
                return resp.text
    except Exception as e:
        logger.debug("httpx fetch failed for %s: %s, trying trafilatura", url, e)
    # Fallback to trafilatura
    try:
        return trafilatura.fetch_url(url)
    except Exception:
        return None


def _fetch_tldr(newsletter: dict, source_id: str, hours: int) -> list[RawItem]:
    """Fetch TLDR newsletter by date-based archive URLs."""
    items = []
    section = newsletter.get("section", "ai")
    today = datetime.now(tz=timezone.utc)

    for days_back in range(int(hours / 24) + 1):
        date = today - timedelta(days=days_back)
        date_str = date.strftime("%Y-%m-%d")
        url = f"https://tldr.tech/{section}/{date_str}"

        try:
            html = _httpx_fetch(url, timeout=10)
            if not html:
                continue
            text = trafilatura.extract(html, include_comments=False)
            if text and len(text) > 200:
                items.append(RawItem(
                    title=f"TLDR {section.upper()} - {date_str}",
                    url=url,
                    source_type="newsletter",
                    source_id=source_id,
                    timestamp=date.replace(hour=0, minute=0, second=0),
                    metadata={
                        "newsletter": f"tldr_{section}",
                        "publisher": "tldr.tech",
                    },
                    content_snippet=text[:500],
                    raw_content=text[:5000],
                ))
        except Exception as e:
            logger.warning("TLDR %s/%s error: %s", section, date_str, e)
        time.sleep(1)
    return items


def _fetch_batch(newsletter: dict, source_id: str) -> list[RawItem]:
    """Fetch The Batch by scraping the archive index for recent issue links.
    Uses httpx with HTTP/2 since deeplearning.ai blocks standard HTTP/1.1 clients."""
    items = []
    index_url = "https://www.deeplearning.ai/the-batch/"

    try:
        index_html = _httpx_fetch(index_url)
        if not index_html:
            logger.warning("The Batch: could not fetch index page")
            return []
    except Exception as e:
        logger.error("The Batch index error: %s", e)
        return []

    # Extract issue links (relative and absolute) from the archive page
    issue_links = re.findall(r'href="(/the-batch/issue-\d+/?)"', index_html)
    seen = set()
    unique_urls = []
    for link in issue_links:
        url = f"https://www.deeplearning.ai{link.rstrip('/')}"
        if url not in seen:
            seen.add(url)
            unique_urls.append(url)

    for issue_url in unique_urls[:5]:
        try:
            html = _httpx_fetch(issue_url)
            if not html:
                continue
            text = trafilatura.extract(html, include_comments=False)
            if text and len(text) > 200:
                slug = issue_url.rstrip("/").split("/")[-1]
                title = f"The Batch - {slug.replace('-', ' ').title()}"

                items.append(RawItem(
                    title=title,
                    url=issue_url,
                    source_type="newsletter",
                    source_id=source_id,
                    timestamp=datetime.now(tz=timezone.utc),
                    metadata={
                        "newsletter": "the_batch",
                        "publisher": "deeplearning.ai",
                    },
                    content_snippet=text[:500],
                    raw_content=text[:5000],
                ))
        except Exception as e:
            logger.warning("The Batch issue error (%s): %s", issue_url, e)
        time.sleep(1)
    return items


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

FETCHERS = {
    "reddit": fetch_reddit,
    "hackernews": fetch_hackernews,
    "rss": fetch_rss,
    "arxiv": fetch_arxiv,
    "twitter": fetch_twitter,
    "twitter_accounts": fetch_twitter_accounts,
    "podcast": fetch_podcast,
    "youtube": fetch_youtube,
    "pubmed": fetch_pubmed,
    "exa": fetch_exa,
    "substack": fetch_substack,
    "blog": fetch_blog,
    "newsletter": fetch_newsletter,
}


def fetch_all(profile: dict) -> list[RawItem]:
    """Iterate enabled sources and dispatch to the right fetcher.
    One source failing doesn't kill the pipeline."""
    all_items: list[RawItem] = []
    for source in profile.get("sources", []):
        if not source.get("enabled", True):
            continue
        source_type = source.get("type", "")
        fetcher = FETCHERS.get(source_type)
        if not fetcher:
            logger.warning("Unknown source type: %s", source_type)
            continue
        try:
            logger.info("Fetching from %s (%s)...", source.get("id", source_type), source_type)
            items = fetcher(source)
            logger.info("  → %d items from %s", len(items), source.get("id", source_type))
            all_items.extend(items)
        except Exception as e:
            logger.error("Fetcher %s failed: %s", source_type, e)
    logger.info("Total: %d raw items from %d sources", len(all_items),
                sum(1 for s in profile.get("sources", []) if s.get("enabled", True)))
    return all_items
