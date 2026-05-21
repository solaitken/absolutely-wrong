import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import './app.css'

interface Message {
  id: number
  role: 'user' | 'bot'
  content: string
  createdAt: string
}

const API_BASE = '/api'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`${API_BASE}/chat`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [])

  const handleSubmit = async () => {
    const message = input.trim()
    if (!message || message.length > 2000 || isLoading) return
    setInput('')
    setError(null)
    const userMsg: Message = { id: Date.now(), role: 'user', content: message, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message }) })
      const data = await res.json()
      if (res.status === 429) { setError('Slow down. Even I have limits.'); return }
      if (!res.ok || data.error) { setError(data.error || 'Even I need a break. Try again.'); return }
      if (data.message) setMessages((prev) => [...prev, data.message])
    } catch { setError('Even I need a break. Try again.') }
    finally {
      setIsLoading(false)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  const handleClear = async () => {
    try { await fetch(`${API_BASE}/chat`, { method: 'DELETE', credentials: 'include' }) } catch {}
    setMessages([])
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <img src="/bot-avatar.svg" alt="Absolutely Wrong" className="bot-avatar" />
          <div className="header-text">
            <h1 className="header-title">Absolutely Wrong</h1>
            <p className="header-subtitle">You're never right. Ever.</p>
          </div>
        </div>
        <button className="btn-clear" onClick={handleClear} aria-label="Clear chat">Clear</button>
      </header>
      <main className="chat-area">
        {messages.length === 0 && !isLoading && (
          <div className="empty-state"><p>Go ahead. Try to be right about something.</p></div>
        )}
        <div className="message-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.role}`}>
              {msg.role === 'bot' && <img src="/bot-avatar.svg" alt="" className="msg-avatar" />}
              <div className={`bubble bubble-${msg.role}`}><p>{msg.content}</p></div>
            </div>
          ))}
          {isLoading && (
            <div className="message message-bot">
              <img src="/bot-avatar.svg" alt="" className="msg-avatar" />
              <div className="bubble bubble-bot">
                <div className="typing-indicator"><span className="dot" /><span className="dot" /><span className="dot" /></div>
              </div>
            </div>
          )}
          {error && (
            <div className="message message-bot">
              <img src="/bot-avatar.svg" alt="" className="msg-avatar" />
              <div className="bubble bubble-bot bubble-error"><p>{error}</p></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="input-area">
        <textarea ref={textareaRef} className="input-field" value={input} onChange={(e) => { setInput(e.target.value); adjustTextarea() }} onKeyDown={handleKeyDown} placeholder="Say something..." rows={1} maxLength={2000} disabled={isLoading} aria-label="Message input" />
        <button className="btn-send" onClick={handleSubmit} disabled={!input.trim() || isLoading} aria-label="Send message">↑</button>
      </footer>
    </div>
  )
}

export default App
