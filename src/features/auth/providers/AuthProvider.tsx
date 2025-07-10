import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { AuthContext } from '../contexts/AuthContext'
import type { 
  AuthProviderProps, 
  AuthContextValue, 
  AuthUser, 
  AuthSession,
  AuthActionResult 
} from '../types/auth.types'

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides auth methods to child components.
 * Uses React 19 patterns with modern hooks and error handling.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Core auth state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const isAuthenticated = useMemo(() => Boolean(user && session), [user, session])

  /**
   * Initialize authentication state from existing session
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (session) {
        setSession(session as AuthSession)
        setUser(session.user as AuthUser)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { data: null, error }
      }

      return { 
        data: {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
        }, 
        error: null 
      }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Sign in failed') 
      }
    }
  }, [])

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { data: null, error }
      }

      return { 
        data: {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
        }, 
        error: null 
      }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Sign up failed') 
      }
    }
  }, [])

  /**
   * Sign out current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // State will be updated by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error)
      throw error instanceof Error ? error : new Error('Sign out failed')
    }
  }, [])

  /**
   * Handle auth state changes
   */
  useEffect(() => {
    // Initialize auth state
    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (session) {
          setSession(session as AuthSession)
          setUser(session.user as AuthUser)
        } else {
          setSession(null)
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextValue>(() => ({
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  }), [user, session, isLoading, isAuthenticated, signIn, signUp, signOut])

  // Use React 19 context syntax
  return (
    <AuthContext value={contextValue}>
      {children}
    </AuthContext>
  )
}
