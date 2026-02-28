import { useEffect, useRef, useState, useCallback } from "react"
import { mockTopics, type Topic } from "@/lib/mock-data"

/* ── Category colors ── */
const CAT_COLORS: Record<string, string> = {
  BREAKING: "#EF4444",
  "NEW PAPER": "#6366F1",
  TRENDING: "#F59E0B",
  REPO: "#22C55E",
  PODCAST: "#8B5CF6",
}

const CAT_BG: Record<string, string> = {
  BREAKING: "#FEF2F2",
  "NEW PAPER": "#EEF2FF",
  TRENDING: "#FFFBEB",
  REPO: "#F0FDF4",
  PODCAST: "#FAF5FF",
}

/* ── Types ── */
interface Node {
  id: string
  label: string
  category: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  tags: string[]
  relevance: number
  type: "topic"
}

interface TagNode {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  type: "tag"
  count: number
}

type AnyNode = Node | TagNode

interface Edge {
  source: string
  target: string
}

/* ── Build graph from mock data ── */
function buildGraph(topics: Topic[]) {
  const nodes: AnyNode[] = []
  const edges: Edge[] = []
  const tagCounts: Record<string, number> = {}

  // Count tags
  for (const t of topics) {
    for (const tag of t.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }

  // Create tag nodes
  const tagIds = Object.keys(tagCounts)
  const cx = 400
  const cy = 250

  tagIds.forEach((tag, i) => {
    const angle = (2 * Math.PI * i) / tagIds.length - Math.PI / 2
    const r = 100
    nodes.push({
      id: `tag:${tag}`,
      label: tag,
      x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 30,
      y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 30,
      vx: 0,
      vy: 0,
      radius: 18 + tagCounts[tag] * 4,
      type: "tag",
      count: tagCounts[tag],
    })
  })

  // Create topic nodes in outer ring
  topics.forEach((topic, i) => {
    const angle = (2 * Math.PI * i) / topics.length - Math.PI / 2
    const r = 220
    nodes.push({
      id: topic.slug,
      label: topic.title.length > 30 ? topic.title.slice(0, 28) + "…" : topic.title,
      category: topic.category,
      x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 20,
      y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      radius: 28 + topic.tags.length * 3,
      tags: topic.tags,
      relevance: 0.8,
      type: "topic",
    })

    // Edges from topic to its tags
    for (const tag of topic.tags) {
      edges.push({ source: topic.slug, target: `tag:${tag}` })
    }
  })

  return { nodes, edges }
}

/* ── Simple force simulation ── */
function simulate(nodes: AnyNode[], edges: Edge[], width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Gravity toward center
  for (const n of nodes) {
    const dx = cx - n.x
    const dy = cy - n.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const force = 0.003
    n.vx += (dx / dist) * force * dist
    n.vy += (dy / dist) * force * dist
  }

  // Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const minDist = a.radius + b.radius + 30
      if (dist < minDist * 2) {
        const force = 1.5 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }
  }

  // Spring force for edges
  for (const edge of edges) {
    const a = nodeMap.get(edge.source)
    const b = nodeMap.get(edge.target)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const targetDist = 140
    const force = (dist - targetDist) * 0.005
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    a.vx += fx
    a.vy += fy
    b.vx -= fx
    b.vy -= fy
  }

  // Apply velocity with damping
  for (const n of nodes) {
    n.vx *= 0.85
    n.vy *= 0.85
    n.x += n.vx
    n.y += n.vy
    // Keep in bounds
    n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x))
    n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y))
  }
}

/* ── Component ── */
interface GraphViewProps {
  onSelectTopic?: (slug: string, name: string) => void
}

