import { useEffect, useState, useMemo } from "react"
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Loader2, MessageSquare, PanelRightClose, PanelRightOpen } from "lucide-react"
import { useTopicsStore } from "@/stores/topics-store"
import type { Topic } from "@/lib/mock-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChatPanel } from "@/components/ChatPanel"

const categoryVariant: Record<string, "breaking" | "paper" | "trending" | "repo" | "podcast"> = {
  BREAKING: "breaking",
  "NEW PAPER": "paper",
  TRENDING: "trending",
  REPO: "repo",
  PODCAST: "podcast",
}

interface FileInfo {
  name: string
}

function TopicFolder({
  topic,
  selected,
  onSelect,
}: {
  topic: Topic
  selected: { slug: string; filename: string } | null
  onSelect: (slug: string, filename: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loaded, setLoaded] = useState(false)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && !loaded) {
      try {
        const res = await fetch(`/api/topics/${topic.slug}/files`)
        if (res.ok) {
          const data = await res.json()
          setFiles(data)
        } else {
          // Fallback: show known files from topic
          setFiles(
            (topic.files ?? ["synthesis.md", "raw_sources.md", "notes.md"]).map((f) => ({ name: f }))
          )
        }
      } catch {
        setFiles(
          (topic.files ?? ["synthesis.md", "raw_sources.md", "notes.md"]).map((f) => ({ name: f }))
        )
      }
      setLoaded(true)
    }
  }

  return (
    <div className="ml-3">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-bg-muted hover:text-text cursor-pointer"
      >
        {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <Folder className="h-3 w-3 shrink-0" />
        <span className="truncate">{topic.title}</span>
      </button>

      {open && (
        <div className="ml-5">
          {files.length === 0 && loaded && (
            <p className="px-2 py-1 text-[11px] text-text-subtle">No files</p>
          )}
          {files.map((file) => {
            const isActive = selected?.slug === topic.slug && selected?.filename === file.name
            return (
              <button
                key={file.name}
                onClick={() => onSelect(topic.slug, file.name)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  isActive
                    ? "bg-bg-muted font-medium text-text"
                    : "text-text-muted hover:bg-bg-muted hover:text-text"
                }`}
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EdgePage() {
  const { topics, loading, fetchTopics } = useTopicsStore()
  const [selected, setSelected] = useState<{ slug: string; filename: string } | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileLoading, setFileLoading] = useState(false)
  const [topicsOpen, setTopicsOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  useEffect(() => {
    if (!selected) {
      setFileContent("")
      return
    }
    setFileLoading(true)
    fetch(`/api/topics/${selected.slug}/file/${selected.filename}`)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        setFileContent(text)
        setFileLoading(false)
      })
      .catch(() => {
        setFileContent("")
        setFileLoading(false)
      })
  }, [selected])

  function handleSelect(slug: string, filename: string) {
    setSelected({ slug, filename })
  }

  // Find topic for selected file (for badge display)
  const selectedTopic = selected ? topics.find((t) => t.slug === selected.slug) : null

  // Build chat context from currently viewed content
  const chatContext = useMemo(() => {
    const base = `You are Cortex, an AI research companion embedded in the Edge knowledge explorer.
The user is browsing their curated topic feed — synthesized research on repos, papers, and trends.

You can help the user by:
1. Explaining concepts from the content they're viewing
2. Searching the web for deeper information (use exa_search)
3. Fetching and reading linked GitHub repos or papers (use web_fetch)
4. Comparing technologies or approaches mentioned in topics
5. Writing notes or summaries to topic folders (use write_file to save to data/topics/<slug>/notes.md)
6. Generating diagrams or visual explanations (use generate_image)

Be concise, technical, and insightful. Use markdown formatting. When the user asks about something in their feed, reference the specific content they're viewing.`

    if (selectedTopic && fileContent) {
      return `${base}

Currently viewing:
- Topic: ${selectedTopic.title}
- File: ${selected?.filename}
- Category: ${selectedTopic.category}

File content (truncated):
${fileContent.slice(0, 3000)}`
    }

    if (topics.length > 0) {
      const topicList = topics.slice(0, 10).map(t => `- ${t.title} (${t.category})`).join('\n')
      return `${base}

The user has ${topics.length} topics in their feed. Recent topics:
${topicList}`
    }

    return base
  }, [selectedTopic, fileContent, selected, topics])

  const chatInitialMessage = selectedTopic
    ? `I can see you're looking at **${selectedTopic.title}**. I can search for more details, explain concepts, compare this with alternatives, or help you take notes. What would you like to explore?`
    : "I'm your research companion. Select a topic from the feed and I can help you dive deeper — search for details, explain concepts, fetch code, or compare approaches."

  return (
    <div className="flex h-[calc(100vh-57px-73px)]">
      {/* File tree sidebar */}
      <div className="w-64 shrink-0 border-r bg-[#FAFAFA]">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-0.5">
            <button
              onClick={() => setTopicsOpen(!topicsOpen)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-bg-muted cursor-pointer"
            >
              {topicsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-4 w-4 text-text-muted" />
              topics
              {loading && <Loader2 className="h-3 w-3 animate-spin text-text-subtle ml-auto" />}
            </button>

            {topicsOpen &&
              topics.map((topic) => (
                <TopicFolder
                  key={topic.slug}
                  topic={topic}
                  selected={selected}
                  onSelect={handleSelect}
                />
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selected ? (
          <>
            {/* File tab bar */}
            <div className="shrink-0 border-b bg-white px-4 py-2 flex items-center gap-1.5 text-xs text-text-subtle">
              <FolderOpen className="h-3 w-3" />
              <span>topics</span>
              <span className="text-text-ghost">/</span>
              <span>{selected.slug}</span>
              <span className="text-text-ghost">/</span>
              <span className="font-medium text-text">{selected.filename}</span>
              {selectedTopic && (
                <Badge variant={categoryVariant[selectedTopic.category]} className="ml-3 text-[10px]">
                  {selectedTopic.category}
                </Badge>
              )}
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setChatOpen(!chatOpen)}
                  title={chatOpen ? "Hide chat" : "Show chat"}
                >
                  {chatOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                </Button>
              </div>
            </div>

            {/* Markdown content */}
            <ScrollArea className="flex-1">
              {fileLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
                </div>
              ) : fileContent ? (
                <div className="max-w-3xl mx-auto px-8 py-6">
                  <article className="prose prose-sm max-w-none
                    prose-headings:font-serif prose-headings:text-text
                    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-text-muted prose-p:leading-relaxed
                    prose-li:text-text-muted
                    prose-strong:text-text prose-strong:font-semibold
                    prose-code:text-xs prose-code:bg-bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-table:text-sm
                    prose-th:text-left prose-th:font-semibold prose-th:text-text prose-th:py-2 prose-th:px-3 prose-th:border-b prose-th:border-border
                    prose-td:py-2 prose-td:px-3 prose-td:border-b prose-td:border-border prose-td:text-text-muted
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
                  </article>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-text-muted">No content available for this file.</p>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-text-subtle">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-text-muted">Select a file to view</p>
              <p className="text-xs mt-1">Browse the topic tree on the left</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="w-96 shrink-0 border-l border-[var(--color-border)] bg-white flex flex-col overflow-hidden">
          <ChatPanel
            key={selectedTopic?.slug ?? "default"}
            title="Cortex Agent"
            initialMessage={chatInitialMessage}
            context={chatContext}
          />
        </div>
      )}

      {/* Collapsed chat toggle (when chat is hidden) */}
      {!chatOpen && (
        <div className="shrink-0 border-l border-[var(--color-border)] bg-white flex flex-col items-center py-3 px-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setChatOpen(true)}
            title="Open chat"
            className="mb-2"
          >
            <MessageSquare size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
