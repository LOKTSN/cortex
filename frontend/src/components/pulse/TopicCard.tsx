import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Topic } from '@/stores/topics'

const categoryConfig: Record<Topic['category'], { emoji: string; label: string }> = {
  breaking: { emoji: '🔴', label: 'BREAKING' },
  paper:    { emoji: '📄', label: 'NEW PAPER' },
  trending: { emoji: '🔥', label: 'TRENDING' },
  repo:     { emoji: '📦', label: 'REPO' },
  podcast:  { emoji: '🎙️', label: 'PODCAST' },
}

function formatSources(sources: Topic['sources']): string {
  return sources
    .map((s) => {
      if (s.type === 'hn') return `HN (${s.points ? s.points >= 1000 ? `${(s.points / 1000).toFixed(1)}K` : s.points : '?'} pts)`
      if (s.title) return s.title
      return s.type
    })
    .join(' · ')
}

interface TopicCardProps {
  topic: Topic
}

export function TopicCard({ topic }: TopicCardProps) {
  const { emoji, label } = categoryConfig[topic.category]

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex flex-col transition-colors hover:bg-[var(--bg-card-hover)]">
      <div className="flex items-center justify-between">
        <Badge variant={topic.category}>
          {emoji} {label}
        </Badge>
        <span className="text-xs text-[var(--color-text-subtle)]">
          {topic.date}
        </span>
      </div>

      <h3 className="text-sm font-semibold mt-3 text-[var(--color-text)] leading-snug">
        {topic.title}
      </h3>

      {topic.paper_meta && (
        <p className="text-xs text-[var(--color-text-subtle)] mt-1">
          {topic.paper_meta.authors} · arxiv {topic.paper_meta.arxiv_id} · {topic.paper_meta.citations} citations in 2 days
        </p>
      )}

      <p className="text-[var(--color-text-muted)] text-sm mt-2 leading-relaxed flex-1">
        {topic.summary}
      </p>

      {topic.relevance_reason && (
        <p className="text-xs text-[var(--color-text-subtle)] italic mt-2">
          {topic.relevance_reason}
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-subtle)] truncate mr-3">
            {formatSources(topic.sources)}
          </span>
          <Button variant="ghost" size="sm" asChild className="shrink-0 text-[var(--color-accent)]">
            <Link to={`/learn/${topic.slug}`}>
              Dive Deeper
              <ExternalLink size={12} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
