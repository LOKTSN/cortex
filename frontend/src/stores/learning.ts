import { create } from 'zustand'

export interface TopicDetail {
  slug: string
  title: string
  date: string
  category: string
  synthesis: string
  description?: string
  sources: { url: string; type: string; title?: string; points?: number }[]
  tags: string[]
  status: string
  generated: { synthesis: boolean; audio: boolean; video: boolean; jingle: boolean; diagrams: string[] }
  notes: string
}

const SEED_SYNTHESES: Record<string, string> = {
  'gemini-4-launch': `# Google Releases Gemini 4 with Native Code Execution

## What Happened
Google released Gemini 4, the first major LLM to include **native sandboxed code execution** as a core capability. Unlike previous models that rely on external tool-calling, Gemini 4 can write, execute, and iterate on code within a secure gVisor-based sandbox — all in a single inference pass.

## Why It Matters
This is a paradigm shift in how we think about tool use in LLMs:

- **Before**: Models generate code → external system executes it → results piped back → model continues
- **After**: Models write and run code internally, iterating until the output is correct

The implications for deployment pipelines are significant. Instead of building complex orchestration layers for code execution, the model handles it natively.

## Key Technical Details
- **Sandbox**: gVisor-based isolation with resource limits (CPU, memory, network)
- **Languages**: Python, JavaScript, Go, Rust (at launch)
- **Iteration**: Model can run code up to 5 times per turn, self-correcting errors
- **Security**: No filesystem access outside sandbox, no network by default

## How This Compares
| Feature | Gemini 4 | Claude Tool Use | GPT Code Interpreter |
|---------|----------|-----------------|---------------------|
| Execution | Native (in-model) | External | External (sandbox) |
| Languages | 4 | N/A | Python only |
| Self-correction | Built-in | Manual retry | Limited |
| Latency | ~200ms | ~500ms+ | ~1s+ |

## What To Do
If you're running tool-use pipelines, benchmark Gemini 4's native execution against your current setup. The latency reduction alone could justify a switch for code-heavy workflows.`,

  'sparse-attention-10m': `# Adaptive Sparse Attention for 10M Context Windows

## Paper Summary
Chen et al. introduce **Adaptive Sparse Attention (ASA)**, a method that achieves 10 million token context windows with 3x less compute than Ring Attention. Published on arxiv as 2602.14421.

## Core Innovation
The key insight: instead of using fixed sparsity patterns (like block-sparse or strided attention), ASA **predicts** which attention entries matter on a per-layer basis.

Each transformer layer learns a lightweight "attention predictor" — a small network that scores query-key pairs and selects the top-k entries for full attention computation.

## Technical Details
- **Predictor network**: 2-layer MLP that takes Q, K embeddings and outputs importance scores
- **Top-k selection**: Only the top 2-5% of attention entries are computed per layer
- **Adaptive per layer**: Early layers attend broadly, later layers attend narrowly
- **Training**: Joint training with the main model, predictor learns from attention gradients

## Results
- **10M tokens** context length on 8x H100 (vs. 4M for Ring Attention on same hardware)
- **3.1x less FLOPs** than Ring Attention at equivalent context length
- **No quality loss** on RULER, Needle-in-Haystack, and LongBench benchmarks
- **Inference speedup**: 2.4x faster than dense attention at 1M tokens

## Implications
This makes ultra-long context practical for real workloads. Applications: full-codebase understanding, book-length document analysis, long video comprehension.`,

  'eu-ai-act-enforcement': `# EU AI Act Enforcement Begins — 3 Things That Changed

## Overview
The EU AI Act's first enforcement wave officially began, targeting foundation model providers with three key requirements that took effect February 2026.

## The Three Changes

### 1. Mandatory Risk Assessments
All foundation model providers must now submit risk assessments covering:
- Potential for misuse (bioweapons, CSAM, manipulation)
- Environmental impact (compute, energy, water usage)
- Societal impact (labor displacement, bias propagation)

Deadline: Within 6 months of model release. Retroactive for models released after Aug 2025.

### 2. Compute Reporting
Models trained with more than **10^24 FLOPs** must report:
- Total training compute
- Training data composition (sources, languages, domains)
- Hardware used and energy consumed
- Evaluation results on EU-specified benchmarks

### 3. "Systemic Risk" Category
A new classification for models exceeding **10^25 FLOPs**:
- Subject to adversarial testing by EU-designated labs
- Must maintain incident response teams
- Required to share model weights with regulators on request
- Annual compliance audits

## Who's Affected
- OpenAI (GPT-5), Google (Gemini 4), Anthropic (Claude 4), Meta (Llama 5)
- Any company deploying these models in the EU
- Cloud providers hosting foundation models for EU customers

## What It Means
Compliance costs estimated at $2-5M per model for large providers. Smaller open-source projects are exempt under the "open source exception" (models under 10^24 FLOPs with <$10M revenue).`,
}

