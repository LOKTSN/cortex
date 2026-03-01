<p align="center">
  <img src="assets/logo.svg" alt="Frontexh Logo" width="64" />
</p>

<h1 align="center">Frontexh</h1>
<p align="center"><strong>AI-powered learning companion for fast-moving fields.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MiniMax-M2.5-purple?style=flat-square" alt="MiniMax" />
  <img src="https://img.shields.io/badge/Exa-Search-green?style=flat-square" alt="Exa API" />
</p>

---

Frontexh discovers what's new in your field, explains it at your level through voice, images, and conversation, and stores everything in a persistent knowledge base that grows with you over time.

## Key Features

### Smart Discovery Pipeline
An agentic discovery engine powered by **Exa semantic search** and **MiniMax M2.5**. It searches with editorial intent, cross-references primary sources, filters noise aggressively, and writes structured topic folders with ranked syntheses.

### AI Chat with Tool Use
A full tool-calling agent loop that can **search the web**, **read pages**, **generate images**, and **read/write files** — all within the chat. The agent runs up to 10 tool rounds per turn for complex multi-step research. Powered by MiniMax M2.5 via OpenAI-compatible function calling.

### Real-Time Voice Conversation
Speak to Frontexh and hear it respond. Full pipeline: **Browser Speech Recognition → WebSocket → MiniMax M2.5 streaming → MiniMax Speech-2.6 TTS → sentence-by-sentence audio playback**. Responses stream as text while audio plays in parallel.

### AI-Generated Diagrams & Audio
One-click diagram generation via **MiniMax image-01** and voice-narrated briefings via **MiniMax Speech-2.6** — saved directly to the topic's knowledge folder.

### Persistent File-Based Knowledge
Every topic becomes a folder with `meta.yaml`, `synthesis.md`, `raw_sources.md`, generated audio, and diagrams. The AI agent can read, write, edit, and search these files — building a permanent knowledge base across sessions.

### Customizable Curation Profiles
Define your field, sources, expertise level, focus areas, and time budget. Preset templates for AI/ML, Crypto, Biotech, Climate Tech, Cybersecurity, and more.

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

### Data Model

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
| **UI** | Radix UI, CVA, Lucide Icons |
| **State** | Zustand |
| **Backend** | FastAPI (Python) |
| **LLM** | MiniMax M2.5 (OpenAI-compatible) |
| **Search** | Exa API (semantic web search) |
| **TTS** | MiniMax Speech-2.6 |
| **Image Gen** | MiniMax image-01 |
| **Data Store** | Filesystem (YAML + Markdown) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys: `MINIMAX_API_KEY`, `EXA_API_KEY`

### 1. Clone and configure

```bash
git clone https://github.com/LOKTSN/cortex.git
cd cortex
```

Create a `.env` file in the project root:

```env
MINIMAX_API_KEY=your_minimax_api_key
EXA_API_KEY=your_exa_api_key
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api/*` to the backend automatically.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/topics` | List all curated topics |
| `GET` | `/api/topics/:slug` | Get full topic metadata |
| `GET` | `/api/topics/:slug/synthesis` | Get synthesis markdown |
| `GET` | `/api/topics/:slug/files` | List files in topic folder |
| `GET` | `/api/topics/:slug/file/:name` | Serve a topic file |
| `GET` | `/api/profile` | Get user curation profile |
| `PUT` | `/api/profile` | Update profile fields |
| `POST` | `/api/discover` | Trigger discovery pipeline |
| `GET` | `/api/discover/:job_id` | Poll discovery job status |
| `POST` | `/api/chat` | Chat with the AI agent |
| `POST` | `/api/generate/audio/:slug` | Generate TTS audio briefing |
| `POST` | `/api/generate/diagram/:slug` | Generate AI diagram |
| `WS` | `/ws/voice` | Real-time voice conversation |

---

## Project Structure

```
cortex/
├── frontend/
│   ├── src/
│   │   ├── pages/                # EssentialPage, LearningPage, TemplatePage
│   │   ├── components/
│   │   │   ├── ui/               # Button, Badge, Tabs, Card, Dialog
│   │   │   ├── essential/        # TopicCard, TldrBox, Greeting
│   │   │   ├── learning/         # WorkspacePanel, MediaPanel
│   │   │   ├── template/         # ProfileForm
│   │   │   └── ChatPanel.tsx     # AI chat with voice + tool rendering
│   │   ├── hooks/useVoiceChat.ts # Voice pipeline
│   │   ├── stores/               # Zustand stores
│   │   └── lib/                  # Utilities, API client, presets
│   └── package.json
├── backend/
│   ├── server.py                 # FastAPI app
│   ├── agent/
│   │   ├── agent.py              # CortexAgent — tool-calling loop
│   │   └── tools/                # exa_search, web_fetch, image gen, file ops
│   ├── exa_discovery.py          # Discovery pipeline orchestrator
│   ├── discovery.py              # Profile loading, data paths
│   └── requirements.txt
├── data/                         # Profiles + discovered topics
├── contracts.md                  # API contracts
└── .env                          # API keys (not committed)
```

---

## License

MIT

---

<sub>Built at HackTheEast 2026 by Philipp, Lauren, and Wan.</sub>
