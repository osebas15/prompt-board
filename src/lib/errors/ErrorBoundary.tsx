import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '../../components/ui/Button/Button';
import { errorLogger } from './errorLogger';
import type { AppError, ErrorInfo } from './types';

interface ErrorFallbackProps {
  error: AppError;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const isCritical = error.severity === 'critical';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${
          isCritical ? 'bg-red-500' : 'bg-red-100'
        }`}>
          <svg
            className={`w-6 h-6 ${isCritical ? 'text-white' : 'text-red-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {isCritical ? 'Critical Error Occurred' : 'Something went wrong'}
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {error.userMessage || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex flex-col space-y-3">
          <Button onClick={resetErrorBoundary} className="w-full">
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Reload page
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error details (dev only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
            {error.errorId && (
              <p className="mt-2 text-xs text-gray-500">
                Error ID: {error.errorId}
              </p>
            )}
          </details>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

export function ErrorBoundary({ 
  children, 
  fallback = ErrorFallback,
  onError 
}: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    const appError = error as AppError;
    
    // Convert React.ErrorInfo to our ErrorInfo
    const customErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: 'ErrorBoundary',
    };
    
    // Enhance error with additional context
    if (!appError.errorId) {
      appError.errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    if (!appError.severity) {
      appError.severity = 'high'; // Errors caught by boundary are typically significant
    }
    
    // Log error to monitoring service
    errorLogger.logError(appError, customErrorInfo);
    
    // Call custom error handler if provided
    onError?.(appError, customErrorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
