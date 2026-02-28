import { useState } from "react"
import { FileText, FolderOpen } from "lucide-react"
import { FileTree, type FileSelection } from "@/components/edge/FileTree"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockTopics } from "@/lib/mock-data"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Get the markdown content for a file from mock data */
function getFileContent(slug: string, filename: string): string | null {
  const topic = mockTopics.find((t) => t.slug === slug)
  if (!topic) return null

  if (filename === "synthesis.md") return topic.synthesis
  if (filename === "notes.md") return `# Notes\n\n*No notes yet. Start adding your thoughts here.*`
  if (filename === "raw_sources.md") {
    return `# Raw Sources\n\n${topic.sources}\n\n---\n\n**Tags:** ${topic.tags.join(", ")}\n\n**Category:** ${topic.category}\n\n**Date:** ${topic.date}`
  }
  return null
}

export function EdgePage() {
  const [selected, setSelected] = useState<FileSelection | null>(null)

  const content = selected ? getFileContent(selected.slug, selected.filename) : null
  const isMarkdown = selected?.filename.endsWith(".md")

  return (
    <div className="flex h-[calc(100vh-57px-73px)]">
      {/* File tree sidebar */}
      <div className="w-64 shrink-0 border-r bg-[#FAFAFA]">
        <FileTree selected={selected} onSelect={setSelected} />
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
            </div>

            {/* File content */}
            <ScrollArea className="flex-1">
              {isMarkdown && content ? (
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </article>
                </div>
              ) : !isMarkdown ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-text-subtle">
                    <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-text-muted">{selected.filename}</p>
                    <p className="text-xs mt-1">Media files will be available once generated.</p>
                  </div>
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
    </div>
  )
}
