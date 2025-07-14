import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, RetryConfig } from '@/lib/api/apiClient';
import { ApiError, NetworkError, RateLimitError, ServerError } from '@/lib/errors/apiErrors';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Error Handling', () => {
  let apiClient: ApiClient;
  let retryConfig: RetryConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    retryConfig = {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      initialDelay: 100,
      maxDelay: 5000,
      retryableErrors: ['NetworkError', 'ServerError', 'RateLimitError'],
    };
    apiClient = new ApiClient(retryConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ApiClient', () => {
    describe('successful requests', () => {
      it('should make successful request without retries', async () => {
        const mockResponse = { data: 'test' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

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
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(NetworkError);
      });

      it('should throw ServerError for 5xx responses', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        });

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(ServerError);
      });

      it('should throw RateLimitError for 429 responses', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '60']]),
          json: async () => ({ error: 'Rate limited' }),
        });

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(RateLimitError);
      });

      it('should throw ClientError for 4xx responses', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Bad request' }),
        });

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(ApiError);
      });
    });

    describe('retry logic', () => {
      it('should retry on retryable errors', async () => {
        // First two calls fail, third succeeds
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ data: 'success' }),
          });

        const result = await apiClient.request({
          url: '/test',
          method: 'GET',
        });

        expect(result).toEqual({ data: 'success' });
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      it('should not retry on non-retryable errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Bad request' }),
        });

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow();

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should respect maxAttempts configuration', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow(NetworkError);

        expect(mockFetch).toHaveBeenCalledTimes(retryConfig.maxAttempts);
      });

      it('should apply exponential backoff', async () => {
        const startTime = Date.now();
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(apiClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow();

        const endTime = Date.now();
        const elapsed = endTime - startTime;

        // Should have some delay due to backoff (at least initial delay)
        expect(elapsed).toBeGreaterThan(retryConfig.initialDelay);
      });

      it('should handle RateLimitError with custom delay', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '1']]), // 1 second
          json: async () => ({ error: 'Rate limited' }),
        }).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
        });

        const startTime = Date.now();
        const result = await apiClient.request({
          url: '/test',
          method: 'GET',
        });

        const endTime = Date.now();
        const elapsed = endTime - startTime;

        expect(result).toEqual({ data: 'success' });
        expect(elapsed).toBeGreaterThan(1000); // Should wait at least 1 second
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('configuration', () => {
      it('should use custom retry configuration', async () => {
        const customConfig: RetryConfig = {
          maxAttempts: 1,
          backoffStrategy: 'fixed',
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

      it('should allow disabling retries', async () => {
        const noRetryClient = new ApiClient({
          maxAttempts: 1,
          backoffStrategy: 'fixed',
          initialDelay: 0,
          maxDelay: 0,
          retryableErrors: [],
        });

        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(noRetryClient.request({
          url: '/test',
          method: 'GET',
        })).rejects.toThrow();

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Classification', () => {
    it('should correctly identify network errors', () => {
      const networkError = new NetworkError('Connection failed', 0, true);
      expect(networkError.retryable).toBe(true);
      expect(networkError.statusCode).toBe(0);
    });

    it('should correctly identify rate limit errors', () => {
      const rateLimitError = new RateLimitError('Too many requests', 429, true);
      expect(rateLimitError.retryable).toBe(true);
      expect(rateLimitError.statusCode).toBe(429);
    });

    it('should correctly identify server errors', () => {
      const serverError = new ServerError('Internal server error', 500, true);
      expect(serverError.retryable).toBe(true);
      expect(serverError.statusCode).toBe(500);
    });

    it('should correctly identify client errors as non-retryable', () => {
      const clientError = new ApiError('Bad request', 400, false);
      expect(clientError.retryable).toBe(false);
      expect(clientError.statusCode).toBe(400);
    });
  });

  describe('Backoff Strategies', () => {
    it('should calculate exponential backoff correctly', () => {
      const backoff1 = apiClient.calculateBackoff(1);
      const backoff2 = apiClient.calculateBackoff(2);
      const backoff3 = apiClient.calculateBackoff(3);

      expect(backoff2).toBeGreaterThan(backoff1);
      expect(backoff3).toBeGreaterThan(backoff2);
      expect(backoff3).toBeLessThanOrEqual(retryConfig.maxDelay);
    });

    it('should respect maximum delay', () => {
      const backoff = apiClient.calculateBackoff(10); // Large attempt number
      expect(backoff).toBeLessThanOrEqual(retryConfig.maxDelay);
    });

    it('should apply jitter to prevent thundering herd', () => {
      const backoffs = Array.from({ length: 10 }, () => apiClient.calculateBackoff(2));
      const uniqueBackoffs = new Set(backoffs);
      
      // Should have some variation due to jitter
      expect(uniqueBackoffs.size).toBeGreaterThan(1);
    });
  });
});
