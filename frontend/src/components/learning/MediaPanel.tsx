import { Headphones, Video, Image, Music, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MediaPanelProps {
  type: 'audio' | 'video' | 'diagram' | 'jingle'
  slug: string
  generated: boolean
}

const config = {
  audio: {
    icon: Headphones,
    label: 'Audio Briefing',
    description: 'A voice-narrated summary of this topic, perfect for your commute.',
    generateLabel: 'Generate Audio Briefing',
    file: 'audio.mp3',
  },
  video: {
    icon: Video,
    label: 'Video Explainer',
    description: 'A short video explaining the key concepts visually.',
    generateLabel: 'Generate Video Explainer',
    file: 'video.mp4',
  },
  diagram: {
    icon: Image,
    label: 'Diagrams',
    description: 'AI-generated explanatory diagrams for complex concepts.',
    generateLabel: 'Generate Diagram',
    file: 'diagram_1.png',
  },
  jingle: {
    icon: Music,
    label: 'Mnemonic Jingle',
    description: 'A catchy tune to help you remember the key facts.',
    generateLabel: 'Generate Jingle',
    file: 'jingle.mp3',
  },
}

export function MediaPanel({ type, slug, generated }: MediaPanelProps) {
  const { icon: Icon, label, description, generateLabel, file } = config[type]
  const mediaUrl = `/api/topics/${slug}/file/${file}`

  if (generated) {
    return (
      <div className="p-5">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon size={16} className="text-[var(--color-accent)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
            <Badge variant="new" className="ml-auto text-[10px]">Generated</Badge>
          </div>
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
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center mb-4 ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--bg-surface)]">
        <Icon size={24} className="text-[var(--color-accent)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">{label}</h3>
      <p className="text-xs text-[var(--color-text-muted)] max-w-xs mb-4">{description}</p>
      <Button variant="accent" size="sm" className="gap-1.5">
        <Sparkles size={12} />
        {generateLabel}
      </Button>
      <p className="text-xs text-[var(--color-text-subtle)] mt-3">
        Or ask Cortex in the chat to generate this for you.
      </p>
    </div>
  )
}
