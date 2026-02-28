export interface Topic {
  id: string
  slug: string
  category: "BREAKING" | "NEW PAPER" | "TRENDING" | "REPO" | "PODCAST"
  title: string
  description: string
  sources: string
  date: string
  tags: string[]
  synthesis: string
  files: string[]
}

export interface UserProfile {
  name: string
  field: string
  sources: { name: string; detail: string; enabled: boolean }[]
  level: string
  depth: string
  interval: string
  focusAreas: string[]
  goal: string
  timeBudget: string
}

export const mockTopics: Topic[] = [
  {
    id: "1",
    slug: "gemini-4-launch",
    category: "BREAKING",
    title: "Google releases Gemini 4 with native code execution",
    description:
      "Google DeepMind announced Gemini 4, featuring native code execution capabilities that allow the model to write, run, and iterate on code within its reasoning loop. Early benchmarks show a 34% improvement on SWE-bench over Gemini 2.5 Pro. The model also introduces a 2M-token context window and native tool use.",
    sources: "Sources: arxiv · Google Blog · HN (847 pts)",
    date: "2026-02-28",
    tags: ["LLM", "Google", "Code Generation"],
    synthesis: `## Gemini 4: Native Code Execution

Google DeepMind has released Gemini 4, its most capable model yet, featuring **native code execution** within the model's reasoning loop.

### Key Capabilities
- Write, run, and iterate on code during inference
- 2M-token context window
- Native tool use without function calling overhead
- 34% improvement on SWE-bench over Gemini 2.5 Pro

### Why It Matters
This represents a shift from "code generation" to "code execution as reasoning." The model can now verify its own outputs by running them, dramatically reducing hallucination in technical tasks.

### Community Reaction
HN discussion (847 pts) focuses on implications for AI-assisted development. Several commenters note this closes the gap with Claude's extended thinking approach.`,
    files: ["synthesis.md", "raw_sources.md", "diagram_1.png", "audio_briefing.mp3", "video.mp4", "notes.md"],
  },
  {
    id: "2",
    slug: "sparse-attention-10m",
    category: "NEW PAPER",
    title: "Adaptive Sparse Attention for 10M Context Windows",
    description:
      "Chen et al. propose a new attention mechanism that dynamically selects relevant tokens from a 10M context window using learned routing. The method achieves near-full-attention quality at 1/100th the compute cost, validated on long-document QA and code understanding benchmarks.",
    sources: "Sources: arxiv 2602.14421 · 23 citations",
    date: "2026-02-27",
    tags: ["Attention", "Efficiency", "Long Context"],
    synthesis: `## Adaptive Sparse Attention for 10M Context Windows

Chen et al. (2026) introduce a novel attention mechanism enabling **10 million token context windows** with practical compute costs.

### Method
- Learned token routing selects ~1% of tokens per attention head
- Hierarchical compression maintains global context awareness
- Dynamic sparsity patterns adapt per-layer and per-head

### Results
- 99.2% of full attention quality on SCROLLS benchmark
- 100x compute reduction vs dense attention
- Linear scaling with context length (vs quadratic for dense)

### Implications
This could enable models to process entire codebases or book-length documents in a single pass, fundamentally changing how we approach long-context tasks.`,
    files: ["synthesis.md", "raw_sources.md", "diagram_attention.png", "notes.md"],
  },
  {
    id: "3",
    slug: "eu-ai-act-enforcement",
    category: "TRENDING",
    title: "EU AI Act enforcement begins — 3 things that changed",
    description:
      "The EU AI Act's first enforcement provisions took effect this week, banning social scoring systems and real-time biometric surveillance. Companies have 6 months to comply with transparency requirements for general-purpose AI. Fines up to €35M or 7% of global revenue.",
    sources: "Sources: HN (1.2K pts) · Reuters · TechCrunch",
    date: "2026-02-26",
    tags: ["Regulation", "EU", "Policy"],
    synthesis: `## EU AI Act Enforcement Begins

The first enforcement provisions of the EU AI Act took effect on February 24, 2026, marking the world's most comprehensive AI regulation entering its active phase.

### Three Key Changes
1. **Banned practices now enforceable**: Social scoring, real-time biometric surveillance in public spaces, and emotion recognition in workplaces/schools
2. **GPAI transparency requirements**: 6-month compliance window for general-purpose AI providers to publish training data summaries and model cards
3. **Fine structure active**: Up to €35M or 7% of global annual revenue for violations

### Industry Impact
Major tech companies have already begun publishing compliance documentation. Several US-based AI labs are creating "EU-compliant" model variants with enhanced transparency features.`,
    files: ["synthesis.md", "raw_sources.md", "notes.md"],
  },
  {
    id: "4",
    slug: "vllm-08-release",
    category: "REPO",
    title: "vLLM 0.8: 3x inference throughput with disaggregated prefill",
    description:
      "The vLLM team released v0.8 with disaggregated prefill, separating prompt processing from token generation across GPU clusters. Production deployments report 3x throughput improvements with sub-100ms TTFT on 70B parameter models.",
    sources: "Sources: GitHub · vLLM Blog",
    date: "2026-02-25",
    tags: ["Inference", "Open Source", "Performance"],
    synthesis: `## vLLM 0.8: Disaggregated Prefill

vLLM 0.8 introduces **disaggregated prefill**, a new architecture that separates prompt processing from token generation.

### What Changed
- Prefill and decode run on separate GPU pools
- KV-cache is streamed between pools via high-speed interconnect
- Automatic load balancing across heterogeneous hardware

### Performance
- 3x throughput improvement on production workloads
- Sub-100ms time-to-first-token on 70B models
- 50% cost reduction for high-throughput serving

### Why It Matters
This makes serving large models economically viable for more organizations, further democratizing access to frontier-class AI capabilities.`,
    files: ["synthesis.md", "raw_sources.md", "audio_briefing.mp3", "notes.md"],
  },
  {
    id: "5",
    slug: "state-of-rlhf-dpo",
    category: "PODCAST",
    title: "The State of RLHF: Why DPO Won",
    description:
      "Latent Space podcast deep-dive into why Direct Preference Optimization has largely replaced PPO-based RLHF in production systems. Guests from Anthropic and Meta discuss the practical tradeoffs and what's next for alignment training.",
    sources: "Sources: Latent Space · Spotify",
    date: "2026-02-24",
    tags: ["RLHF", "DPO", "Alignment"],
    synthesis: `## The State of RLHF: Why DPO Won

The Latent Space podcast hosted researchers from Anthropic and Meta for a deep-dive into the current state of reinforcement learning from human feedback.

### Key Takeaways
- **DPO dominates production**: ~80% of major labs have moved to DPO or DPO variants for preference training
- **PPO still has a role**: Complex reasoning and multi-step tasks still benefit from online RL approaches
- **GRPO emerging**: Group Relative Policy Optimization showing promise for math and code tasks

### What's Next
- Constitutional AI methods are being combined with DPO for "self-improving" preference data
- Synthetic preference generation reducing reliance on human annotators
- Focus shifting to "alignment tax" — maintaining capabilities while adding safety constraints`,
    files: ["synthesis.md", "audio_briefing.mp3", "notes.md"],
  },
]

