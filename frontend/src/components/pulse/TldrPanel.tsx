import { Sparkles } from 'lucide-react'
import type { Topic } from '@/stores/topics'

interface TldrPanelProps {
  topics: Topic[]
}

export function TldrPanel({ topics }: TldrPanelProps) {
  const top3 = topics.slice(0, 3)

  if (top3.length === 0) return null

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6">
      <h2 className="text-sm font-medium flex items-center gap-2 text-[var(--color-text)]">
        <Sparkles size={14} className="text-[var(--color-accent)]" />
        TL;DR — While you slept
      </h2>
      <ul className="text-[var(--color-text-muted)] text-sm mt-3 space-y-2">
        {top3.map((topic) => (
          <li key={topic.slug} className="flex items-start gap-2">
            <span className="text-[var(--color-text-subtle)] mt-0.5 shrink-0">•</span>
            <span>{topic.tldr}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
