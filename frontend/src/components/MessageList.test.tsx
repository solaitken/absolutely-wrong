import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MessageList } from './MessageList'
import type { ChatMessage } from '../types'

const messages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'The moon is made of cheese.',
    createdAt: '2026-05-21T00:00:00.000Z',
  },
  {
    id: 'm2',
    role: 'bot',
    content: 'Confident, but still wrong.',
    createdAt: '2026-05-21T00:00:01.000Z',
  },
]

describe('MessageList', () => {
  it('renders user and bot messages', () => {
    render(
      <MessageList
        errorMessage={null}
        isInitialLoading={false}
        isTyping={false}
        messages={messages}
      />,
    )

    expect(screen.getByText('The moon is made of cheese.')).toBeInTheDocument()
    expect(screen.getByText('Confident, but still wrong.')).toBeInTheDocument()
    expect(screen.getByTestId('user-message')).toHaveAccessibleName('You wrote')
    expect(screen.getByTestId('bot-message')).toHaveAccessibleName('Absolutely Wrong replied')
  })

  it('renders the empty taunt after initial loading', () => {
    render(
      <MessageList errorMessage={null} isInitialLoading={false} isTyping={false} messages={[]} />,
    )

    expect(screen.getByText('Go ahead. Try to be right about something.')).toBeInTheDocument()
  })
})
