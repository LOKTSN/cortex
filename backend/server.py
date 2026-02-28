"""
Cortex Backend — FastAPI server
See ../contracts.md for the full API specification.
"""
from pathlib import Path

import yaml
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Cortex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed data lives two levels up from backend/
SEED_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "seed-data" / "topics"


@app.get("/api/topics")
async def list_topics():
    topics = []
    if SEED_DATA_DIR.exists():
        for meta_path in sorted(SEED_DATA_DIR.glob("*/meta.yaml")):
            try:
                data = yaml.safe_load(meta_path.read_text())
                if not data:
                    continue
                # Include first paragraph of synthesis as summary
                synthesis_path = meta_path.parent / "synthesis.md"
                if synthesis_path.exists():
                    text = synthesis_path.read_text().strip()
                    data["summary"] = text.split("\n\n")[0]
                topics.append(data)
            except Exception:
                continue
    return topics


@app.get("/api/profile")
async def get_profile():
    # TODO: read data/profiles/default/profile.yaml
    return {}