interface LearningState {
  topic: TopicDetail | null
  loading: boolean
  error: string | null
  activeTab: string
  generatingMedia: Record<string, boolean>
  // Generated media URLs (not persisted — refreshed per session)
  diagramUrl: string | null
  audioUrl: string | null
  fetchTopic: (slug: string) => Promise<void>
  setActiveTab: (tab: string) => void
  setGenerating: (media: string, state: boolean) => void
  updateNotes: (content: string) => void
  generateDiagram: () => Promise<string | null>
  generateAudio: () => Promise<string | null>
}

export const useLearningStore = create<LearningState>((set, get) => ({
  topic: null,
  loading: false,
  error: null,
  activeTab: 'workspace',
  generatingMedia: {},
  diagramUrl: null,
  audioUrl: null,
  fetchTopic: async (slug: string) => {
    set({ loading: true, error: null, diagramUrl: null, audioUrl: null })
    try {
      const [metaRes, synthRes] = await Promise.all([
        fetch(`/api/topics/${slug}`),
        fetch(`/api/topics/${slug}/synthesis`),
      ])
      if (!metaRes.ok) throw new Error('Topic not found')
      const meta = await metaRes.json()
      const synthesis = synthRes.ok ? await synthRes.text() : ''

      // Check if audio/diagram already exist by fetching file list
      let audioUrl: string | null = null
      let diagramUrl: string | null = null
      try {
        const filesRes = await fetch(`/api/topics/${slug}/files`)
        if (filesRes.ok) {
          const files: { name: string }[] = await filesRes.json()
          if (files.some(f => f.name === 'audio.mp3')) {
            audioUrl = `/api/topics/${slug}/file/audio.mp3`
          }
          const diagramFile = files.find(f => f.name.startsWith('diagram_') && f.name.endsWith('.png'))
          if (diagramFile) {
            diagramUrl = `/api/topics/${slug}/file/${diagramFile.name}`
          }
        }
      } catch { /* ignore */ }

      set({
        topic: { ...meta, synthesis, notes: '' },
        loading: false,
        activeTab: 'workspace',
        audioUrl,
        diagramUrl,
      })
    } catch {
      // Fallback to seed data
      const synthesis = SEED_SYNTHESES[slug] || `# ${slug}\n\nNo synthesis available yet. Click "Research More" in the chat to generate content.`
      set({
        topic: {
          slug,
          title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          date: '2026-02-28',
          category: 'paper',
          synthesis,
          sources: [],
          tags: [],
          status: 'new',
          generated: { synthesis: true, audio: false, video: false, jingle: false, diagrams: [] },
          notes: '',
        },
        loading: false,
        activeTab: 'workspace',
      })
    }
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGenerating: (media, state) =>
    set({ generatingMedia: { ...get().generatingMedia, [media]: state } }),
  updateNotes: (content) => {
    const topic = get().topic
    if (topic) set({ topic: { ...topic, notes: content } })
  },

  generateDiagram: async () => {
    const { topic } = get()
    if (!topic) return null
    set({ generatingMedia: { ...get().generatingMedia, diagram: true } })
    try {
      const res = await fetch(`/api/generate/diagram/${topic.slug}`, { method: 'POST' })
      if (!res.ok) throw new Error('Diagram generation failed')
      const data = await res.json()
      if (data.status === 'done' && data.path) {
        const diagramUrl = `/api/topics/${topic.slug}/file/${data.path}`
        set({
          diagramUrl,
          generatingMedia: { ...get().generatingMedia, diagram: false },
          topic: {
            ...topic,
            generated: { ...topic.generated, diagrams: [data.path] },
          },
        })
        return diagramUrl
      }
      set({ generatingMedia: { ...get().generatingMedia, diagram: false } })
      return null
    } catch (e) {
      console.error('Diagram generation error:', e)
      set({ generatingMedia: { ...get().generatingMedia, diagram: false } })
      return null
    }
  },

  generateAudio: async () => {
    const { topic } = get()
    if (!topic) return null
    set({ generatingMedia: { ...get().generatingMedia, audio: true } })
    try {
      const res = await fetch(`/api/generate/audio/${topic.slug}`, { method: 'POST' })
      if (!res.ok) throw new Error('Audio generation failed')
      const data = await res.json()
      if (data.status === 'done' && data.path) {
        const audioUrl = `/api/topics/${topic.slug}/file/audio.mp3`
        set({
          audioUrl,
          generatingMedia: { ...get().generatingMedia, audio: false },
          topic: {
            ...topic,
            generated: { ...topic.generated, audio: true },
          },
        })
        return audioUrl
      }
      set({ generatingMedia: { ...get().generatingMedia, audio: false } })
      return null
    } catch (e) {
      console.error('Audio generation error:', e)
      set({ generatingMedia: { ...get().generatingMedia, audio: false } })
      return null
    }
  },
}))
