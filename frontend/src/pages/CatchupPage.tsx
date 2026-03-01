import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, FileText, FolderOpen } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTopicsStore } from "@/stores/topics-store"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChatPanel } from "@/components/ChatPanel"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const categoryVariant: Record<string, "breaking" | "paper" | "trending" | "repo" | "podcast"> = {
  BREAKING: "breaking",
  "NEW PAPER": "paper",
  TRENDING: "trending",
  REPO: "repo",
  PODCAST: "podcast",
}

const categoryConfig: Record<string, { emoji: string; variant: "breaking" | "paper" | "trending" | "repo" | "podcast" }> = {
  BREAKING: { emoji: "\uD83D\uDD34", variant: "breaking" },
  "NEW PAPER": { emoji: "\uD83D\uDCC4", variant: "paper" },
  TRENDING: { emoji: "\uD83D\uDD25", variant: "trending" },
  REPO: { emoji: "\uD83D\uDCE6", variant: "repo" },
  PODCAST: { emoji: "\uD83C\uDF99\uFE0F", variant: "podcast" },
}

interface TopicFile {
  name: string
  size?: number
}

function StudioHome() {
  const topics = useTopicsStore((s) => s.topics)
  const fetchTopics = useTopicsStore((s) => s.fetchTopics)

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Topic list */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold font-serif mb-2">Studio</h1>
          <p className="text-sm text-text-muted mb-6">
            Your curated feed. Click a topic to dive deeper.
          </p>

          <div>
            {topics.map((topic) => {
              const config = categoryConfig[topic.category] ?? categoryConfig.BREAKING
              return (
                <div key={topic.id}>
                  <Link
                    to={`/catchup/${topic.slug}`}
                    className="block py-5 transition-colors hover:bg-bg-muted/50 -mx-2 px-2 rounded-lg"
                  >
                    <div className="mb-2">
                      <Badge variant={config.variant}>
                        <span>{config.emoji}</span>
                        {topic.category}
                      </Badge>
                    </div>
                    <h2 className="mb-2 text-lg font-bold text-text">{topic.title}</h2>
                    <p className="mb-2 text-sm leading-relaxed text-text-muted line-clamp-2">
                      {topic.description}
                    </p>
                    <p className="text-xs text-text-subtle">{topic.sources}</p>
                  </Link>
                  <Separator />
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Ask Cortex</p>
            </div>
            <div className="h-[500px]">
              <ChatPanel
                title="Cortex"
                initialMessage="Hi! I'm your AI research companion. Ask me about any of today's topics, or anything else you're curious about."
                context={topics.map((t) => `${t.category}: ${t.title} — ${t.description}`).join("\n\n")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilesPanel({ slug }: { slug: string }) {
  const [files, setFiles] = useState<TopicFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch(`/api/topics/${slug}/files`)
        if (!res.ok) return
        const data = await res.json()
        setFiles(data)
        // Auto-select first markdown file
        const firstMd = data.find((f: TopicFile) => f.name.endsWith(".md"))
        if (firstMd) {
          setSelectedFile(firstMd.name)
        }
      } catch {
        // no files available
      }
    }
    loadFiles()
  }, [slug])

  useEffect(() => {
    if (!selectedFile) {
      setFileContent("")
      return
    }
    setLoading(true)
    fetch(`/api/topics/${slug}/file/${selectedFile}`)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        setFileContent(text)
        setLoading(false)
      })
      .catch(() => {
        setFileContent("")
        setLoading(false)
      })
  }, [slug, selectedFile])

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <FolderOpen className="h-8 w-8 mb-3 opacity-30" />
        <p className="text-sm">No files available for this topic.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 min-h-[300px]">
      {/* File list sidebar */}
      <div className="w-48 shrink-0 border-r pr-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Topic Files
        </p>
        <div className="space-y-0.5">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file.name)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                selectedFile === file.name
                  ? "bg-bg-muted font-medium text-text"
                  : "text-text-muted hover:bg-bg-muted hover:text-text"
              }`}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-muted">Loading...</p>
          </div>
        ) : selectedFile && fileContent ? (
          <div className="prose prose-sm max-w-none">
            <div className="flex items-center gap-1.5 text-xs text-text-subtle mb-4">
              <FolderOpen className="h-3 w-3" />
              <span>{slug}</span>
              <span className="text-text-ghost">/</span>
              <span className="font-medium text-text">{selectedFile}</span>
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm text-text-muted">
            Select a file to view its contents
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export function CatchupPage() {
  const { slug } = useParams<{ slug: string }>()
  const { selectedTopic, selectTopic, fetchTopics } = useTopicsStore()

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  useEffect(() => {
    if (slug) selectTopic(slug)
  }, [slug, selectTopic])

  // No slug — show studio landing
  if (!slug) {
    return <StudioHome />
  }

  if (!selectedTopic) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="mt-8 text-center text-text-muted">Topic not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-6">
        <Badge variant={categoryVariant[selectedTopic.category]} className="mb-2">
          {selectedTopic.category}
        </Badge>
        <h1 className="text-3xl font-bold font-serif">{selectedTopic.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-text-muted">
          <span>{selectedTopic.date}</span>
          <span>·</span>
          <div className="flex gap-2">
            {selectedTopic.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-bg-muted px-2.5 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTopic.synthesis}
                </ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="files">
              <FilesPanel slug={slug} />
            </TabsContent>

            <TabsContent value="audio">
              <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <p className="text-sm">Audio briefing for this topic</p>
                <div className="mt-4 w-full max-w-md rounded-lg bg-bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent" />
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-border-strong" />
                      <p className="mt-1 text-xs text-text-subtle">3:42</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagrams">
              <div className="flex items-center justify-center py-16 text-sm text-text-muted">
                Architecture diagrams will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Ask about this topic</p>
            </div>
            <div className="h-[400px]">
              <ChatPanel
                title="Cortex"
                initialMessage={`I can help you understand "${selectedTopic.title}". Ask me anything about this topic!`}
                context={selectedTopic.synthesis}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
