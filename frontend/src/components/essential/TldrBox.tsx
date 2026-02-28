import { useState } from "react"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import { useTopicsStore } from "@/stores/topics-store"
import ReactMarkdown from "react-markdown"

export function TldrBox() {
  const [expanded, setExpanded] = useState(true)
  const tldr = useTopicsStore((s) => s.tldr)

  return (
    <div className="mb-6 rounded-xl border bg-bg-muted p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left cursor-pointer"
      >
        <FileText className="h-5 w-5 text-text-muted" />
        <span className="flex-1 text-sm font-semibold">
          TL;DR — While you slept
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="mt-3 text-sm leading-relaxed text-text-muted prose prose-sm max-w-none">
          <ReactMarkdown>{tldr}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
