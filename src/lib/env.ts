import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .refine(
      (url) => url.includes('supabase') || url.includes('localhost'),
      'URL must be a valid Supabase URL or localhost for development'
    ),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is required')
    .refine(
      (key) => key.startsWith('eyJ'),
      'Invalid Supabase anonymous key format (must be a JWT starting with "eyJ")'
    ),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_DESCRIPTION: z.string().optional(),
})

function validateEnv() {
  // Log environment information
  console.log('🔧 Environment Validation Starting...')
  console.log('📂 Current working directory:', typeof window !== 'undefined' ? window.location.origin : 'server')
  console.log('🏗️ Vite mode:', import.meta.env.MODE)
  console.log('🏗️ Vite dev mode:', import.meta.env.DEV)
  console.log('🏗️ Vite prod mode:', import.meta.env.PROD)
  
  // Log all environment variables that start with VITE_
  console.log('📋 All VITE_ environment variables:')
  const allEnvVars = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      // Mask sensitive values
      let value = import.meta.env[key]
      if (key.includes('KEY') || key.includes('SECRET')) {
        value = value ? `${value.substring(0, 10)}...` : 'undefined'
      }
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
  
  console.table(allEnvVars)
  
  // Extract values for validation
  const rawEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION,
  }
  
  console.log('🧪 Raw environment variables before validation:')
  console.log('VITE_SUPABASE_URL:', rawEnvVars.VITE_SUPABASE_URL || 'undefined')
  console.log('VITE_SUPABASE_ANON_KEY:', rawEnvVars.VITE_SUPABASE_ANON_KEY ? `${rawEnvVars.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined')
  console.log('VITE_GEMINI_API_KEY:', rawEnvVars.VITE_GEMINI_API_KEY ? 'Set' : 'undefined')
  
  try {
    const validatedEnv = envSchema.parse(rawEnvVars)
    console.log('✅ Environment validation successful!')
    return validatedEnv
  } catch (error) {
    console.error('❌ Environment validation failed!')
    if (error instanceof z.ZodError) {
      console.error('🚨 Validation errors:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(
        `Missing or invalid environment variables:\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set correctly.\n' +
        'For local development, make sure Supabase is running on localhost:54321'
      )
    }
    throw error
  }
}

export const env = validateEnv()

// Re-export for convenience
export const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  VITE_GEMINI_API_KEY,
  VITE_APP_NAME,
  VITE_APP_DESCRIPTION,
} = env
