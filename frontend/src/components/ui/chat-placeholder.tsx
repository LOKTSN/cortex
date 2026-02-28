import React, { useState } from "react"
import { Send } from "lucide-react"

interface ChatPlaceholderProps {
  title: string
  initialMessage: string
}

export function ChatPlaceholder({ title, initialMessage }: ChatPlaceholderProps) {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: initialMessage },
  ])
  const [input, setInput] = useState("")

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "bot", text: "I'm a demo placeholder — connect a CopilotKit runtime to enable real AI chat." },
    ])
    setInput("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2 text-sm font-semibold">{title}</div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "bot"
                ? "bg-bg-muted text-text"
                : "ml-auto bg-accent text-white"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent p-2 text-white hover:bg-accent-hover cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
