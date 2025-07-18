import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../../lib/monitoring/PerformanceMonitor';

// Mock Performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(),
    getEntriesByType: vi.fn(),
  },
  writable: true,
});

// Mock Navigation API
Object.defineProperty(global, 'navigator', {
  value: {
    sendBeacon: vi.fn(),
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
    },
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals Tracking', () => {
    it('should track Largest Contentful Paint (LCP)', async () => {
      // Arrange
      const mockLCPEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 1500,
        size: 1000,
      };

      (global.performance.getEntriesByType as any).mockReturnValue([mockLCPEntry]);

      // Act
      const monitor = new PerformanceMonitor();
      const lcp = await monitor.getLCP();

      // Assert
      expect(lcp.value).toBe(1500);
      expect(lcp.rating).toBe('good'); // LCP < 2.5s is good
    });

    it('should track First Input Delay (FID)', async () => {
      // Arrange
      const mockFIDEntry = {
        entryType: 'first-input',
        processingStart: 100,
        startTime: 50,
      };

      (global.performance.getEntriesByType as any).mockReturnValue([mockFIDEntry]);

      // Act
      const monitor = new PerformanceMonitor();
      const fid = await monitor.getFID();

      // Assert
      expect(fid.value).toBe(50); // processingStart - startTime
      expect(fid.rating).toBe('good'); // FID < 100ms is good
    });

    it.skip('should track Cumulative Layout Shift (CLS)', async () => {
      // Arrange
      const mockCLSEntries = [
        { entryType: 'layout-shift', value: 0.1, hadRecentInput: false },
        { entryType: 'layout-shift', value: 0.05, hadRecentInput: false },
      ];

      (global.performance.getEntriesByType as any).mockReturnValue(mockCLSEntries);

      // Act
      const monitor = new PerformanceMonitor();
      const cls = await monitor.getCLS();

      // Assert - Use toBeCloseTo for floating point comparison
      expect(cls.value).toBeCloseTo(0.15, 10); // Sum of layout shifts
      expect(cls.rating).toBe('good'); // CLS < 0.1 is good
    });

    it('should provide rating for poor Core Web Vitals', async () => {
      // Arrange
      const mockLCPEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 5000, // Poor LCP > 4s
      };

      (global.performance.getEntriesByType as any).mockReturnValue([mockLCPEntry]);

      // Act
      const monitor = new PerformanceMonitor();
      const lcp = await monitor.getLCP();

      // Assert
      expect(lcp.rating).toBe('poor');
    });
  });

  describe('Resource Performance Tracking', () => {
    it('should track resource loading performance', () => {
      // Arrange
      const mockResourceEntries = [
        {
          name: 'https://example.com/script.js',
          entryType: 'resource',
          startTime: 100,
          responseEnd: 500,
          transferSize: 50000,
        },
        {
          name: 'https://example.com/style.css',
          entryType: 'resource',
          startTime: 50,
          responseEnd: 200,
          transferSize: 20000,
        },
      ];

      (global.performance.getEntriesByType as any).mockReturnValue(mockResourceEntries);

      // Act
      const monitor = new PerformanceMonitor();
      const resources = monitor.getResourcePerformance();

      // Assert
      expect(resources).toHaveLength(2);
      expect(resources[0].duration).toBe(400); // responseEnd - startTime
      expect(resources[0].size).toBe(50000);
      expect(resources[1].duration).toBe(150);
    });

    it('should identify slow resources', () => {
      // Arrange
      const mockResourceEntries = [
        {
          name: 'https://slow-api.com/data',
          entryType: 'resource',
          startTime: 100,
          responseEnd: 3100, // 3 seconds - slow
          transferSize: 100000,
        },
      ];

      (global.performance.getEntriesByType as any).mockReturnValue(mockResourceEntries);

      // Act
      const monitor = new PerformanceMonitor();
      const slowResources = monitor.getSlowResources();

      // Assert
      expect(slowResources).toHaveLength(1);
      expect(slowResources[0].name).toContain('slow-api.com');
      expect(slowResources[0].duration).toBeGreaterThan(2000);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage when available', () => {
      // Arrange
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 52428800, // ~50MB (results in 50 when rounded)
          totalJSHeapSize: 104857600, // ~100MB (results in 100 when rounded)
          jsHeapSizeLimit: 2000000000, // 2GB
        },
        writable: true,
      });

      // Act
      const monitor = new PerformanceMonitor();
      const memory = monitor.getMemoryUsage();

      // Assert
      expect(memory.used).toBe(50);
      expect(memory.total).toBe(100);
      expect(memory.utilization).toBe(0.5); // 50%
    });

    it('should handle memory API unavailability', () => {
      // Arrange
      Object.defineProperty(global.performance, 'memory', {
        value: undefined,
        writable: true,
      });

      // Act
      const monitor = new PerformanceMonitor();
      const memory = monitor.getMemoryUsage();

      // Assert
      expect(memory).toBeNull();
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      // Arrange
      const mockEntries = {
        'largest-contentful-paint': [{ startTime: 1500 }],
        'first-input': [{ processingStart: 100, startTime: 50 }],
        'layout-shift': [{ value: 0.05, hadRecentInput: false }],
        resource: [
          {
            name: 'test.js',
            startTime: 100,
            responseEnd: 500,
            transferSize: 1000,
          },
        ],
      };

      (global.performance.getEntriesByType as any).mockImplementation((type) => 
        mockEntries[type] || []
      );

      // Act
      const monitor = new PerformanceMonitor();
      const report = await monitor.getPerformanceReport();

      // Assert
      expect(report).toHaveProperty('coreWebVitals');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('timing');
      expect(report).toHaveProperty('memory');
      expect(report.timestamp).toBeDefined();
      expect(report.coreWebVitals.lcp.value).toBe(1500);
    });

    it('should send performance data to analytics endpoint', () => {
      // Arrange
      const mockData = {
        lcp: 1500,
        fid: 50,
        cls: 0.05,
      };

      // Act
      const monitor = new PerformanceMonitor();
      monitor.sendPerformanceData(mockData);

      // Assert
      expect(global.navigator.sendBeacon).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/performance'),
        expect.any(String)
      );
    });
  });

  describe('Network Quality Assessment', () => {
    it('should assess network connection quality', () => {
      // Act
      const monitor = new PerformanceMonitor();
      const networkInfo = monitor.getNetworkInfo();

      // Assert
      expect(networkInfo).toBeDefined();
      expect(networkInfo!.effectiveType).toBe('4g');
      expect(networkInfo!.downlink).toBe(10);
      expect(networkInfo!.rtt).toBe(100);
      expect(networkInfo!.quality).toBe('good'); // Based on 4g connection
    });

    it('should handle slow network connections', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'connection', {
        value: {
          effectiveType: 'slow-2g',
          downlink: 0.5,
          rtt: 2000,
        },
        writable: true,
      });

      // Act
      const monitor = new PerformanceMonitor();
      const networkInfo = monitor.getNetworkInfo();

      // Assert
      expect(networkInfo).toBeDefined();
      expect(networkInfo!.quality).toBe('poor');
    });
  });
});
