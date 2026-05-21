import './TypingIndicator.css'

export function TypingIndicator() {
  return (
    <div
      aria-label="Bot is composing a reply"
      aria-live="polite"
      className="typing-indicator message-enter"
      role="status"
    >
      <img alt="" className="typing-indicator__avatar" height="32" src="/bot-avatar.svg" width="32" />
      <div className="typing-indicator__bubble" aria-hidden="true">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
    </div>
  )
}
