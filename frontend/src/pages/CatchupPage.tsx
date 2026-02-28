import { useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTopicsStore } from "@/stores/topics-store"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChatPlaceholder } from "@/components/ui/chat-placeholder"

const categoryVariant: Record<string, "breaking" | "paper" | "trending" | "repo" | "podcast"> = {
  BREAKING: "breaking",
  "NEW PAPER": "paper",
  TRENDING: "trending",
  REPO: "repo",
  PODCAST: "podcast",
}

export function CatchupPage() {
  const { slug } = useParams<{ slug: string }>()
  const { selectedTopic, selectTopic } = useTopicsStore()

  useEffect(() => {
    if (slug) selectTopic(slug)
  }, [slug, selectTopic])

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
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="jingle">Jingle</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTopic.synthesis}
                </ReactMarkdown>
              </div>
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

            <TabsContent value="video">
              <div className="flex items-center justify-center py-16 text-sm text-text-muted">
                Video summary will appear here
              </div>
            </TabsContent>

            <TabsContent value="jingle">
              <div className="flex items-center justify-center py-16 text-sm text-text-muted">
                AI-generated jingle for this topic
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="flex items-center justify-center py-16 text-sm text-text-muted">
                Your notes will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: CopilotKit chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Ask about this topic</p>
            </div>
            <div className="h-[400px]">
              <ChatPlaceholder
                title="Cortex"
                initialMessage={`I can help you understand "${selectedTopic.title}". Ask me anything about this topic!`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
