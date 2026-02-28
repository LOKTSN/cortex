import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Copy, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  title: string
  initialMessage: string
  context?: string
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
          messages: [...messages, userMsg],
          context,
        }),
      })
      if (!res.ok) throw new Error('Chat request failed')
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
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
                  <div className="bg-[#1B1B1B] text-white rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
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
