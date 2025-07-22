import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../providers/AuthProvider'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
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

const renderWithProviders = (component: React.ReactNode, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  )
}

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

describe('Authentication User Journey', () => {
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
  })

  it('should complete signup flow successfully', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signUp.mockResolvedValue({
      data: { 
        user: { 
          id: '123', 
          email: 'newuser@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any,
        session: null
      },
      error: null
    } as any)

    renderWithProviders(<SignupPage />)
    
    // Fill out signup form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    
    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'securepassword123')
    await user.type(confirmPasswordInput, 'securepassword123')
    await user.click(submitButton)
    
    // Should call signUp with correct credentials
    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'securepassword123'
      })
    })

    // Should show confirmation message
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    })
  }, 10000) // Increased timeout for signup flow

  it('should complete login flow successfully', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signInWithPassword.mockResolvedValue({
      data: { 
        user: { 
          id: '123', 
          email: 'user@example.com',
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

    renderWithProviders(<LoginPage />)
    
    // Fill out login form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Clear and type with explicit focus
    await user.clear(emailInput)
    await user.type(emailInput, 'user@example.com')
    await user.clear(passwordInput)
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Should call signInWithPassword with correct credentials
    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123'
      })
    })
  }, 10000) // Increased timeout for login flow

  it('should handle password reset flow', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    } as any)

    renderWithProviders(<ForgotPasswordPage />)
    
    // Fill out forgot password form
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.click(submitButton)
    
    // Should call resetPasswordForEmail with correct email
    await waitFor(() => {
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
    })

    // Should show confirmation message
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset link sent/i })).toBeInTheDocument()
    })
  })

  it('should handle validation errors across forms', async () => {
    const user = userEvent.setup()

    // Test login form validation
    renderWithProviders(<LoginPage />)
    
    const loginSubmitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(loginSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should handle authentication errors gracefully', async () => {
    const user = userEvent.setup()
    const mocks = getMockedSupabase()
    
    mocks.signInWithPassword.mockImplementation(() => {
      throw new Error('Invalid login credentials')
    })

    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })
})
