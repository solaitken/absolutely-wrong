import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
} from 'react'
import './InputArea.css'

interface InputAreaProps {
  draft: string
  isSubmitting: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export function InputArea({ draft, isSubmitting, onChange, onSend }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const canSend = draft.trim().length > 0 && !isSubmitting

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 104)}px`
  }, [draft])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return

    onSend()
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) onSend()
      return
    }

    if (event.key === 'Escape') {
      onChange('')
    }
  }

  function keepTextareaFocus(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  return (
    <form aria-label="Send a message" className="input-area" onSubmit={handleSubmit}>
      <textarea
        aria-label="Message input"
        className="input-area__field"
        id="chat-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Say something wrong."
        readOnly={isSubmitting}
        ref={textareaRef}
        rows={1}
        value={draft}
      />

      <button
        aria-label="Send message"
        className="input-area__send"
        disabled={!canSend}
        onMouseDown={keepTextareaFocus}
        type="submit"
      >
        <span aria-hidden="true" className="input-area__send-icon">
          ▲
        </span>
        <span className="input-area__send-label">Send</span>
      </button>
    </form>
  )
}
