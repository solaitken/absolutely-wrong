import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatApiError, chatApi } from './api'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { InputArea } from './components/InputArea'
import { MessageList } from './components/MessageList'
import type { ChatMessage } from './types'

const MAX_MESSAGE_LENGTH = 2000

const ERROR_COPY = {
  tooLong: "That's too much wrong for one breath. Cut it down.",
  rateLimit: 'Slow down. Even I have limits.',
  server: 'Even I need a break. Try again.',
  network: "Your connection's wrong too. Try again.",
  initialOffline: "Even the internet is wrong today. Come back when it's cooperating.",
} as const

function createLocalMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

function copyForError(error: unknown): string {
  if (error instanceof ChatApiError) {
    if (error.status === 429) return ERROR_COPY.rateLimit
    if (error.kind === 'network') return ERROR_COPY.network
    return ERROR_COPY.server
  }

  return ERROR_COPY.server
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const sessionIdRef = useRef<string | undefined>(undefined)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<ChatMessage | null>(null)

  useEffect(() => {
    let isMounted = true

    chatApi
      .getChat()
      .then((response) => {
        if (!isMounted) return
        setMessages(response.messages)
        sessionIdRef.current = response.sessionId
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setErrorMessage(createLocalMessage('bot', copyForError(error)))
      })
      .finally(() => {
        if (isMounted) setIsInitialLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || isSending) return

    if (content.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(createLocalMessage('bot', ERROR_COPY.tooLong))
      return
    }

    setDraft('')
    setErrorMessage(null)
    setMessages((current) => [...current, createLocalMessage('user', content)])
    setIsSending(true)

    try {
      const response = await chatApi.sendMessage(content)
      setMessages((current) => [...current, response.message])
      sessionIdRef.current = response.sessionId
    } catch (error) {
      setErrorMessage(createLocalMessage('bot', copyForError(error)))
    } finally {
      setIsSending(false)
    }
  }, [draft, isSending])

  const clearConversation = useCallback(async () => {
    setErrorMessage(null)

    try {
      await chatApi.clearChat()
      setMessages([])
      sessionIdRef.current = undefined
    } catch (error) {
      setErrorMessage(createLocalMessage('bot', copyForError(error)))
    }
  }, [])

  return (
    <div className="app">
      <a className="skip-link" href="#chat-input">
        Skip to input
      </a>

      <AppHeader onClear={clearConversation} />

      <main className="chat-shell" aria-label="Conversation">
        <MessageList
          errorMessage={errorMessage}
          isInitialLoading={isInitialLoading}
          isTyping={isSending}
          messages={messages}
        />
      </main>

      <InputArea
        draft={draft}
        isSubmitting={isSending}
        onChange={setDraft}
        onSend={sendMessage}
      />
    </div>
  )
}

export default App
