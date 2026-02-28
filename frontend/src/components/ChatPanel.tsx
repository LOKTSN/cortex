import { useState, useRef, useEffect } from 'react'
import { Send, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Search, Globe, Image, FileText, Terminal, ChevronDown, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  tools_used?: ToolCall[]
}

interface ChatPanelProps {
  title: string
  initialMessage: string
  context?: string
}

const TOOL_META: Record<string, { icon: typeof Search; label: string; color: string }> = {
  exa_search: { icon: Search, label: 'Searched', color: 'text-blue-500' },
  web_fetch: { icon: Globe, label: 'Read page', color: 'text-green-500' },
  generate_image: { icon: Image, label: 'Generated image', color: 'text-purple-500' },
  read_file: { icon: FileText, label: 'Read file', color: 'text-amber-500' },
  write_file: { icon: FileText, label: 'Wrote file', color: 'text-amber-500' },
  edit_file: { icon: FileText, label: 'Edited file', color: 'text-amber-500' },
  list_files: { icon: FileText, label: 'Listed files', color: 'text-amber-500' },
  search_files: { icon: Search, label: 'Searched files', color: 'text-amber-500' },
  execute_command: { icon: Terminal, label: 'Ran command', color: 'text-red-500' },
}

function ToolCallChip({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TOOL_META[tool.name] || { icon: Terminal, label: tool.name, color: 'text-gray-500' }
  const Icon = meta.icon
  const Chevron = expanded ? ChevronDown : ChevronRight

  // Build a short summary from args
  const summary = tool.args.query as string
    || tool.args.url as string
    || tool.args.prompt as string
    || tool.args.path as string
    || tool.args.file_path as string
    || tool.args.command as string
    || ''

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 w-full text-left hover:bg-black/5 transition-colors cursor-pointer"
      >
        <Icon size={12} className={meta.color} />
        <span className="font-medium text-[var(--color-text-subtle)]">{meta.label}</span>
        {summary && (
          <span className="text-[var(--color-text-ghost)] truncate flex-1">
            {summary.length > 50 ? summary.slice(0, 50) + '…' : summary}
          </span>
        )}
        <Chevron size={10} className="text-[var(--color-text-ghost)] shrink-0" />
      </button>
      {expanded && (
        <div className="px-2.5 py-2 border-t border-[var(--color-border)] bg-black/[0.02]">
          <pre className="text-[10px] text-[var(--color-text-subtle)] whitespace-pre-wrap break-all">
            {JSON.stringify(tool.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ title, initialMessage, context }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      })
      if (!res.ok) throw new Error('Chat request failed')
      const data = await res.json()
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.reply,
        tools_used: data.tools_used || [],
      }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm not connected to the backend yet. Once the server is running, I'll be able to help you explore this topic.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-[var(--color-text)]">{title}</span>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal size={14} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-[var(--color-accent-dim)] border border-[var(--color-border-accent)] text-[var(--color-text)] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Tool calls */}
                  {msg.tools_used && msg.tools_used.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.tools_used.map((tool, j) => (
                        <ToolCallChip key={j} tool={tool} />
                      ))}
                    </div>
                  )}
                  {/* Response text */}
                  <div className="text-sm text-[var(--color-text)] leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none [&_hr]:my-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1 [&_ul]:my-1 [&_a]:text-[var(--color-accent)] [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  {i > 0 && (
                    <div className="flex items-center gap-1 pt-1">
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[var(--color-text-subtle)]">
                        <Copy size={12} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[var(--color-text-subtle)]">
                        <ThumbsUp size={12} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[var(--color-text-subtle)]">
                        <ThumbsDown size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-1.5 py-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-subtle)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-subtle)] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-subtle)] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input — pill-shaped like NotebookLM */}
      <div className="p-3 border-t border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2 border border-[var(--color-border)] rounded-full px-4 py-1.5 focus-within:border-[var(--color-accent)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Start typing..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)]"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-full shrink-0"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
