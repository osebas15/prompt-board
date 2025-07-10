import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, render } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from '../providers/AuthProvider'
import React from 'react'

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    // Test that the hook throws when used outside provider
    // Since React error boundaries catch this, we'll check console.error
    const TestComponent = () => {
      try {
        useAuth()
      } catch (error) {
        // React will log this error
      }
      return null
    }

    expect(() => render(<TestComponent />)).toThrowError()

    console.error = originalError
  })

  it('should return authentication state and methods', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Should provide required properties and methods
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('session')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('signOut')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signUp')
  })

  it('should handle sign in method', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { 
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' }
      },
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await result.current.signIn('test@example.com', 'password123')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should handle sign up method', async () => {
    const { supabase } = await import('../../../lib/supabase')
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    supabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: '123', email: 'test@example.com' },
        session: null
      },
      error: null
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await result.current.signUp('test@example.com', 'password123')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })
})
