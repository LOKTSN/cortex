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
from fastapi.responses import PlainTextResponse, FileResponse
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

def _extract_tldr_summary(synthesis: str) -> tuple[str, str]:
    """Parse synthesis.md to extract (tldr, summary).

    Looks for a **TL;DR:** prefix line; falls back to first paragraph.
    """
    tldr = ""
    summary = ""
    for line in synthesis.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith("**TL;DR:**") or stripped.startswith("**TL;DR**"):
            tldr = stripped.split(":", 1)[-1].strip().strip("*").strip()
            if not summary:
                summary = tldr
        elif not summary:
            summary = stripped
    if not tldr:
        tldr = summary[:250] if summary else ""
    return tldr, summary


@app.get("/api/topics")
async def list_topics():
    """Scan data/topics/ folders, return meta.yaml summaries enriched with tldr/summary/files."""
    topics = []
    if not TOPICS_DIR.exists():
        return []
    for meta_file in sorted(TOPICS_DIR.glob("*/meta.yaml"), reverse=True):
        try:
            meta = yaml.safe_load(meta_file.read_text())
            if not meta:
                continue
            folder = meta_file.parent

            # Enrich with tldr + summary from synthesis.md
            synth_file = folder / "synthesis.md"
            if synth_file.exists():
                tldr, summary = _extract_tldr_summary(synth_file.read_text())
            else:
                tldr = meta.get("relevance_reason", "")
                summary = tldr
            meta["tldr"] = tldr
            meta["summary"] = summary

            # Normalize category to lowercase canonical form
            _cat_map = {"BREAKING": "breaking", "NEW PAPER": "paper", "TRENDING": "trending", "REPO": "repo", "PODCAST": "podcast"}
            raw_cat = meta.get("category", "trending")
            meta["category"] = _cat_map.get(raw_cat, raw_cat.lower() if isinstance(raw_cat, str) else "trending")

            # Add file listing
            meta["files"] = [f.name for f in folder.iterdir() if f.is_file()]

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


@app.get("/api/topics/{slug}/file/{filename}")
async def get_topic_file(slug: str, filename: str):
    """Return a specific file from a topic folder. Handles text and binary."""
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            file_path = folder / filename
            if file_path.exists():
                # Binary files: serve via FileResponse
                binary_exts = {'.mp3', '.mp4', '.wav', '.ogg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'}
                if file_path.suffix.lower() in binary_exts:
                    return FileResponse(str(file_path))
                return PlainTextResponse(file_path.read_text())
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


# ---------------------------------------------------------------------------
# Audio Generation (TTS)
# ---------------------------------------------------------------------------

def _find_topic_folder(slug: str) -> Path | None:
    """Find topic folder by slug."""
    if not TOPICS_DIR.exists():
        return None
    for folder in TOPICS_DIR.iterdir():
        if folder.is_dir() and slug in folder.name:
            return folder
    return None


async def _text_to_audio_file(text: str, output_path: Path) -> bool:
    """Convert text to speech using MiniMax TTS WebSocket and save as mp3."""
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        logger.error("MINIMAX_API_KEY not set")
        return False

    try:
        extra_headers = {"Authorization": f"Bearer {api_key}"}
        async with websockets.connect(
            _TTS_WS_URL,
            additional_headers=extra_headers,
        ) as tts_ws:
            # Wait for connection
            hello = json_mod.loads(await tts_ws.recv())
            if hello.get("event") != "connected_success":
                logger.error("TTS connect failed: %s", hello)
                return False

            # Start task
            await tts_ws.send(json_mod.dumps({
                "event": "task_start",
                "model": "speech-2.6-turbo",
                "voice_setting": _TTS_VOICE_SETTING,
                "audio_setting": _TTS_AUDIO_SETTING,
            }))
            started = json_mod.loads(await tts_ws.recv())
            logger.info("TTS task started: %s", started.get("event", "?"))

            # Split text into sentences and send each
            import re
            sentences = re.split(r'(?<=[.!?])\s+', text)
            all_audio = bytearray()

            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                await tts_ws.send(json_mod.dumps({
                    "event": "task_continue",
                    "text": sentence[:10000],
                }))

                # Collect audio chunks
                while True:
                    msg = json_mod.loads(await _asyncio.wait_for(tts_ws.recv(), timeout=30))
                    if msg.get("data", {}).get("audio"):
                        all_audio.extend(bytes.fromhex(msg["data"]["audio"]))
                    if msg.get("is_final"):
                        break

            # Close TTS
            await tts_ws.send(json_mod.dumps({"event": "task_finish"}))

            # Write audio file
            if all_audio:
                output_path.write_bytes(bytes(all_audio))
                logger.info("Audio saved: %s (%d bytes)", output_path, len(all_audio))
                return True

    except Exception as e:
        logger.exception("TTS to file error: %s", e)

    return False


