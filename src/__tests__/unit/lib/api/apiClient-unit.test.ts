import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create a dedicated test that doesn't use MSW setup
describe('API Error Handling (Unit)', () => {
  // Mock fetch globally for this test suite only
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // Import modules after mocks are set up
  async function createApiClient() {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const retryConfig = {
      maxAttempts: 3,
      backoffStrategy: 'exponential' as const,
      initialDelay: 100,
      maxDelay: 5000,
      retryableErrors: ['NetworkError', 'ServerError', 'RateLimitError'],
    };
    return new ApiClient(retryConfig);
  }

  async function createNoRetryApiClient() {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const noRetryConfig = {
      maxAttempts: 1,
      backoffStrategy: 'fixed' as const,
      initialDelay: 0,
      maxDelay: 0,
      retryableErrors: [],
    };
    return new ApiClient(noRetryConfig);
  }

  describe('ApiClient', () => {
    describe('successful requests', () => {
      it('should make successful request without retries', async () => {
        const mockResponse = { data: 'test' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const apiClient = await createApiClient();
        const result = await apiClient.request({
          url: '/test',
          method: 'GET',
        });

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should include authorization headers', async () => {
        const mockResponse = { data: 'test' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const apiClient = await createApiClient();
        await apiClient.request({
          url: '/test',
          method: 'GET',
          headers: { Authorization: 'Bearer token' },
        });

        expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        }));
      });
    });

    describe('error handling', () => {
      it('should throw NetworkError for network failures', async () => {
        const { NetworkError } = await import('@/lib/errors/apiErrors');
        mockFetch.mockRejectedValue(new Error('Network error'));

        const apiClient = await createNoRetryApiClient();
        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(NetworkError);
      });

      it('should throw ServerError for 5xx responses', async () => {
        const { ServerError } = await import('@/lib/errors/apiErrors');
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        });

        const apiClient = await createNoRetryApiClient();
        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(ServerError);
      });

      it('should throw RateLimitError for 429 responses', async () => {
        const { RateLimitError } = await import('@/lib/errors/apiErrors');
        mockFetch.mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            get: (name: string) => name === 'Retry-After' ? '60' : null,
          },
          json: async () => ({ error: 'Rate limited' }),
        });

        const apiClient = await createNoRetryApiClient();
        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(RateLimitError);
      });

      it('should throw ApiError for 4xx responses', async () => {
        const { ApiError } = await import('@/lib/errors/apiErrors');
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Bad request' }),
        });

        const apiClient = await createNoRetryApiClient();
        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(ApiError);
      });
    });

    describe('retry logic', () => {
      it('should retry on retryable errors', async () => {
        // Use fake timers but with a faster initial delay
        vi.useFakeTimers();
        
        // Create client with faster retry for testing
        const { ApiClient } = await import('@/lib/api/apiClient');
        const fastRetryConfig = {
          maxAttempts: 3,
          backoffStrategy: 'fixed' as const,
          initialDelay: 10, // Much faster for testing
          maxDelay: 100,
          retryableErrors: ['NetworkError', 'ServerError', 'RateLimitError'],
        };
        const apiClient = new ApiClient(fastRetryConfig);

        // First two calls fail, third succeeds
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ data: 'success' }),
          });

        const requestPromise = apiClient.request({
          url: '/test',
          method: 'GET',
        });

        // Advance timers step by step
        await vi.advanceTimersByTimeAsync(50); // First retry
        await vi.advanceTimersByTimeAsync(50); // Second retry

        const result = await requestPromise;
        expect(result).toEqual({ data: 'success' });
        expect(mockFetch).toHaveBeenCalledTimes(3);

        vi.useRealTimers();
      });

      it('should not retry on non-retryable errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Bad request' }),
        });

        const apiClient = await createNoRetryApiClient();
        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow();

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should respect maxAttempts configuration', async () => {
        vi.useFakeTimers();
        
        const fastRetryConfig = {
          maxAttempts: 3,
          backoffStrategy: 'fixed' as const,
          initialDelay: 10,
          maxDelay: 100,
          retryableErrors: ['NetworkError'],
        };
        const { ApiClient } = await import('@/lib/api/apiClient');
        const apiClient = new ApiClient(fastRetryConfig);
        
        mockFetch.mockRejectedValue(new Error('Network error'));

        try {
          // Create the request promise
          const requestPromise = apiClient.request({
            url: '/test',
            method: 'GET',
          });

          // Add a promise rejection handler to prevent unhandled rejections
          requestPromise.catch(() => {
            // Intentionally empty - we expect this to reject
          });

          // Advance timers to process all retry attempts
          await vi.runAllTimersAsync();

          // Now await the promise which should be rejected
          await expect(requestPromise).rejects.toThrow('Network error');
          expect(mockFetch).toHaveBeenCalledTimes(3); // maxAttempts
        } finally {
          vi.useRealTimers();
        }
      });
    });

    describe('configuration', () => {
      it('should use custom retry configuration', async () => {
        const { ApiClient } = await import('@/lib/api/apiClient');
        const customConfig = {
          maxAttempts: 1,
          backoffStrategy: 'fixed' as const,
          initialDelay: 50,
          maxDelay: 1000,
          retryableErrors: [],
        };
        const customClient = new ApiClient(customConfig);

        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(customClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow();

        // Should only attempt once with custom config
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Classification', () => {
    it('should correctly identify network errors', async () => {
      const { NetworkError } = await import('@/lib/errors/apiErrors');
      const networkError = new NetworkError('Connection failed');
      expect(networkError.retryable).toBe(true);
      expect(networkError.statusCode).toBe(0);
    });

    it('should correctly identify rate limit errors', async () => {
      const { RateLimitError } = await import('@/lib/errors/apiErrors');
      const rateLimitError = new RateLimitError('Too many requests');
      expect(rateLimitError.retryable).toBe(true);
      expect(rateLimitError.statusCode).toBe(429);
    });

    it('should correctly identify server errors', async () => {
      const { ServerError } = await import('@/lib/errors/apiErrors');
      const serverError = new ServerError('Internal server error', 500);
      expect(serverError.retryable).toBe(true);
      expect(serverError.statusCode).toBe(500);
    });

    it('should correctly identify client errors as non-retryable', async () => {
      const { ApiError } = await import('@/lib/errors/apiErrors');
      const clientError = new ApiError('Bad request', 400, false);
      expect(clientError.retryable).toBe(false);
      expect(clientError.statusCode).toBe(400);
    });
  });

  describe('Backoff Strategies', () => {
    it('should calculate exponential backoff correctly', async () => {
      const apiClient = await createApiClient();
      const backoff1 = apiClient.calculateBackoff(1);
      const backoff2 = apiClient.calculateBackoff(2);
      const backoff3 = apiClient.calculateBackoff(3);

      expect(backoff2).toBeGreaterThan(backoff1);
      expect(backoff3).toBeGreaterThan(backoff2);
      expect(backoff3).toBeLessThanOrEqual(5000); // maxDelay
    });

    it('should respect maximum delay', async () => {
      const apiClient = await createApiClient();
      const backoff = apiClient.calculateBackoff(10); // Large attempt number
      expect(backoff).toBeLessThanOrEqual(5000); // maxDelay
    });

    it('should apply jitter to prevent thundering herd', async () => {
      const apiClient = await createApiClient();
      const backoffs = Array.from({ length: 10 }, () => apiClient.calculateBackoff(2));
      const uniqueBackoffs = new Set(backoffs);
      
      // Should have some variation due to jitter
      expect(uniqueBackoffs.size).toBeGreaterThan(1);
    });
  });
});
