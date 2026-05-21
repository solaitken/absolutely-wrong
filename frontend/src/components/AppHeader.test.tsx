import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('renders the product title and subline', () => {
    render(<AppHeader onClear={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Absolutely Wrong' })).toBeInTheDocument()
    expect(screen.getByText('Always wrong, always sure.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toHaveAttribute(
      'title',
      'Erase the evidence',
    )
  })
})
