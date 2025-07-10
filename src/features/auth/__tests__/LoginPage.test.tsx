import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
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

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
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
  }
}

describe('LoginPage', () => {
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

  it('should render login page with proper layout', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: /prompt board/i })).toBeInTheDocument()
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('should contain LoginForm component', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should have navigation links', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })

  it('should have proper page title', () => {
    renderWithProviders(<LoginPage />)
    
    expect(document.title).toContain('Sign In')
  })
})
