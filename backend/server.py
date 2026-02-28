"""
Cortex Backend — FastAPI server
See ../contracts.md for the full API specification.
"""
import base64
import json as json_mod
import logging
import os
import uuid
from pathlib import Path
import httpx
import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from discovery import load_profile, TOPICS_DIR, PROFILES_DIR
from exa_discovery import run_exa_discovery
from agent.agent import CortexAgent

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("cortex")

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
_agent = CortexAgent(str(WORKSPACE_ROOT))


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str | None = None


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Chat endpoint — runs the agent and returns the final reply."""
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    try:
        return await _agent.run(messages, context=req.context)
    except Exception as e:
        logger.exception("Chat error")
        return {"reply": f"Sorry, something went wrong: {e}", "tools_used": []}

# ---------------------------------------------------------------------------
# Voice WebSocket — LLM streaming + MiniMax TTS
# Pipeline: STT (browser) → M2.5 streaming → text → TTS → audio
# ---------------------------------------------------------------------------

VOICE_SYSTEM_PROMPT = """You are Cortex, an AI learning companion. The user is speaking to you via voice.

Rules for voice responses:
- Keep responses concise: 2-4 sentences for simple questions, up to 6 for complex ones.
- Be warm, conversational, and engaging — like a knowledgeable friend.
- Avoid markdown formatting, bullet lists, or code blocks — this will be spoken aloud.
- Use natural speech patterns. Say "about" instead of "approximately", etc.
- If explaining something complex, break it into digestible pieces.
- Do NOT use <think> tags or internal monologue.
- Reference the topic context if provided to stay relevant."""

import re as _re
import asyncio as _asyncio
import websockets

# Sentence boundary regex — split on . ! ? followed by space or end-of-string
_SENTENCE_END = _re.compile(r'(?<=[.!?])\s+')

# TTS WebSocket settings
_TTS_WS_URL = "wss://api.minimax.io/ws/v1/t2a_v2"
_TTS_VOICE_SETTING = {
    "voice_id": "English_FriendlyPerson",
    "speed": 1.0,
    "vol": 1,
    "pitch": 0,
}
_TTS_AUDIO_SETTING = {
    "sample_rate": 32000,
    "bitrate": 128000,
    "format": "mp3",
    "channel": 1,
}


async def _tts_worker(
    sentence_queue: _asyncio.Queue,
    client_ws: WebSocket,
    api_key: str,
):
    """Background task: stream sentences to MiniMax WebSocket TTS, forward audio chunks."""
    try:
        extra_headers = {"Authorization": f"Bearer {api_key}"}
        async with websockets.connect(
            _TTS_WS_URL,
            additional_headers=extra_headers,
        ) as tts_ws:
            # Wait for connection success
            hello = json_mod.loads(await tts_ws.recv())
            if hello.get("event") != "connected_success":
                logger.error("TTS WS connect failed: %s", hello)
                return

            # Start task with voice/audio settings
            await tts_ws.send(json_mod.dumps({
                "event": "task_start",
                "model": "speech-2.6-turbo",
                "voice_setting": _TTS_VOICE_SETTING,
                "audio_setting": _TTS_AUDIO_SETTING,
            }))

            # Wait for task_started
            started = json_mod.loads(await tts_ws.recv())
            logger.info("TTS task started: %s", started.get("event", "?"))

            # Process sentences from queue
            while True:
                sentence = await sentence_queue.get()
                if sentence is None:  # poison pill — done
                    break
                text = sentence.strip()
                if not text:
                    continue

                # Send text for synthesis
                await tts_ws.send(json_mod.dumps({
                    "event": "task_continue",
                    "text": text[:10000],
                }))

                # Collect audio chunks until is_final
                audio_buf = bytearray()
                while True:
                    msg = json_mod.loads(await _asyncio.wait_for(tts_ws.recv(), timeout=30))
                    if msg.get("data", {}).get("audio"):
                        audio_buf.extend(bytes.fromhex(msg["data"]["audio"]))
                    if msg.get("is_final"):
                        break

                # Send accumulated audio for this sentence
                if audio_buf:
                    audio_b64 = base64.b64encode(bytes(audio_buf)).decode()
                    await client_ws.send_json({
                        "type": "audio",
                        "data": audio_b64,
                        "format": "mp3",
                    })

            # Close TTS session
            await tts_ws.send(json_mod.dumps({"event": "task_finish"}))

    except Exception as e:
        logger.exception("TTS worker error: %s", e)


@app.websocket("/ws/voice")
async def voice_ws(websocket: WebSocket):
    """WebSocket endpoint for real-time voice conversation.

    Pipeline: user speech → text via browser STT → LLM streaming → TTS → audio
    Client sends: {"type": "chat", "messages": [...], "context": "..."}
    Server sends: {"type": "text", "content": "..."} (streaming text chunks)
                  {"type": "audio", "data": "<base64>", "format": "mp3", "index": N}
                  {"type": "done"} (response complete)
                  {"type": "error", "message": "..."} (on error)
    """
    await websocket.accept()
    api_key = os.getenv("MINIMAX_API_KEY")

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") != "chat":
                continue

            messages = data.get("messages", [])
            context = data.get("context")

            # Build API messages with voice-optimized system prompt
            system_content = VOICE_SYSTEM_PROMPT
            if context:
                system_content += f"\n\nCurrent topic context: {context}"

            api_messages = [{"role": "system", "content": system_content}]
            for msg in messages:
                api_messages.append({"role": msg["role"], "content": msg["content"]})

            try:
                full_text = ""
                sentence_buf = ""  # accumulates clean text for sentence splitting
                sentence_queue: _asyncio.Queue[str | None] = _asyncio.Queue()

                # Start TTS worker — generates audio for each sentence as it arrives
                tts_task = _asyncio.create_task(
                    _tts_worker(sentence_queue, websocket, api_key)
                )

                # Step 1: Stream LLM text response
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(60.0, connect=10.0)
                ) as client:
                    async with client.stream(
                        "POST",
                        "https://api.minimax.io/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "MiniMax-M2.5",
                            "messages": api_messages,
                            "stream": True,
                            "max_tokens": 512,
                            "temperature": 0.7,
                        },
                    ) as response:
                        if response.status_code != 200:
                            body = await response.aread()
                            logger.error("LLM error %s: %s", response.status_code, body[:500])
                            await websocket.send_json({
                                "type": "error",
                                "message": f"LLM error: {response.status_code}",
                            })
                            # Clean up TTS worker
                            await sentence_queue.put(None)
                            await tts_task
                            continue

                        in_think = False
                        async for line in response.aiter_lines():
                            if not line.startswith("data:"):
                                continue
                            raw = line[5:].strip()
                            if raw == "[DONE]":
                                break
                            try:
                                chunk = json_mod.loads(raw)
                            except json_mod.JSONDecodeError:
                                continue

                            choices = chunk.get("choices", [])
                            if not choices:
                                continue
                            delta = choices[0].get("delta", {})

                            if delta.get("content"):
                                text_chunk = delta["content"]
                                full_text += text_chunk

                                # Filter <think> blocks from streaming output
                                if "<think>" in text_chunk:
                                    in_think = True
                                    before = text_chunk.split("<think>")[0]
                                    if before.strip():
                                        await websocket.send_json({
                                            "type": "text",
                                            "content": before,
                                        })
                                        sentence_buf += before
                                    continue
                                if "</think>" in text_chunk:
                                    in_think = False
                                    after = text_chunk.split("</think>", 1)[1]
                                    if after.strip():
                                        await websocket.send_json({
                                            "type": "text",
                                            "content": after,
                                        })
                                        sentence_buf += after
                                    continue
                                if in_think:
                                    continue

                                # Stream clean text to client
                                await websocket.send_json({
                                    "type": "text",
                                    "content": text_chunk,
                                })
                                sentence_buf += text_chunk

                                # Check for sentence boundaries → queue for TTS
                                parts = _SENTENCE_END.split(sentence_buf)
                                if len(parts) > 1:
                                    # All but last part are complete sentences
                                    for s in parts[:-1]:
                                        if s.strip():
                                            await sentence_queue.put(s.strip())
                                    sentence_buf = parts[-1]

                # Flush remaining text as final TTS chunk
                if sentence_buf.strip():
                    await sentence_queue.put(sentence_buf.strip())

                # Signal TTS worker to finish and wait
                await sentence_queue.put(None)
                await tts_task

                await websocket.send_json({"type": "done"})

            except Exception as e:
                logger.exception("Voice stream error")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Voice processing error: {e}",
                })

    except WebSocketDisconnect:
        logger.info("Voice WebSocket disconnected")


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

async def _run_discovery_job(job_id: str):
    """Run Exa discovery pipeline as a background task."""
    try:
        _jobs[job_id]["status"] = "running"
        result = await run_exa_discovery()
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["new_topics"] = result.get("topics_created", [])
        _jobs[job_id]["stats"] = result.get("stats", {})
    except Exception as e:
        logger.exception("Discovery job failed")
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)


@app.post("/api/discover")
async def start_discovery(body: dict | None = None):
    """Trigger a discovery run. Returns a job ID to poll."""
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"status": "started", "job_id": job_id}

    _asyncio.create_task(_run_discovery_job(job_id))

    return {"status": "started", "job_id": job_id}


@app.get("/api/discover/{job_id}")
async def get_discovery_status(job_id: str):
    """Poll discovery job status."""
    if job_id not in _jobs:
        raise HTTPException(404, f"Job not found: {job_id}")
    return _jobs[job_id]
