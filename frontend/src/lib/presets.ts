import type { Profile } from '@/stores/profile'

export interface FieldPreset {
  id: string
  label: string
  emoji: string
  detail: string
  profile: Omit<Profile, 'interval' | 'breaking_alerts' | 'time_budget_min'>
}

/**
 * Field presets that populate a complete profile.yaml-compatible profile.
 * Sources use the same {id, type, ...config, enabled} shape that the
 * backend fetchers expect:
 *   reddit  → subreddits: string[]
 *   hackernews → filter: string
 *   arxiv   → categories: string[]
 *   exa     → query: string, category: string
 *   podcast → name: string
 *
 * No "github" type — the pipeline has no GitHub fetcher. Use "exa" for
 * web search coverage instead.
 */
export const FIELD_PRESETS: FieldPreset[] = [
  {
    id: 'ai-ml',
    label: 'AI / ML',
    emoji: '🤖',
    detail: 'arxiv, HN, Reddit, Exa search',
    profile: {
      field: 'AI / ML',
      sources: [
        { id: 'arxiv_ai', type: 'arxiv', categories: ['cs.AI', 'cs.LG', 'cs.CL'], enabled: true },
        { id: 'hn', type: 'hackernews', filter: 'AI OR machine learning OR LLM OR AI agent OR agentic', enabled: true },
        { id: 'reddit_ml', type: 'reddit', subreddits: ['MachineLearning', 'LocalLLaMA'], enabled: true },
        { id: 'exa_ai', type: 'exa', query: 'AI agents agentic AI multi-agent systems autonomous agents', category: 'news', enabled: true },
        { id: 'latent_space', type: 'podcast', name: 'Latent Space', enabled: false },
      ],
      level: 'advanced',
      depth: 'technical',
      focus_areas: ['AI agents', 'agentic workflows', 'multi-agent systems', 'autonomous agents', 'agent tool use'],
      goal: 'stay_current',
    },
  },
  {
    id: 'crypto',
    label: 'Crypto & Web3',
    emoji: '🪙',
    detail: 'Reddit, HN, arxiv, Exa search',
    profile: {
      field: 'Crypto & Web3',
      sources: [
        { id: 'reddit_crypto', type: 'reddit', subreddits: ['CryptoCurrency', 'ethereum'], enabled: true },
        { id: 'hn_crypto', type: 'hackernews', filter: 'crypto OR blockchain OR ethereum', enabled: true },
        { id: 'arxiv_crypto', type: 'arxiv', categories: ['cs.CR', 'cs.DC'], enabled: false },
        { id: 'exa_crypto', type: 'exa', query: 'crypto blockchain DeFi web3', category: 'news', enabled: true },
      ],
      level: 'intermediate',
      depth: 'technical',
      focus_areas: ['DeFi protocols', 'L2 scaling', 'governance mechanisms'],
      goal: 'stay_current',
    },
  },
  {
    id: 'climate',
    label: 'Climate Tech',
    emoji: '🌱',
    detail: 'Reddit, HN, arxiv, Exa search',
    profile: {
      field: 'Climate Tech',
      sources: [
        { id: 'reddit_climate', type: 'reddit', subreddits: ['ClimateActionPlan', 'renewableenergy'], enabled: true },
        { id: 'hn_climate', type: 'hackernews', filter: 'climate OR clean energy OR carbon', enabled: true },
        { id: 'arxiv_climate', type: 'arxiv', categories: ['physics.ao-ph', 'cs.CY'], enabled: true },
        { id: 'exa_climate', type: 'exa', query: 'climate tech renewable energy carbon capture', category: 'news', enabled: true },
      ],
      level: 'intermediate',
      depth: 'executive',
      focus_areas: ['carbon capture', 'renewable energy', 'climate policy'],
      goal: 'stay_current',
    },
  },
  {
    id: 'biotech',
    label: 'Biotech',
    emoji: '💉',
    detail: 'arxiv, Reddit, HN, Exa search',
    profile: {
      field: 'Biotech',
      sources: [
        { id: 'arxiv_bio', type: 'arxiv', categories: ['q-bio.BM', 'q-bio.GN'], enabled: true },
        { id: 'reddit_bio', type: 'reddit', subreddits: ['biotech', 'bioinformatics'], enabled: true },
        { id: 'hn_bio', type: 'hackernews', filter: 'biotech OR CRISPR OR genomics', enabled: true },
        { id: 'exa_bio', type: 'exa', query: 'biotech gene therapy drug discovery CRISPR', category: 'news', enabled: true },
      ],
      level: 'advanced',
      depth: 'technical',
      focus_areas: ['gene therapy', 'drug discovery', 'protein engineering'],
      goal: 'stay_current',
    },
  },
  {
    id: 'geopolitics',
    label: 'Geopolitics',
    emoji: '🌍',
    detail: 'Reddit, HN, Exa search',
    profile: {
      field: 'Geopolitics',
      sources: [
        { id: 'reddit_geopol', type: 'reddit', subreddits: ['geopolitics', 'worldnews'], enabled: true },
        { id: 'hn_geopol', type: 'hackernews', filter: 'geopolitics OR foreign policy', enabled: true },
        { id: 'exa_geopol', type: 'exa', query: 'geopolitics foreign policy international relations', category: 'news', enabled: true },
      ],
      level: 'intermediate',
      depth: 'executive',
      focus_areas: ['US-China relations', 'EU policy', 'emerging markets'],
      goal: 'stay_current',
    },
  },
  {
    id: 'custom',
    label: 'Custom...',
    emoji: '✨',
    detail: 'Start blank, build your own',
    profile: {
      field: '',
      sources: [],
      level: 'intermediate',
      depth: 'executive',
      focus_areas: [],
      goal: 'stay_current',
    },
  },
]
