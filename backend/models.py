"""
Cortex — Shared data models
"""
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawItem:
    """A single item fetched from any source. Common format across all fetchers."""
    title: str
    url: str
    source_type: str          # reddit | twitter | twitter_accounts | hackernews | rss | podcast | youtube | arxiv | pubmed | exa
    source_id: str            # the profile source id (e.g. "reddit_ml", "hn")
    timestamp: datetime
    metadata: dict            # source-specific: score, comments, likes, author, etc.
    content_snippet: str      # first ~500 chars of content (if available)
    raw_content: str | None   # full article text (extracted via trafilatura, or inline for tweets/self-posts)


@dataclass
class ScoredItem:
    """A RawItem after relevance scoring."""
    item: RawItem
    relevance_score: float    # 0-1
    relevance_reason: str


@dataclass
class TopicCluster:
    """A group of related items about the same event/story."""
    cluster_id: int
    representative_title: str  # best title for the cluster
    items: list[RawItem]
    relevance_score: float = 0.0
    relevance_reason: str = ""
    embedding: list[float] = field(default_factory=list)
