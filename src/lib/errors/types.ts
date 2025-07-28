// Error types and interfaces

// Define more specific types for error context
export type ErrorContextValue = string | number | boolean | null;
export type ErrorContext = Record<string, ErrorContextValue>;

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
  timestamp?: Date;
  userMessage?: string;
  severity?: ErrorSeverity;
  errorId?: string;
  originalError?: Error;
}

export interface ErrorInfo {
  componentStack?: string; // Made optional for better usability
  errorBoundary?: string;
  userId?: string;
  action?: string;
  context?: ErrorContext;
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
