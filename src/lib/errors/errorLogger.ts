import type { AppError, ErrorInfo, ErrorDetails, ErrorSeverity } from './types';

class ErrorLogger {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  logError(error: AppError, errorInfo?: ErrorInfo): void {
    const errorDetails: ErrorDetails = {
      error,
      errorInfo,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
    };

    // Add to local storage
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorDetails);
    }

    // Send to monitoring service (e.g., Sentry)
    this.sendToMonitoring(errorDetails);
  }

  logWarning(message: string, context?: Record<string, any>): void {
    const warning: AppError = {
      name: 'Warning',
      message,
      context,
      timestamp: new Date(),
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

  clearErrors(): void {
    this.errors = [];
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
