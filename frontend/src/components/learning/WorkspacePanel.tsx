import { StickyNote } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface WorkspacePanelProps {
  synthesis: string
  notes: string
  onNotesChange: (content: string) => void
}

export function WorkspacePanel({ synthesis, notes, onNotesChange }: WorkspacePanelProps) {
  return (
    <div className="space-y-6">
      {/* Synthesis content */}
      <article className="prose-cortex">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
      </article>

      {/* Notes section */}
      <div className="border-t border-[var(--color-border-subtle)] pt-4">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <StickyNote size={12} />
          Your Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add your notes here... The AI can also save insights from chat."
          className="w-full min-h-[100px] p-3 text-sm bg-[var(--bg-ingrained)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
        />
      </div>
    </div>
  )
}
