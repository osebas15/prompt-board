import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../components/forms/SignupForm'
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

describe('SignupForm', () => {
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
    mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null } as any)
  })

  it('should render signup form with required fields', () => {
    render(<SignupForm />, { wrapper })
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignupForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    const user = userEvent.setup()
    render(<SignupForm />, { wrapper })
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup()
    render(<SignupForm />, { wrapper })
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password456')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should handle successful signup', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signUp.mockResolvedValue({
      data: { 
        user: { 
          id: '123', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any,
        session: null
      },
      error: null
    } as any)

    render(<SignupForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should display error messages for failed signup', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    // Mock the signUp to throw an error
    mocks.signUp.mockImplementation(() => {
      throw new Error('User already registered')
    })

    render(<SignupForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during signup', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    // Create a promise that we can resolve manually
    let resolveSignup: (value: any) => void
    const signupPromise = new Promise((resolve) => {
      resolveSignup = resolve
    })
    
    mocks.signUp.mockReturnValue(signupPromise as any)

    render(<SignupForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Resolve the promise
    resolveSignup!({ data: { user: null, session: null }, error: null })
  })

  it('should have link to login page', () => {
    render(<SignupForm />, { wrapper })
    
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('should show confirmation message after successful signup', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signUp.mockResolvedValue({
      data: { 
        user: { 
          id: '123', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any,
        session: null
      },
      error: null
    } as any)

    render(<SignupForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    })
  })
})
