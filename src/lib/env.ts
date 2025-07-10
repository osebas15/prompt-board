import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .refine(
      (url) => url.includes('supabase'),
      'URL must be a valid Supabase URL'
    ),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is required')
    .refine(
      (key) => key.startsWith('eyJ'),
      'Invalid Supabase anonymous key format'
    ),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_DESCRIPTION: z.string().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(
        `Missing required Supabase environment variables:\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
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
