import type { User, Session } from '@supabase/supabase-js'

// Core auth types from Supabase with app-specific extensions
export interface AuthUser extends User {
  id: string
  email?: string
  aud: string
  created_at: string
}

export interface AuthSession extends Session {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
}

// Auth state enumeration for clear state management
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

// Auth action result interface
export interface AuthActionResult {
  data: {
    user: AuthUser | null
    session: AuthSession | null
  } | null
  error: Error | null
}

// Auth error types
export interface AuthError extends Error {
  name: string
  message: string
  status?: number
}

// Provider props interface
export interface AuthProviderProps {
  children: React.ReactNode
}

// Context value interface
export interface AuthContextValue {
  // State
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

// Hook return types for convenience
export interface AuthStateHook {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthActionsHook {
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

// Protected route props
export interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

// Auth form types
export interface SignInFormData {
  email: string
  password: string
}

export interface SignUpFormData extends SignInFormData {
  confirmPassword?: string
}

// Auth validation schemas
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8

export interface AuthValidationError {
  field: string
  message: string
}

// Auth event types for state changes
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

export interface AuthEventData {
  event: AuthEvent
  session: AuthSession | null
  user: AuthUser | null
}
