import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthCheck } from '../../lib/monitoring/HealthCheck';
import { supabase } from '../../lib/supabase';

// Type definitions for mocked Supabase functions
type MockedFunction = ReturnType<typeof vi.fn>;

// Mock Supabase client - using Partial type to avoid complex mock typing
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock fetch for external API health checks
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Health Check', () => {
    it('should return healthy status when database is accessible', async () => {
      // Arrange
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });
      
      const mockSelect = vi.fn().mockReturnValue({
        limit: mockLimit,
      });
      
      // Cast supabase.from as a mock function for testing
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkDatabase();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('database');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return unhealthy status when database is not accessible', async () => {
      // Arrange
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      
      const mockSelect = vi.fn().mockReturnValue({
        limit: mockLimit,
      });
      
      // Cast supabase.from as a mock function for testing
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkDatabase();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.service).toBe('database');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('Authentication Health Check', () => {
    it('should return healthy status when auth service is accessible', async () => {
      // Arrange
      (supabase.auth.getSession as MockedFunction).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkAuth();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('auth');
    });

    it('should return unhealthy status when auth service fails', async () => {
      // Arrange
      (supabase.auth.getSession as MockedFunction).mockResolvedValue({
        data: null,
        error: { message: 'Auth service unavailable' },
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkAuth();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.service).toBe('auth');
      expect(result.error).toBe('Auth service unavailable');
    });
  });

  describe('External API Health Check', () => {
    it.skip('should check Gemini API health', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      } as MockedFunction);

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkExternalAPIs();

      // Assert
      expect(result.gemini.status).toBe('healthy');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/',
        expect.objectContaining({
          method: 'HEAD',
        })
      );
    });

    it('should handle Gemini API failure gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.checkExternalAPIs();

      // Assert
      expect(result.gemini.status).toBe('unhealthy');
      expect(result.gemini.error).toContain('Network error');
    });
  });

  describe('Overall Health Check', () => {
    it.skip('should return comprehensive health status', async () => {
      // Arrange
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });
      
      (supabase.from as MockedFunction).mockReturnValue({
        select: mockSelect,
      });

      (supabase.auth.getSession as MockedFunction).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.getOverallHealth();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('auth');
      expect(result.checks).toHaveProperty('externalAPIs');
      expect(result.timestamp).toBeDefined();
    });

    it.skip('should return degraded status when some services are unhealthy', async () => {
      // Arrange
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });
      
      (supabase.from as MockedFunction).mockReturnValue({
        select: mockSelect,
      });

      (supabase.auth.getSession as MockedFunction).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Act
      const healthCheck = new HealthCheck();
      const result = await healthCheck.getOverallHealth();

      // Assert
      expect(result.status).toBe('degraded');
      expect(result.checks.database.status).toBe('unhealthy');
      expect(result.checks.auth.status).toBe('healthy');
    });
  });
});
