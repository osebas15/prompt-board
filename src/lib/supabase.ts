import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Validate environment variables before creating client
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

// Create Supabase client with optimized configuration
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session in URL (for auth callbacks)
      detectSessionInUrl: true,
      // Set storage key for session persistence
      storageKey: 'prompt-board-auth',
      // Enable debug mode in development
      debug: import.meta.env.DEV,
    },
    // Global headers for all requests
    global: {
      headers: {
        'X-Client-Info': 'prompt-board@1.0.0',
      },
    },
    // Realtime configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Export auth methods for convenience
export const {
  auth: {
    signUp,
    signInWithPassword,
    signOut,
    getSession,
    getUser,
    onAuthStateChange,
  },
} = supabase

// Type definitions for better TypeScript support
export type SupabaseClient = typeof supabase
export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>['data']['session']>
export type AuthUser = NonNullable<AuthSession['user']>
