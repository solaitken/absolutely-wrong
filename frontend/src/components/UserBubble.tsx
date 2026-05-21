import type { ChatMessage } from '../types'
import './UserBubble.css'

interface UserBubbleProps {
  message: ChatMessage
}

export function UserBubble({ message }: UserBubbleProps) {
  return (
    <article aria-label="You wrote" className="user-message message-enter" data-testid="user-message">
      <div className="user-message__bubble">
        <p>{message.content}</p>
      </div>
    </article>
  )
}
