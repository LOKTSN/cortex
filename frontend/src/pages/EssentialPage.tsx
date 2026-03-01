import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2, RefreshCw, Inbox } from "lucide-react"
import { useTopicsStore } from "@/stores/topics-store"
import { useAuthStore } from "@/stores/auth-store"
import { Greeting } from "@/components/essential/Greeting"
import { TldrBox } from "@/components/essential/TldrBox"
import { PromoBanner } from "@/components/essential/PromoBanner"
import { TopicCard } from "@/components/essential/TopicCard"
import { OnboardingModal } from "@/components/onboarding/OnboardingModal"
import { Button } from "@/components/ui/button"

const DISCOVERY_PHASES = [
  "Scanning sources\u2026",
  "Fetching articles\u2026",
  "Scoring relevance\u2026",
  "Synthesising topics\u2026",
  "Almost done\u2026",
]

export function EssentialPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { topics, loading, fetchTopics } = useTopicsStore()
  const { isOnboarded } = useAuthStore()
  const showSignup = searchParams.get("signup") === "true"

  const [discovering, setDiscovering] = useState(false)
  const [phase, setPhase] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (phaseRef.current) clearInterval(phaseRef.current)
    }
  }, [])

  function stopDiscovery() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (phaseRef.current) { clearInterval(phaseRef.current); phaseRef.current = null }
    setDiscovering(false)
    setPhase(0)
  }

  async function runDiscovery() {
    if (discovering) return
    setDiscovering(true)
    setPhase(0)

    phaseRef.current = setInterval(() => {
      setPhase((p) => Math.min(p + 1, DISCOVERY_PHASES.length - 1))
    }, 4000)

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      if (!res.ok) throw new Error("discover start failed")
      const { job_id } = await res.json()

      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(`/api/discover/${job_id}`)
          if (!poll.ok) return
          const data = await poll.json()
          if (data.status === "done") {
            stopDiscovery()
            fetchTopics()
          }
        } catch {
          // keep polling on transient errors
        }
      }, 2000)
    } catch {
      stopDiscovery()
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <Greeting />
        <Button
          variant="ingrained"
          size="sm"
          onClick={runDiscovery}
          disabled={discovering}
          className="gap-1.5 shrink-0"
        >
          {discovering ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          {discovering ? "Discovering\u2026" : "Run Discovery"}
        </Button>
      </div>

      {discovering && (
        <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl bg-bg-muted border border-border">
          <Loader2 size={14} className="animate-spin text-accent shrink-0" />
          <p className="text-sm text-text-muted">{DISCOVERY_PHASES[phase]}</p>
        </div>
      )}

      <TldrBox />
      {!isOnboarded && <PromoBanner />}

      {loading && !discovering && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={20} className="animate-spin text-text-subtle" />
          <p className="text-sm text-text-muted">Fetching your latest topics...</p>
        </div>
      )}

      {!loading && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Inbox size={24} className="text-text-ghost" />
          <p className="text-sm text-text-muted">No topics yet</p>
          <p className="text-xs text-text-subtle">
            Click "Run Discovery" above, or configure your sources in the Template.
          </p>
        </div>
      )}

      <div>
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      <OnboardingModal
        open={showSignup}
        onOpenChange={(open) => {
          if (!open) setSearchParams({})
        }}
      />
    </div>
  )
}
