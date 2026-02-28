import { create } from "zustand"
import { type Topic, mockTopics, mockTldr } from "@/lib/mock-data"

interface TopicsState {
  topics: Topic[]
  tldr: string
  selectedTopic: Topic | null
  selectTopic: (slug: string) => void
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  topics: mockTopics,
  tldr: mockTldr,
  selectedTopic: null,
  selectTopic: (slug) => {
    const topic = get().topics.find((t) => t.slug === slug) ?? null
    set({ selectedTopic: topic })
  },
}))
