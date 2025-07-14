// Robust performance monitoring system

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
  tags?: Record<string, string>;
  url?: string;
  userAgent?: string;
}

export interface MetricFilter {
  name?: string;
  timeRange?: { start: number; end: number };
  tags?: Record<string, string>;
}

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunkSizes: Record<string, number>;
  unusedCode: number;
}

export interface WebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  INP?: number; // Interaction to Next Paint
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private timingMarks: Map<string, number> = new Map();
  private webVitals: WebVitalsMetrics = {};
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;
    
    this.initWebVitals();
    this.initPerformanceObservers();
    this.monitorRouteChanges();
    this.monitorAPIRequests();
    this.isInitialized = true;
  }

  private initWebVitals(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    onCLS((metric) => {
      this.webVitals.CLS = metric.value;
      this.recordMetric('web-vital-cls', metric.value, { type: 'web-vital' });
    });

    onINP((metric) => {
      this.webVitals.INP = metric.value;
      this.recordMetric('web-vital-inp', metric.value, { type: 'web-vital' });
    });

    onFCP((metric) => {
      this.webVitals.FCP = metric.value;
      this.recordMetric('web-vital-fcp', metric.value, { type: 'web-vital' });
    });

    onLCP((metric) => {
      this.webVitals.LCP = metric.value;
      this.recordMetric('web-vital-lcp', metric.value, { type: 'web-vital' });
    });

    onTTFB((metric) => {
      this.webVitals.TTFB = metric.value;
      this.recordMetric('web-vital-ttfb', metric.value, { type: 'web-vital' });
    });
  }

  private initPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Observer for resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource-load', resourceEntry.duration, {
              type: 'resource',
              resourceType: resourceEntry.initiatorType,
              url: resourceEntry.name
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Could not initialize resource observer:', e);
    }

    // Observer for long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long-task', entry.duration, {
              type: 'longtask',
              startTime: entry.startTime.toString()
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Could not initialize long task observer:', e);
    }
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      delta: 0,
      id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      tags,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only last 1000 metrics per name to prevent memory leaks
    const metricList = this.metrics.get(name)!;
    if (metricList.length > 1000) {
      metricList.splice(0, metricList.length - 1000);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric recorded:', metric);
    }

    // Send to analytics
    this.sendToAnalytics(metric);
  }

  startTiming(name: string): () => void {
    const startTime = performance.now();
    const markName = `${name}-start-${Date.now()}`;
    this.timingMarks.set(markName, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.timingMarks.delete(markName);
      this.recordMetric(name, duration, { type: 'timing' });
      return duration;
    };
  }

  markEvent(name: string, details?: any): void {
    this.recordMetric(name, 1, { 
      type: 'event',
      ...(details && { details: JSON.stringify(details) })
    });
  }

  getMetrics(filter?: MetricFilter): PerformanceMetric[] {
    let allMetrics: PerformanceMetric[] = [];
    
    if (filter?.name) {
      allMetrics = this.metrics.get(filter.name) || [];
    } else {
      for (const metricList of this.metrics.values()) {
        allMetrics.push(...metricList);
      }
    }

    // Apply time range filter
    if (filter?.timeRange) {
      allMetrics = allMetrics.filter(metric => 
        metric.timestamp >= filter.timeRange!.start && 
        metric.timestamp <= filter.timeRange!.end
      );
    }

    // Apply tag filter
    if (filter?.tags) {
      allMetrics = allMetrics.filter(metric => {
        if (!metric.tags) return false;
        return Object.entries(filter.tags!).every(([key, value]) => 
          metric.tags![key] === value
        );
      });
    }

    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  getWebVitals(): WebVitalsMetrics {
    return { ...this.webVitals };
  }

  getAverageMetric(metricName: string, timeWindow?: number): number {
    const now = Date.now();
    const startTime = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.getMetrics({
      name: metricName,
      timeRange: { start: startTime, end: now }
    });
    
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  getPercentile(metricName: string, percentile: number, timeWindow?: number): number {
    const now = Date.now();
    const startTime = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.getMetrics({
      name: metricName,
      timeRange: { start: startTime, end: now }
    });
    
    if (relevantMetrics.length === 0) return 0;
    
    const sortedValues = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private monitorRouteChanges(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('route-change', navigationEntry.loadEventEnd - navigationEntry.fetchStart, {
              type: 'navigation',
              navigationType: navigationEntry.type
            });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Could not initialize navigation observer:', e);
    }
  }

  private monitorAPIRequests(): void {
    if (typeof window === 'undefined' || typeof window.fetch === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : 
                  args[0] instanceof Request ? args[0].url : 
                  args[0].toString();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.recordMetric('api-request', endTime - startTime, {
          type: 'api',
          url: url,
          status: response.status.toString(),
          method: args[1]?.method || 'GET'
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.recordMetric('api-error', endTime - startTime, {
          type: 'api-error',
          url: url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    };
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
    if (process.env.NODE_ENV === 'production') {
      // Analytics integration would go here
      // For now, just log in production as well for debugging
      console.log('Metric to be sent to analytics:', metric);
    }
  }

  // For testing and debugging
  reset(): void {
    this.metrics.clear();
    this.timingMarks.clear();
    this.webVitals = {};
  }

  destroy(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.reset();
    this.isInitialized = false;
  }
}

export const performanceMonitor = new PerformanceMonitor();
