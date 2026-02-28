import { create } from "zustand"
import { type Topic, mockTopics, mockTldr } from "@/lib/mock-data"

const API_BASE = "/api"

const categoryMap: Record<string, Topic["category"]> = {
  breaking: "BREAKING",
  paper: "NEW PAPER",
  trending: "TRENDING",
  repo: "REPO",
  podcast: "PODCAST",
}

function formatSources(sources: { url: string; type: string; title?: string; points?: number }[]): string {
  const parts = sources.map((s) => {
    if (s.points) return `${s.type === "hn" ? "HN" : s.title ?? s.type} (${s.points} pts)`
    return s.title ?? s.type
  })
  return `Sources: ${parts.join(" · ")}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiTopicToTopic(raw: any, index: number): Topic {
  return {
    id: String(index + 1),
    slug: raw.slug,
    category: categoryMap[raw.category] ?? "BREAKING",
    title: raw.title,
    description: raw.summary ?? raw.tldr ?? "",
    sources: formatSources(raw.sources ?? []),
    date: raw.date,
    tags: raw.tags ?? [],
    synthesis: "", // loaded on demand
    files: raw.files ?? [],
  }
}

interface TopicsState {
  topics: Topic[]
  tldr: string
  selectedTopic: Topic | null
  loading: boolean
  fetchTopics: () => Promise<void>
  selectTopic: (slug: string) => Promise<void>
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  topics: mockTopics,
  tldr: mockTldr,
  selectedTopic: null,
  loading: false,

  fetchTopics: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/topics`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      const topics = (data as unknown[]).map((t, i) => apiTopicToTopic(t, i))
      set({ topics, loading: false })
    } catch {
      // Fall back to mock data
      set({ topics: mockTopics, loading: false })
    }
  },

  selectTopic: async (slug) => {
    const topic = get().topics.find((t) => t.slug === slug) ?? null
    if (!topic) {
      set({ selectedTopic: null })
      return
    }

    // Show immediately with description as placeholder
    set({ selectedTopic: { ...topic, synthesis: topic.synthesis || topic.description } })

    // Fetch full synthesis from backend
    try {
      const res = await fetch(`${API_BASE}/topics/${slug}/synthesis`)
      if (!res.ok) throw new Error(`${res.status}`)
      const markdown = await res.text()
      const updated = { ...topic, synthesis: markdown }
      // Update both the selected topic and the topic in the list
      set((state) => ({
        selectedTopic: updated,
        topics: state.topics.map((t) => (t.slug === slug ? updated : t)),
      }))
    } catch {
      // Keep mock synthesis if available, otherwise use description
      const fallback = mockTopics.find((t) => t.slug === slug)
      if (fallback?.synthesis) {
        set({ selectedTopic: { ...topic, synthesis: fallback.synthesis } })
      }
    }
  },
}))
