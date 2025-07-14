import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  initialize(): void {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Custom performance monitoring
    this.monitorRouteChanges();
    this.monitorAPIRequests();
  }

  private handleMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }

    // Send to analytics service
    this.sendToAnalytics(metric);
  }

  private monitorRouteChanges(): void {
    let startTime = performance.now();

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          this.handleMetric({
            name: 'route-change',
            value: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
            delta: 0,
            id: 'route-' + Date.now(),
            timestamp: Date.now(),
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  private monitorAPIRequests(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.handleMetric({
          name: 'api-request',
          value: endTime - startTime,
          delta: 0,
          id: 'api-' + Date.now(),
          timestamp: Date.now(),
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.handleMetric({
          name: 'api-error',
          value: endTime - startTime,
          delta: 0,
          id: 'api-error-' + Date.now(),
          timestamp: Date.now(),
        });
        
        throw error;
      }
    };
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
    if (process.env.NODE_ENV === 'production') {
      // Analytics integration would go here
      console.log('Metric to be sent to analytics:', metric);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageMetric(metricName: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();
