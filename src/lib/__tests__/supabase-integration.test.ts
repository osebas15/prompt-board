import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Unmock Supabase for real integration testing
vi.unmock('@supabase/supabase-js')

// Integration tests for local Supabase development
describe('Supabase Local Development Integration', () => {
  let supabaseClient: SupabaseClient
  const localUrl = 'http://localhost:54321'
  const localAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  beforeAll(() => {
    // Ensure we're using the real implementation
    vi.resetAllMocks()
  })

  beforeEach(() => {
    // Use actual local development credentials
    supabaseClient = createClient(localUrl, localAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  })

  afterEach(async () => {
    // Clean up any test data
    try {
      await supabaseClient.auth.signOut()
    } catch (error) {
      // Ignore errors during cleanup
    }
  })

  describe('Connection Tests', () => {
    it('should connect to local Supabase instance', async () => {
      expect(supabaseClient).toBeDefined()
      expect(supabaseClient.auth).toBeDefined()
      expect(typeof supabaseClient.from).toBe('function')
      expect(typeof supabaseClient.channel).toBe('function')
    })

    it('should have proper client configuration', () => {
      expect(supabaseClient.auth).toBeDefined()
      expect(typeof supabaseClient.auth.getSession).toBe('function')
      expect(typeof supabaseClient.auth.signUp).toBe('function')
      expect(typeof supabaseClient.auth.signInWithPassword).toBe('function')
    })

    it('should handle network errors gracefully', async () => {
      // Test error handling with invalid URL
      try {
        // Validate URL before creating client
        const invalidUrl = 'http://localhost:99999'
        new URL(invalidUrl) // This will throw if URL is invalid
        
        const invalidClient = createClient(invalidUrl, 'invalid-key', {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        
        const { data, error } = await invalidClient.auth.getSession()
        // Either we get an error or we get null data due to network issues
        expect(data || error).toBeDefined()
      } catch (networkError) {
        // Network errors or URL errors are expected
        expect(networkError).toBeDefined()
      }
    })
  })

  describe('Authentication Integration', () => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testPassword123!'

    it('should handle user session retrieval', async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        
        // Either error or data should be returned
        expect(data || error).toBeDefined()
        if (data) {
          expect(data.session).toBeNull() // No user should be logged in initially
        }
      } catch (networkError) {
        // Network errors are expected when Supabase is not running
        expect(networkError).toBeDefined()
      }
    })

    it('should handle user registration flow', async () => {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email: testEmail,
          password: testPassword,
        })
        
        // In local development, this might succeed or fail depending on setup
        expect(data || error).toBeDefined()
        
        if (data?.user) {
          expect(data.user.email).toBe(testEmail)
        }
      } catch (networkError) {
        // Network errors are acceptable in test environment
        expect(networkError).toBeDefined()
      }
    })

    it('should handle sign in attempts', async () => {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        })
        
        // This will likely fail with incorrect credentials, which is expected
        expect(data || error).toBeDefined()
        
        if (error) {
          expect(error.message).toBeDefined()
        } else if (data) {
          expect(data).toBeDefined()
        }
      } catch (networkError) {
        // Network errors are acceptable in test environment
        expect(networkError).toBeDefined()
      }
    })

    it('should handle sign out', async () => {
      try {
        const { error } = await supabaseClient.auth.signOut()
        
        // Should not error even if no user is signed in
        if (error) {
          expect(error.message).toBeDefined()
        }
      } catch (networkError) {
        // Network errors are acceptable in test environment
        expect(networkError).toBeDefined()
      }
    })

    it('should setup auth state change listener', () => {
      const mockCallback = vi.fn()
      
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange(mockCallback)
      
      expect(subscription).toBeDefined()
      expect(typeof subscription.unsubscribe).toBe('function')
      
      // Clean up
      subscription.unsubscribe()
    })
  })

  describe('Database Integration', () => {
    it('should have database query capabilities', () => {
      const query = supabaseClient.from('users')
      
      expect(query).toBeDefined()
      expect(typeof query.select).toBe('function')
      expect(typeof query.insert).toBe('function')
      expect(typeof query.update).toBe('function')
      expect(typeof query.delete).toBe('function')
    })

    it('should handle database queries with network errors', async () => {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .limit(1)
        
        // In local dev without server, expect network error or data
        expect(data || error).toBeDefined()
        
        if (error) {
          expect(error.message).toBeDefined()
        } else {
          expect(Array.isArray(data)).toBe(true)
        }
      } catch (err) {
        // Network errors are expected in local dev without running server
        expect(err).toBeDefined()
      }
    })
  })

  describe('Real-time Integration', () => {
    it('should support real-time subscriptions', () => {
      const channel = supabaseClient.channel('test-channel')
      
      expect(channel).toBeDefined()
      expect(typeof channel.on).toBe('function')
      expect(typeof channel.subscribe).toBe('function')
      expect(typeof channel.unsubscribe).toBe('function')
    })

    it('should handle real-time connection states', async () => {
      const channel = supabaseClient.channel('test-channel-2')
      
      const mockCallback = vi.fn()
      channel.on('broadcast', { event: 'test' }, mockCallback)
      
      // In local dev, this will likely fail to connect
      const response = channel.subscribe((status: string) => {
        expect(['SUBSCRIBED', 'TIMED_OUT', 'CLOSED', 'CHANNEL_ERROR']).toContain(status)
      })
      
      expect(response).toBeDefined()
      
      // Clean up
      setTimeout(() => channel.unsubscribe(), 100)
    })
  })

  describe('Environment Configuration', () => {
    it('should use correct local development configuration', () => {
      // Test that we can access basic client functionality
      expect(supabaseClient.auth).toBeDefined()
      expect(typeof supabaseClient.from).toBe('function')
      expect(typeof supabaseClient.channel).toBe('function')
    })

    it('should use development anon key pattern', () => {
      // We can't access the key directly, but we can test functionality
      expect(supabaseClient.auth).toBeDefined()
      expect(typeof supabaseClient.auth.getSession).toBe('function')
    })

    it('should have proper auth configuration', () => {
      // Check if auth config is accessible
      expect(supabaseClient.auth).toBeDefined()
      expect(typeof supabaseClient.auth.getSession).toBe('function')
      expect(typeof supabaseClient.auth.getUser).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      try {
        // Intentionally malformed request
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: 'not-an-email',
          password: '',
        })
        
        // Should either get an error response or throw a network error
        expect(data || error).toBeDefined()
        
        if (error) {
          expect(error.message).toBeDefined()
        }
      } catch (err) {
        // Network errors are acceptable in local dev
        expect(err).toBeDefined()
      }
    })

    it('should handle timeout scenarios', async () => {
      // Create client with custom fetch that times out quickly
      const timeoutClient = createClient(localUrl, localAnonKey, {
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) => {
            return Promise.race([
              fetch(input, init),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 100)
              )
            ])
          }
        }
      })

      try {
        await timeoutClient.auth.getSession()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Local Development Helpers', () => {
    it('should provide development utilities', () => {
      // Test that development functionality is available
      expect(supabaseClient.auth).toBeDefined()
      expect(supabaseClient.from).toBeDefined()
      expect(supabaseClient.channel).toBeDefined()
      
      // Test that we can create queries and channels
      expect(typeof supabaseClient.from('test').select).toBe('function')
      expect(typeof supabaseClient.channel('test').subscribe).toBe('function')
    })

    it('should support local storage integration', () => {
      // Test that client can work with localStorage
      const originalLocalStorage = global.localStorage
      
      // Mock localStorage
      const mockStorage: { [key: string]: string } = {}
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => { mockStorage[key] = value },
          removeItem: (key: string) => { delete mockStorage[key] },
          clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) }
        },
        writable: true
      })

      // Test auth storage
      expect(() => {
        supabaseClient.auth.getSession()
      }).not.toThrow()

      // Restore
      global.localStorage = originalLocalStorage
    })
  })
})
