import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
}

interface AlertProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
  children?: ReactNode;
}

export const Toast = ({
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
  className,
  children,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants = {
    default: 'bg-background border-border text-text-primary',
    destructive: 'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-green-500 border-green-500 text-white',
    warning: 'bg-yellow-500 border-yellow-500 text-white',
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-50 w-full max-w-sm p-4 rounded-lg border shadow-lg transition-all duration-300',
        'transform translate-x-0 opacity-100',
        variants[variant],
        className,
        {
          'animate-in slide-in-from-right-full': isVisible,
          'animate-out slide-out-to-right-full': !isVisible,
        }
      )}
      role="alert"
      data-testid="toast"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm mb-1" data-testid="toast-title">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90" data-testid="toast-description">
              {description}
            </div>
          )}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label="Close toast"
            data-testid="toast-close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export const Alert = ({
  title,
  description,
  variant = 'default',
  className,
  children,
}: AlertProps) => {
  const variants = {
    default: 'bg-background border-border text-text-primary',
    destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border',
        variants[variant],
        className
      )}
      role="alert"
      data-testid="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm mb-1" data-testid="alert-title">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm" data-testid="alert-description">
              {description}
            </div>
          )}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
