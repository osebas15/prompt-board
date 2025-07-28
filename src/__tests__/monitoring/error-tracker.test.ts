import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { ErrorTracker } from '../../lib/monitoring/ErrorTracker';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

describe('ErrorTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Error Capture', () => {
    it('should capture and log JavaScript errors', () => {
      // Arrange
      const error = new Error('Test error');
      const errorTracker = new ErrorTracker();

      // Act
      errorTracker.captureError(error, {
        component: 'TestComponent',
        action: 'button-click',
      });

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error captured'),
        expect.objectContaining({
          message: 'Test error',
          component: 'TestComponent',
        })
      );
    });

    it('should capture errors with user context', () => {
      // Arrange
      const error = new Error('User action failed');
      const errorTracker = new ErrorTracker();
      
      errorTracker.setUserContext({
        id: 'user-123',
        email: 'test@example.com',
      });

      // Act
      errorTracker.captureError(error);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error captured'),
        expect.objectContaining({
          user: { id: 'user-123', email: 'test@example.com' },
        })
      );
    });

    it('should capture unhandled promise rejections', () => {
      // Arrange
      const errorTracker = new ErrorTracker();
      const rejectionReason = 'Promise rejected';

      // Act
      errorTracker.captureUnhandledRejection(rejectionReason);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled promise rejection'),
        expect.objectContaining({
          reason: rejectionReason,
        })
      );
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors', () => {
      // Arrange
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      const errorTracker = new ErrorTracker();

      // Act
      const category = errorTracker.categorizeError(networkError);

      // Assert
      expect(category).toBe('network');
    });

    it('should categorize authentication errors', () => {
      // Arrange
      const authError = new Error('Unauthorized');
      authError.name = 'AuthError';
      const errorTracker = new ErrorTracker();

      // Act
      const category = errorTracker.categorizeError(authError);

      // Assert
      expect(category).toBe('authentication');
    });

    it('should categorize validation errors', () => {
      // Arrange
      const validationError = new Error('Invalid input');
      const errorTracker = new ErrorTracker();

      // Act
      const category = errorTracker.categorizeError(validationError, {
        source: 'form-validation',
      });

      // Assert
      expect(category).toBe('validation');
    });

    it('should default to unknown category for unrecognized errors', () => {
      // Arrange
      const unknownError = new Error('Something went wrong');
      const errorTracker = new ErrorTracker();

      // Act
      const category = errorTracker.categorizeError(unknownError);

      // Assert
      expect(category).toBe('unknown');
    });
  });

  describe('Error Storage', () => {
    it('should store errors in local database for analysis', async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      });
      
      (supabase.from as MockedFunction<typeof supabase.from>).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<typeof supabase.from>);

      const error = new Error('Test error');
      const errorTracker = new ErrorTracker();

      // Act
      await errorTracker.storeError(error, {
        component: 'TestComponent',
        severity: 'high',
      });

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          component: 'TestComponent',
          severity: 'high',
          category: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle storage failures gracefully', async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage failed' },
      });
      
      (supabase.from as MockedFunction<typeof supabase.from>).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<typeof supabase.from>);

      const error = new Error('Test error');
      const errorTracker = new ErrorTracker();

      // Act
      await errorTracker.storeError(error);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store error'),
        expect.any(String)
      );
    });
  });

  describe('Error Analytics', () => {
    it('should track error frequency by category', () => {
      // Arrange
      const errorTracker = new ErrorTracker();
      const errors = [
        new Error('Network timeout'),
        new Error('Validation failed'),
        new Error('Another network error'),
      ];

      // Act
      errors.forEach((error, index) => {
        errorTracker.captureError(error, {
          category: index < 2 ? 'network' : 'validation',
        });
      });

      const stats = errorTracker.getErrorStats();

      // Assert
      expect(stats.byCategory.network).toBe(2);
      expect(stats.byCategory.validation).toBe(1);
    });

    it('should provide error trends over time', () => {
      // Arrange
      const errorTracker = new ErrorTracker();
      
      // Act - capture errors with real timestamps
      errorTracker.captureError(new Error('Error 1'));
      errorTracker.captureError(new Error('Error 2'));
      errorTracker.captureError(new Error('Error 3'));

      const trends = errorTracker.getErrorTrends();

      // Assert - all errors should be in recent timeframes
      expect(trends.lastHour).toBe(3);
      expect(trends.last30Minutes).toBe(3);
      expect(trends.last24Hours).toBe(3);
    });

    it('should identify error hotspots by component', () => {
      // Arrange
      const errorTracker = new ErrorTracker();

      // Act
      errorTracker.captureError(new Error('Error 1'), { component: 'ComponentA' });
      errorTracker.captureError(new Error('Error 2'), { component: 'ComponentA' });
      errorTracker.captureError(new Error('Error 3'), { component: 'ComponentB' });

      const hotspots = errorTracker.getErrorHotspots();

      // Assert
      expect(hotspots[0]).toEqual(
        expect.objectContaining({
          component: 'ComponentA',
          count: 2,
        })
      );
      expect(hotspots[1]).toEqual(
        expect.objectContaining({
          component: 'ComponentB',
          count: 1,
        })
      );
    });
  });

  describe('Error Recovery', () => {
    it('should provide error recovery suggestions', () => {
      // Arrange
      const networkError = new Error('Failed to fetch');
      const errorTracker = new ErrorTracker();

      // Act
      const suggestions = errorTracker.getRecoverySuggestions(networkError);

      // Assert
      expect(suggestions).toContain('Check network connection');
      expect(suggestions).toContain('Retry the request');
    });

    it('should suggest different recovery for authentication errors', () => {
      // Arrange
      const authError = new Error('Unauthorized');
      authError.name = 'AuthError';
      const errorTracker = new ErrorTracker();

      // Act
      const suggestions = errorTracker.getRecoverySuggestions(authError);

      // Assert
      expect(suggestions).toContain('Re-authenticate');
      expect(suggestions).toContain('Check permissions');
    });
  });

  describe('Error Reporting', () => {
    it('should generate comprehensive error report', () => {
      // Arrange
      const errorTracker = new ErrorTracker();
      
      // Add some errors
      errorTracker.captureError(new Error('Error 1'), { component: 'A' });
      errorTracker.captureError(new Error('Error 2'), { component: 'B' });

      // Act
      const report = errorTracker.generateErrorReport();

      // Assert
      expect(report).toHaveProperty('totalErrors');
      expect(report).toHaveProperty('errorsByCategory');
      expect(report).toHaveProperty('errorsByComponent');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('timestamp');
    });
  });
});
