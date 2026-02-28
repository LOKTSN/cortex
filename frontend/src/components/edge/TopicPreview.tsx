import { Link } from "react-router-dom"
import { CheckCircle, FileText, Music, Video, Image, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockEdgeTopics } from "@/lib/mock-data"
import { useTopicsStore } from "@/stores/topics"

interface TopicPreviewProps {
  slug: string
  name: string
}

const fileIcons: Record<string, React.ReactNode> = {
  ".md": <FileText className="h-4 w-4 text-text-muted" />,
  ".png": <Image className="h-4 w-4 text-text-muted" />,
  ".mp3": <Music className="h-4 w-4 text-text-muted" />,
  ".mp4": <Video className="h-4 w-4 text-text-muted" />,
}

function getIcon(filename: string) {
  const ext = filename.substring(filename.lastIndexOf("."))
  return fileIcons[ext] ?? <StickyNote className="h-4 w-4 text-text-muted" />
}

export function TopicPreview({ slug, name }: TopicPreviewProps) {
  const allEdgeTopics = mockEdgeTopics.flatMap((g) => g.days.flatMap((d) => d.topics))
  const edgeTopic = allEdgeTopics.find((t) => t.slug === slug && t.name === name)
  const { topics } = useTopicsStore()
  const topic = topics.find((t) => t.slug === slug)

  if (!edgeTopic) return null

  // Use files from the API-backed topic store, fall back to edge topic fileCount
  const files = topic?.files ?? []

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">Preview: {name}</h2>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-text-muted">Status:</span>
          <span className="font-medium">{edgeTopic.status}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted">Saved:</span>
          <span>{edgeTopic.saved}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted">Files:</span>
          <span>{files.length || edgeTopic.fileCount}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            {getIcon(file)}
            {file}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Button asChild className="flex-1">
          <Link to={`/catchup/${slug}`}>Open Learning Page</Link>
        </Button>
        <Button variant="outline" className="flex-1">
          Chat about this
        </Button>
      </div>
    </div>
  )
}
