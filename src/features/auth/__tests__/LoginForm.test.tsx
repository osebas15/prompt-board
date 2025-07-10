import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../components/forms/LoginForm'
import { AuthProvider } from '../providers/AuthProvider'
import React from 'react'
import * as supabaseModule from '@/lib/supabase'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
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

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
    <a href={to}>{children}</a>,
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// Helper function to render with proper act wrapping
const renderWithAuth = async (component: React.ReactElement) => {
  let result: any
  await act(async () => {
    result = render(component, { wrapper })
  })
  // Give AuthProvider time to initialize
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result
}

const getMockedSupabase = () => {
  const { supabase } = vi.mocked(supabaseModule)
  return {
    getSession: vi.mocked(supabase.auth.getSession),
    onAuthStateChange: vi.mocked(supabase.auth.onAuthStateChange),
    signOut: vi.mocked(supabase.auth.signOut),
    signInWithPassword: vi.mocked(supabase.auth.signInWithPassword),
    signUp: vi.mocked(supabase.auth.signUp),
  }
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mocks = getMockedSupabase()
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mocks.onAuthStateChange.mockReturnValue({ 
      data: { 
        subscription: { 
          unsubscribe: vi.fn(),
          id: 'test-id',
          callback: vi.fn()
        } as any 
      } 
    } as any)
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null } as any)
  })

  it('should render login form with email and password fields', async () => {
    await renderWithAuth(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper })
    
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signInWithPassword.mockResolvedValue({
      data: { 
        user: { 
          id: '123', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any,
        session: { 
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {} as any
        } as any
      },
      error: null
    } as any)

    render(<LoginForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should display error messages for failed login', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { 
        message: 'Invalid login credentials',
        code: 'invalid_credentials',
        status: 400,
        __isAuthError: true,
        name: 'AuthError'
      } as any
    } as any)

    render(<LoginForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    // Create a promise that we can resolve manually
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })
    
    mocks.signInWithPassword.mockReturnValue(loginPromise as any)

    render(<LoginForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Resolve the promise
    resolveLogin!({ data: { user: null, session: null }, error: null })
  })

  it('should have links to signup and forgot password', async () => {
    await renderWithAuth(<LoginForm />)
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })
})
