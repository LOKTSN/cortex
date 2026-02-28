import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, FolderOpen, Calendar, Brain, BookOpen } from 'lucide-react'
import { useTopicsStore, type Topic } from '@/stores/topics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

type FilterCategory = 'all' | Topic['category']
type FilterStatus = 'all' | Topic['status']

export function KBPage() {
  const { topics, fetchTopics } = useTopicsStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  const filtered = topics.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    return true
  })

  // Group by date
  const grouped = filtered.reduce<Record<string, Topic[]>>((acc, topic) => {
    const key = topic.date
    if (!acc[key]) acc[key] = []
    acc[key].push(topic)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const selected = topics.find((t) => t.slug === selectedSlug) || null

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Left: Topic browser */}
      <div className="w-80 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col overflow-hidden">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
          <Brain size={14} className="text-[var(--color-text-subtle)]" />
          <span className="text-sm font-medium text-[var(--color-text)]">Knowledge Base</span>
          <span className="text-xs text-[var(--color-text-subtle)] ml-auto">{filtered.length}</span>
        </div>
        {/* Search */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="form-input pl-8 w-full"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-[var(--color-border)] flex flex-wrap gap-1">
          {(['all', 'breaking', 'paper', 'trending', 'repo', 'podcast'] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                categoryFilter === cat
                  ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-b border-[var(--color-border)] flex gap-1">
          {(['all', 'new', 'read', 'archived'] as FilterStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                statusFilter === st
                  ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Topic list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {dates.length === 0 && (
              <p className="text-xs text-[var(--color-text-subtle)] p-4 text-center">No topics found.</p>
            )}
            {dates.map((date) => (
              <div key={date} className="mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <Calendar size={10} className="text-[var(--color-text-subtle)]" />
                  <span className="text-xs font-medium text-[var(--color-text-subtle)]">
                    {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {grouped[date].map((topic) => (
                  <button
                    key={topic.slug}
                    onClick={() => setSelectedSlug(topic.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSlug === topic.slug
                        ? 'bg-[var(--bg-ingrained)] text-[var(--color-text)]'
                        : 'hover:bg-[var(--bg-card-hover)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen size={12} className="shrink-0" />
                      <span className="truncate">{topic.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 ml-5">
                      <Badge
                        variant={topic.category as 'breaking' | 'paper' | 'trending' | 'repo' | 'podcast'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {topic.category}
                      </Badge>
                      <Badge
                        variant={topic.status === 'new' ? 'new' : topic.status === 'read' ? 'read' : 'archived'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {topic.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 min-w-0 bg-white flex flex-col overflow-hidden">
        {selected ? (
          <div key={selected.slug} className="animate-fade-in flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-[var(--color-border)]">
              <h2 className="text-base font-semibold text-[var(--color-text)]">{selected.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={selected.category as 'breaking' | 'paper' | 'trending' | 'repo' | 'podcast'}>
                  {selected.category}
                </Badge>
                <Badge variant={selected.status === 'new' ? 'new' : selected.status === 'read' ? 'read' : 'archived'}>
                  {selected.status}
                </Badge>
                <span className="text-xs text-[var(--color-text-subtle)]">{selected.date}</span>
              </div>
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="text-xs text-[var(--color-text-subtle)] bg-[var(--bg-raised)] px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-5">
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{selected.summary}</p>
                <p className="text-xs text-[var(--color-text-subtle)] mb-4">
                  {selected.relevance_reason}
                </p>

                <div className="flex gap-2">
                  <Button variant="default" size="sm" asChild className="gap-1.5">
                    <Link to={`/learn/${selected.slug}`}>
                      <BookOpen size={12} />
                      Open Learning Page
                    </Link>
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FolderOpen size={32} className="mx-auto text-[var(--color-text-ghost)] mb-3" />
              <p className="text-sm text-[var(--color-text-muted)]">Select a topic to preview</p>
              <p className="text-xs text-[var(--color-text-subtle)] mt-1">{filtered.length} topics available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