export const mockProfile: UserProfile = {
  name: "Daniel",
  field: "AI / ML",
  sources: [
    { name: "arxiv (cs.AI, cs.LG, cs.CL)", detail: "Academic papers", enabled: true },
    { name: "Hacker News (AI filter)", detail: "Tech community", enabled: true },
    { name: "GitHub trending (ML)", detail: "Open source", enabled: true },
    { name: "Reddit r/MachineLearning", detail: "Community discussion", enabled: false },
    { name: "Twitter/X AI accounts", detail: "Social media", enabled: false },
    { name: "Podcasts", detail: "Audio content", enabled: false },
  ],
  level: "Intermediate",
  depth: "Technical summaries with key equations",
  interval: "Daily",
  focusAreas: ["Transformers", "RLHF", "Inference Optimization"],
  goal: "Stay current on LLM advances for my research",
  timeBudget: "30 min/day",
}

export const mockTldr = `While you were away, 3 major developments happened in AI/ML:

**1. Gemini 4 launched** with native code execution — a paradigm shift from code generation to code-as-reasoning. Benchmarks show 34% gains on SWE-bench.

**2. New attention paper** by Chen et al. achieves 10M token context windows at 1/100th compute cost. Could change how we handle long documents entirely.

**3. EU AI Act enforcement started** — social scoring banned, €35M fines active. Major compliance deadline in 6 months for GPAI providers.`

