import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import { logger } from './debug/logger'

logger.infoOnce('🔗 Supabase Client Initialization Starting...')

// Validate environment variables before creating client
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  logger.forceError('❌ Missing required Supabase environment variables')
  logger.forceError('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL || 'undefined')
  logger.forceError('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'undefined')
  throw new Error('Missing required Supabase environment variables')
}

logger.infoOnce('✅ Environment variables validated successfully')
logger.debug('🌐 Supabase URL:', env.VITE_SUPABASE_URL)
logger.debug('🔑 Anon Key (first 20 chars):', env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...')
logger.debug('🏗️ Environment mode:', import.meta.env.MODE)
logger.debug('🔧 Debug mode enabled:', import.meta.env.DEV)

const supabaseConfig = {
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

logger.debug('⚙️ Supabase client configuration:', {
  ...supabaseConfig,
  auth: {
    ...supabaseConfig.auth,
    // Don't log sensitive debug info
    debug: supabaseConfig.auth.debug
  }
})

// Create Supabase client with optimized configuration
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  supabaseConfig
)

logger.infoOnce('🚀 Supabase client created successfully')
logger.debug('🔐 Auth methods available:', Object.keys(supabase.auth))
logger.debug('📊 Database methods available:', typeof supabase.from === 'function' ? 'Available' : 'Not available')
logger.debug('⚡ Realtime methods available:', typeof supabase.channel === 'function' ? 'Available' : 'Not available')

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
