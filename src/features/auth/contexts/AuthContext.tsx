import { createContext } from 'react'
import type { AuthContextValue } from '../types/auth.types'

// Default context value with proper error handling
const defaultContextValue: AuthContextValue = {
  // State
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  
  // Actions with meaningful error messages
  signIn: async () => ({
    data: null,
    error: new Error('AuthProvider not found. Make sure useAuth is called within an AuthProvider.')
  }),
  signUp: async () => ({
    data: null,
    error: new Error('AuthProvider not found. Make sure useAuth is called within an AuthProvider.')
  }),
  signOut: async () => {
    throw new Error('AuthProvider not found. Make sure useAuth is called within an AuthProvider.')
  }
}

// Create the authentication context
export const AuthContext = createContext<AuthContextValue>(defaultContextValue)

// Set display name for better debugging
AuthContext.displayName = 'AuthContext'
