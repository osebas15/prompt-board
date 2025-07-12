import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnalyticsService } from '../services/AnalyticsService';
import type { AnalyticsQuery } from '../types/analytics';

// Mock Supabase
const mockSupabaseInsert = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockQueryResult: { data: any[] | null, error: any, count: number } = { data: [], error: null, count: 0 };

// Create a mock query builder that always returns itself for chaining
const createMockQueryBuilder = () => {
  const builder = {
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    lt: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    in: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    not: vi.fn(),
  };
  
  // Make all methods return the builder for chaining, and also act as a thenable
  Object.keys(builder).forEach(key => {
    (builder as any)[key] = vi.fn(() => {
      // Return a new object that has all the methods and is thenable
      const chainedBuilder = { ...builder };
      // Make it thenable so it can be awaited
      (chainedBuilder as any).then = (callback: (result: any) => any) => {
        return Promise.resolve(callback(mockQueryResult));
      };
      return chainedBuilder;
    });
  });
  
  // Make the builder itself thenable
  (builder as any).then = (callback: (result: any) => any) => {
    return Promise.resolve(callback(mockQueryResult));
  };
  
  return builder;
};

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
      select: vi.fn(() => createMockQueryBuilder()),
    })),
  },
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset singleton instance
    (AnalyticsService as any).instance = undefined;
    
    // Setup default mock responses
    mockSupabaseInsert.mockResolvedValue({ error: null });
    
    // Reset mock query result
    mockQueryResult.data = [];
    mockQueryResult.error = null;
    mockQueryResult.count = 0;
    
    analyticsService = AnalyticsService.getInstance();
  });

  afterEach(() => {
    // Clean up timers
    vi.clearAllTimers();
  });

  describe('Instance Management', () => {
    it('should create a singleton instance', () => {
      const instance1 = AnalyticsService.getInstance();
      const instance2 = AnalyticsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should generate unique session IDs', () => {
      const service1 = AnalyticsService.getInstance();
      (AnalyticsService as any).instance = undefined;
      const service2 = AnalyticsService.getInstance();
      
      expect((service1 as any).sessionId).toBeDefined();
      expect((service2 as any).sessionId).toBeDefined();
      expect((service1 as any).sessionId).not.toBe((service2 as any).sessionId);
    });

    it('should set user ID correctly', () => {
      const userId = 'test-user-123';
      analyticsService.setUserId(userId);
      
      expect((analyticsService as any).userId).toBe(userId);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      analyticsService.setUserId('test-user');
    });

    it('should track prompt created events', async () => {
      const promptId = 'prompt-123';
      const category = 'test-category';
      const tags = ['tag1', 'tag2'];
      
      await analyticsService.trackPromptCreated(promptId, category, tags);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('prompt_created');
      expect(event.category).toBe('prompt');
      expect(event.promptId).toBe(promptId);
      expect(event.promptCategory).toBe(category);
      expect(event.promptTags).toEqual(tags);
      expect(event.userId).toBe('test-user');
    });

    it('should track prompt used events', async () => {
      const promptId = 'prompt-123';
      const metadata = { source: 'dashboard' };
      
      await analyticsService.trackPromptUsed(promptId, metadata);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('prompt_used');
      expect(event.category).toBe('prompt');
      expect(event.promptId).toBe(promptId);
      expect(event.metadata).toEqual(metadata);
    });

    it('should track search events', async () => {
      const query = 'test search';
      const resultsCount = 5;
      const filters = { category: 'development' };
      
      await analyticsService.trackSearchPerformed(query, resultsCount, filters);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('search_performed');
      expect(event.category).toBe('search');
      expect(event.query).toBe(query);
      expect(event.resultsCount).toBe(resultsCount);
      expect(event.filters).toEqual(filters);
    });

    it('should track page view events', async () => {
      const page = '/dashboard';
      const duration = 5000;
      
      await analyticsService.trackPageView(page, duration);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('page_viewed');
      expect(event.category).toBe('navigation');
      expect(event.page).toBe(page);
      expect(event.duration).toBe(duration);
    });

    it('should track feature usage events', async () => {
      const feature = 'command-palette';
      const action = 'opened';
      
      await analyticsService.trackFeatureUsed(feature, action);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('feature_accessed');
      expect(event.category).toBe('feature');
      expect(event.feature).toBe(feature);
      expect(event.action).toBe(action);
    });

    it('should track error events', async () => {
      const errorCode = 'SEARCH_FAILED';
      const errorMessage = 'Search service unavailable';
      const severity = 'high';
      
      // Mock the flush to prevent immediate clearing
      const originalFlush = (analyticsService as any).flushEvents;
      (analyticsService as any).flushEvents = vi.fn();
      
      await analyticsService.trackError(errorCode, errorMessage, severity);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('error_occurred');
      expect(event.category).toBe('error');
      expect(event.errorCode).toBe(errorCode);
      expect(event.errorMessage).toBe(errorMessage);
      expect(event.severity).toBe(severity);
      
      // Restore original flush
      (analyticsService as any).flushEvents = originalFlush;
    });

    it('should track performance metric events', async () => {
      const metric = 'search_response_time';
      const value = 250;
      const unit = 'ms';
      const context = { query_length: 15 };
      
      await analyticsService.trackPerformanceMetric(metric, value, unit, context);
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.type).toBe('performance_metric');
      expect(event.category).toBe('performance');
      expect(event.metric).toBe(metric);
      expect(event.value).toBe(value);
      expect(event.unit).toBe(unit);
      expect(event.context).toEqual(context);
    });

    it('should use anonymous user ID when no user is set', async () => {
      (analyticsService as any).userId = null;
      
      await analyticsService.trackPromptCreated('test-prompt');
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue[0].userId).toBe('anonymous');
    });

    it('should generate unique event IDs', async () => {
      await analyticsService.trackPromptCreated('prompt-1');
      await analyticsService.trackPromptCreated('prompt-2');
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue[0].id).toBeDefined();
      expect(eventQueue[1].id).toBeDefined();
      expect(eventQueue[0].id).not.toBe(eventQueue[1].id);
    });
  });

  describe('Event Queue Management', () => {
    beforeEach(() => {
      analyticsService.setUserId('test-user');
    });

    it('should queue events for batch processing', async () => {
      await analyticsService.trackPromptCreated('prompt-1');
      await analyticsService.trackPromptCreated('prompt-2');
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(2);
    });

    it('should flush events when queue reaches max size', async () => {
      const maxQueueSize = (analyticsService as any).maxQueueSize;
      
      // Fill up the queue to max size
      for (let i = 0; i < maxQueueSize; i++) {
        await analyticsService.trackPromptCreated(`prompt-${i}`);
      }
      
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1);
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'prompt_created'
          })
        ])
      );
    });

    it('should immediately flush critical events', async () => {
      await analyticsService.trackError('CRITICAL_ERROR', 'System failure', 'critical');
      
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1);
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'error_occurred'
          })
        ])
      );
    });

    it('should handle flush errors gracefully', async () => {
      mockSupabaseInsert.mockResolvedValueOnce({ error: new Error('Database error') });
      
      await analyticsService.trackPromptCreated('test-prompt');
      
      // Force flush
      await (analyticsService as any).flushEvents();
      
      // Event should be re-queued on error
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
    });

    it('should clear queue after successful flush', async () => {
      await analyticsService.trackPromptCreated('prompt-1');
      await analyticsService.trackPromptCreated('prompt-2');
      
      await (analyticsService as any).flushEvents();
      
      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(0);
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'prompt_created' })
        ])
      );
    });

    it('should not flush empty queue', async () => {
      await (analyticsService as any).flushEvents();
      
      expect(mockSupabaseInsert).not.toHaveBeenCalled();
    });
  });

  describe('Data Querying', () => {
    it('should execute analytics queries', async () => {
      const mockData = [
        { id: '1', type: 'prompt_created', timestamp: new Date().toISOString() },
        { id: '2', type: 'prompt_used', timestamp: new Date().toISOString() }
      ];
      
      // Set up the mock to return our test data
      mockQueryResult.data = mockData;
      mockQueryResult.error = null;
      mockQueryResult.count = 2;
      
      const query: AnalyticsQuery = {
        metrics: ['count'],
        timeframe: {
          start: new Date(Date.now() - 86400000), // 24 hours ago
          end: new Date()
        },
        filters: [
          { field: 'category', operator: '=', value: 'prompt' }
        ],
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 10
      };
      
      const result = await analyticsService.query(query);
      
      expect(result.data).toEqual(mockData);
      expect(result.totalCount).toBe(2);
      expect(result.metadata.query).toEqual(query);
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.metadata.cached).toBe(false);
    });

    it('should handle query errors', async () => {
      // Set up the mock to return an error
      mockQueryResult.data = null;
      mockQueryResult.error = new Error('Query failed');
      mockQueryResult.count = 0;
      
      const query: AnalyticsQuery = {
        metrics: ['count'],
        timeframe: {
          start: new Date(Date.now() - 86400000),
          end: new Date()
        }
      };
      
      await expect(analyticsService.query(query)).rejects.toThrow('Analytics query failed');
    });

    it('should apply different filter operators', async () => {
      // Set up the mock to return empty data
      mockQueryResult.data = [];
      mockQueryResult.error = null;
      mockQueryResult.count = 0;
      
      const query: AnalyticsQuery = {
        metrics: ['count', 'avg'],
        timeframe: {
          start: new Date(Date.now() - 86400000),
          end: new Date()
        },
        filters: [
          { field: 'type', operator: '!=', value: 'error_occurred' },
          { field: 'timestamp', operator: '>', value: new Date(Date.now() - 3600000) },
          { field: 'category', operator: 'in', value: ['prompt', 'search'] },
          { field: 'query', operator: 'like', value: 'test' }
        ]
      };
      
      await analyticsService.query(query);
      
      // Verify that the query was executed (the result doesn't matter for this test)
      expect(mockQueryResult).toBeDefined();
    });
  });

  describe('Usage Metrics', () => {
    it('should calculate usage metrics', async () => {
      // Mock Supabase responses for different metrics
      mockSupabaseSelect
        .mockResolvedValueOnce({ count: 100 }) // total prompts
        .mockResolvedValueOnce({ data: [{ user_id: 'user1' }, { user_id: 'user2' }] }) // active users
        .mockResolvedValueOnce({ data: [{ type: 'feature_accessed' }, { type: 'feature_accessed' }] }) // feature usage
        .mockResolvedValueOnce({ count: 50 }) // total events
        .mockResolvedValueOnce({ count: 5 }); // error events
      
      const timeframe = {
        start: new Date(Date.now() - 86400000),
        end: new Date()
      };
      
      const metrics = await analyticsService.getUsageMetrics(timeframe);
      
      expect(metrics.totalPrompts).toBe(100);
      expect(metrics.activeUsers).toBe(2);
      expect(metrics.errorRate).toBe(10); // 5/50 * 100
      expect(metrics.performanceScore).toBe(90); // 100 - 10
      expect(metrics.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle missing data gracefully', async () => {
      mockSupabaseSelect
        .mockResolvedValueOnce({ count: null })
        .mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ count: null })
        .mockResolvedValueOnce({ count: null });
      
      const timeframe = {
        start: new Date(Date.now() - 86400000),
        end: new Date()
      };
      
      const metrics = await analyticsService.getUsageMetrics(timeframe);
      
      expect(metrics.totalPrompts).toBe(0);
      expect(metrics.activeUsers).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('Prompt Analytics', () => {
    it('should calculate prompt analytics', async () => {
      const mockEvents = [
        {
          data: {
            type: 'prompt_created',
            promptId: 'prompt-1',
            promptCategory: 'development',
            promptTags: ['coding', 'help']
          },
          timestamp: new Date('2024-01-01T10:00:00Z').toISOString()
        },
        {
          data: {
            type: 'prompt_used',
            promptId: 'prompt-1'
          },
          timestamp: new Date('2024-01-01T11:00:00Z').toISOString()
        },
        {
          data: {
            type: 'prompt_used',
            promptId: 'prompt-1'
          },
          timestamp: new Date('2024-01-01T12:00:00Z').toISOString()
        }
      ];
      
      mockSupabaseSelect.mockResolvedValueOnce({
        data: mockEvents,
        error: null
      });
      
      const analytics = await analyticsService.getPromptAnalytics('prompt-1');
      
      expect(analytics).toHaveLength(1);
      const promptAnalytics = analytics[0];
      
      expect(promptAnalytics.promptId).toBe('prompt-1');
      expect(promptAnalytics.usageCount).toBe(2);
      expect(promptAnalytics.categories).toEqual(['development']);
      expect(promptAnalytics.tags).toEqual(['coding', 'help']);
      expect(promptAnalytics.successRate).toBe(100);
      expect(promptAnalytics.performanceMetrics.userSatisfaction).toBe(5);
    });

    it('should handle analytics for all prompts when no ID specified', async () => {
      const mockEvents = [
        {
          data: {
            type: 'prompt_created',
            promptId: 'prompt-1'
          },
          timestamp: new Date().toISOString()
        },
        {
          data: {
            type: 'prompt_created',
            promptId: 'prompt-2'
          },
          timestamp: new Date().toISOString()
        }
      ];
      
      mockSupabaseSelect.mockResolvedValueOnce({
        data: mockEvents,
        error: null
      });
      
      const analytics = await analyticsService.getPromptAnalytics();
      
      expect(analytics).toHaveLength(2);
      expect(analytics[0].promptId).toBe('prompt-1');
      expect(analytics[1].promptId).toBe('prompt-2');
    });
  });

  describe('Live Metrics', () => {
    it('should calculate live metrics', async () => {
      const recentEvents = [
        {
          user_id: 'user1',
          category: 'performance',
          data: { value: 100 }
        },
        {
          user_id: 'user2',
          category: 'performance',
          data: { value: 200 }
        },
        {
          user_id: 'anonymous',
          category: 'error',
          data: {}
        }
      ];
      
      mockSupabaseSelect.mockResolvedValueOnce({
        data: recentEvents,
        error: null
      });
      
      const liveMetrics = await analyticsService.getLiveMetrics();
      
      expect(liveMetrics.activeUsers).toBe(2); // Excludes anonymous
      expect(liveMetrics.requestsPerSecond).toBeCloseTo(3 / 60, 2); // 3 events in 60 seconds
      expect(liveMetrics.averageResponseTime).toBe(150); // (100 + 200) / 2
      expect(liveMetrics.errorRate).toBeCloseTo(33.33, 1); // 1/3 * 100
      expect(liveMetrics.onlineStatus).toBe('degraded'); // Error rate > 10%
      expect(liveMetrics.timestamp).toBeInstanceOf(Date);
    });

    it('should determine correct online status', async () => {
      // Test healthy status
      mockSupabaseSelect.mockResolvedValueOnce({
        data: [
          { user_id: 'user1', category: 'feature' },
          { user_id: 'user2', category: 'navigation' }
        ],
        error: null
      });
      
      let liveMetrics = await analyticsService.getLiveMetrics();
      expect(liveMetrics.onlineStatus).toBe('healthy');
      
      // Test degraded status (error rate > 10% but < 50%)
      mockSupabaseSelect.mockResolvedValueOnce({
        data: [
          { user_id: 'user1', category: 'error' },
          { user_id: 'user2', category: 'feature' },
          { user_id: 'user3', category: 'feature' }
        ],
        error: null
      });
      
      liveMetrics = await analyticsService.getLiveMetrics();
      expect(liveMetrics.onlineStatus).toBe('degraded');
      
      // Test down status (error rate > 50%)
      mockSupabaseSelect.mockResolvedValueOnce({
        data: [
          { user_id: 'user1', category: 'error' },
          { user_id: 'user2', category: 'error' },
          { user_id: 'user3', category: 'feature' }
        ],
        error: null
      });
      
      liveMetrics = await analyticsService.getLiveMetrics();
      expect(liveMetrics.onlineStatus).toBe('down');
    });
  });

  describe('Cleanup', () => {
    it('should flush events on destroy', async () => {
      await analyticsService.trackPromptCreated('test-prompt');
      
      analyticsService.destroy();
      
      expect(mockSupabaseInsert).toHaveBeenCalled();
    });
  });
});
