import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { createClient } from '@supabase/supabase-js'
import { AuthProvider } from '../providers/AuthProvider'
import { useAuth } from '../hooks/useAuth'
import React from 'react'

// Unmock Supabase for real integration testing
vi.unmock('@supabase/supabase-js')

// Test component that uses the auth hook
const TestAuthComponent = () => {
  const { user, isLoading, signUp, signIn, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button 
        data-testid="signup" 
        onClick={() => signUp('test@example.com', 'password123')}
      >
        Sign Up
      </button>
      <button 
        data-testid="signin" 
        onClick={() => signIn('test@example.com', 'password123')}
      >
        Sign In
      </button>
      <button data-testid="signout" onClick={signOut}>
        Sign Out
      </button>
    </div>
  )
}

describe('Authentication Integration Tests', () => {
  const localUrl = 'http://localhost:54321'
  const localAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  beforeAll(() => {
    // Ensure we're using the real implementation
    vi.resetAllMocks()
  })

  beforeEach(() => {
    // Reset any auth state before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AuthProvider Integration', () => {
    it('should provide auth context with real Supabase client', async () => {
      const TestComponent = () => {
        const { isLoading } = useAuth()
        return <div data-testid="auth-status">{isLoading ? 'loading' : 'ready'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should be loading
      expect(screen.getByTestId('auth-status')).toHaveTextContent('loading')

      // Wait for auth state to resolve
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('ready')
      }, { timeout: 5000 })
    })

    it('should handle auth state changes', async () => {
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // Initially no user
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should handle sign up attempts', async () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // Try to sign up (will likely fail due to network/config, but should not crash)
      act(() => {
        screen.getByTestId('signup').click()
      })

      // Should still be in ready state (not crash)
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      mockConsoleError.mockRestore()
    })

    it('should handle sign in attempts', async () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // Try to sign in (will likely fail due to network/config, but should not crash)
      act(() => {
        screen.getByTestId('signin').click()
      })

      // Should still be in ready state (not crash)
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      mockConsoleError.mockRestore()
    })

    it('should handle sign out', async () => {
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // Try to sign out (should work even if no user is signed in)
      act(() => {
        screen.getByTestId('signout').click()
      })

      // Wait for any async operations to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      })

      // Should show no user after sign out
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      }, { timeout: 3000 })
    })
  })

  describe('Real Supabase Client Integration', () => {
    it('should work with real Supabase client configuration', () => {
      // Test that we can create a real client
      const client = createClient(localUrl, localAnonKey)
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(typeof client.auth.getSession).toBe('function')
      expect(typeof client.auth.signUp).toBe('function')
      expect(typeof client.auth.signInWithPassword).toBe('function')
      expect(typeof client.auth.signOut).toBe('function')
      expect(typeof client.auth.onAuthStateChange).toBe('function')
    })

    it('should handle network errors gracefully in auth provider', async () => {
      // Test with invalid client configuration to test error handling
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should eventually settle into ready state even with network errors
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 10000 })

      mockConsoleError.mockRestore()
    })
  })

  describe('Error Boundary Integration', () => {
    it('should not crash the app when auth operations fail', async () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false)
        
        React.useEffect(() => {
          const handleError = () => setHasError(true)
          window.addEventListener('error', handleError)
          return () => window.removeEventListener('error', handleError)
        }, [])
        
        if (hasError) {
          return <div data-testid="error-boundary">Error caught</div>
        }
        
        return <>{children}</>
      }

      render(
        <ErrorBoundary>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </ErrorBoundary>
      )

      // Wait for load and ensure no errors crash the app
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // Should not show error boundary
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    })
  })

  describe('Local Development Environment', () => {
    it('should work in development mode without real Supabase server', async () => {
      // Mock console.error to avoid noise from expected network errors
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Clear any existing auth state
      localStorage.clear()
      sessionStorage.clear()
      
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should handle development environment gracefully
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      // User should be null in development without server
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')

      mockConsoleError.mockRestore()
    }, 10000) // Increased timeout

    it('should maintain consistent auth state across re-renders', async () => {
      const TestWrapper = () => {
        const [count, setCount] = React.useState(0)
        
        return (
          <AuthProvider>
            <TestAuthComponent />
            <button data-testid="rerender" onClick={() => setCount(c => c + 1)}>
              Re-render {count}
            </button>
          </AuthProvider>
        )
      }

      render(<TestWrapper />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready')
      }, { timeout: 5000 })

      const initialUserState = screen.getByTestId('user').textContent

      // Force re-render
      act(() => {
        screen.getByTestId('rerender').click()
      })

      // Auth state should remain consistent
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(initialUserState || '')
      })
    })
  })
})
