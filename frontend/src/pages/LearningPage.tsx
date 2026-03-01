import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Headphones, Image, Loader2, Play, Pause,
  Calendar, BookX, StickyNote, Sparkles, FileText, PenLine,
} from 'lucide-react'
import { useLearningStore } from '@/stores/learning'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatPanel } from '@/components/ChatPanel'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const studioItems = [
  { type: 'audio' as const, icon: Headphones, label: 'Audio Overview' },
  { type: 'diagram' as const, icon: Image, label: 'Diagram' },
]

export function LearningPage() {
  const { slug } = useParams<{ slug: string }>()
  const {
    topic, loading, fetchTopic, updateNotes,
    generatingMedia, generateDiagram, generateAudio,
    diagramUrl, audioUrl,
  } = useLearningStore()
  const [activeStudio, setActiveStudio] = useState<string | null>(null)

  useEffect(() => {
    if (slug) fetchTopic(slug)
  }, [slug, fetchTopic])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 animate-fade-in">
        <Loader2 className="animate-spin text-[var(--color-text-subtle)]" size={20} />
        <p className="text-sm text-[var(--color-text-muted)]">Loading topic...</p>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
        <BookX size={32} className="text-[var(--color-text-ghost)]" />
        <p className="text-sm text-[var(--color-text-muted)]">Topic not found</p>
        <Button variant="ghost" asChild className="mt-2">
          <Link to="/">Back</Link>
        </Button>
      </div>
    )
  }

  // Build rich context for the agent — it should know what topic folder it's in
  const agentContext = [
    `Topic: ${topic.title}`,
    `Category: ${topic.category}`,
    `Date: ${topic.date}`,
    topic.tags.length > 0 ? `Tags: ${topic.tags.join(', ')}` : '',
    topic.description ? `Description: ${topic.description}` : '',
    `\nSynthesis:\n${topic.synthesis}`,
    topic.notes ? `\nUser Notes:\n${topic.notes}` : '',
  ].filter(Boolean).join('\n')

  const handleGenerate = async (type: string) => {
    if (type === 'diagram') {
      await generateDiagram()
    } else if (type === 'audio') {
      await generateAudio()
    }
  }

  return (
    <div className="flex h-[calc(100dvh-57px)] animate-fade-in overflow-hidden">
      {/* ── Left: Sources panel ── */}
      <div className="w-72 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/">
                <ArrowLeft size={14} />
              </Link>
            </Button>
            <span className="text-sm font-medium text-[var(--color-text)]">Sources</span>
          </div>
          <FileText size={14} className="text-[var(--color-text-subtle)]" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Topic info card */}
            <div className="border border-[var(--color-border)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={topic.category as 'breaking' | 'paper' | 'trending' | 'repo' | 'podcast'}>
                  {topic.category}
                </Badge>
                <span className="text-xs text-[var(--color-text-subtle)] flex items-center gap-1 ml-auto">
                  <Calendar size={10} />
                  {topic.date}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-text)] leading-snug">{topic.title}</h2>
              {topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {topic.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-[var(--color-text-subtle)] bg-[var(--bg-raised)] px-1.5 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Synthesis content */}
            <article className="prose-cortex">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.synthesis}</ReactMarkdown>
            </article>

            {/* Notes */}
            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="text-xs font-medium text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                <StickyNote size={11} />
                Your Notes
              </h3>
              <textarea
                value={topic.notes}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="w-full min-h-[80px] p-3 text-sm bg-[var(--bg-ingrained)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ── Center: Chat ── */}
      <div className="flex-1 min-w-0 bg-white border-r border-[var(--color-border)] flex flex-col">
        <ChatPanel
          title="Chat"
          initialMessage={`I'm ready to help you explore "${topic.title}". I have the full synthesis and can search for more information, explain concepts, or generate diagrams. Ask me anything!`}
          context={agentContext}
        />
      </div>

      {/* ── Right: Studio panel ── */}
      <div className="w-80 shrink-0 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text)]">Studio</span>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {studioItems.map(({ type, icon: Icon, label }) => {
              const isGenerated = type === 'audio' ? !!audioUrl : type === 'diagram' ? !!diagramUrl : false
              const isGenerating = generatingMedia[type] || false
              return (
                <button
                  key={type}
                  onClick={() => setActiveStudio(activeStudio === type ? null : type)}
                  className={`border border-[var(--color-border)] rounded-xl p-3 text-left transition-colors hover:bg-[var(--bg-card-hover)] ${
                    activeStudio === type ? 'bg-[var(--bg-card-hover)] border-[var(--color-border-strong)]' : ''
                  }`}
                >
                  {isGenerating ? (
                    <Loader2 size={18} className="mb-2 animate-spin text-[var(--color-accent)]" />
                  ) : (
                    <Icon size={18} className={`mb-2 ${isGenerated ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-subtle)]'}`} />
                  )}
                  <span className="text-xs font-medium text-[var(--color-text)] block">{label}</span>
                  {isGenerating && (
                    <span className="text-[10px] text-[var(--color-accent)] mt-0.5 block">Generating...</span>
                  )}
                  {isGenerated && !isGenerating && (
                    <span className="text-[10px] text-[var(--color-accent)] mt-0.5 block">Ready</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active studio content */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
          {activeStudio ? (
            <StudioContent
              type={activeStudio as 'audio' | 'diagram'}
              slug={topic.slug}
              diagramUrl={diagramUrl}
              audioUrl={audioUrl}
              isGenerating={generatingMedia[activeStudio] || false}
              onGenerate={() => handleGenerate(activeStudio)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Sparkles size={24} className="mx-auto mb-3 text-[var(--color-text-ghost)]" />
                <p className="text-sm text-[var(--color-text-muted)]">Studio output will be saved here.</p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-1 max-w-[200px] mx-auto">
                  Click to add Audio Overview, Diagrams, and more!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Add note button */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <Button variant="default" size="sm" className="w-full gap-2">
            <PenLine size={14} />
            Add note
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Custom audio player using Web Audio API — bypasses <audio> element issues */
function WebAudioPlayer({ url }: { url: string }) {
  const ctxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef(0)
  const offsetRef = useRef(0)

  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Decode audio on mount
  useEffect(() => {
    let cancelled = false
    const ctx = new AudioContext()
    ctxRef.current = ctx

    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => {
        if (cancelled) return
        bufferRef.current = decoded
        setDuration(decoded.duration)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    return () => {
      cancelled = true
      sourceRef.current?.stop()
      ctx.close()
    }
  }, [url])

  // Update time while playing
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const ctx = ctxRef.current
      if (ctx) setCurrentTime(offsetRef.current + ctx.currentTime - startTimeRef.current)
    }, 250)
    return () => clearInterval(id)
  }, [playing])

  const play = useCallback(() => {
    const ctx = ctxRef.current
    const buffer = bufferRef.current
    if (!ctx || !buffer) return

    if (ctx.state === 'suspended') ctx.resume()

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.onended = () => {
      setPlaying(false)
      offsetRef.current = 0
      setCurrentTime(0)
    }

    startTimeRef.current = ctx.currentTime
    source.start(0, offsetRef.current)
    sourceRef.current = source
    setPlaying(true)
  }, [])

  const pause = useCallback(() => {
    const ctx = ctxRef.current
    if (ctx && sourceRef.current) {
      offsetRef.current += ctx.currentTime - startTimeRef.current
      sourceRef.current.stop()
      sourceRef.current = null
      setPlaying(false)
    }
  }, [])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
        <Loader2 size={14} className="animate-spin" /> Loading audio...
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={playing ? pause : play}
        className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-[var(--bg-raised)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--color-text-subtle)]">{fmt(currentTime)}</span>
          <span className="text-[10px] text-[var(--color-text-subtle)]">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}

function StudioContent({
  type,
  slug,
  diagramUrl,
  audioUrl,
  isGenerating,
  onGenerate,
}: {
  type: 'audio' | 'diagram'
  slug: string
  diagramUrl: string | null
  audioUrl: string | null
  isGenerating: boolean
  onGenerate: () => void
}) {
  const labels = { audio: 'Audio Overview', diagram: 'Diagram' }
  const label = labels[type]
  const mediaReady = type === 'audio' ? !!audioUrl : type === 'diagram' ? !!diagramUrl : false

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
        <Loader2 size={24} className="animate-spin text-[var(--color-accent)] mb-3" />
        <p className="text-sm text-[var(--color-text-muted)]">Generating {label.toLowerCase()}...</p>
        <p className="text-xs text-[var(--color-text-subtle)] mt-1">This may take a moment</p>
      </div>
    )
  }

  if (mediaReady) {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">{label}</p>
        {type === 'audio' && audioUrl && <WebAudioPlayer url={audioUrl} />}
        {type === 'diagram' && diagramUrl && (
          <img src={diagramUrl} alt="AI-generated diagram" className="w-full rounded-lg border border-[var(--color-border)]" />
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
      <p className="text-sm text-[var(--color-text-muted)] mb-3">Generate {label.toLowerCase()}?</p>
      <Button variant="default" size="sm" className="gap-1.5" onClick={onGenerate}>
        <Sparkles size={12} />
        Generate
      </Button>
      <p className="text-xs text-[var(--color-text-subtle)] mt-2">
        Or ask in chat to generate this.
      </p>
    </div>
  )
}
