import { supabase } from '../supabase';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  responseTime: number;
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface OverallHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheckResult>;
  timestamp: string;
  uptime: number;
}

export class HealthCheck {
  private startTime: number = Date.now();
  private cache: Map<string, { result: HealthCheckResult; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Check database connectivity and basic functionality
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const service = 'database';

    try {
      // Simple connectivity test - try to select from a system table
      const { data, error } = await supabase
        .from('users') // Assuming users table exists
        .select('id')
        .limit(1);

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          service,
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.message,
          metadata: { errorCode: error.code }
        };
      }

      // Check if we can read data (even if empty)
      if (data !== null) {
        return {
          status: 'healthy',
          service,
          responseTime,
          timestamp: new Date().toISOString(),
          metadata: { recordCount: data.length }
        };
      }

      return {
        status: 'degraded',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        error: 'Unable to verify database connectivity'
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'unhealthy',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check authentication service health
   */
  async checkAuth(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const service = 'auth';

    try {
      // Test auth service by checking session (doesn't require authenticated user)
      const { data, error } = await supabase.auth.getSession();
      
      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          service,
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }

      return {
        status: 'healthy',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: { hasSession: !!data.session }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'unhealthy',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown auth error'
      };
    }
  }

  /**
   * Check external API health (Gemini API)
   */
  async checkExternalAPIs(): Promise<{ gemini: HealthCheckResult }> {
    const geminiResult = await this.checkGeminiAPI();
    
    return {
      gemini: geminiResult
    };
  }

  private async checkGeminiAPI(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const service = 'gemini-api';

    try {
      // For health checks, we'll use a simple connectivity test
      // In production, this might be a minimal API call or a dedicated health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      // Mock health check - in real implementation, this would be a minimal API call
      const response = await fetch('https://generativelanguage.googleapis.com/', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      if (response.ok || response.status === 404) { // 404 is expected for root endpoint
        return {
          status: 'healthy',
          service,
          responseTime,
          timestamp: new Date().toISOString(),
          metadata: { httpStatus: response.status }
        };
      }

      return {
        status: 'degraded',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}`,
        metadata: { httpStatus: response.status }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'unhealthy',
          service,
          responseTime,
          timestamp: new Date().toISOString(),
          error: 'Request timeout (5s)'
        };
      }

      return {
        status: 'unhealthy',
        service,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  /**
   * Get overall health status with caching
   */
  async getOverallHealth(): Promise<OverallHealthResult> {
    const cacheKey = 'overall-health';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.result as unknown as OverallHealthResult;
    }

    // Run all health checks in parallel
    const [database, auth, externalAPIs] = await Promise.all([
      this.checkDatabase(),
      this.checkAuth(),
      this.checkExternalAPIs()
    ]);

    const checks: Record<string, HealthCheckResult> = {
      database,
      auth,
      ...externalAPIs
    };

    // Determine overall status
    const statuses = Object.values(checks).map(check => check.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (statuses.every(status => status === 'healthy')) {
      overallStatus = 'healthy';
    } else if (statuses.some(status => status === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const result: OverallHealthResult = {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };

    // Cache the result
    this.cache.set(cacheKey, {
      result: result as unknown as HealthCheckResult,
      expiry: Date.now() + this.CACHE_DURATION
    });

    return result;
  }

  /**
   * Clear health check cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get a simple health check endpoint response
   * Useful for load balancer health checks
   */
  async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const health = await this.getOverallHealth();
      return {
        status: health.status === 'healthy' ? 'ok' : 'error',
        timestamp: health.timestamp
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const healthCheck = new HealthCheck();
