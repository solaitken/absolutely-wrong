import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InputArea } from './InputArea'

describe('InputArea', () => {
  it('disables the send button when the draft is empty', () => {
    render(<InputArea draft="" isSubmitting={false} onChange={vi.fn()} onSend={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })

  it('enables the send button when the draft has text', () => {
    render(<InputArea draft="Actually" isSubmitting={false} onChange={vi.fn()} onSend={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
  })
})
