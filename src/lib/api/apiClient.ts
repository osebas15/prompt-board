// Robust API client with retry logic and error handling

import { ApiError, RateLimitError, ServerError, ClientError, classifyError, isRetryableError, getRetryDelay } from '../errors/apiErrors';

// Types for request body data
type RequestBodyData = 
  | Record<string, unknown>
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Array<unknown>;

// Type for error response data
interface ErrorResponseData {
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: RequestBodyData;
  timeout?: number;
}

export class ApiClient {
  private retryConfig: RetryConfig;

  constructor(retryConfig: RetryConfig) {
    this.retryConfig = retryConfig;
  }

  async request<T>(config: RequestConfig): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(config);
      return this.handleResponse<T>(response);
    });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: ApiError | undefined;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const apiError = error instanceof ApiError ? error : classifyError(error);
        lastError = apiError;

        // Don't retry on last attempt or non-retryable errors
        if (attempt === this.retryConfig.maxAttempts || !this.shouldRetry(apiError)) {
          throw apiError;
        }

        // Calculate delay and wait before retry
        const delay = this.getRetryDelay(apiError, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private async makeRequest(config: RequestConfig): Promise<Response> {
    const { url, method, headers = {}, body, timeout = 30000 } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw this.createErrorFromResponse(response, errorData);
    }

    return response.json();
  }

  private async parseErrorResponse(response: Response): Promise<ErrorResponseData> {
    try {
      return await response.json();
    } catch {
      return { error: response.statusText };
    }
  }

  private createErrorFromResponse(response: Response, errorData: ErrorResponseData): ApiError {
    const message = errorData.error || errorData.message || response.statusText;

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : undefined);
    }

    if (response.status >= 500) {
      return new ServerError(message, response.status);
    }

    if (response.status >= 400) {
      return new ClientError(message, response.status);
    }

    return new ApiError(message, response.status, false);
  }

  private shouldRetry(error: ApiError): boolean {
    // First check if error is inherently retryable
    if (!isRetryableError(error)) {
      return false;
    }

    // Then check if this error type is allowed to be retried
    return this.retryConfig.retryableErrors.includes(error.name);
  }

  private getRetryDelay(error: ApiError, attempt: number): number {
    // Use custom delay for rate limit errors
    if (error instanceof RateLimitError) {
      const customDelay = getRetryDelay(error);
      if (customDelay) {
        return Math.min(customDelay, this.retryConfig.maxDelay);
      }
    }

    return this.calculateBackoff(attempt);
  }

  public calculateBackoff(attempt: number): number {
    let delay: number;

    switch (this.retryConfig.backoffStrategy) {
      case 'linear':
        delay = this.retryConfig.initialDelay * attempt;
        break;
      case 'exponential':
        delay = this.retryConfig.initialDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = this.retryConfig.initialDelay;
        break;
    }

    // Apply jitter to prevent thundering herd problem
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default retry configurations
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ['NetworkError', 'ServerError', 'RateLimitError'],
};

export const aggressiveRetryConfig: RetryConfig = {
  maxAttempts: 5,
  backoffStrategy: 'exponential',
  initialDelay: 500,
  maxDelay: 30000,
  retryableErrors: ['NetworkError', 'ServerError', 'RateLimitError'],
};

export const noRetryConfig: RetryConfig = {
  maxAttempts: 1,
  backoffStrategy: 'fixed',
  initialDelay: 0,
  maxDelay: 0,
  retryableErrors: [],
};
