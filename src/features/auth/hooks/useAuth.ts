import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { AuthStateHook, AuthActionsHook } from '../types/auth.types'

/**
 * Custom hook to access authentication state and methods
 * 
 * @throws {Error} When used outside of AuthProvider
 * @returns {AuthContextValue} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Convenience hook to access only authentication state
 * 
 * @returns {AuthStateHook} Authentication state only
 */
export function useAuthState(): AuthStateHook {
  const { user, isLoading, isAuthenticated } = useAuth()
  return { user, isLoading, isAuthenticated }
}

/**
 * Convenience hook to access only authentication actions
 * 
 * @returns {AuthActionsHook} Authentication actions only
 */
export function useAuthActions(): AuthActionsHook {
  const { signIn, signUp, signOut } = useAuth()
  return { signIn, signUp, signOut }
}

/**
 * Hook to check if user is authenticated (convenience)
 * 
 * @returns {boolean} Whether user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to get current user (convenience)
 * 
 * @returns {AuthUser | null} Current authenticated user or null
 */
export function useUser() {
  const { user } = useAuth()
  return user
}
