import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../providers/AuthProvider'
import { useAuth } from '../hooks/useAuth'

// Mock Supabase client
vi.mock('../../../lib/supabase', () => ({
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

// Test component that uses auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>
  }
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={signOut} data-testid="sign-out">Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should provide authentication context to children', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
    // Mock initial session as null (unauthenticated)
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    // Mock auth state change listener
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Wait for auth state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
    })

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
  })

  it('should handle authenticated user session', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
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

    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle sign out functionality', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
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

    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    supabase.auth.signOut.mockResolvedValue({
      error: null
    })

    const { user } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    // Click sign out
    const signOutButton = screen.getByTestId('sign-out')
    signOutButton.click()

    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
  })

  it('should handle authentication errors gracefully', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error' }
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
    })
  })

  it('should cleanup auth subscription on unmount', async () => {
    const { supabase } = await import('../../../lib/supabase')
    const mockUnsubscribe = vi.fn()
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })
})
