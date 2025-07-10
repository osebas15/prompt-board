import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variables
vi.mock('../../env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

// Mock Supabase client constructor
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(),
  })),
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should initialize with correct configuration', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const { supabase } = await import('../supabase')

    expect(createClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QtcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MjM5MDIyLCJleHAiOjE5NjA4MTUwMjJ9.test-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          storageKey: 'prompt-board-auth',
          detectSessionInUrl: true,
          debug: true,
        }),
        global: expect.objectContaining({
          headers: expect.objectContaining({
            'X-Client-Info': 'prompt-board@1.0.0',
          }),
        }),
        realtime: expect.objectContaining({
          params: expect.objectContaining({
            eventsPerSecond: 10,
          }),
        }),
      })
    )

    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should throw error if environment variables are missing', async () => {
    // Mock the env module to return invalid values using importOriginal
    vi.doMock('../env', async (importOriginal) => {
      const actual = await importOriginal() as any
      return {
        ...actual,
        validateEnv: vi.fn(() => {
          throw new Error('Missing required Supabase environment variables')
        }),
      }
    })

    // Clear the module cache to force re-import
    vi.resetModules()

    await expect(async () => {
      await import('../supabase?t=' + Date.now())
    }).rejects.toThrow('Missing required Supabase environment variables')
  })

  it('should have auth methods available', async () => {
    const { supabase } = await import('../supabase')

    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.onAuthStateChange).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signUp).toBeDefined()
  })
})
