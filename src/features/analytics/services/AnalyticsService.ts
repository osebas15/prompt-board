import { supabase } from '../../../lib/supabase';
import type {
  AnalyticsEvent,
  PromptEvent,
  SearchEvent,
  NavigationEvent,
  PerformanceEvent,
  ErrorEvent,
  AnalyticsQuery,
  AnalyticsResult,
  UsageMetrics,
  PromptAnalytics,
  LiveMetrics,
} from '../types/analytics';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxQueueSize: number = 100;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startEventFlush();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Session Management
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Event Tracking - Generic method for internal use
  private async trackEventInternal(event: AnalyticsEvent): Promise<void> {
    this.eventQueue.push(event);

    // Flush if queue is full or event is critical
    if (this.eventQueue.length >= this.maxQueueSize || event.type === 'error_occurred') {
      await this.flushEvents();
    }
  }

  // Public event tracking methods for specific event types

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Queue Management
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const { error } = await supabase
        .from('analytics_events')
        .insert(events.map(event => ({
          id: event.id,
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: event.timestamp.toISOString(),
          type: event.type,
          category: event.category,
          data: event,
        })));

      if (error) {
        console.error('Failed to flush analytics events:', error);
        // Re-queue events for retry
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }

  private startEventFlush(): void {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
      });
    }
  }

  // Convenience Methods for Common Events
  async trackPromptCreated(promptId: string, category?: string, tags?: string[]): Promise<void> {
    const event: PromptEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'prompt_created',
      category: 'prompt',
      promptId,
      promptCategory: category,
      promptTags: tags,
    };
    await this.trackEventInternal(event);
  }

  async trackPromptUsed(promptId: string, metadata?: Record<string, any>): Promise<void> {
    const event: PromptEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'prompt_used',
      category: 'prompt',
      promptId,
      metadata,
    };
    await this.trackEventInternal(event);
  }

  async trackSearchPerformed(query: string, resultsCount: number, filters?: Record<string, any>): Promise<void> {
    const event: SearchEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'search_performed',
      category: 'search',
      query,
      resultsCount,
      filters,
    };
    await this.trackEventInternal(event);
  }

  async trackPageView(page: string, duration?: number): Promise<void> {
    const event: NavigationEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'page_viewed',
      category: 'navigation',
      page,
      duration,
    };
    await this.trackEventInternal(event);
  }

  async trackFeatureUsed(feature: string, action?: string): Promise<void> {
    const event: NavigationEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'feature_accessed',
      category: 'feature',
      page: feature, // Using page field for feature name for now
      feature,
      action,
    };
    await this.trackEventInternal(event);
  }

  async trackError(errorCode: string, errorMessage: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const event: ErrorEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'error_occurred',
      category: 'error',
      errorCode,
      errorMessage,
      severity,
    };
    await this.trackEventInternal(event);
  }

  async trackPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): Promise<void> {
    const event: PerformanceEvent = {
      id: this.generateEventId(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date(),
      type: 'performance_metric',
      category: 'performance',
      metric,
      value,
      unit,
      context,
    };
    await this.trackEventInternal(event);
  }

  // Data Querying
  async query(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();

    try {
      let dbQuery = supabase
        .from('analytics_events')
        .select('*');

      // Apply filters
      if (query.filters) {
        query.filters.forEach(filter => {
          switch (filter.operator) {
            case '=':
              dbQuery = dbQuery.eq(filter.field, filter.value);
              break;
            case '!=':
              dbQuery = dbQuery.neq(filter.field, filter.value);
              break;
            case '>':
              dbQuery = dbQuery.gt(filter.field, filter.value);
              break;
            case '<':
              dbQuery = dbQuery.lt(filter.field, filter.value);
              break;
            case '>=':
              dbQuery = dbQuery.gte(filter.field, filter.value);
              break;
            case '<=':
              dbQuery = dbQuery.lte(filter.field, filter.value);
              break;
            case 'in':
              dbQuery = dbQuery.in(filter.field, filter.value);
              break;
            case 'like':
              dbQuery = dbQuery.ilike(filter.field, `%${filter.value}%`);
              break;
          }
        });
      }

      // Apply time range
      dbQuery = dbQuery
        .gte('timestamp', query.timeframe.start.toISOString())
        .lte('timestamp', query.timeframe.end.toISOString());

      // Apply ordering
      if (query.orderBy) {
        dbQuery = dbQuery.order(query.orderBy.field, { ascending: query.orderBy.direction === 'asc' });
      }

      // Apply pagination
      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }
      if (query.offset) {
        dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 100) - 1);
      }

      const { data, error, count } = await dbQuery;

      if (error) {
        throw new Error(`Analytics query failed: ${error.message}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        data: data || [],
        totalCount: count || 0,
        metadata: {
          query,
          executionTime,
          generatedAt: new Date(),
          cached: false,
        },
      };
    } catch (error) {
      console.error('Analytics query error:', error);
      throw error;
    }
  }

  // Usage Metrics
  async getUsageMetrics(timeframe: { start: Date; end: Date }): Promise<UsageMetrics> {
    try {
      // Get total prompts
      const { count: totalPrompts } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true });

      // Get active users in timeframe
      const { data: activeUsersData } = await supabase
        .from('analytics_events')
        .select('user_id')
        .gte('timestamp', timeframe.start.toISOString())
        .lte('timestamp', timeframe.end.toISOString())
        .not('user_id', 'eq', 'anonymous');

      const activeUsers = new Set(activeUsersData?.map(event => event.user_id) || []).size;

      // Get feature usage
      const { data: featureUsageData } = await supabase
        .from('analytics_events')
        .select('type')
        .gte('timestamp', timeframe.start.toISOString())
        .lte('timestamp', timeframe.end.toISOString())
        .eq('category', 'feature');

      const featuresUsed = featureUsageData?.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate error rate
      const { count: totalEvents } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeframe.start.toISOString())
        .lte('timestamp', timeframe.end.toISOString());

      const { count: errorEvents } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'error')
        .gte('timestamp', timeframe.start.toISOString())
        .lte('timestamp', timeframe.end.toISOString());

      const errorRate = totalEvents ? (errorEvents || 0) / totalEvents * 100 : 0;

      return {
        totalPrompts: totalPrompts || 0,
        activeUsers,
        dailyActiveUsers: activeUsers, // Simplified for now
        weeklyActiveUsers: activeUsers,
        monthlyActiveUsers: activeUsers,
        avgSessionDuration: 0, // TODO: Calculate from session data
        featuresUsed,
        errorRate,
        performanceScore: Math.max(0, 100 - errorRate), // Simplified score
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting usage metrics:', error);
      throw error;
    }
  }

  // Prompt Analytics
  async getPromptAnalytics(promptId?: string): Promise<PromptAnalytics[]> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('category', 'prompt');

      if (promptId) {
        query = query.eq('data->promptId', promptId);
      }

      const { data: events } = await query;

      if (!events) return [];

      // Group events by prompt ID
      const promptGroups = events.reduce((acc, event) => {
        const id = (event.data as any).promptId;
        if (!acc[id]) acc[id] = [];
        acc[id].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(promptGroups).map(([id, promptEventsUnknown]) => {
        const promptEvents = promptEventsUnknown as any[];
        const usageEvents = promptEvents.filter((e: any) => e.data.type === 'prompt_used');
        const createdEvent = promptEvents.find((e: any) => e.data.type === 'prompt_created');

        return {
          promptId: id,
          usageCount: usageEvents.length,
          successRate: 100, // TODO: Calculate from success/failure events
          avgResponseTime: 0, // TODO: Calculate from performance events
          categories: createdEvent?.data.promptCategory ? [createdEvent.data.promptCategory] : [],
          tags: createdEvent?.data.promptTags || [],
          lastUsed: usageEvents.length > 0 ? new Date(Math.max(...usageEvents.map((e: any) => new Date(e.timestamp).getTime()))) : new Date(),
          createdAt: createdEvent ? new Date(createdEvent.timestamp) : new Date(),
          updatedAt: new Date(),
          performanceMetrics: {
            averageExecutionTime: 0,
            errorRate: 0,
            userSatisfaction: 5, // Default rating
          },
        };
      });
    } catch (error) {
      console.error('Error getting prompt analytics:', error);
      throw error;
    }
  }

  // Performance Monitoring
  async getLiveMetrics(): Promise<LiveMetrics> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    try {
      // Get recent events for live calculations
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', oneMinuteAgo.toISOString());

      const activeUsers = new Set(
        recentEvents?.filter(e => e.user_id !== 'anonymous').map(e => e.user_id) || []
      ).size;

      const requestsPerSecond = (recentEvents?.length || 0) / 60;

      const performanceEvents = recentEvents?.filter(e => e.category === 'performance') || [];
      const avgResponseTime = performanceEvents.length > 0
        ? performanceEvents.reduce((sum, e) => sum + (e.data.value || 0), 0) / performanceEvents.length
        : 0;

      const errorEvents = recentEvents?.filter(e => e.category === 'error') || [];
      const errorRate = recentEvents?.length ? (errorEvents.length / recentEvents.length) * 100 : 0;

      return {
        timestamp: now,
        activeUsers,
        requestsPerSecond,
        averageResponseTime: avgResponseTime,
        errorRate,
        systemLoad: 0, // TODO: Get from system metrics
        memoryUsage: 0, // TODO: Get from system metrics
        onlineStatus: errorRate > 10 ? 'degraded' : errorRate > 50 ? 'down' : 'healthy',
      };
    } catch (error) {
      console.error('Error getting live metrics:', error);
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    this.flushEvents();
  }
}
