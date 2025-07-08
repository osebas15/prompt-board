import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Test for actual elements that exist in the App component
    expect(screen.getByText('Vite + React')).toBeInTheDocument()
    expect(screen.getByText(/count is/)).toBeInTheDocument()
  })

  it('renders the logos', () => {
    render(<App />)
    expect(screen.getByAltText('Vite logo')).toBeInTheDocument()
    expect(screen.getByAltText('React logo')).toBeInTheDocument()
  })

  it('renders the counter button', () => {
    render(<App />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('count is 0')
  })
})
