import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('smoke', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('renders with jsdom and jest-dom matchers', () => {
    render(<p>hello</p>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
