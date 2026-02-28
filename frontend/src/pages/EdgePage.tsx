import { useState } from "react"
import { Search, MessageCircle } from "lucide-react"
import { FileTree } from "@/components/edge/FileTree"
import { TopicPreview } from "@/components/edge/TopicPreview"
import { GraphView } from "@/components/edge/GraphView"
import { Button } from "@/components/ui/button"

export function EdgePage() {
  const [view, setView] = useState<"file" | "graph">("file")
  const [selected, setSelected] = useState<{ slug: string; name: string } | null>(null)

  return (
    <div className="flex h-[calc(100vh-57px-73px)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex gap-2">
          <Button
            variant={view === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("file")}
          >
            File View
          </Button>
          <Button
            variant={view === "graph" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("graph")}
          >
            Graph View
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-72 border-r">
          <FileTree
            selectedSlug={selected?.slug ?? null}
            onSelect={(slug, name) => setSelected({ slug, name })}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-auto">
          {view === "graph" ? (
            <GraphView />
          ) : selected ? (
            <TopicPreview slug={selected.slug} name={selected.name} />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              Select a topic to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
