import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, FileText, FolderOpen, Calendar } from "lucide-react"
import { mockEdgeTopics, mockCollections } from "@/lib/mock-data"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileTreeProps {
  selectedSlug: string | null
  onSelect: (slug: string, name: string) => void
}

export function FileTree({ selectedSlug, onSelect }: FileTreeProps) {
  const [topicsOpen, setTopicsOpen] = useState(true)
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    new Set(mockEdgeTopics.map((g) => g.month))
  )
  const [openDays, setOpenDays] = useState<Set<string>>(
    // Open the first day of each month by default
    new Set(mockEdgeTopics.map((g) => `${g.month}/${g.days[0]?.day}`))
  )

  function toggleMonth(month: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  function toggleDay(key: string) {
    setOpenDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {/* Topics */}
        <button
          onClick={() => setTopicsOpen(!topicsOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-bg-muted cursor-pointer"
        >
          {topicsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Folder className="h-4 w-4 text-text-muted" />
          Topics
        </button>

        {topicsOpen &&
          mockEdgeTopics.map((group) => (
            <div key={group.month} className="ml-4">
              {/* Month level */}
              <button
                onClick={() => toggleMonth(group.month)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-text hover:bg-bg-muted cursor-pointer"
              >
                {openMonths.has(group.month) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                {group.month}
              </button>

              {openMonths.has(group.month) &&
                group.days.map((day) => {
                  const dayKey = `${group.month}/${day.day}`
                  return (
                    <div key={dayKey} className="ml-4">
                      {/* Day level */}
                      <button
                        onClick={() => toggleDay(dayKey)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-bg-muted cursor-pointer"
                      >
                        {openDays.has(dayKey) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <FolderOpen className="h-3 w-3" />
                        {day.label}
                      </button>

                      {/* Topic level */}
                      {openDays.has(dayKey) &&
                        day.topics.map((topic) => (
                          <button
                            key={topic.slug + topic.name}
                            onClick={() => onSelect(topic.slug, topic.name)}
                            className={`ml-5 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer ${
                              selectedSlug === topic.slug
                                ? "bg-bg-muted font-medium text-text"
                                : "text-text-muted hover:bg-bg-muted hover:text-text"
                            }`}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{topic.name}</span>
                            {topic.isNew && (
                              <span className="ml-auto shrink-0 text-[10px] font-semibold text-success">(NEW)</span>
                            )}
                          </button>
                        ))}
                    </div>
                  )
                })}
            </div>
          ))}

        {/* Collections */}
        <button
          onClick={() => setCollectionsOpen(!collectionsOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-bg-muted mt-2 cursor-pointer"
        >
          {collectionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Folder className="h-4 w-4 text-text-muted" />
          Collections
        </button>

        {collectionsOpen &&
          mockCollections.map((col) => (
            <button
              key={col.name}
              className="ml-6 flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-text-muted hover:bg-bg-muted hover:text-text cursor-pointer"
            >
              <Folder className="h-3.5 w-3.5" />
              {col.name}
              <span className="ml-auto text-xs text-text-subtle">{col.count}</span>
            </button>
          ))}
      </div>
    </ScrollArea>
  )
}
