import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has correct title', () => {
    render(<App />)
    // Add more specific tests based on your App component
    expect(document.title).toBeTruthy()
  })
})
