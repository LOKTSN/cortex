# Cortex — Contracts

Agreed interfaces between frontend (Laureen) and backend (Philipp). Do not change without syncing with the other side.

---

## 1. Topic Folder Schema

Each discovered topic is a folder. Backend writes everything. Frontend reads everything. Frontend only writes `notes.md`.

```
topics/<YYYY-MM-DD>_<slug>/
├── meta.yaml
├── synthesis.md
├── raw_sources.md
├── audio.mp3            # optional
├── diagram_<n>.png      # optional
├── video.mp4            # optional
├── jingle.mp3           # optional
└── notes.md             # user notes (frontend writes)
```

### meta.yaml

```yaml
title: "Gemini 4 Launches Native Code Execution"
slug: "gemini-4-launch"
date: "2026-02-28"
category: "breaking"          # breaking | paper | trending | repo | podcast
sources:
  - { url: "https://...", type: "arxiv", title: "..." }
  - { url: "https://...", type: "hn", points: 847 }
  - { url: "https://...", type: "blog", title: "..." }
relevance_score: 0.94         # 0-1
relevance_reason: "Directly affects model deployment pipelines"
tags: ["code-execution", "gemini", "tool-use"]
status: "new"                 # new | read | listened | archived
generated:
  synthesis: true
  audio: false
  video: false
  jingle: false
  diagrams: []                # ["diagram_1.png"]
```

---

## 2. Profile Schema

```yaml
# profiles/<user_id>/profile.yaml
field: "AI / ML"
sources:
  - { id: "arxiv_ai", type: "arxiv", categories: ["cs.AI", "cs.LG", "cs.CL"], enabled: true }
  - { id: "hn", type: "hackernews", filter: "AI", enabled: true }
  - { id: "gh_ml", type: "github", filter: "trending/ML", enabled: true }
  - { id: "reddit_ml", type: "reddit", subreddit: "MachineLearning", enabled: false }
  - { id: "latent_space", type: "podcast", name: "Latent Space", enabled: true }
level: "advanced"             # beginner | intermediate | advanced
depth: "technical"            # beginner_friendly | executive | technical
interval: "daily_6am"         # daily_6am | twice_daily | realtime
breaking_alerts: true
focus_areas: ["training methods", "model deployment", "inference optimization"]
goal: "stay_current"          # stay_current | prepare_exams | teach_others
time_budget_min: 15
```

Frontend reads + writes (template editor). Backend reads (discovery pipeline config).

---

## 3. API Endpoints

```
# Topics
GET  /api/topics                        → [{ slug, title, date, category, relevance_score, status, generated }]
GET  /api/topics/:slug                  → full meta.yaml content
GET  /api/topics/:slug/synthesis        → synthesis.md as text
GET  /api/topics/:slug/files            → [{ name, type, size }]
GET  /api/topics/:slug/file/:filename   → file content (md text, or binary for media)
POST /api/topics/:slug/notes            → { content: string } → saves notes.md

# Profile
GET  /api/profile                       → profile.yaml content as JSON
PUT  /api/profile                       → partial update { field: value, ... }

# Discovery
POST /api/discover                      → { query?: string } → { status: "started", job_id: string }
GET  /api/discover/:job_id              → { status: "running"|"done", new_topics?: string[] }

# Generation (trigger async, poll or SSE for completion)
POST /api/generate/audio/:slug          → { status: "generating"|"done", path?: string }
POST /api/generate/video/:slug          → { status: "generating"|"done", path?: string }
POST /api/generate/jingle/:slug         → { status: "generating"|"done", path?: string }
POST /api/generate/diagram/:slug        → { description: string } → { status, path }

# CopilotKit runtime
POST /api/copilotkit                    → proxied to backend agent server
```

---

## 4. CopilotKit Actions

Registered on the frontend via `useCopilotAction`. The LLM invokes these during chat.

### Learning page actions

```typescript
{
  name: "generateAudio",
  description: "Generate a voice-narrated briefing for the current topic",
  parameters: [],
  // → POST /api/generate/audio/:slug
}

{
  name: "generateVideo",
  description: "Generate a short video explainer for the current topic",
  parameters: [],
  // → POST /api/generate/video/:slug
}

{
  name: "generateJingle",
  description: "Generate a mnemonic jingle for the key concepts",
  parameters: [],
  // → POST /api/generate/jingle/:slug
}

{
  name: "generateDiagram",
  description: "Generate an explanatory diagram and add it to the workspace",
  parameters: [
    { name: "description", type: "string", description: "What the diagram should show" }
  ],
  // → POST /api/generate/diagram/:slug
}

{
  name: "saveNote",
  description: "Save an insight or chat excerpt to the topic's notes",
  parameters: [
    { name: "content", type: "string", description: "The note to save" }
  ],
  // → POST /api/topics/:slug/notes
}

{
  name: "researchMore",
  description: "Search for more information on a specific question",
  parameters: [
    { name: "query", type: "string", description: "What to research" }
  ],
  // → POST /api/discover
}
```

### Template editor actions

```typescript
{
  name: "updateTemplate",
  description: "Update a field in the user's curation template",
  parameters: [
    { name: "field", type: "string", description: "Field path e.g. 'depth' or 'level'" },
    { name: "value", type: "any", description: "New value" }
  ],
  // → PUT /api/profile
}

{
  name: "addSource",
  description: "Add a new content source to the curation template",
  parameters: [
    { name: "id", type: "string" },
    { name: "type", type: "string", description: "arxiv|hackernews|github|reddit|podcast|blog|twitter" },
    { name: "config", type: "object", description: "Source-specific config" }
  ],
  // → PUT /api/profile (append to sources array)
}

{
  name: "removeSource",
  description: "Remove a content source from the curation template",
  parameters: [
    { name: "id", type: "string", description: "Source ID to remove" }
  ],
  // → PUT /api/profile (filter from sources array)
}
```

---

## 5. CopilotKit Readable Context

### Learning page
```typescript
useCopilotReadable({
  description: "Current topic the user is viewing",
  value: JSON.stringify({
    title, slug, synthesis, sources, tags,
    generatedMedia: topic.generated,
    userNotes: notesContent,
  })
});
```

### Template editor
```typescript
useCopilotReadable({
  description: "User's current curation template",
  value: JSON.stringify(profile)
});
```

### Knowledge base chat
```typescript
useCopilotReadable({
  description: "All stored topics in the knowledge base",
  value: JSON.stringify(allTopics.map(t => ({
    title: t.title, slug: t.slug, date: t.date, tags: t.tags
  })))
});
```
