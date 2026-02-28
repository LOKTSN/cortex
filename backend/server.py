"""
Cortex Backend — FastAPI server
See ../contracts.md for the full API specification.
"""
from pathlib import Path

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

app = FastAPI(title="Cortex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed data lives two levels up from backend/
SEED_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "seed-data" / "topics"


def _find_topic_dirs() -> list[Path]:
    """Find all topic directories matching YYYY-MM/DD/slug/ structure."""
    dirs: list[Path] = []
    if not SEED_DATA_DIR.exists():
        return dirs
    for month_dir in sorted(SEED_DATA_DIR.iterdir()):
        if not month_dir.is_dir():
            continue
        for day_dir in sorted(month_dir.iterdir()):
            if not day_dir.is_dir():
                continue
            for topic_dir in sorted(day_dir.iterdir()):
                if topic_dir.is_dir() and (topic_dir / "meta.yaml").exists():
                    dirs.append(topic_dir)
    return dirs


def _read_topic(topic_dir: Path) -> dict | None:
    """Read a topic from its directory, returning metadata with file list."""
    meta_path = topic_dir / "meta.yaml"
    try:
        data = yaml.safe_load(meta_path.read_text())
        if not data:
            return None
        # Include first paragraph of synthesis as summary
        synthesis_path = topic_dir / "synthesis.md"
        if synthesis_path.exists():
            text = synthesis_path.read_text().strip()
            data["summary"] = text.split("\n\n")[0]
        # List all files in the topic folder (excluding meta.yaml)
        data["files"] = sorted(
            f.name for f in topic_dir.iterdir()
            if f.is_file() and f.name != "meta.yaml"
        )
        return data
    except Exception:
        return None


@app.get("/api/topics")
async def list_topics():
    topics = []
    for topic_dir in _find_topic_dirs():
        data = _read_topic(topic_dir)
        if data:
            topics.append(data)
    return topics


@app.get("/api/topics/{slug}")
async def get_topic(slug: str):
    for topic_dir in _find_topic_dirs():
        meta_path = topic_dir / "meta.yaml"
        try:
            data = yaml.safe_load(meta_path.read_text())
            if data and data.get("slug") == slug:
                result = _read_topic(topic_dir)
                if result:
                    return result
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Topic not found")


@app.get("/api/topics/{slug}/synthesis")
async def get_synthesis(slug: str):
    for topic_dir in _find_topic_dirs():
        meta_path = topic_dir / "meta.yaml"
        try:
            data = yaml.safe_load(meta_path.read_text())
            if data and data.get("slug") == slug:
                synthesis_path = topic_dir / "synthesis.md"
                if synthesis_path.exists():
                    return PlainTextResponse(synthesis_path.read_text())
                raise HTTPException(status_code=404, detail="Synthesis not found")
        except HTTPException:
            raise
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Topic not found")


@app.get("/api/profile")
async def get_profile():
    # TODO: read data/profiles/default/profile.yaml
    return {}


# Mount the CopilotKit AG-UI endpoint at /api/copilotkit
try:
    from agent.copilotkit_setup import setup_copilotkit
    setup_copilotkit(app, workspace_root=Path(__file__).resolve().parent.parent)
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"CopilotKit endpoint not mounted: {e}")
