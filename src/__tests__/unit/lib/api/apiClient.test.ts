import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '@/lib/api/apiClient'
import type { RetryConfig, RequestConfig } from '@/lib/api/apiClient'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ApiClient', () => {
  let apiClient: ApiClient
  let retryConfig: RetryConfig

  beforeEach(() => {
    retryConfig = {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      initialDelay: 100,
      maxDelay: 5000,
      retryableErrors: ['NetworkError', 'RateLimitError', 'ServerError']
    }
    apiClient = new ApiClient(retryConfig)
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('request method', () => {
    it('should make successful GET request', async () => {
      server.use(
        http.get('http://localhost:3000/api/users', () => {
          return HttpResponse.json({ users: [] })
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/users',
        method: 'GET'
      }

      const result = await apiClient.request(config)
      expect(result).toEqual({ users: [] })
    })

    it('should make successful POST request', async () => {
      server.use(
        http.post('http://localhost:3000/api/users', () => {
          return HttpResponse.json({ id: 1, name: 'John' })
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/users',
        method: 'POST',
        body: { name: 'John' }
      }

      const result = await apiClient.request(config)
      expect(result).toEqual({ id: 1, name: 'John' })
    })

    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/users', () => {
          return HttpResponse.error()
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/users',
        method: 'GET'
      }

      await expect(apiClient.request(config)).rejects.toThrow()
    })
  })

  describe('retry mechanism', () => {
    it('should retry failed requests', async () => {
      let attempts = 0
      server.use(
        http.get('http://localhost:3000/api/retry', () => {
          attempts++
          if (attempts < 3) {
            return new Response(null, { status: 500 })
          }
          return HttpResponse.json({ success: true })
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/retry',
        method: 'GET'
      }

      const result = await apiClient.request(config)
      expect(result).toEqual({ success: true })
      // Should make 3 attempts: 2 failures + 1 success
      expect(attempts).toBe(3)
    })

    it('should respect maxAttempts configuration', async () => {
      const shortRetryConfig: RetryConfig = {
        maxAttempts: 2,
        backoffStrategy: 'fixed',
        initialDelay: 50,
        maxDelay: 1000,
        retryableErrors: ['NetworkError', 'ServerError']
      }
      const shortRetryClient = new ApiClient(shortRetryConfig)

      let attempts = 0
      server.use(
        http.get('http://localhost:3000/api/fail', () => {
          attempts++
          return new Response(null, { status: 500 })
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/fail',
        method: 'GET'
      }

      await expect(shortRetryClient.request(config)).rejects.toThrow()
      // Should make exactly 2 attempts as per maxAttempts
      expect(attempts).toBe(2)
    })
  })

  describe('error handling', () => {
    it('should handle 400 client errors', async () => {
      server.use(
        http.post('http://localhost:3000/api/users', () => {
          return HttpResponse.json(
            { error: 'Bad Request' },
            { status: 400 }
          )
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/users',
        method: 'POST',
        body: { invalid: 'data' }
      }

      await expect(apiClient.request(config)).rejects.toThrow()
    })

    it('should handle 500 server errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/error', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          )
        })
      )

      const config: RequestConfig = {
        url: 'http://localhost:3000/api/error',
        method: 'GET'
      }

      await expect(apiClient.request(config)).rejects.toThrow()
    })
  })
})
