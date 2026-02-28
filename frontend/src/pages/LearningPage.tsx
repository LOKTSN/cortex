import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Headphones, Video, Image, Music, Loader2,
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
  { type: 'video' as const, icon: Video, label: 'Video Explainer' },
  { type: 'diagram' as const, icon: Image, label: 'Mind Map' },
  { type: 'jingle' as const, icon: Music, label: 'Jingle' },
]

export function LearningPage() {
  const { slug } = useParams<{ slug: string }>()
  const { topic, loading, fetchTopic, updateNotes } = useLearningStore()
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
          <Link to="/pulse">Back to Pulse</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* ── Left: Sources panel ── */}
      <div className="w-72 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/pulse">
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
          initialMessage={`I'm ready to help you explore "${topic.title}". Ask me anything, or I can generate audio briefings, diagrams, and more.`}
          context={JSON.stringify({ title: topic.title, slug: topic.slug, tags: topic.tags })}
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
              const isGenerated =
                type === 'audio' ? topic.generated.audio :
                type === 'video' ? topic.generated.video :
                type === 'diagram' ? topic.generated.diagrams.length > 0 :
                topic.generated.jingle
              return (
                <button
                  key={type}
                  onClick={() => setActiveStudio(activeStudio === type ? null : type)}
                  className={`border border-[var(--color-border)] rounded-xl p-3 text-left transition-colors hover:bg-[var(--bg-card-hover)] ${
                    activeStudio === type ? 'bg-[var(--bg-card-hover)] border-[var(--color-border-strong)]' : ''
                  }`}
                >
                  <Icon size={18} className={`mb-2 ${isGenerated ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-subtle)]'}`} />
                  <span className="text-xs font-medium text-[var(--color-text)] block">{label}</span>
                  {isGenerated && (
                    <span className="text-[10px] text-[var(--color-accent)] mt-0.5 block">Ready</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active studio content or empty state */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
          {activeStudio ? (
            <StudioContent type={activeStudio as 'audio' | 'video' | 'diagram' | 'jingle'} slug={topic.slug} topic={topic} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Sparkles size={24} className="mx-auto mb-3 text-[var(--color-text-ghost)]" />
                <p className="text-sm text-[var(--color-text-muted)]">Studio output will be saved here.</p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-1 max-w-[200px] mx-auto">
                  Click to add Audio Overview, Video Explainer, and more!
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

function StudioContent({ type, slug, topic }: { type: 'audio' | 'video' | 'diagram' | 'jingle'; slug: string; topic: { generated: { audio: boolean; video: boolean; diagrams: string[]; jingle: boolean } } }) {
  const config = {
    audio: { file: 'audio.mp3', label: 'Audio Overview' },
    video: { file: 'video.mp4', label: 'Video Explainer' },
    diagram: { file: 'diagram_1.png', label: 'Mind Map' },
    jingle: { file: 'jingle.mp3', label: 'Jingle' },
  }
  const { file, label } = config[type]
  const mediaUrl = `/api/topics/${slug}/file/${file}`
  const isGenerated =
    type === 'audio' ? topic.generated.audio :
    type === 'video' ? topic.generated.video :
    type === 'diagram' ? topic.generated.diagrams.length > 0 :
    topic.generated.jingle

  if (isGenerated) {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">{label}</p>
        {(type === 'audio' || type === 'jingle') && (
          <audio controls className="w-full" src={mediaUrl}>
            Your browser does not support audio playback.
          </audio>
        )}
        {type === 'video' && (
          <video controls className="w-full rounded-lg" src={mediaUrl}>
            Your browser does not support video playback.
          </video>
        )}
        {type === 'diagram' && (
          <img src={mediaUrl} alt="AI-generated diagram" className="w-full rounded-lg border border-[var(--color-border)]" />
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
      <p className="text-sm text-[var(--color-text-muted)] mb-3">Generate {label.toLowerCase()}?</p>
      <Button variant="default" size="sm" className="gap-1.5">
        <Sparkles size={12} />
        Generate
      </Button>
      <p className="text-xs text-[var(--color-text-subtle)] mt-2">
        Or ask in chat to generate this.
      </p>
    </div>
  )
}
