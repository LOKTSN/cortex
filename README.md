<p align="center">
  <img src="assets/logo.svg" alt="Cortex Logo" width="64" />
</p>

<h1 align="center">Cortex</h1>
<p align="center"><strong>The AI that teaches you what happened while you slept.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/HackTheEast-2026-blue?style=flat-square" alt="HackTheEast 2026" />
  <img src="https://img.shields.io/badge/Team-Dumplings_%F0%9F%A5%9F-orange?style=flat-square" alt="Team Dumplings" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MiniMax-M2.5-purple?style=flat-square" alt="MiniMax" />
  <img src="https://img.shields.io/badge/Exa-Search-green?style=flat-square" alt="Exa API" />
</p>

---

## What is Cortex?

Every morning, 500 new AI papers drop on arxiv. Policy shifts reshape industries overnight. Breakthroughs appear in podcasts you'll never find. **You're drowning — not in ignorance, but in volume.**

**Cortex** is an AI-powered learning companion that curates what's new in your field and teaches it to you — through voice, diagrams, and conversation — adapting to your level and goals.

It's not a news feed. It's not a course. It's **a living curriculum that evolves as fast as your field does.**

---

## Demo

> Screenshots and demo video coming soon.
>
> _For judges: see our submission video for the full walkthrough._

---

## Key Features

### 🔍 Smart Discovery Pipeline
An agentic discovery engine powered by **Exa semantic search** and **MiniMax M2.5**. It doesn't just aggregate links — it searches with editorial intent, cross-references primary sources, filters noise aggressively, and writes structured topic folders with ranked syntheses.

### 💬 AI Chat with Tool Use
A full tool-calling agent loop that can **search the web**, **read pages**, **generate images**, and **read/write files** — all within the chat. Ask it to research a topic deeper, generate a diagram, or explain a concept. Powered by MiniMax M2.5 via OpenAI-compatible function calling.

### 🎙️ Real-Time Voice Conversation
Speak to Cortex and hear it respond. The full pipeline: **Browser Speech Recognition → WebSocket → MiniMax M2.5 streaming → MiniMax Speech-2.6-turbo TTS → sentence-by-sentence audio playback**. Responses stream as text while audio plays in parallel — no waiting for the full response.

### 🖼️ AI-Generated Diagrams
One-click diagram generation via **MiniMax image-01**. The agent reads the topic synthesis, crafts a detailed visual prompt, and generates an educational diagram saved directly to the topic folder.

### 🔊 Audio Briefings
Generate voice-narrated overviews of any topic. The agent first rewrites the synthesis into a conversational, voice-friendly summary, then converts it to speech via **MiniMax Speech-2.6-turbo** — so it sounds natural, not like a robot reading markdown.

### ⚙️ Customizable Curation Template
Define your field, sources, expertise level, focus areas, and time budget. Cortex adapts what it discovers, how deep it explains, and which modalities it generates. Preset templates for AI/ML, Crypto, Biotech, Climate Tech, and more — or build your own.

### 📋 Daily Pulse Feed
Your curated morning briefing. A TL;DR summary at the top, then topic cards ranked by relevance — each with category badges (Breaking, Paper, Trending, Repo, Podcast) and a single action: **Dive Deeper** into the Learning Page.

