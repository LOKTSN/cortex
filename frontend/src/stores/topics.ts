import { create } from 'zustand'

export interface Topic {
  slug: string
  title: string
  date: string
  category: 'breaking' | 'paper' | 'trending' | 'repo' | 'podcast'
  relevance_score: number
  relevance_reason: string
  tldr: string
  summary: string
  status: 'new' | 'read' | 'listened' | 'archived'
  sources: { url: string; type: string; title?: string; points?: number }[]
  tags: string[]
  paper_meta?: { authors: string; arxiv_id: string; citations: number }
  generated: { synthesis: boolean; audio: boolean; video: boolean; jingle: boolean; diagrams: string[] }
}

const SEED_TOPICS: Topic[] = [
  {
    slug: 'gemini-4-launch',
    title: 'Google releases Gemini 4 with native code execution',
    date: '2026-02-28',
    category: 'breaking',
    relevance_score: 0.94,
    relevance_reason: 'Directly affects model deployment pipelines',
    tldr: 'Google dropped Gemini 4 with native code execution — this changes how you think about tool-use in your deployment pipeline',
    summary: 'Gemini 4 introduces sandboxed code execution as a native capability — models can now write AND run code in a secure environment. This shifts the tool-use paradigm from external function calling to built-in execution.',
    status: 'new',
    sources: [
      { url: 'https://arxiv.org/abs/2602.18901', type: 'arxiv', title: 'Gemini 4 Technical Report' },
      { url: 'https://blog.google/technology/ai/gemini-4/', type: 'blog', title: 'Google Blog' },
      { url: 'https://news.ycombinator.com/item?id=39281247', type: 'hn', points: 847 },
    ],
    tags: ['code-execution', 'gemini', 'tool-use'],
    generated: { synthesis: true, audio: false, video: false, jingle: false, diagrams: [] },
  },
  {
    slug: 'sparse-attention-10m',
    title: 'Adaptive Sparse Attention for 10M Context Windows',
    date: '2026-02-28',
    category: 'paper',
    relevance_score: 0.88,
    relevance_reason: 'Relevant to your infrastructure work on long-context models',
    tldr: 'A new paper achieves 10M token context at 3x less compute than Ring Attention — relevant to your infra work',
    summary: 'Proposes learned sparsity patterns that adapt per-layer, achieving 10M token context with 3x less compute than Ring Attention. Key trick: attention masks are predicted, not fixed.',
    status: 'new',
    sources: [
      { url: 'https://arxiv.org/abs/2602.14421', type: 'arxiv', title: 'arxiv 2602.14421' },
    ],
    tags: ['attention', 'long-context', 'efficiency'],
    paper_meta: { authors: 'Chen et al.', arxiv_id: '2602.14421', citations: 23 },
    generated: { synthesis: true, audio: false, video: false, jingle: false, diagrams: [] },
  },
  {
    slug: 'eu-ai-act-enforcement',
    title: 'EU AI Act enforcement begins — 3 things that changed',
    date: '2026-02-28',
    category: 'trending',
    relevance_score: 0.79,
    relevance_reason: 'Regulatory changes affecting foundation model providers',
    tldr: 'EU AI Act enforcement kicked in — 3 new compliance rules that affect foundation model providers',
    summary: "The Act's first enforcement wave targets foundation model providers: mandatory risk assessments, compute reporting, and a new \"systemic risk\" category for models above 10^25 FLOPs.",
    status: 'new',
    sources: [
      { url: 'https://news.ycombinator.com/item?id=39284100', type: 'hn', points: 1200 },
      { url: 'https://reuters.com/technology/eu-ai-act', type: 'blog', title: 'Reuters' },
      { url: 'https://techcrunch.com/eu-ai-act', type: 'blog', title: 'TechCrunch' },
    ],
    tags: ['regulation', 'eu', 'compliance'],
    generated: { synthesis: true, audio: false, video: false, jingle: false, diagrams: [] },
  },
]

interface TopicsState {
  topics: Topic[]
  loading: boolean
  error: string | null
  fetchTopics: () => Promise<void>
}

export const useTopicsStore = create<TopicsState>((set) => ({
  topics: [],
  loading: false,
  error: null,
  fetchTopics: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/topics')
      if (!res.ok) throw new Error(`Failed to fetch topics: ${res.status}`)
      const data = await res.json()
      const sorted = (data as Topic[]).sort((a, b) => b.relevance_score - a.relevance_score)
      set({ topics: sorted, loading: false })
    } catch {
      // Backend unavailable — use seed data for development
      set({ topics: SEED_TOPICS, loading: false, error: null })
    }
  },
}))
