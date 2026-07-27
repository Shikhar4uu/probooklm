// client/src/features/chat/ChatPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { chatApi, type Message, type Citation } from '../../lib/api'

export default function ChatPanel({ notebookId }: { notebookId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [openCite, setOpenCite] = useState<Citation | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Load history when the notebook changes
  useEffect(() => {
    chatApi.history(notebookId).then(setMessages)
    setOpenCite(null)
  }, [notebookId])

  // Auto-scroll to the newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    // optimistic user bubble
    const userMsg: Message = {
      id: 'temp-' + Date.now(), notebookId, role: 'user',
      content: q, createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const assistant = await chatApi.ask(notebookId, q)
      setMessages(prev => [...prev, assistant])
    } catch(err) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(), notebookId, role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.' + String(err),
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-msgs">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p className="chat-empty-title">Ask your first question</p>
            <p className="muted">Answers are grounded in your sources, with citations.</p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`bubble ${m.role}`}>
            <div className="bubble-body">
              {renderContent(m, setOpenCite)}
            </div>
            {m.role === 'assistant' && !!m.citations?.length && (
              <div className="bubble-cites">
                {m.citations.map(c => (
                  <button key={c.n} className="cite-pill" onClick={() => setOpenCite(c)}>
                    [{c.n}] {c.sourceTitle}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && <div className="bubble assistant"><div className="bubble-body typing">Thinking…</div></div>}
        <div ref={endRef} />
      </div>

      {/* Citation preview (Phase 5 will move this to the right pane) */}
      {openCite && (
        <div className="cite-preview">
          <div className="cite-preview-head">
            <strong>[{openCite.n}] {openCite.sourceTitle}</strong>
            <button onClick={() => setOpenCite(null)}>✕</button>
          </div>
          <p className="muted">{openCite.snippet}…</p>
        </div>
      )}

      <div className="composer">
        <input
          value={input}
          placeholder="Ask anything about your sources…"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
        />
        <button onClick={send} disabled={loading || !input.trim()}>➤</button>
      </div>
    </div>
  )
}

// Turn "[1]" markers in the answer into clickable chips
function renderContent(m: Message, onCite: (c: Citation) => void) {
  if (m.role !== 'assistant' || !m.citations?.length) return <span>{m.content}</span>
  const parts = m.content.split(/(\[\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      const n = Number(match[1])
      const cite = m.citations!.find(c => c.n === n)
      if (cite) {
        return (
          <button key={i} className="cite-chip" onClick={() => onCite(cite)}>{n}</button>
        )
      }
    }
    return <span key={i}>{part}</span>
  })
}