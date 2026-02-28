import { useEffect, useMemo, useRef, useState } from 'react'
import { Zap, Loader2, Newspaper, Inbox, RefreshCw } from 'lucide-react'
import { useTopicsStore, type Topic } from '@/stores/topics'
import { TldrPanel } from '@/components/pulse/TldrPanel'
import { TopicCard } from '@/components/pulse/TopicCard'
import { PulseSidebar } from '@/components/pulse/PulseSidebar'
import { Button } from '@/components/ui/button'

const greeting = (() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})()

const dateStr = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const DISCOVERY_PHASES = [
  'Scanning sources…',
  'Fetching articles…',
  'Scoring relevance…',
  'Synthesising topics…',
  'Almost done…',
]

export function PulsePage() {
  const { topics, loading, fetchTopics } = useTopicsStore()
  const [discovering, setDiscovering] = useState(false)
  const [phase, setPhase] = useState(0)
  const [activeFilter, setActiveFilter] = useState<Topic['category'] | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filteredTopics = useMemo(
    () => activeFilter ? topics.filter((t) => t.category === activeFilter) : topics,
    [topics, activeFilter]
  )

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (phaseRef.current) clearInterval(phaseRef.current)
    }
  }, [])

  async function runDiscovery() {
    if (discovering) return
    setDiscovering(true)
    setPhase(0)

    // Cycle through phase messages for UX feedback
    phaseRef.current = setInterval(() => {
      setPhase((p) => Math.min(p + 1, DISCOVERY_PHASES.length - 1))
    }, 4000)

    try {
      const res = await fetch('/api/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (!res.ok) throw new Error('discover start failed')
      const { job_id } = await res.json()

      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(`/api/discover/${job_id}`)
          if (!poll.ok) return
          const data = await poll.json()
          if (data.status === 'done') {
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

  function stopDiscovery() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (phaseRef.current) { clearInterval(phaseRef.current); phaseRef.current = null }
    setDiscovering(false)
    setPhase(0)
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Feed column */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-3xl px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Zap size={20} className="text-[var(--color-accent)]" />
                <h1 className="text-xl font-semibold text-[var(--color-text)]">Pulse</h1>
              </div>
              <Button
                variant="ingrained"
                size="sm"
                onClick={runDiscovery}
                disabled={discovering}
                className="gap-1.5"
              >
                {discovering
                  ? <Loader2 size={13} className="animate-spin" />
                  : <RefreshCw size={13} />}
                {discovering ? 'Discovering…' : 'Run Discovery'}
              </Button>
            </div>
            <p className="text-[var(--color-text)] text-base">
              {greeting}, Daniel. Here's what happened overnight.
            </p>
            <p className="text-[var(--color-text-subtle)] text-sm mt-1">
              {dateStr}
            </p>
          </div>

          {discovering && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl bg-[var(--bg-raised)] border border-[var(--color-border)]">
              <Loader2 size={14} className="animate-spin text-[var(--color-accent)] shrink-0" />
              <p className="text-sm text-[var(--color-text-muted)]">{DISCOVERY_PHASES[phase]}</p>
            </div>
          )}

          {loading && !discovering && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={20} className="animate-spin text-[var(--color-text-subtle)]" />
              <p className="text-sm text-[var(--color-text-muted)]">Fetching your latest topics...</p>
            </div>
          )}

          <TldrPanel topics={filteredTopics} />

          {!loading && filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Inbox size={24} className="text-[var(--color-text-ghost)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                {activeFilter ? 'No topics in this category' : 'No topics yet'}
              </p>
              {!activeFilter && (
                <p className="text-xs text-[var(--color-text-subtle)]">Configure your sources in the template to start receiving updates.</p>
              )}
            </div>
          )}

          {filteredTopics.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper size={14} className="text-[var(--color-text-muted)]" />
                <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Today's Topics
                </h2>
                <span className="text-xs text-[var(--color-text-subtle)]">({filteredTopics.length})</span>
                <div className="flex-1 border-t border-[var(--color-border-subtle)]" />
              </div>
              <div className="grid gap-4">
                {filteredTopics.map((topic, i) => (
                  <div
                    key={topic.slug}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <TopicCard topic={topic} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-80 shrink-0 bg-white border-l border-[var(--color-border)] overflow-y-auto hidden lg:block">
        <PulseSidebar
          topics={topics}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
    </div>
  )
}
