import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm'
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
      resetPasswordForEmail: vi.fn(),
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
    resetPasswordForEmail: vi.mocked(supabase.auth.resetPasswordForEmail),
  }
}

describe('ForgotPasswordForm', () => {
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
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as any)
  })

  it('should render forgot password form with email field', () => {
    render(<ForgotPasswordForm />, { wrapper })
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should handle successful password reset request', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    } as any)

    render(<ForgotPasswordForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('should display error messages for failed reset request', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.resetPasswordForEmail.mockImplementation(() => {
      throw new Error('Email not found')
    })

    render(<ForgotPasswordForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'nonexistent@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during reset request', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    // Create a promise that we can resolve manually
    let resolveReset: (value: any) => void
    const resetPromise = new Promise((resolve) => {
      resolveReset = resolve
    })
    
    mocks.resetPasswordForEmail.mockReturnValue(resetPromise as any)

    render(<ForgotPasswordForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Resolve the promise
    resolveReset!({ data: {}, error: null })
  })

  it('should have link back to login page', () => {
    render(<ForgotPasswordForm />, { wrapper })
    
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('should show success message after sending reset link', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    } as any)

    render(<ForgotPasswordForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset link sent/i })).toBeInTheDocument()
    })
  })
})