@app.post("/api/generate/audio/{slug}")
async def generate_audio(slug: str):
    """Generate audio briefing for a topic.

    Flow:
    1. Read synthesis.md
    2. Ask the agent to create a concise voice-friendly summary
    3. Convert to speech via MiniMax TTS
    4. Save as audio.mp3 in the topic folder
    """
    folder = _find_topic_folder(slug)
    if not folder:
        raise HTTPException(404, f"Topic not found: {slug}")

    audio_path = folder / "audio.mp3"

    # If already generated, return immediately
    if audio_path.exists():
        return {"status": "done", "path": f"audio.mp3"}

    # Read synthesis
    synth_file = folder / "synthesis.md"
    meta_file = folder / "meta.yaml"
    synthesis = synth_file.read_text() if synth_file.exists() else ""
    meta = yaml.safe_load(meta_file.read_text()) if meta_file.exists() else {}

    if not synthesis:
        raise HTTPException(400, "No synthesis available for this topic")

    # Ask the agent to create a voice-friendly summary
    try:
        summary_result = await _agent.run(
            messages=[{
                "role": "user",
                "content": (
                    "Create a concise voice-friendly briefing summary of the following topic. "
                    "This will be read aloud, so: use natural speech patterns, avoid markdown formatting, "
                    "bullet points, tables, or code blocks. Keep it under 300 words. "
                    "Write in a warm, conversational tone like a knowledgeable friend explaining it. "
                    "Start with the topic title and why it matters."
                ),
            }],
            context=f"Topic: {meta.get('title', slug)}\n\nSynthesis:\n{synthesis}",
        )
        summary_text = summary_result.get("reply", "")
    except Exception as e:
        logger.exception("Agent summary failed, using raw synthesis")
        # Fallback: strip markdown and use synthesis directly
        import re
        summary_text = re.sub(r'[#*|`\[\]]', '', synthesis)
        summary_text = re.sub(r'\n{2,}', '. ', summary_text)
        summary_text = re.sub(r'\s+', ' ', summary_text).strip()

    if not summary_text:
        raise HTTPException(500, "Failed to create summary")

    # Convert to speech
    success = await _text_to_audio_file(summary_text, audio_path)
    if not success:
        raise HTTPException(500, "TTS conversion failed")

    # Update meta.yaml
    if meta_file.exists():
        meta["generated"]["audio"] = True
        meta_file.write_text(yaml.dump(meta, default_flow_style=False, allow_unicode=True))

    return {"status": "done", "path": "audio.mp3"}


@app.post("/api/generate/diagram/{slug}")
async def generate_diagram(slug: str):
    """Generate an explanatory diagram for a topic.

    Flow:
    1. Read synthesis.md
    2. Create a descriptive image prompt
    3. Call MiniMax image-01 API
    4. Download the generated image to the topic folder
    5. Return local file path
    """
    folder = _find_topic_folder(slug)
    if not folder:
        raise HTTPException(404, f"Topic not found: {slug}")

    # Check for existing diagram
    existing = [f for f in folder.iterdir() if f.name.startswith("diagram_") and f.name.endswith(".png")]
    if existing:
        return {"status": "done", "path": existing[0].name}

    # Read synthesis + meta
    synth_file = folder / "synthesis.md"
    meta_file = folder / "meta.yaml"
    synthesis = synth_file.read_text() if synth_file.exists() else ""
    meta = yaml.safe_load(meta_file.read_text()) if meta_file.exists() else {}
    title = meta.get("title", slug)

    if not synthesis:
        raise HTTPException(400, "No synthesis available for this topic")

    # Ask the agent to create a good image prompt
    try:
        prompt_result = await _agent.run(
            messages=[{
                "role": "user",
                "content": (
                    "Create a detailed image generation prompt for an educational diagram about this topic. "
                    "The prompt should describe a clear, informative visual that illustrates the key concepts, "
                    "architecture, or relationships. Be specific about layout, colors, labels, and visual elements. "
                    "Return ONLY the image prompt text, nothing else."
                ),
            }],
            context=f"Topic: {title}\n\nSynthesis:\n{synthesis}",
        )
        image_prompt = prompt_result.get("reply", f"Educational diagram about {title}")
    except Exception:
        image_prompt = f"A detailed, educational infographic diagram illustrating the key concepts and architecture of {title}. Clean design, labeled components, arrows showing relationships."

    # Call MiniMax image generation API directly
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        raise HTTPException(500, "MINIMAX_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.minimax.io/v1/image_generation",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "image-01",
                    "prompt": image_prompt[:2000],
                    "aspect_ratio": "16:9",
                    "n": 1,
                    "response_format": "url",
                    "prompt_optimizer": True,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.exception("Image generation API failed")
        raise HTTPException(500, f"Image generation failed: {e}")

    urls = data.get("data", {}).get("image_urls", [])
    if not urls:
        msg = data.get("base_resp", {}).get("status_msg", "unknown error")
        raise HTTPException(500, f"Image generation returned no URLs: {msg}")

    # Download the image to local storage
    diagram_name = f"diagram_{uuid.uuid4().hex[:8]}.png"
    diagram_path = folder / diagram_name
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            img_resp = await client.get(urls[0])
            img_resp.raise_for_status()
            diagram_path.write_bytes(img_resp.content)
    except Exception as e:
        logger.exception("Failed to download generated image")
        raise HTTPException(500, f"Failed to download image: {e}")

    logger.info("Diagram saved: %s (%d bytes)", diagram_path, len(img_resp.content))

    # Update meta.yaml
    if meta_file.exists():
        if "diagrams" not in meta.get("generated", {}):
            meta.setdefault("generated", {})["diagrams"] = []
        meta["generated"]["diagrams"].append(diagram_name)
        meta_file.write_text(yaml.dump(meta, default_flow_style=False, allow_unicode=True))

    return {"status": "done", "path": diagram_name}
