"""
Cortex — Embedding & Similarity Layer

Local ONNX embeddings (BGE-small-en via fastembed): dedup, novelty detection, relevance filtering, clustering.
No external API needed — runs entirely locally.
"""
import hashlib
import json
import logging
import os
from pathlib import Path

import numpy as np
import yaml
from dotenv import load_dotenv
from fastembed import TextEmbedding
from sklearn.cluster import KMeans

from models import RawItem, TopicCluster

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

# Local embedding model (384d, fast ONNX inference)
_EMBED_MODEL: TextEmbedding | None = None


def _get_embed_model() -> TextEmbedding:
    global _EMBED_MODEL
    if _EMBED_MODEL is None:
        _EMBED_MODEL = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _EMBED_MODEL


CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / ".embedding_cache.json"

# Similarity thresholds
DEDUP_AUTO_MERGE = 0.95
DEDUP_NEEDS_REVIEW = 0.80
NOVELTY_THRESHOLD = 0.85
RELEVANCE_THRESHOLD = 0.30


# ---------------------------------------------------------------------------
# Embedding cache
# ---------------------------------------------------------------------------

def _load_cache() -> dict[str, list[float]]:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _save_cache(cache: dict[str, list[float]]) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache))


def _cache_key(text: str) -> str:
    """SHA-256 of text for stable cache keys."""
    return hashlib.sha256(text.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Cosine similarity (numpy)
# ---------------------------------------------------------------------------

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def cosine_similarity_matrix(vectors: np.ndarray) -> np.ndarray:
    """Pairwise cosine similarity matrix for a set of vectors."""
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)  # avoid div by zero
    normalized = vectors / norms
    return normalized @ normalized.T


