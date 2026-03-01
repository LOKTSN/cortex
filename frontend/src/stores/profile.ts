import { create } from 'zustand'

export interface Source {
  id: string
  type: string
  name?: string
  categories?: string[]
  filter?: string
  subreddit?: string
  subreddits?: string[]
  enabled: boolean
  [key: string]: unknown
}

export interface Profile {
  field: string
  sources: Source[]
  level: 'beginner' | 'intermediate' | 'advanced'
  depth: 'beginner_friendly' | 'executive' | 'technical'
  interval: 'daily_6am' | 'twice_daily' | 'realtime'
  breaking_alerts: boolean
  focus_areas: string[]
  goal: 'stay_current' | 'prepare_exams' | 'teach_others'
  time_budget_min: number
  custom_instructions?: string
}

const SEED_PROFILE: Profile = {
  field: 'AI / ML',
  sources: [
    { id: 'arxiv_ai', type: 'arxiv', categories: ['cs.AI', 'cs.LG', 'cs.CL'], enabled: true },
    { id: 'hn', type: 'hackernews', filter: 'AI OR machine learning OR LLM', enabled: true },
    { id: 'reddit_ml', type: 'reddit', subreddits: ['MachineLearning', 'LocalLLaMA'], enabled: true },
    { id: 'exa_ai', type: 'exa', query: 'AI machine learning LLM agents', category: 'news', enabled: true },
    { id: 'latent_space', type: 'podcast', name: 'Latent Space', enabled: false },
  ],
  level: 'advanced',
  depth: 'technical',
  interval: 'daily_6am',
  breaking_alerts: true,
  focus_areas: ['training methods', 'model deployment', 'inference optimization'],
  goal: 'stay_current',
  time_budget_min: 15,
}

interface ProfileState {
  profile: Profile
  loading: boolean
  saving: boolean
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  applyPreset: (preset: Partial<Profile>) => Promise<void>
  toggleSource: (sourceId: string) => void
  addFocusArea: (area: string) => void
  removeFocusArea: (area: string) => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: SEED_PROFILE,
  loading: false,
  saving: false,
  fetchProfile: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      set({ profile: data as Profile, loading: false })
    } catch {
      set({ profile: SEED_PROFILE, loading: false })
    }
  },
  updateProfile: async (updates) => {
    const newProfile = { ...get().profile, ...updates }
    set({ profile: newProfile, saving: true })
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch {
      // Silently fail — local state is updated
    } finally {
      set({ saving: false })
    }
  },
  applyPreset: async (preset) => {
    const current = get().profile
    const newProfile = { ...current, ...preset }
    set({ profile: newProfile, saving: true })
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      })
    } catch {
      // Silently fail — local state is updated
    } finally {
      set({ saving: false })
    }
  },
  toggleSource: (sourceId) => {
    const profile = get().profile
    const sources = profile.sources.map((s) =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    )
    set({ profile: { ...profile, sources } })
  },
  addFocusArea: (area) => {
    const profile = get().profile
    if (!profile.focus_areas.includes(area)) {
      set({ profile: { ...profile, focus_areas: [...profile.focus_areas, area] } })
    }
  },
  removeFocusArea: (area) => {
    const profile = get().profile
    set({ profile: { ...profile, focus_areas: profile.focus_areas.filter((a) => a !== area) } })
  },
}))
