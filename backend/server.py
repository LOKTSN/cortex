"""
Cortex Backend — FastAPI server
See ../contracts.md for the full API specification.
"""
import logging
import re
import uuid
from pathlib import Path
from threading import Thread

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from discovery import run_discovery, load_profile, TOPICS_DIR, PROFILES_DIR
from agent.graph import build_graph
from agent.copilotkit_setup import setup_copilotkit

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Cortex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Chat Agent
# ---------------------------------------------------------------------------
WORKSPACE_ROOT = Path(__file__).parent.parent  # workspace/ directory
_graph = build_graph(str(WORKSPACE_ROOT))

# CopilotKit endpoint (used by the standalone chat app)
setup_copilotkit(app, WORKSPACE_ROOT)

# Debug: capture what CopilotKit sends
from fastapi import Request
@app.post("/api/copilotkit-debug")
async def copilotkit_debug(request: Request):
    body = await request.json()
    logger.info(f"CopilotKit request body keys: {list(body.keys())}")
    logger.info(f"CopilotKit request body: {str(body)[:2000]}")
    return {"ok": True}
logger = logging.getLogger("cortex")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str | None = None


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Chat endpoint — runs the LangGraph agent and returns the final reply."""
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    # Convert frontend messages to LangChain format
    # NOTE: MiniMax only allows ONE system message, and graph.py already adds it.
    # Pass context as a prefixed user message instead.
    lc_messages = []
    for msg in req.messages:
        if msg.role == "user":
            content = msg.content
            # Prepend context to the first user message
            if req.context and not any(isinstance(m, HumanMessage) for m in lc_messages):
                content = f"[Page context: {req.context[:2000]}]\n\n{content}"
            lc_messages.append(HumanMessage(content=content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))

    # Run the agent
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    try:
        result = await _graph.ainvoke({"messages": lc_messages}, config)
        # Extract tool calls from the conversation
        tools_used = []
        for msg in result["messages"]:
            if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tools_used.append({
                        "name": tc["name"],
                        "args": {k: (v[:100] + "..." if isinstance(v, str) and len(v) > 100 else v)
                                 for k, v in tc.get("args", {}).items()},
                    })
        # Get the last AI message
        reply = ""
        for msg in reversed(result["messages"]):
            if isinstance(msg, AIMessage) and msg.content:
                reply = msg.content
                break
        # Strip thinking tags from MiniMax
        reply = re.sub(r"<think>.*?</think>", "", reply, flags=re.DOTALL).strip()
        return {"reply": reply, "tools_used": tools_used}
    except Exception as e:
        logger.exception("Chat error")
        return {"reply": f"Sorry, something went wrong: {e}", "tools_used": []}

# In-memory job tracking (hackathon — no persistence needed)
_jobs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------

@app.get("/api/topics")
async def list_topics():
    """Scan data/topics/ folders, return meta.yaml summaries."""
    topics = []
    if not TOPICS_DIR.exists():
        return []
    for meta_file in sorted(TOPICS_DIR.glob("*/meta.yaml"), reverse=True):
        try:
            meta = yaml.safe_load(meta_file.read_text())
            if meta:
                topics.append(meta)
        except Exception:
            continue
    return topics


@app.get("/api/topics/{slug}")
async def get_topic(slug: str):
    """Return full meta.yaml content for a topic."""
    # Find folder matching slug
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            meta_file = folder / "meta.yaml"
            if meta_file.exists():
                return yaml.safe_load(meta_file.read_text())
    raise HTTPException(404, f"Topic not found: {slug}")


@app.get("/api/topics/{slug}/synthesis", response_class=PlainTextResponse)
async def get_synthesis(slug: str):
    """Return synthesis.md as text."""
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            synth_file = folder / "synthesis.md"
            if synth_file.exists():
                return synth_file.read_text()
    raise HTTPException(404, f"Synthesis not found for: {slug}")


@app.get("/api/topics/{slug}/files")
async def list_topic_files(slug: str):
    """List files in a topic folder."""
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            files = []
            for f in folder.iterdir():
                if f.is_file():
                    files.append({
                        "name": f.name,
                        "type": f.suffix.lstrip("."),
                        "size": f.stat().st_size,
                    })
            return files
    raise HTTPException(404, f"Topic not found: {slug}")


@app.get("/api/topics/{slug}/file/{filename}", response_class=PlainTextResponse)
async def get_topic_file(slug: str, filename: str):
    """Return a specific file from a topic folder."""
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            file_path = folder / filename
            if file_path.exists():
                return file_path.read_text()
    raise HTTPException(404, f"File not found: {slug}/{filename}")


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@app.get("/api/profile")
async def get_profile():
    """Return profile.yaml content as JSON."""
    try:
        return load_profile()
    except FileNotFoundError:
        raise HTTPException(404, "Default profile not found")


@app.put("/api/profile")
async def update_profile(updates: dict):
    """Partial update to profile."""
    path = PROFILES_DIR / "default" / "profile.yaml"
    if not path.exists():
        raise HTTPException(404, "Default profile not found")
    profile = yaml.safe_load(path.read_text())
    profile.update(updates)
    path.write_text(yaml.dump(profile, default_flow_style=False, allow_unicode=True))
    return profile


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

def _run_discovery_job(job_id: str, query: str | None = None):
    """Run discovery in a background thread."""
    try:
        _jobs[job_id]["status"] = "running"
        result = run_discovery()
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["new_topics"] = result.get("topics_created", [])
        _jobs[job_id]["stats"] = result.get("stats", {})
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)


@app.post("/api/discover")
async def start_discovery(body: dict | None = None):
    """Trigger a discovery run. Returns a job ID to poll."""
    job_id = str(uuid.uuid4())[:8]
    query = body.get("query") if body else None
    _jobs[job_id] = {"status": "started", "job_id": job_id}

    thread = Thread(target=_run_discovery_job, args=(job_id, query), daemon=True)
    thread.start()

    return {"status": "started", "job_id": job_id}


@app.get("/api/discover/{job_id}")
async def get_discovery_status(job_id: str):
    """Poll discovery job status."""
    if job_id not in _jobs:
        raise HTTPException(404, f"Job not found: {job_id}")
    return _jobs[job_id]
