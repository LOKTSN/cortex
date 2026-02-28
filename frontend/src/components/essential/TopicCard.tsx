import { Link } from "react-router-dom"
import type { Topic } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const categoryConfig: Record<string, { emoji: string; variant: "breaking" | "paper" | "trending" | "repo" | "podcast" }> = {
  BREAKING: { emoji: "🔴", variant: "breaking" },
  "NEW PAPER": { emoji: "📄", variant: "paper" },
  TRENDING: { emoji: "🔥", variant: "trending" },
  REPO: { emoji: "📦", variant: "repo" },
  PODCAST: { emoji: "🎙️", variant: "podcast" },
}

export function TopicCard({ topic }: { topic: Topic }) {
  const config = categoryConfig[topic.category] ?? categoryConfig.BREAKING

  return (
    <div>
      <Link to={`/catchup/${topic.slug}`} className="block py-6 transition-colors hover:bg-bg-muted/50 -mx-2 px-2 rounded-lg">
        <div className="mb-2">
          <Badge variant={config.variant}>
            <span>{config.emoji}</span>
            {topic.category}
          </Badge>
        </div>
        <h2 className="mb-2 text-xl font-bold text-text">{topic.title}</h2>
        <p className="mb-3 text-sm leading-relaxed text-text-muted">
          {topic.description}
        </p>
        <p className="text-xs text-text-subtle">{topic.sources}</p>
      </Link>
      <Separator />
    </div>
  )
}
