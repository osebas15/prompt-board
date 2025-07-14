// Error types and interfaces
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp?: Date;
  userMessage?: string;
  severity?: ErrorSeverity;
  errorId?: string;
  originalError?: Error;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  userId?: string;
  action?: string;
  context?: Record<string, any>;
}

export interface ErrorDetails {
  error: AppError;
  errorInfo?: ErrorInfo;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLogEntry {
  id: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  details: ErrorDetails;
  resolved: boolean;
  created_at: Date;
  errorId?: string;
  userId?: string;
}
