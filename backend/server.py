"""
Cortex Backend — FastAPI server
See ../contracts.md for the full API specification.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Cortex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/topics")
async def list_topics():
    # TODO: scan data/topics/ folders, return meta.yaml summaries
    return []


@app.get("/api/profile")
async def get_profile():
    # TODO: read data/profiles/default/profile.yaml
    return {}
