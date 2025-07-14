import { describe, it, expect } from 'vitest';

describe('API Error Classification (Pure Functions)', () => {
  it('should classify network errors correctly', async () => {
    const { classifyError, NetworkError } = await import('@/lib/errors/apiErrors');
    
    const networkError = new Error('fetch failed');
    const result = classifyError(networkError);
    
    expect(result).toBeInstanceOf(NetworkError);
    expect(result.retryable).toBe(true);
    expect(result.statusCode).toBe(0);
  });

  it('should classify server errors correctly', async () => {
    const { classifyError, ServerError } = await import('@/lib/errors/apiErrors');
    
    const serverError = new Error('Server error');
    const result = classifyError(serverError, 500);
    
    expect(result).toBeInstanceOf(ServerError);
    expect(result.retryable).toBe(true);
    expect(result.statusCode).toBe(500);
  });

  it('should classify rate limit errors correctly', async () => {
    const { classifyError, RateLimitError } = await import('@/lib/errors/apiErrors');
    
    const rateLimitError = new Error('Too many requests');
    const result = classifyError(rateLimitError, 429);
    
    expect(result).toBeInstanceOf(RateLimitError);
    expect(result.retryable).toBe(true);
    expect(result.statusCode).toBe(429);
  });

  it('should classify client errors as non-retryable', async () => {
    const { classifyError, ClientError } = await import('@/lib/errors/apiErrors');
    
    const clientError = new Error('Bad request');
    const result = classifyError(clientError, 400);
    
    expect(result).toBeInstanceOf(ClientError);
    expect(result.retryable).toBe(false);
    expect(result.statusCode).toBe(400);
  });
});

describe('Retry Logic (Pure Functions)', () => {
  it('should calculate exponential backoff correctly', async () => {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const config = {
      maxAttempts: 3,
      backoffStrategy: 'exponential' as const,
      initialDelay: 100,
      maxDelay: 5000,
      retryableErrors: ['NetworkError'],
    };
    const client = new ApiClient(config);
    
    const backoff1 = client.calculateBackoff(1);
    const backoff2 = client.calculateBackoff(2);
    const backoff3 = client.calculateBackoff(3);
    
    expect(backoff1).toBeGreaterThanOrEqual(100);
    expect(backoff2).toBeGreaterThan(backoff1);
    expect(backoff3).toBeGreaterThan(backoff2);
    expect(backoff3).toBeLessThanOrEqual(5000);
  });

  it('should respect maximum delay limit', async () => {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const config = {
      maxAttempts: 10,
      backoffStrategy: 'exponential' as const,
      initialDelay: 1000,
      maxDelay: 5000,
      retryableErrors: ['NetworkError'],
    };
    const client = new ApiClient(config);
    
    // Large attempt number should be capped at maxDelay
    const backoff = client.calculateBackoff(10);
    expect(backoff).toBeLessThanOrEqual(5000);
  });

  it('should apply jitter for thundering herd prevention', async () => {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const config = {
      maxAttempts: 3,
      backoffStrategy: 'exponential' as const,
      initialDelay: 1000,
      maxDelay: 10000,
      retryableErrors: ['NetworkError'],
    };
    const client = new ApiClient(config);
    
    // Generate multiple backoff values for same attempt
    const backoffs = Array.from({ length: 10 }, () => client.calculateBackoff(2));
    const uniqueValues = new Set(backoffs);
    
    // Should have variation due to jitter
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  it('should use fixed backoff strategy', async () => {
    const { ApiClient } = await import('@/lib/api/apiClient');
    const config = {
      maxAttempts: 3,
      backoffStrategy: 'fixed' as const,
      initialDelay: 1000,
      maxDelay: 10000,
      retryableErrors: ['NetworkError'],
    };
    const client = new ApiClient(config);
    
    const backoff1 = client.calculateBackoff(1);
    const backoff2 = client.calculateBackoff(2);
    const backoff3 = client.calculateBackoff(3);
    
    // Fixed strategy should have similar values (within jitter range)
    expect(Math.abs(backoff1 - backoff2)).toBeLessThan(200); // Allow for jitter
    expect(Math.abs(backoff2 - backoff3)).toBeLessThan(200);
  });
});
