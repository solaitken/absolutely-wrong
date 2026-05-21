import { useEffect, useMemo, useRef } from 'react'
import type { ChatMessage } from '../types'
import { BotBubble } from './BotBubble'
import { EmptyState } from './EmptyState'
import { TypingIndicator } from './TypingIndicator'
import { UserBubble } from './UserBubble'
import './MessageList.css'

interface MessageListProps {
  errorMessage: ChatMessage | null
  isInitialLoading: boolean
  isTyping: boolean
  messages: ChatMessage[]
}

export function MessageList({
  errorMessage,
  isInitialLoading,
  isTyping,
  messages,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)
  const prevLengthRef = useRef(0)

  const visibleMessages = useMemo(
    () => (errorMessage ? [...messages, errorMessage] : messages),
    [errorMessage, messages],
  )

  const showEmpty = !isInitialLoading && visibleMessages.length === 0 && !isTyping
  const showError = !isInitialLoading && errorMessage && messages.length === 0

  // Smooth auto-scroll when new messages arrive
  useEffect(() => {
    const prevLen = prevLengthRef.current
    prevLengthRef.current = visibleMessages.length

    if (visibleMessages.length > prevLen || isTyping) {
      // Use requestAnimationFrame to let the DOM paint before scrolling
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      })
    }
  }, [visibleMessages.length, isTyping])

  return (
    <section className="message-list" aria-label="Messages" tabIndex={-1}>
      {isInitialLoading ? (
        <div className="message-list__loading" aria-busy="true">
          <div className="message-list__loading-dot" />
          <div className="message-list__loading-dot" />
          <div className="message-list__loading-dot" />
        </div>
      ) : showError ? (
        <div className="message-list__error-state" role="alert">
          <BotBubble
            message={errorMessage!}
            showAvatar={true}
          />
        </div>
      ) : showEmpty ? (
        <EmptyState />
      ) : (
        <div className="message-list__stack">
          {visibleMessages.map((message, index) => {
            if (message.role === 'user') {
              return <UserBubble key={message.id} message={message} />
            }

            return (
              <BotBubble
                key={message.id}
                message={message}
                showAvatar={visibleMessages[index - 1]?.role !== 'bot'}
              />
            )
          })}

          {isTyping ? <TypingIndicator /> : null}
        </div>
      )}

      <div ref={endRef} />
    </section>
  )
}
