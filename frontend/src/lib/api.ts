import { mockTopics, mockProfile, mockTldr } from "./mock-data"

const API_BASE = "/api"

async function fetchWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch {
    return fallback
  }
}

export const api = {
  getTopics: () => fetchWithFallback("/topics", mockTopics),
  getTopic: (slug: string) =>
    fetchWithFallback(`/topics/${slug}`, mockTopics.find((t) => t.slug === slug) ?? mockTopics[0]),
  getProfile: () => fetchWithFallback("/profile", mockProfile),
  getTldr: () => fetchWithFallback("/tldr", { text: mockTldr }),
}
