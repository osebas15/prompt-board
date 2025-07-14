// API-specific error types and classifications

export class ApiError extends Error {
  public statusCode: number;
  public retryable: boolean;
  public originalError?: Error;

  constructor(
    message: string,
    statusCode: number,
    retryable: boolean,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(message, 0, true, originalError);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends ApiError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number, originalError?: Error) {
    super(message, 429, true, originalError);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends ApiError {
  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message, statusCode, true, originalError);
    this.name = 'ServerError';
  }
}

export class ClientError extends ApiError {
  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message, statusCode, false, originalError);
    this.name = 'ClientError';
  }
}

export function classifyError(error: any, statusCode?: number): ApiError {
  // Network/connection errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed', error);
  }
  
  if (error.name === 'AbortError') {
    return new NetworkError('Request was aborted', error);
  }

  // Generic network errors (covers most fetch failures)
  if (error instanceof Error && !statusCode) {
    return new NetworkError(error.message, error);
  }

  // HTTP status-based classification
  if (statusCode) {
    if (statusCode === 429) {
      return new RateLimitError('Too many requests', undefined, error);
    }
    
    if (statusCode >= 500) {
      return new ServerError(`Server error: ${statusCode}`, statusCode, error);
    }
    
    if (statusCode >= 400) {
      return new ClientError(`Client error: ${statusCode}`, statusCode, error);
    }
  }

  // Generic API error
  return new ApiError(error.message || 'Unknown API error', statusCode || 0, false, error);
}

export function isRetryableError(error: ApiError): boolean {
  return error.retryable;
}

export function getRetryDelay(error: RateLimitError): number | undefined {
  return error.retryAfter ? error.retryAfter * 1000 : undefined; // Convert to milliseconds
}