export function GraphView({ onSelectTopic }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [hovered, setHovered] = useState<string | null>(null)
  const nodesRef = useRef<AnyNode[]>([])
  const edgesRef = useRef<Edge[]>([])
  const frameRef = useRef<number>(0)
  const [, setTick] = useState(0)
  const tickRef = useRef(0)

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width, height: e.contentRect.height })
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Init graph
  useEffect(() => {
    const { nodes, edges } = buildGraph(mockTopics)
    // Rescale positions to dimensions
    for (const n of nodes) {
      n.x = (n.x / 800) * dimensions.width
      n.y = (n.y / 500) * dimensions.height
    }
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [dimensions.width, dimensions.height])

  // Animation loop
  useEffect(() => {
    let running = true
    function tick() {
      if (!running) return
      simulate(nodesRef.current, edgesRef.current, dimensions.width, dimensions.height)
      tickRef.current++
      setTick(tickRef.current)
      // Slow down after stabilizing
      if (tickRef.current < 200) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        // Run at lower rate
        setTimeout(() => {
          frameRef.current = requestAnimationFrame(tick)
        }, 100)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [dimensions.width, dimensions.height])

  const handleClick = useCallback(
    (node: AnyNode) => {
      if (node.type === "topic" && onSelectTopic) {
        const topic = mockTopics.find((t) => t.slug === node.id)
        if (topic) onSelectTopic(topic.slug, topic.title)
      }
    },
    [onSelectTopic]
  )

  const nodes = nodesRef.current
  const edges = edgesRef.current
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Find connected nodes for hover highlight
  const connectedToHovered = new Set<string>()
  if (hovered) {
    connectedToHovered.add(hovered)
    for (const e of edges) {
      if (e.source === hovered) connectedToHovered.add(e.target)
      if (e.target === hovered) connectedToHovered.add(e.source)
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full relative overflow-hidden bg-[#FAFAFA]">
      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-10">
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-medium text-[#6B6B6B] uppercase tracking-wide">{cat}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4D4D4]" />
          <span className="text-[10px] font-medium text-[#6B6B6B] uppercase tracking-wide">TAG</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="select-none"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const s = nodeMap.get(edge.source)
          const t = nodeMap.get(edge.target)
          if (!s || !t) return null
          const isHighlighted = hovered && (connectedToHovered.has(edge.source) && connectedToHovered.has(edge.target))
          const dimmed = hovered && !isHighlighted
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={isHighlighted ? "#1A1A1A" : "#E5E5E5"}
              strokeWidth={isHighlighted ? 1.5 : 1}
              opacity={dimmed ? 0.15 : isHighlighted ? 0.8 : 0.4}
              style={{ transition: "opacity 200ms, stroke 200ms" }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHovered = hovered === node.id
          const isConnected = connectedToHovered.has(node.id)
          const dimmed = hovered && !isConnected
          const color =
            node.type === "tag" ? "#9CA3AF" : CAT_COLORS[node.category] || "#6B7280"
          const bgColor =
            node.type === "tag" ? "#F3F4F6" : CAT_BG[node.category] || "#F5F5F5"

          return (
            <g
              key={node.id}
              style={{
                cursor: node.type === "topic" ? "pointer" : "default",
                opacity: dimmed ? 0.25 : 1,
                transition: "opacity 200ms",
              }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(node)}
            >
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? node.radius + 3 : node.radius}
                fill={bgColor}
                stroke={color}
                strokeWidth={isHovered ? 2.5 : node.type === "topic" ? 2 : 1.5}
                filter={isHovered ? "url(#glow)" : undefined}
                style={{ transition: "r 150ms, stroke-width 150ms" }}
              />

              {/* Label */}
              {node.type === "tag" ? (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#6B7280"
                  fontSize={10}
                  fontFamily="Inter, system-ui"
                  fontWeight={500}
                >
                  #{node.label}
                </text>
              ) : (
                <>
                  {/* Category badge */}
                  <text
                    x={node.x}
                    y={node.y - 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={8}
                    fontFamily="Inter, system-ui"
                    fontWeight={700}
                    letterSpacing="0.5"
                  >
                    {node.category}
                  </text>
                  {/* Title */}
                  <text
                    x={node.x}
                    y={node.y + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#1A1A1A"
                    fontSize={9}
                    fontFamily="Inter, system-ui"
                    fontWeight={500}
                  >
                    {node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-[#9A9A9A] select-none">
        Click a topic node to preview &middot; Hover to highlight connections
      </div>
    </div>
  )
}
