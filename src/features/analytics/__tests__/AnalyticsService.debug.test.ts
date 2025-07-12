import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../services/AnalyticsService';

// Mock Supabase
const mockSupabaseInsert = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
      })),
    })),
  },
}));

describe('AnalyticsService Debug', () => {
  let analyticsService: AnalyticsService;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset singleton instance
    (AnalyticsService as any).instance = undefined;
    
    // Setup default mock responses
    mockSupabaseInsert.mockResolvedValue({ error: null });
    
    analyticsService = AnalyticsService.getInstance();
    analyticsService.setUserId('test-user');
  });

  it('should debug error tracking issue', async () => {
    console.log('Starting error tracking test...');
    
    const errorCode = 'SEARCH_FAILED';
    const errorMessage = 'Search service unavailable';
    const severity = 'high';
    
    await analyticsService.trackError(errorCode, errorMessage, severity);
    
    const eventQueue = (analyticsService as any).eventQueue;
    console.log('Event queue after tracking error:', JSON.stringify(eventQueue, null, 2));
    console.log('Event queue length:', eventQueue.length);
    
    if (eventQueue.length > 0) {
      const event = eventQueue[0];
      console.log('Event type:', event.type);
      console.log('Event category:', event.category);
      console.log('Event errorCode:', event.errorCode);
      console.log('Event errorMessage:', event.errorMessage);
      console.log('Event severity:', event.severity);
    }
    
    expect(eventQueue.length).toBe(1);
  });

  it('should debug analytics query issue', async () => {
    console.log('Starting analytics query test...');
    
    const mockData = [
      { id: '1', type: 'prompt_created', timestamp: new Date().toISOString() },
      { id: '2', type: 'prompt_used', timestamp: new Date().toISOString() }
    ];
    
    console.log('Mock data:', JSON.stringify(mockData, null, 2));
    
    const mockQueryChain = {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    };
    
    // Mock the select method to return our chain that resolves to mockData
    const mockSelect = vi.fn(() => {
      const chain = { ...mockQueryChain };
      // The last method in the chain should resolve to our data
      Object.keys(chain).forEach(key => {
        (chain as any)[key] = vi.fn(() => Promise.resolve({
          data: mockData,
          error: null,
          count: 2
        }));
      });
      return chain;
    });
    
    // Override the from mock for this test
    vi.mocked(require('../../../lib/supabase').supabase.from).mockReturnValueOnce({
      select: mockSelect
    });
    
    const query = {
      metrics: ['count'],
      timeframe: {
        start: new Date(Date.now() - 86400000),
        end: new Date()
      },
      filters: [
        { field: 'category', operator: '=' as const, value: 'prompt' }
      ],
      orderBy: { field: 'timestamp', direction: 'desc' as const },
      limit: 10
    };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    try {
      const result = await analyticsService.query(query);
      console.log('Query result:', JSON.stringify(result, null, 2));
      console.log('Result data length:', result.data.length);
      console.log('Result data:', result.data);
      
      expect(result.data).toEqual(mockData);
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  });
});