### 📖 Learning Page
A three-panel workspace: **Sources** (synthesis, metadata, your notes) | **Chat** (AI agent with full tool access) | **Studio** (generate audio, diagrams, and more). Everything is contextual to the topic you're exploring.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React 19 · Vite 7 · TypeScript 5.9 · Tailwind 4 · Zustand     │
│                                                                  │
│  Pages: Essential (Pulse) → Learning → Template Editor           │
│  Components: ChatPanel (voice + text), TopicCard, Studio         │
│  Voice: Browser SpeechRecognition → WebSocket                    │
├─────────────────────────────────────────────────────────────────┤
│                     REST API + WebSocket                         │
│  /api/topics · /api/chat · /api/discover · /api/generate/*      │
│  /ws/voice                                                       │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
│  FastAPI · Python · MiniMax M2.5 (OpenAI SDK)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  CortexAgent │  │  Discovery   │  │  Voice Pipeline      │  │
│  │              │  │  Pipeline    │  │                      │  │
│  │  Tool loop:  │  │              │  │  STT → LLM stream   │  │
│  │  exa_search  │  │  Profile →   │  │  → sentence split   │  │
│  │  web_fetch   │  │  Exa search  │  │  → TTS (Speech-2.6) │  │
│  │  gen_image   │  │  → synthesis │  │  → audio chunks      │  │
│  │  file_ops    │  │  → folders   │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  Data: Filesystem (YAML meta + markdown synthesis per topic)     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model — Everything is a Folder

Each discovered topic becomes a folder. Learning generates files into that folder. The knowledge base **is** the filesystem.

```
data/
├── profiles/default/profile.yaml     # Curation template
└── topics/
    ├── 2026-03-01_gemini-4-launch/
    │   ├── meta.yaml                 # Title, sources, relevance, tags, status
    │   ├── synthesis.md              # AI-written summary adapted to user level
    │   ├── raw_sources.md            # Scraped source content
    │   ├── audio.mp3                 # MiniMax Speech-2.6 narration
    │   └── diagram_*.png            # MiniMax image-01 diagrams
    └── 2026-03-01_sparse-attention/
        └── ...
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind 4 |
| **UI Components** | Radix UI, CVA, Lucide Icons |
| **State Management** | Zustand |
| **AI Chat** | Custom ChatPanel with tool-call rendering |
| **Voice** | Web Speech API + WebSocket + streaming TTS |
| **Backend** | FastAPI (Python) |
| **LLM** | MiniMax M2.5 (OpenAI-compatible) |
| **Search** | Exa API (semantic web search) |
| **TTS** | MiniMax Speech-2.6-turbo (WebSocket streaming) |
| **Image Gen** | MiniMax image-01 |
| **Data Store** | Filesystem (YAML + Markdown) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys: `MINIMAX_API_KEY`, `EXA_API_KEY`

### 1. Clone the repo

```bash
git clone https://github.com/LOKTSN/cortex.git
cd cortex
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
MINIMAX_API_KEY=your_minimax_api_key
EXA_API_KEY=your_exa_api_key
```

### 3. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api/*` requests to the backend automatically.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/topics` | List all curated topics with TL;DR and metadata |
| `GET` | `/api/topics/:slug` | Get full topic metadata |
| `GET` | `/api/topics/:slug/synthesis` | Get synthesis markdown |
| `GET` | `/api/topics/:slug/files` | List files in topic folder |
| `GET` | `/api/topics/:slug/file/:name` | Serve a topic file (text or binary) |
| `GET` | `/api/profile` | Get user curation profile |
| `PUT` | `/api/profile` | Update profile fields |
| `POST` | `/api/discover` | Trigger discovery pipeline (returns job ID) |
| `GET` | `/api/discover/:job_id` | Poll discovery job status |
| `POST` | `/api/chat` | Chat with the CortexAgent (tool-calling loop) |
| `POST` | `/api/generate/audio/:slug` | Generate TTS audio briefing |
| `POST` | `/api/generate/diagram/:slug` | Generate AI diagram |
| `WS` | `/ws/voice` | Real-time voice conversation (STT → LLM → TTS) |

---

## Project Structure

```
cortex/
├── frontend/
│   ├── src/
│   │   ├── pages/                # EssentialPage, LearningPage, TemplatePage, ...
│   │   ├── components/
│   │   │   ├── ui/               # Button, Badge, Tabs, Card, Dialog, ...
│   │   │   ├── essential/        # TopicCard, TldrBox, Greeting, PromoBanner
│   │   │   ├── learning/         # WorkspacePanel, MediaPanel
│   │   │   ├── template/         # ProfileForm
│   │   │   ├── onboarding/       # OnboardingModal
│   │   │   └── ChatPanel.tsx     # AI chat with voice + tool rendering
│   │   ├── hooks/useVoiceChat.ts # Voice pipeline (STT → WS → TTS playback)
│   │   ├── stores/               # Zustand stores (topics, learning, profile, auth)
│   │   ├── lib/                  # Utilities, API client, presets
│   │   └── assets/               # SVG logos and icons
│   └── package.json
├── backend/
│   ├── server.py                 # FastAPI app — routes, voice WS, generation
│   ├── agent/
│   │   ├── agent.py              # CortexAgent — tool-calling loop with M2.5
│   │   └── tools/                # exa_search, web_fetch, image gen, file ops
│   ├── exa_discovery.py          # Discovery pipeline orchestrator
│   ├── discovery.py              # Profile loading, data paths
│   ├── models.py                 # Pydantic models
│   └── requirements.txt
├── data/                         # Live data (profiles + discovered topics)
├── contracts.md                  # API contracts between frontend and backend
└── .env                          # API keys (not committed)
```

---

## Target Tracks

| Track | Prize | Why Cortex Fits |
|-------|-------|----------------|
| **OAX Foundation AI EdTech Platform** | HKD 15,000 | AI-powered content curation + adaptive, personalized learning |
| **MiniMax Creative Usage** | HKD 15,000 | Voice briefings (Speech-2.6), AI diagrams (image-01), real-time voice chat |

---

## Team Dumplings 🥟

Built in 24 hours at **HackTheEast 2026** (Feb 28 – Mar 1, Hong Kong).

| Name | Role |
|------|------|
| **Philipp** | Backend — Discovery pipeline, REST API, CortexAgent, Voice WebSocket |
| **Laureen** | Frontend — UI/UX, Design system, Pages, CopilotKit integration |
| **Wan** | Demo — Seed data, Demo video, Presentation |

---

## License

All rights reserved. This project was built for HackTheEast 2026 and is not licensed for redistribution or commercial use.
