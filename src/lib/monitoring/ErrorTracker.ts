import { supabase } from '../supabase';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface ErrorStats {
  total: number;
  byCategory: Record<string, number>;
  byComponent: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface ErrorTrends {
  lastHour: number;
  last24Hours: number;
  last7Days: number;
  last30Minutes: number;
}

export interface ErrorHotspot {
  component: string;
  count: number;
  lastOccurred: string;
}

export interface ErrorReport {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByComponent: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  trends: ErrorTrends;
  hotspots: ErrorHotspot[];
  timestamp: string;
}

export class ErrorTracker {
  private errors: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: number;
  }> = [];
  
  private userContext: { id?: string; email?: string } | null = null;
  private readonly MAX_STORED_ERRORS = 1000;

  /**
   * Set user context for error tracking
   */
  setUserContext(user: { id?: string; email?: string }): void {
    this.userContext = user;
  }

  /**
   * Capture and log an error with context
   */
  captureError(error: Error, context: ErrorContext = {}): void {
    const timestamp = Date.now();
    const enhancedContext = {
      ...context,
      userId: context.userId || this.userContext?.id,
      category: context.category || this.categorizeError(error, context),
      severity: context.severity || this.determineSeverity(error, context)
    };

    // Store error for analytics
    this.errors.push({
      error,
      context: enhancedContext,
      timestamp
    });

    // Maintain size limit
    if (this.errors.length > this.MAX_STORED_ERRORS) {
      this.errors.shift();
    }

    // Log to console with context
    console.error('Error captured:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...enhancedContext,
      user: this.userContext,
      timestamp: new Date(timestamp).toISOString(),
      url: window.location.href
    });

    // Send to Sentry if available
    this.sendToSentry(error, enhancedContext);

    // Store in database for analysis
    this.storeError(error, enhancedContext);
  }

  /**
   * Capture unhandled promise rejections
   */
  captureUnhandledRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    console.error('Unhandled promise rejection:', {
      reason: String(reason),
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    this.captureError(error, {
      category: 'promise-rejection',
      severity: 'high',
      source: 'unhandled-rejection'
    });
  }

  /**
   * Categorize errors based on type and context
   */
  categorizeError(error: Error, context: ErrorContext = {}): string {
    // Check context source first
    if (context.source) {
      if (context.source.includes('network') || context.source.includes('api')) {
        return 'network';
      }
      if (context.source.includes('auth')) {
        return 'authentication';
      }
      if (context.source.includes('validation')) {
        return 'validation';
      }
    }

    // Check error name and message
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'network';
    }
    
    if (error.name === 'AuthError' || error.message.includes('Unauthorized')) {
      return 'authentication';
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'programming';
    }
    
    if (error.message.includes('timeout') || error.message.includes('performance')) {
      return 'performance';
    }

    // Check component context
    if (context.component) {
      if (context.component.toLowerCase().includes('form')) {
        return 'validation';
      }
      if (context.component.toLowerCase().includes('api')) {
        return 'network';
      }
    }

    return 'unknown';
  }

  /**
   * Determine error severity based on error type and context
   */
  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (error.message.includes('data loss') || error.message.includes('security')) {
      return 'critical';
    }

    // High severity errors
    if (
      error.name === 'NetworkError' ||
      error.message.includes('auth') ||
      error.message.includes('database') ||
      context.category === 'authentication'
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      error.name === 'TypeError' ||
      error.name === 'ReferenceError' ||
      context.category === 'validation'
    ) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  /**
   * Send error to Sentry (if configured)
   */
  private sendToSentry(error: Error, context: ErrorContext): void {
    // In a real implementation, this would use Sentry SDK
    // For now, we'll just prepare the data structure
    const sentryData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      tags: {
        component: context.component,
        category: context.category,
        severity: context.severity
      },
      user: this.userContext,
      extra: context.metadata,
      level: this.mapSeverityToSentryLevel(context.severity || 'medium')
    };

    // Log what would be sent to Sentry
    console.debug('Would send to Sentry:', sentryData);
  }

  /**
   * Map our severity levels to Sentry levels
   */
  private mapSeverityToSentryLevel(severity: string): string {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
  }

  /**
   * Store error in database for analysis
   */
  async storeError(error: Error, context: ErrorContext = {}): Promise<void> {
    try {
      const enhancedContext = {
        ...context,
        category: context.category || this.categorizeError(error, context),
        severity: context.severity || this.determineSeverity(error, context)
      };

      const { error: supabaseError } = await supabase
        .from('error_logs')
        .insert({
          message: error.message,
          stack: error.stack,
          name: error.name,
          component: enhancedContext.component,
          category: enhancedContext.category,
          severity: enhancedContext.severity,
          user_id: enhancedContext.userId,
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          metadata: enhancedContext.metadata || {}
        });

      if (supabaseError) {
        console.warn('Failed to store error in database:', supabaseError.message);
      }
    } catch (storageError) {
      console.warn('Failed to store error:', storageError);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const byCategory: Record<string, number> = {};
    const byComponent: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.errors.forEach(({ context }) => {
      // Count by category
      const category = context.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Count by component
      const component = context.component || 'unknown';
      byComponent[component] = (byComponent[component] || 0) + 1;

      // Count by severity
      const severity = context.severity || 'medium';
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCategory,
      byComponent,
      bySeverity
    };
  }

  /**
   * Get error trends over time
   */
  getErrorTrends(): ErrorTrends {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const week = 7 * day;

    return {
      last30Minutes: this.errors.filter(e => now - e.timestamp < 30 * 60 * 1000).length,
      lastHour: this.errors.filter(e => now - e.timestamp < hour).length,
      last24Hours: this.errors.filter(e => now - e.timestamp < day).length,
      last7Days: this.errors.filter(e => now - e.timestamp < week).length
    };
  }

  /**
   * Get error hotspots (components with most errors)
   */
  getErrorHotspots(): ErrorHotspot[] {
    const componentCounts: Record<string, { count: number; lastOccurred: number }> = {};

    this.errors.forEach(({ context, timestamp }) => {
      const component = context.component || 'unknown';
      if (!componentCounts[component]) {
        componentCounts[component] = { count: 0, lastOccurred: 0 };
      }
      componentCounts[component].count++;
      componentCounts[component].lastOccurred = Math.max(
        componentCounts[component].lastOccurred,
        timestamp
      );
    });

    return Object.entries(componentCounts)
      .map(([component, data]) => ({
        component,
        count: data.count,
        lastOccurred: new Date(data.lastOccurred).toISOString()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 hotspots
  }

  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error: Error): string[] {
    const suggestions: string[] = [];
    const category = this.categorizeError(error);

    switch (category) {
      case 'network':
        suggestions.push('Check network connection');
        suggestions.push('Retry the request');
        suggestions.push('Check if the service is available');
        break;
      case 'authentication':
        suggestions.push('Re-authenticate');
        suggestions.push('Check permissions');
        suggestions.push('Clear browser cache and cookies');
        break;
      case 'validation':
        suggestions.push('Check input data');
        suggestions.push('Verify required fields');
        suggestions.push('Check data format');
        break;
      case 'performance':
        suggestions.push('Check system resources');
        suggestions.push('Close unnecessary applications');
        suggestions.push('Refresh the page');
        break;
      default:
        suggestions.push('Refresh the page');
        suggestions.push('Contact support if the issue persists');
    }

    return suggestions;
  }

  /**
   * Generate comprehensive error report
   */
  generateErrorReport(): ErrorReport {
    const stats = this.getErrorStats();
    const trends = this.getErrorTrends();
    const hotspots = this.getErrorHotspots();

    return {
      totalErrors: stats.total,
      errorsByCategory: stats.byCategory,
      errorsByComponent: stats.byComponent,
      errorsBySeverity: stats.bySeverity,
      trends,
      hotspots,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear stored errors (useful for testing)
   */
  clearErrors(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();