# ---------------------------------------------------------------------------
# Local embedding (fastembed / BGE-small-en)
# ---------------------------------------------------------------------------

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed texts using local ONNX model (BGE-small-en, 384d).

    Uses local cache to skip already-embedded texts.
    """
    if not texts:
        return []

    cache = _load_cache()
    results: list[tuple[int, list[float] | None]] = []
    uncached_indices: list[int] = []
    uncached_texts: list[str] = []

    for i, text in enumerate(texts):
        key = _cache_key(text)
        if key in cache:
            results.append((i, cache[key]))
        else:
            results.append((i, None))
            uncached_indices.append(i)
            uncached_texts.append(text)

    if uncached_texts:
        model = _get_embed_model()
        new_embeddings = list(model.embed(uncached_texts))
        for idx, emb in zip(uncached_indices, new_embeddings):
            emb_list = emb.tolist()
            results[idx] = (idx, emb_list)
            cache[_cache_key(texts[idx])] = emb_list
        _save_cache(cache)

    return [emb for _, emb in sorted(results, key=lambda x: x[0])]


# ---------------------------------------------------------------------------
# Item embedding
# ---------------------------------------------------------------------------

def _item_text(item: RawItem) -> str:
    """Build embedding text from a RawItem."""
    parts = [item.title]
    if item.content_snippet:
        parts.append(item.content_snippet)
    if item.raw_content:
        parts.append(item.raw_content[:500])
    return " ".join(parts)


def embed_items(items: list[RawItem]) -> list[tuple[RawItem, list[float]]]:
    """Embed a list of RawItems. Returns (item, vector) pairs."""
    if not items:
        return []
    texts = [_item_text(item) for item in items]
    vectors = embed_texts(texts)
    return list(zip(items, vectors))


# ---------------------------------------------------------------------------
# Dedup
# ---------------------------------------------------------------------------

def dedup_items(
    items_with_embeddings: list[tuple[RawItem, list[float]]],
) -> list[RawItem]:
    """Deduplicate items by cosine similarity on their embeddings.

    - > 0.95: auto-merge (keep item with most metadata/engagement)
    - 0.80-0.95: merge for now (TODO: add LLM confirmation)
    - < 0.80: different items
    """
    if len(items_with_embeddings) <= 1:
        return [item for item, _ in items_with_embeddings]

    items = [item for item, _ in items_with_embeddings]
    vectors = np.array([vec for _, vec in items_with_embeddings])
    sim_matrix = cosine_similarity_matrix(vectors)

    # Track which items are merged away
    merged = set()
    n = len(items)

    for i in range(n):
        if i in merged:
            continue
        for j in range(i + 1, n):
            if j in merged:
                continue
            sim = sim_matrix[i, j]
            if sim >= DEDUP_NEEDS_REVIEW:  # >= 0.80 → merge
                # Keep the one with more engagement signals
                keep, drop = _pick_better(items[i], items[j])
                if drop is items[j]:
                    merged.add(j)
                else:
                    merged.add(i)
                    break  # i is merged, stop comparing

    return [items[i] for i in range(n) if i not in merged]


def _pick_better(a: RawItem, b: RawItem) -> tuple[RawItem, RawItem]:
    """Pick the item with more metadata / engagement signals."""
    def _score(item: RawItem) -> float:
        s = 0.0
        s += item.metadata.get("score", 0)
        s += item.metadata.get("points", 0)
        s += item.metadata.get("likes", 0)
        s += item.metadata.get("num_comments", 0) * 0.5
        if item.raw_content:
            s += min(len(item.raw_content), 2000) / 200  # bonus for content
        return s

    if _score(a) >= _score(b):
        return a, b
    return b, a


# ---------------------------------------------------------------------------
# Novelty check
# ---------------------------------------------------------------------------

def check_novelty(
    items_with_embeddings: list[tuple[RawItem, list[float]]],
    topics_dir: str,
) -> list[RawItem]:
    """Filter out items that are too similar to existing topics.

    Loads meta.yaml from each topic folder, embeds title + tags,
    and drops new items with cosine > NOVELTY_THRESHOLD against any existing topic.
    """
    if not items_with_embeddings:
        return []

    topics_path = Path(topics_dir)
    if not topics_path.exists():
        # No existing topics → everything is novel
        return [item for item, _ in items_with_embeddings]

    # Load existing topic texts
    topic_texts = []
    for meta_file in topics_path.glob("*/meta.yaml"):
        try:
            meta = yaml.safe_load(meta_file.read_text())
            if meta:
                parts = [meta.get("title", "")]
                tags = meta.get("tags", [])
                if tags:
                    parts.append(" ".join(tags))
                topic_texts.append(" ".join(parts))
        except Exception:
            continue

    if not topic_texts:
        return [item for item, _ in items_with_embeddings]

    # Embed existing topics
    topic_vectors = np.array(embed_texts(topic_texts))

    # Compare each new item against all existing topics
    novel_items = []
    for item, vec in items_with_embeddings:
        item_vec = np.array(vec)
        max_sim = max(
            cosine_similarity(item_vec, tv) for tv in topic_vectors
        )
        if max_sim < NOVELTY_THRESHOLD:
            novel_items.append(item)
        else:
            logger.debug("Skipping '%s' — too similar to existing topic (%.2f)", item.title, max_sim)

    return novel_items


# ---------------------------------------------------------------------------
# Relevance filter
# ---------------------------------------------------------------------------

def filter_relevance(
    items_with_embeddings: list[tuple[RawItem, list[float]]],
    profile: dict,
) -> list[RawItem]:
    """Drop items below RELEVANCE_THRESHOLD against user interest vector.

    Interest vector = embedding of focus_areas + field from profile.
    """
    if not items_with_embeddings:
        return []

    # Build interest text from profile
    field = profile.get("field", "")
    focus_areas = profile.get("focus_areas", [])
    interest_text = f"{field} {' '.join(focus_areas)}".strip()

    if not interest_text:
        # No profile info → keep everything
        return [item for item, _ in items_with_embeddings]

    interest_vec = np.array(embed_texts([interest_text])[0])

    relevant_items = []
    for item, vec in items_with_embeddings:
        sim = cosine_similarity(np.array(vec), interest_vec)
        if sim >= RELEVANCE_THRESHOLD:
            relevant_items.append(item)
        else:
            logger.debug("Dropping '%s' — low relevance (%.2f)", item.title, sim)

    return relevant_items


# ---------------------------------------------------------------------------
# Clustering
# ---------------------------------------------------------------------------

def cluster_items(
    items_with_embeddings: list[tuple[RawItem, list[float]]],
    n_clusters: int = 12,
) -> list[TopicCluster]:
    """K-means clustering on embeddings. Returns TopicCluster objects.

    Representative title = item closest to the cluster centroid.
    """
    if not items_with_embeddings:
        return []

    items = [item for item, _ in items_with_embeddings]
    vectors = np.array([vec for _, vec in items_with_embeddings])

    # Adjust n_clusters if fewer items than clusters
    actual_k = min(n_clusters, len(items))
    if actual_k <= 1:
        return [
            TopicCluster(
                cluster_id=0,
                representative_title=items[0].title,
                items=items,
                embedding=vectors.mean(axis=0).tolist() if len(vectors) > 0 else [],
            )
        ]

    kmeans = KMeans(n_clusters=actual_k, n_init=10, random_state=42)
    labels = kmeans.fit_predict(vectors)
    centroids = kmeans.cluster_centers_

    clusters: list[TopicCluster] = []
    for cluster_id in range(actual_k):
        mask = labels == cluster_id
        cluster_items_list = [items[i] for i in range(len(items)) if mask[i]]
        cluster_vectors = vectors[mask]

        if len(cluster_items_list) == 0:
            continue

        # Find item closest to centroid
        centroid = centroids[cluster_id]
        distances = np.array([
            cosine_similarity(vec, centroid) for vec in cluster_vectors
        ])
        best_idx = int(np.argmax(distances))

        clusters.append(
            TopicCluster(
                cluster_id=cluster_id,
                representative_title=cluster_items_list[best_idx].title,
                items=cluster_items_list,
                embedding=centroid.tolist(),
            )
        )

    return clusters


# ---------------------------------------------------------------------------
# Run data persistence (temp per-run + persistent embedding index)
# ---------------------------------------------------------------------------

def _item_to_dict(item: RawItem) -> dict:
    """Serialize a RawItem to a JSON-safe dict."""
    return {
        "title": item.title,
        "url": item.url,
        "source_type": item.source_type,
        "source_id": item.source_id,
        "timestamp": item.timestamp.isoformat(),
        "metadata": item.metadata,
        "content_snippet": item.content_snippet,
        "raw_content": item.raw_content,
    }


def save_run_data(
    run_dir: str,
    items: list[RawItem],
    embeddings: list[list[float]],
) -> None:
    """Dump raw items + embeddings to a temp run folder."""
    rd = Path(run_dir)
    rd.mkdir(parents=True, exist_ok=True)

    (rd / "raw_items.json").write_text(
        json.dumps([_item_to_dict(it) for it in items], indent=2)
    )
    (rd / "embeddings.json").write_text(
        json.dumps(embeddings)
    )
    logger.info("Saved run data to %s (%d items)", run_dir, len(items))


def load_embedding_index(data_dir: str) -> dict[str, list[float]]:
    """Load the persistent topic embedding index.

    Returns {topic_folder_name: embedding_vector}.
    """
    idx_path = Path(data_dir) / ".embedding_index.json"
    if idx_path.exists():
        try:
            return json.loads(idx_path.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def update_embedding_index(
    data_dir: str,
    new_topics: dict[str, list[float]],
) -> None:
    """Merge new topic embeddings into the persistent index.

    Args:
        data_dir: path to workspace/data/
        new_topics: {topic_folder_name: embedding_vector}
    """
    idx = load_embedding_index(data_dir)
    idx.update(new_topics)
    idx_path = Path(data_dir) / ".embedding_index.json"
    idx_path.parent.mkdir(parents=True, exist_ok=True)
    idx_path.write_text(json.dumps(idx))
    logger.info("Updated embedding index: %d total topics", len(idx))


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

def run_embedding_pipeline(
    items: list[RawItem],
    profile: dict,
    topics_dir: str,
    data_dir: str | None = None,
    n_clusters: int = 12,
) -> list[TopicCluster]:
    """Full embedding pipeline: embed → dedup → novelty → relevance → cluster.

    Takes raw fetched items, returns clustered topic groups ready for LLM synthesis.

    Args:
        items: raw fetched items
        profile: user profile dict (field, focus_areas)
        topics_dir: path to existing topic folders
        data_dir: path to workspace/data/ (for run snapshots + embedding index).
                  If None, defaults to parent of topics_dir.
        n_clusters: target number of topic clusters
    """
    if not items:
        return []

    if data_dir is None:
        data_dir = str(Path(topics_dir).parent)

    logger.info("Embedding pipeline: %d items in", len(items))

    # 1. Embed all items
    items_with_emb = embed_items(items)
    logger.info("Embedded %d items (384d BGE-small-en)", len(items_with_emb))

    # Save run data snapshot
    from datetime import datetime as _dt
    run_dir = str(Path(data_dir) / "temp" / f"run_{_dt.now().strftime('%Y-%m-%d_%H%M')}")
    save_run_data(run_dir, items, [vec for _, vec in items_with_emb])

    # 2. Dedup across sources
    deduped = dedup_items(items_with_emb)
    logger.info("After dedup: %d items (removed %d dupes)", len(deduped), len(items) - len(deduped))

    # Re-pair with embeddings for deduped items
    emb_lookup = {id(item): vec for item, vec in items_with_emb}
    deduped_with_emb = [(item, emb_lookup[id(item)]) for item in deduped]

    # 3. Novelty check — use persistent index if available, else fall back to topics dir
    embedding_index = load_embedding_index(data_dir)
    if embedding_index:
        novel = _check_novelty_from_index(deduped_with_emb, embedding_index)
    else:
        novel = check_novelty(deduped_with_emb, topics_dir)
    logger.info("After novelty check: %d items", len(novel))

    novel_with_emb = [(item, emb_lookup[id(item)]) for item in novel]

    # 4. Relevance filter
    relevant = filter_relevance(novel_with_emb, profile)
    logger.info("After relevance filter: %d items", len(relevant))

    relevant_with_emb = [(item, emb_lookup[id(item)]) for item in relevant]

    # 5. Cluster into topics
    clusters = cluster_items(relevant_with_emb, n_clusters=n_clusters)
    logger.info("Clustered into %d topics", len(clusters))

    return clusters


def _check_novelty_from_index(
    items_with_embeddings: list[tuple[RawItem, list[float]]],
    embedding_index: dict[str, list[float]],
) -> list[RawItem]:
    """Fast novelty check using pre-computed embedding index (no API calls)."""
    if not items_with_embeddings or not embedding_index:
        return [item for item, _ in items_with_embeddings]

    topic_vectors = np.array(list(embedding_index.values()))
    novel_items = []
    for item, vec in items_with_embeddings:
        item_vec = np.array(vec)
        max_sim = max(cosine_similarity(item_vec, tv) for tv in topic_vectors)
        if max_sim < NOVELTY_THRESHOLD:
            novel_items.append(item)
        else:
            logger.debug("Skipping '%s' — matches indexed topic (%.2f)", item.title, max_sim)
    return novel_items
