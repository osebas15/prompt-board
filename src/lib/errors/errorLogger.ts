import type { AppError, ErrorInfo, ErrorDetails, ErrorSeverity, ErrorLogEntry } from './types';

class ErrorLogger {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory
  private readonly STORAGE_KEY = 'error_logs';

  logError(error: AppError, errorInfo?: ErrorInfo): void {
    // Ensure error has required properties
    const enhancedError = this.enhanceError(error);
    
    const errorDetails: ErrorDetails = {
      error: enhancedError,
      errorInfo,
      userId: errorInfo?.userId || this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
    };

    // Add to memory
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Store in localStorage for offline scenarios
    this.storeErrorInLocalStorage(errorDetails);

    // Log to console based on severity
    this.logToConsole(errorDetails);

    // Send to monitoring service (e.g., Sentry)
    this.sendToMonitoring(errorDetails);
  }

  logWarning(message: string, context?: Record<string, any>): void {
    const warning: AppError = {
      name: 'Warning',
      message,
      context,
      timestamp: new Date(),
      severity: 'low',
    };

    console.warn('Warning:', warning);
  }

  logInfo(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.info('Info:', { message, context, timestamp: new Date() });
    }
  }

  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  getStoredErrors(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearErrors(): void {
    this.errors = [];
  }

  clearStoredErrors(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  createAppError(
    message: string,
    severity: ErrorSeverity = 'medium',
    errorId?: string,
    context?: Record<string, any>,
    originalError?: Error
  ): AppError {
    const error = new Error(message) as AppError;
    error.severity = severity;
    error.errorId = errorId || this.generateErrorId();
    error.context = context;
    error.originalError = originalError;
    error.timestamp = new Date();
    return error;
  }

  private enhanceError(error: AppError): AppError {
    if (!error.errorId) {
      error.errorId = this.generateErrorId();
    }
    if (!error.severity) {
      error.severity = this.getSeverity(error);
    }
    if (!error.timestamp) {
      error.timestamp = new Date();
    }
    return error;
  }

  private generateErrorId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `error_${timestamp}_${random}`;
  }

  private storeErrorInLocalStorage(errorDetails: ErrorDetails): void {
    try {
      const stored = this.getStoredErrors();
      const logEntry: ErrorLogEntry = {
        id: errorDetails.error.errorId || this.generateErrorId(),
        severity: errorDetails.error.severity || 'medium',
        message: errorDetails.error.message,
        stack: errorDetails.error.stack,
        details: errorDetails,
        resolved: false,
        created_at: new Date(),
        errorId: errorDetails.error.errorId,
        userId: errorDetails.userId,
      };

      stored.push(logEntry);
      
      // Keep only last 100 errors in localStorage
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }

  private logToConsole(errorDetails: ErrorDetails): void {
    const { error } = errorDetails;
    const logData = {
      errorId: error.errorId,
      message: error.message,
      severity: error.severity,
      userId: errorDetails.userId,
      action: errorDetails.errorInfo?.action,
      context: errorDetails.errorInfo?.context || error.context,
      timestamp: errorDetails.timestamp.toISOString(),
      userAgent: errorDetails.userAgent,
      url: errorDetails.url,
    };

    if (error.severity === 'critical') {
      console.error('[ErrorLogger] CRITICAL ERROR:', logData);
    } else {
      console.error('[ErrorLogger]', logData);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context or localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private sendToMonitoring(errorDetails: ErrorDetails): void {
    // In production, send to Sentry or other monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Sentry integration would go here
      console.error('Error to be sent to monitoring:', errorDetails);
    }
  }

  private getSeverity(error: AppError): ErrorSeverity {
    if (error.statusCode && error.statusCode >= 500) return 'critical';
    if (error.statusCode && error.statusCode >= 400) return 'high';
    if (error.name === 'Warning') return 'low';
    return 'medium';
  }
}

export const errorLogger = new ErrorLogger();
