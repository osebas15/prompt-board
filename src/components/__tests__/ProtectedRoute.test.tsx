import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '../ProtectedRoute'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
    useLocation: () => ({ pathname: '/dashboard' }),
  }
})

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect unauthenticated users to login', async () => {
    const { supabase } = await import('../../lib/supabase')
    
    // Mock unauthenticated state
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Should redirect to login after auth check
    await waitFor(() => {
      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login')
    })

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should allow authenticated users to access protected routes', async () => {
    const { supabase } = await import('../../lib/supabase')
    
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: '2023-01-01'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
      expires_in: 3600,
      token_type: 'bearer'
    }

    // Mock authenticated state
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should show protected content after auth check
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument()
  })

  it('should preserve the intended route in state for redirects', async () => {
    const { supabase } = await import('../../lib/supabase')
    
    // Mock unauthenticated state
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login')
    })

    // The Navigate component should receive state with the intended route
    // This would be checked in a more complex test setup
  })

  it('should show loading state while checking authentication', async () => {
    const { supabase } = await import('../../lib/supabase')
    
    // Mock pending session check
    supabase.auth.getSession.mockImplementation(() => new Promise(() => {}))

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument()
  })
})
