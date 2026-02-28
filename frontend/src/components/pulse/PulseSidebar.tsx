import { Brain, ChevronRight, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Topic } from '@/stores/topics'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<Topic['category'], string> = {
  breaking: 'Breaking',
  paper: 'Papers',
  trending: 'Trending',
  repo: 'Repos',
  podcast: 'Podcasts',
}

interface PulseSidebarProps {
  topics: Topic[]
  activeFilter: Topic['category'] | null
  onFilterChange: (cat: Topic['category'] | null) => void
}

export function PulseSidebar({ topics, activeFilter, onFilterChange }: PulseSidebarProps) {
  // Count topics per category
  const counts = topics.reduce<Partial<Record<Topic['category'], number>>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})

  const categories = Object.entries(counts) as [Topic['category'], number][]

  return (
    <div className="flex flex-col gap-5 py-6 px-5">
      {/* Quick Stats */}
      <section>
        <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Total topics</span>
            <span className="font-medium text-[var(--color-text)]">{topics.length}</span>
          </div>
          {categories.map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{CATEGORY_LABELS[cat]}</span>
              <span className="font-medium text-[var(--color-text)]">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Category Filters */}
      <section>
        <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Filter by Category
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onFilterChange(null)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              activeFilter === null
                ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
            )}
          >
            All
          </button>
          {categories.map(([cat]) => (
            <button
              key={cat}
              onClick={() => onFilterChange(activeFilter === cat ? null : cat)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                activeFilter === cat
                  ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {/* Quick Nav */}
      <section>
        <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-1">
          <Link
            to="/kb"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Brain size={14} />
              Knowledge Base
            </span>
            <ChevronRight size={14} />
          </Link>
          <Link
            to="/template"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings size={14} />
              Settings
            </span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
