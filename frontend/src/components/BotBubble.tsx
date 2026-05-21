import type { ChatMessage } from '../types'
import './BotBubble.css'

interface BotBubbleProps {
  message: ChatMessage
  showAvatar: boolean
}

export function BotBubble({ message, showAvatar }: BotBubbleProps) {
  return (
    <article
      aria-label="Absolutely Wrong replied"
      className="bot-message message-enter"
      data-testid="bot-message"
    >
      {showAvatar ? (
        <img alt="" className="bot-message__avatar" height="32" src="/bot-avatar.svg" width="32" />
      ) : (
        <span aria-hidden="true" className="bot-message__avatar-spacer" />
      )}

      <div className="bot-message__bubble">
        <p>{message.content}</p>
      </div>
    </article>
  )
}