export interface EdgeTopic {
  name: string
  slug: string
  status: string
  saved: string
  fileCount: number
  isNew: boolean
}

export interface EdgeDay {
  day: string       // e.g. "28"
  label: string     // e.g. "Feb 28"
  topics: EdgeTopic[]
}

export interface EdgeMonth {
  month: string     // e.g. "February 2026"
  days: EdgeDay[]
}

export const mockEdgeTopics: EdgeMonth[] = [
  {
    month: "February 2026",
    days: [
      {
        day: "28", label: "Feb 28",
        topics: [
          { name: "Gemini 4 Launch", slug: "gemini-4-launch", status: "Read + Listened", saved: "Feb 28, 2026", fileCount: 3, isNew: true },
          { name: "EU AI Act Changes", slug: "eu-ai-act-enforcement", status: "Read", saved: "Feb 28, 2026", fileCount: 3, isNew: true },
          { name: "Sparse Attention", slug: "sparse-attention-10m", status: "Read", saved: "Feb 28, 2026", fileCount: 3, isNew: true },
        ],
      },
      {
        day: "27", label: "Feb 27",
        topics: [
          { name: "GPT-5 Multimodal", slug: "gpt-5-multimodal", status: "Read", saved: "Feb 27, 2026", fileCount: 3, isNew: true },
        ],
      },
      {
        day: "26", label: "Feb 26",
        topics: [
          { name: "Constitutional AI 2.0", slug: "constitutional-ai-2", status: "New", saved: "Feb 26, 2026", fileCount: 3, isNew: true },
        ],
      },
      {
        day: "25", label: "Feb 25",
        topics: [
          { name: "Llama 4", slug: "llama-4-2m-context", status: "New", saved: "Feb 25, 2026", fileCount: 3, isNew: true },
        ],
      },
      {
        day: "24", label: "Feb 24",
        topics: [
          { name: "Fridman × Hassabis", slug: "fridman-hassabis-agi", status: "New", saved: "Feb 24, 2026", fileCount: 3, isNew: false },
        ],
      },
      {
        day: "23", label: "Feb 23",
        topics: [
          { name: "GRPO Paper", slug: "grpo-rlhf-alternative", status: "New", saved: "Feb 23, 2026", fileCount: 3, isNew: false },
        ],
      },
    ],
  },
  {
    month: "January 2026",
    days: [
      {
        day: "15", label: "Jan 15",
        topics: [
          { name: "State of RLHF", slug: "state-of-rlhf-dpo", status: "Read + Listened", saved: "Jan 15, 2026", fileCount: 3, isNew: false },
        ],
      },
      {
        day: "10", label: "Jan 10",
        topics: [
          { name: "Ring Attention", slug: "ring-attention", status: "Read", saved: "Jan 10, 2026", fileCount: 3, isNew: false },
        ],
      },
      {
        day: "08", label: "Jan 8",
        topics: [
          { name: "vLLM 0.8", slug: "vllm-08-release", status: "Read", saved: "Jan 8, 2026", fileCount: 3, isNew: false },
        ],
      },
    ],
  },
]

export const mockCollections = [
  { name: "Attention Mechanisms", count: 4 },
  { name: "Regulation", count: 2 },
  { name: "Deployment", count: 3 },
]

export const onboardingFields = [
  { id: "ai-ml", label: "AI / ML", emoji: "🤖", detail: "arxiv, HN, GH trending, ML blogs" },
  { id: "crypto", label: "Crypto & Web3", emoji: "🪙", detail: "CoinDesk, Messari, X, governance" },
  { id: "climate", label: "Climate Tech", emoji: "🌱", detail: "Nature, IPCC, CleanTechnica, podcasts" },
  { id: "biotech", label: "Biotech", emoji: "💉", detail: "PubMed, biorx, FDA feeds" },
  { id: "geopolitics", label: "Geopolitics", emoji: "🌍", detail: "Reuters, FP, CSIS, Belfer" },
  { id: "custom", label: "Custom...", emoji: "✨", detail: "Start blank, build your own" },
]
