import { useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  Handle,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { mockTopics } from "@/lib/mock-data"

/* ── Category styles ── */
const CAT_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  BREAKING:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "NEW PAPER": { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  TRENDING:   { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  REPO:       { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  PODCAST:    { color: "#7C3AED", bg: "#FAF5FF", border: "#DDD6FE" },
}

/* ── Custom topic node ── */
function TopicNode({ data }: NodeProps) {
  const style = CAT_STYLES[data.category as string] || CAT_STYLES.TRENDING
  return (
    <div
      className="rounded-xl border-2 px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        minWidth: 180,
        maxWidth: 240,
      }}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ color: style.color }}
      >
        {data.category as string}
      </div>
      <div className="text-xs font-semibold text-[#1A1A1A] leading-snug mb-1.5">
        {data.label as string}
      </div>
      <div className="flex flex-wrap gap-1">
        {(data.tags as string[]).map((tag: string) => (
          <span
            key={tag}
            className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: style.border, color: style.color }}
          >
            {tag}
          </span>
        ))}
      </div>
      {typeof data.sources === "string" && (
        <div className="text-[10px] text-[#9A9A9A] mt-1.5">{data.sources}</div>
      )}
    </div>
  )
}

/* ── Custom tag node (center hub) ── */
function TagNode({ data }: NodeProps) {
  return (
    <div
      className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 shadow-sm text-center"
      style={{ minWidth: 70 }}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div className="text-[10px] font-medium text-[#6B7280]">#{data.label as string}</div>
    </div>
  )
}

/* ── Center hub node ── */
function HubNode({ data }: NodeProps) {
  return (
    <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-2.5 shadow-lg">
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div className="text-xs font-bold text-white tracking-wide">{data.label as string}</div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  topic: TopicNode,
  tag: TagNode,
  hub: HubNode,
}

/* ── Build graph data ── */
function buildGraphData(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Center hub
  nodes.push({
    id: "hub",
    type: "hub",
    position: { x: 400, y: 20 },
    data: { label: "AI / ML" },
    draggable: true,
  })

  // Collect unique tags
  const tagSet = new Set<string>()
  for (const t of mockTopics) {
    for (const tag of t.tags) tagSet.add(tag)
  }
  const tags = Array.from(tagSet)

  // Layout: hub at top, tags in middle row, topics at bottom
  // Tags row
  const tagSpacing = 140
  const tagStartX = 400 - ((tags.length - 1) * tagSpacing) / 2
  tags.forEach((tag, i) => {
    nodes.push({
      id: `tag:${tag}`,
      type: "tag",
      position: { x: tagStartX + i * tagSpacing, y: 140 },
      data: { label: tag },
      draggable: true,
    })
    // Edge from hub to each tag
    edges.push({
      id: `hub-tag:${tag}`,
      source: "hub",
      target: `tag:${tag}`,
      style: { stroke: "#D4D4D4", strokeWidth: 1 },
      type: "smoothstep",
    })
  })

  // Topics row — spread evenly
  const topicSpacing = 260
  const topicStartX = 400 - ((mockTopics.length - 1) * topicSpacing) / 2
  mockTopics.forEach((topic, i) => {
    const style = CAT_STYLES[topic.category] || CAT_STYLES.TRENDING
    nodes.push({
      id: topic.slug,
      type: "topic",
      position: { x: topicStartX + i * topicSpacing, y: 300 + (i % 2 === 0 ? 0 : 60) },
      data: {
        label: topic.title,
        category: topic.category,
        tags: topic.tags,
        sources: topic.sources,
      },
      draggable: true,
    })

    // Edges from topic to its tags
    for (const tag of topic.tags) {
      edges.push({
        id: `${topic.slug}-tag:${tag}`,
        source: `tag:${tag}`,
        target: topic.slug,
        style: { stroke: style.border, strokeWidth: 1.5 },
        type: "smoothstep",
        animated: false,
      })
    }
  })

  return { nodes, edges }
}

/* ── Component ── */
interface GraphViewProps {
  onSelectTopic?: (slug: string, name: string) => void
}

export function GraphView({ onSelectTopic }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => buildGraphData(), [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "topic" && onSelectTopic) {
        const topic = mockTopics.find((t) => t.slug === node.id)
        if (topic) onSelectTopic(topic.slug, topic.title)
      }
    },
    [onSelectTopic]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
      >
        <Background color="#E5E5E5" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!border-[#E5E5E5] !shadow-sm [&_button]:!border-[#E5E5E5] [&_button]:!bg-white"
        />
      </ReactFlow>
    </div>
  )
}
