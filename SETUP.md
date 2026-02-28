# Cortex — Project Setup

## Quick Start

### Frontend (Laureen)
```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### Backend (Philipp)
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Frontend proxies `/api/*` → `localhost:8000` automatically (see `vite.config.ts`).

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 7.3, React 19, TypeScript 5.9, Tailwind 4 |
| UI Components | Radix UI, CVA, lucide-react |
| Tabs (Learning page) | Dockview 5 |
| AI Chat | CopilotKit |
| State | Zustand |
| Backend | FastAPI (Python) |
| Content Discovery | Exa API |
| Multimodal Gen | MiniMax APIs (TTS, video, music) |
| Data Store | Filesystem (topic folders, YAML) |

---

## Design System

Copied from the AgentSystem dashboard. Key concepts:

**Elevation** (light mode):
- `--bg-base` (#E8E8EE) — page background, warm gray
- `--bg-surface` (#FFFFFF) — panels, sidebars
- `--bg-card` — subtle cards on top of surfaces
- `--bg-raised` — hover states, raised elements
- `--bg-ingrained` — recessed/pressed buttons (same as bg-base)

**Glass utilities** (CSS classes):
- `.glass-panel` — structural panels (opaque, subtle border)
- `.glass-card` — elevated cards with hover lift
- `.glass-float` — popovers, dropdowns (blurred)
- `.glass-modal` — dialogs (heavily blurred)

**Fonts**: Inter (sans), JetBrains Mono (mono)
**Accent**: #5BA3D9
**Radius**: 8px default

**Component patterns**:
- Always use `cn()` from `@/lib/utils` for class merging
- Button variants: default, ghost, outline, accent, ingrained, destructive
- Badge variants: breaking, paper, trending, repo, podcast, new, read, archived

---

## Folder Structure

```
workspace/
├── frontend/
│   ├── src/
│   │   ├── tailwind.css           # Design system tokens
│   │   ├── components/ui/         # Shared components (Button, Badge, Tabs, etc.)
│   │   ├── components/            # Feature components (pulse/, learning/, etc.)
│   │   ├── pages/                 # Page components
│   │   ├── lib/utils.ts           # cn() utility
│   │   ├── App.tsx                # Root + CopilotKit provider
│   │   └── main.tsx               # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── backend/
│   ├── server.py                  # FastAPI app
│   └── requirements.txt
├── data/
│   ├── profiles/default/          # User profile YAML
│   └── topics/                    # Live topic folders (written by pipeline)
├── seed-data/
│   └── topics/                    # Pre-baked demo topics
├── demo/                          # Demo video assets
├── contracts.md                   # API contracts (both sides reference this)
└── SETUP.md                       # This file
```

---

## Contracts

See `contracts.md` for the full specification of:
1. **Topic folder schema** — what backend writes, frontend reads
2. **Profile schema** — what frontend writes, backend reads
3. **API endpoints** — REST interface between frontend and backend
4. **CopilotKit actions** — AI-invokable mutations on the frontend
5. **CopilotKit readable context** — state exposed to the AI

---

## Team Responsibilities

| Person | Domain | First Task |
|--------|--------|------------|
| **Philipp** | Backend | Discovery pipeline → REST API → CopilotKit runtime |
| **Laureen** | Frontend | Scaffold is ready → Pulse page → Learning page → Template editor |
| **Wan** | Demo | Seed data (3-5 topic folders) → Demo script → Record video |

### Independence rules
- Philipp and Laureen can work for 8+ hours without syncing
- Both reference `contracts.md` as the source of truth
- Seed data in `seed-data/topics/` lets frontend dev happen before the pipeline is ready
- Copy seed data to `data/topics/` for local testing
