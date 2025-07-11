import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client constructor to spy on calls
const mockCreateClient = vi.fn(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
  },
  from: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct configuration', async () => {
    const { supabase } = await import('../supabase')

    // Verify that createClient was called with the correct configuration structure
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    
    const callArgs = mockCreateClient.mock.calls[0]
    expect(callArgs).toHaveLength(3)
    
    const [url, key, config] = callArgs as unknown as [string, string, any]
    
    // Verify URL format (should be local development URL)
    expect(url).toMatch(/^https?:\/\//)
    expect(typeof url).toBe('string')
    
    // Verify key format (should be a JWT token)
    expect(key).toMatch(/^eyJ/)
    expect(typeof key).toBe('string')
    
    // Verify configuration object structure
    expect(config).toEqual(
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

  it('should have auth methods available', async () => {
    const { supabase } = await import('../supabase')

    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.onAuthStateChange).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signUp).toBeDefined()
  })
})
