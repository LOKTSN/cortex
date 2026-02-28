import { useState } from "react"
import { Link } from "react-router-dom"
import {
  CheckCircle, FileText, Music, Video, Image, StickyNote,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { mockEdgeTopics, mockTopics } from "@/lib/mock-data"
import { useTopicsStore } from "@/stores/topics"

interface TopicPreviewProps {
  slug: string
  name: string
}

const fileIcons: Record<string, React.ReactNode> = {
  ".md": <FileText className="h-3.5 w-3.5 shrink-0" />,
  ".png": <Image className="h-3.5 w-3.5 shrink-0" />,
  ".mp3": <Music className="h-3.5 w-3.5 shrink-0" />,
  ".mp4": <Video className="h-3.5 w-3.5 shrink-0" />,
}

function getIcon(filename: string) {
  const ext = filename.substring(filename.lastIndexOf("."))
  return fileIcons[ext] ?? <StickyNote className="h-3.5 w-3.5 shrink-0" />
}

function isMarkdown(filename: string) {
  return filename.endsWith(".md")
}

/** Get the markdown content for a file, using mock data */
function getFileContent(slug: string, filename: string): string | null {
  const topic = mockTopics.find((t) => t.slug === slug)
  if (!topic) return null

  if (filename === "synthesis.md") {
    return topic.synthesis
  }
  if (filename === "notes.md") {
    return `# Notes\n\n*No notes yet. Start adding your thoughts here.*`
  }
  if (filename === "raw_sources.md") {
    return `# Raw Sources\n\n${topic.sources}\n\n---\n\n**Tags:** ${topic.tags.join(", ")}\n\n**Category:** ${topic.category}\n\n**Date:** ${topic.date}`
  }
  return null
}

const categoryVariant: Record<string, "breaking" | "paper" | "trending" | "repo" | "podcast"> = {
  BREAKING: "breaking",
  "NEW PAPER": "paper",
  TRENDING: "trending",
  REPO: "repo",
  PODCAST: "podcast",
}

export function TopicPreview({ slug, name }: TopicPreviewProps) {
  const [activeFile, setActiveFile] = useState<string | null>("synthesis.md")

  const allEdgeTopics = mockEdgeTopics.flatMap((g) => g.days.flatMap((d) => d.topics))
  const edgeTopic = allEdgeTopics.find((t) => t.slug === slug && t.name === name)
  const { topics } = useTopicsStore()
  const apiTopic = topics.find((t) => t.slug === slug)
  const mockTopic = mockTopics.find((t) => t.slug === slug)

  if (!edgeTopic) return null

  const files = apiTopic?.files ?? mockTopic?.files ?? []
  const content = activeFile ? getFileContent(slug, activeFile) : null

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={categoryVariant[mockTopic?.category ?? ""] ?? "trending"}>
            {mockTopic?.category ?? "TOPIC"}
          </Badge>
          <span className="text-xs text-text-muted">{mockTopic?.date ?? edgeTopic.saved}</span>
          <div className="flex items-center gap-1 ml-auto text-xs text-text-muted">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            {edgeTopic.status}
          </div>
        </div>
        <h2 className="text-lg font-bold font-serif leading-snug">
          {mockTopic?.title ?? name}
        </h2>
        {mockTopic?.tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {mockTopic.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-bg-muted px-2 py-0.5 text-[11px] text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* File tabs + content */}
      <div className="flex flex-1 min-h-0">
        {/* File sidebar */}
        <div className="w-48 shrink-0 border-r bg-[#FAFAFA]">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
            Files ({files.length})
          </div>
          <div className="space-y-0.5 px-2">
            {files.map((file) => (
              <button
                key={file}
                onClick={() => isMarkdown(file) ? setActiveFile(file) : undefined}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                  activeFile === file
                    ? "bg-white font-medium text-text shadow-sm border border-border"
                    : isMarkdown(file)
                    ? "text-text-muted hover:bg-white hover:text-text"
                    : "text-text-subtle opacity-50 cursor-not-allowed"
                }`}
              >
                {getIcon(file)}
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 px-3 space-y-2">
            <Button asChild size="sm" className="w-full text-xs">
              <Link to={`/catchup/${slug}`}>Open Catch-up</Link>
            </Button>
          </div>
        </div>

        {/* Content area */}
        <ScrollArea className="flex-1">
          {activeFile && content ? (
            <div className="p-6">
              {/* File breadcrumb */}
              <div className="flex items-center gap-1.5 mb-4 text-xs text-text-subtle">
                <span>topics</span>
                <span>/</span>
                <span>{slug}</span>
                <span>/</span>
                <span className="font-medium text-text-muted">{activeFile}</span>
              </div>

              {/* Rendered markdown */}
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            </div>
          ) : activeFile && !content ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              <div className="text-center">
                {getIcon(activeFile)}
                <p className="mt-2">Media file: {activeFile}</p>
                <p className="text-xs text-text-subtle mt-1">
                  Audio, video, and image files will be available once generated.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Select a file to view its contents
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
