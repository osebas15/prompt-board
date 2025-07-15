import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorLogger } from '@/lib/errors/errorLogger';
import type { AppError } from '@/lib/errors/types';

// Mock external dependencies
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('ErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    global.localStorage.clear();
  });

  describe('logError', () => {
    it('should log error with all required properties', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Test error') as AppError;
      error.severity = 'high';
      error.errorId = 'test-error-id';

      errorLogger.logError(error, {
        userId: 'user-123',
        action: 'test-action',
        context: { page: 'test-page' }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          errorId: 'test-error-id',
          message: 'Test error',
          severity: 'high',
          userId: 'user-123',
          action: 'test-action',
          context: { page: 'test-page' },
          timestamp: expect.any(String),
          userAgent: expect.any(String),
          url: expect.any(String)
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should store error in localStorage for offline scenarios', () => {
      const error = new Error('Offline error') as AppError;
      error.severity = 'medium';

      errorLogger.logError(error, { userId: 'user-123' });

      const storedErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      expect(storedErrors).toHaveLength(1);
      expect(storedErrors[0]).toMatchObject({
        message: 'Offline error',
        severity: 'medium',
        userId: 'user-123'
      });
    });

    it('should limit stored errors to maximum count', () => {
      // Fill localStorage with max errors
      for (let i = 0; i < 105; i++) {
        const error = new Error(`Error ${i}`) as AppError;
        errorLogger.logError(error, { userId: 'user-123' });
      }

      const storedErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      expect(storedErrors).toHaveLength(100); // Should be limited to 100
      expect(storedErrors[0].message).toBe('Error 5'); // Oldest errors removed
    });

    it('should generate errorId if not provided', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Error without ID');

      errorLogger.logError(error, { userId: 'user-123' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          errorId: expect.stringMatching(/^error_\d+_[a-z0-9]{8}$/),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStoredErrors', () => {
    it('should return stored errors from localStorage', () => {
      const error1 = new Error('Error 1') as AppError;
      const error2 = new Error('Error 2') as AppError;

      errorLogger.logError(error1, { userId: 'user-123' });
      errorLogger.logError(error2, { userId: 'user-456' });

      const storedErrors = errorLogger.getStoredErrors();
      expect(storedErrors).toHaveLength(2);
      expect(storedErrors[0].message).toBe('Error 1');
      expect(storedErrors[1].message).toBe('Error 2');
    });

    it('should return empty array if no errors stored', () => {
      const storedErrors = errorLogger.getStoredErrors();
      expect(storedErrors).toEqual([]);
    });
  });

  describe('clearStoredErrors', () => {
    it('should remove all stored errors from localStorage', () => {
      const error = new Error('Test error') as AppError;
      errorLogger.logError(error, { userId: 'user-123' });

      expect(errorLogger.getStoredErrors()).toHaveLength(1);

      errorLogger.clearStoredErrors();

      expect(errorLogger.getStoredErrors()).toHaveLength(0);
      expect(localStorage.getItem('error_logs')).toBeNull();
    });
  });

  describe('createAppError', () => {
    it('should create AppError with all properties', () => {
      const originalError = new Error('Original error');
      const appError = errorLogger.createAppError(
        'Custom message',
        'high',
        'custom-error-id',
        { action: 'test' },
        originalError
      );

      expect(appError.message).toBe('Custom message');
      expect(appError.severity).toBe('high');
      expect(appError.errorId).toBe('custom-error-id');
      expect(appError.context).toEqual({ action: 'test' });
      expect(appError.originalError).toBe(originalError);
      expect(appError.timestamp).toBeInstanceOf(Date);
    });

    it('should generate errorId if not provided', () => {
      const appError = errorLogger.createAppError('Test message', 'low');

      expect(appError.errorId).toMatch(/^error_\d+_[a-z0-9]{8}$/);
    });

    it('should default severity to medium if not provided', () => {
      const appError = errorLogger.createAppError('Test message');

      expect(appError.severity).toBe('medium');
    });
  });

  describe('error severity handling', () => {
    it('should handle critical errors differently', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const criticalError = new Error('Critical system failure') as AppError;
      criticalError.severity = 'critical';

      errorLogger.logError(criticalError, { userId: 'user-123' });

      // Critical errors should be logged with special formatting
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger] CRITICAL ERROR:',
        expect.objectContaining({
          severity: 'critical',
          message: 'Critical system failure'
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
