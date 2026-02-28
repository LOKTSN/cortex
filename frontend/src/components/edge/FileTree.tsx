import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, FileText, FolderOpen, Calendar, Image, Music, Video } from "lucide-react"
import { mockEdgeTopics, mockTopics, mockCollections } from "@/lib/mock-data"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface FileSelection {
  slug: string
  topicName: string
  filename: string
}

interface FileTreeProps {
  selected: FileSelection | null
  onSelect: (selection: FileSelection) => void
}

function getFileIcon(filename: string) {
  if (filename.endsWith(".md")) return <FileText className="h-3 w-3 shrink-0 text-text-muted" />
  if (filename.endsWith(".png")) return <Image className="h-3 w-3 shrink-0 text-text-muted" />
  if (filename.endsWith(".mp3")) return <Music className="h-3 w-3 shrink-0 text-text-muted" />
  if (filename.endsWith(".mp4")) return <Video className="h-3 w-3 shrink-0 text-text-muted" />
  return <FileText className="h-3 w-3 shrink-0 text-text-muted" />
}

export function FileTree({ selected, onSelect }: FileTreeProps) {
  const [topicsOpen, setTopicsOpen] = useState(true)
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    new Set(mockEdgeTopics.map((g) => g.month))
  )
  const [openDays, setOpenDays] = useState<Set<string>>(
    new Set(mockEdgeTopics.map((g) => `${g.month}/${g.days[0]?.day}`))
  )
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())

  function toggle(key: string, setter: (fn: (prev: Set<string>) => Set<string>) => void) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-0.5">
        {/* Topics root */}
        <button
          onClick={() => setTopicsOpen(!topicsOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-bg-muted cursor-pointer"
        >
          {topicsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Folder className="h-4 w-4 text-text-muted" />
          topics
        </button>

        {topicsOpen &&
          mockEdgeTopics.map((group) => (
            <div key={group.month} className="ml-3">
              {/* Month */}
              <button
                onClick={() => toggle(group.month, setOpenMonths)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-text hover:bg-bg-muted cursor-pointer"
              >
                {openMonths.has(group.month) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Calendar className="h-3 w-3 text-text-muted" />
                {group.month}
              </button>

              {openMonths.has(group.month) &&
                group.days.map((day) => {
                  const dayKey = `${group.month}/${day.day}`
                  return (
                    <div key={dayKey} className="ml-3">
                      {/* Day */}
                      <button
                        onClick={() => toggle(dayKey, setOpenDays)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-[11px] font-medium text-text-subtle hover:bg-bg-muted cursor-pointer"
                      >
                        {openDays.has(dayKey) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <FolderOpen className="h-3 w-3" />
                        {day.label}
                      </button>

                      {openDays.has(dayKey) &&
                        day.topics.map((topic) => {
                          const topicKey = `${dayKey}/${topic.slug}`
                          const isOpen = openTopics.has(topicKey)
                          // Get files from mockTopics
                          const mockTopic = mockTopics.find((t) => t.slug === topic.slug)
                          const files = mockTopic?.files ?? ["synthesis.md", "raw_sources.md", "notes.md"]

                          return (
                            <div key={topicKey} className="ml-3">
                              {/* Topic folder */}
                              <button
                                onClick={() => toggle(topicKey, setOpenTopics)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-xs text-text-muted hover:bg-bg-muted hover:text-text cursor-pointer"
                              >
                                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <Folder className="h-3 w-3" />
                                <span className="truncate">{topic.name}</span>
                                {topic.isNew && (
                                  <span className="ml-auto shrink-0 text-[9px] font-bold text-success">NEW</span>
                                )}
                              </button>

                              {/* Files inside topic */}
                              {isOpen &&
                                files.map((filename) => {
                                  const isActive =
                                    selected?.slug === topic.slug && selected?.filename === filename
                                  return (
                                    <button
                                      key={filename}
                                      onClick={() =>
                                        onSelect({ slug: topic.slug, topicName: topic.name, filename })
                                      }
                                      className={`ml-5 flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                                        isActive
                                          ? "bg-bg-muted font-medium text-text"
                                          : "text-text-muted hover:bg-bg-muted hover:text-text"
                                      }`}
                                    >
                                      {getFileIcon(filename)}
                                      <span className="truncate">{filename}</span>
                                    </button>
                                  )
                                })}
                            </div>
                          )
                        })}
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
          collections
        </button>

        {collectionsOpen &&
          mockCollections.map((col) => (
            <button
              key={col.name}
              className="ml-6 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-bg-muted hover:text-text cursor-pointer"
            >
              <Folder className="h-3 w-3" />
              {col.name}
              <span className="ml-auto text-[10px] text-text-subtle">{col.count}</span>
            </button>
          ))}
      </div>
    </ScrollArea>
  )
}
