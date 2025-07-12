import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextService } from '../services/ContextService';
import { supabase } from '@/lib/supabase';
import type { Context, CreateContextData, UpdateContextData } from '../types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('ContextService', () => {
  let contextService: ContextService;
  let mockUserId: string;

  beforeEach(() => {
    contextService = new ContextService();
    mockUserId = 'test-user-123';
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock auth user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createContext', () => {
    it('should create a new context with valid data', async () => {
      const mockContext: Context = {
        id: 'context-123',
        user_id: mockUserId,
        name: 'Test Context',
        description: 'A test context',
        color: '#3B82F6',
        icon: 'folder',
        settings: {},
        is_default: false,
        is_archived: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockSupabaseResponse = {
        data: mockContext,
        error: null
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockSupabaseResponse)
        })
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'existing' }], error: null })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      } as any);

      const contextData: CreateContextData = {
        name: 'Test Context',
        description: 'A test context'
      };

      const result = await contextService.createContext(contextData);

      expect(supabase.from).toHaveBeenCalledWith('contexts');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: 'Test Context',
        description: 'A test context',
        color: '#3B82F6',
        icon: 'folder',
        is_default: false,
        settings: {}
      });
      expect(result).toEqual(mockContext);
    });

    it('should set as default context if no others exist', async () => {
      const mockContext: Context = {
        id: 'context-123',
        user_id: mockUserId,
        name: 'First Context',
        description: 'First context becomes default',
        color: '#3B82F6',
        icon: 'folder',
        settings: {},
        is_default: true,
        is_archived: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock no existing contexts (empty array)
      const mockSelectForCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockContext, error: null })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelectForCount,
        insert: mockInsert
      } as any);

      const contextData: CreateContextData = {
        name: 'First Context',
        description: 'First context becomes default'
      };

      const result = await contextService.createContext(contextData);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: 'First Context',
        description: 'First context becomes default',
        color: '#3B82F6',
        icon: 'folder',
        settings: {},
        is_default: true
      });
      expect(result.is_default).toBe(true);
    });

    it('should validate context name uniqueness', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'existing' }], error: null })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      } as any);

      const contextData: CreateContextData = {
        name: 'Duplicate Context'
      };

      await expect(contextService.createContext(contextData))
        .rejects.toThrow('Context name already exists');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'existing' }], error: null })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      } as any);

      const contextData: CreateContextData = {
        name: 'Test Context'
      };

      await expect(contextService.createContext(contextData))
        .rejects.toThrow('Failed to create context');
    });
  });

  describe('getContexts', () => {
    it('should fetch user contexts with proper ordering', async () => {
      const mockContexts: Context[] = [
        {
          id: 'context-1',
          user_id: mockUserId,
          name: 'Context 1',
          color: '#3B82F6',
          icon: 'folder',
          settings: {},
          is_default: true,
          is_archived: false,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'context-2',
          user_id: mockUserId,
          name: 'Context 2',
          color: '#10B981',
          icon: 'folder',
          settings: {},
          is_default: false,
          is_archived: false,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockContexts, error: null })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await contextService.getContexts();

      expect(result).toEqual(mockContexts);
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should filter out archived contexts by default', async () => {
      const mockActiveContexts: Context[] = [
        {
          id: 'context-1',
          user_id: mockUserId,
          name: 'Active Context',
          color: '#3B82F6',
          icon: 'folder',
          settings: {},
          is_default: true,
          is_archived: false,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockActiveContexts, error: null })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await contextService.getContexts(false);

      expect(result).toEqual(mockActiveContexts);
      // Verify archived contexts are filtered out
      expect(result.every(c => !c.is_archived)).toBe(true);
    });

    it('should handle empty result sets', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await contextService.getContexts();

      expect(result).toEqual([]);
    });
  });

  describe('updateContext', () => {
    it('should update context properties', async () => {
      const contextId = 'context-123';
      const updates: UpdateContextData = {
        name: 'Updated Context',
        description: 'Updated description',
        color: '#EF4444'
      };

      const updatedContext: Context = {
        id: contextId,
        user_id: mockUserId,
        name: 'Updated Context',
        description: 'Updated description',
        color: '#EF4444',
        icon: 'folder',
        settings: {},
        is_default: false,
        is_archived: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedContext, error: null })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      const result = await contextService.updateContext(contextId, updates);

      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(result).toEqual(updatedContext);
    });

    it('should handle default context switching', async () => {
      const contextId = 'context-123';
      const updates: UpdateContextData = {
        name: 'New Default Context'
      };

      // Mock clearing previous default
      const mockClearDefault = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock setting new default
      const mockSetDefault = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { id: contextId, is_default: true }, 
              error: null 
            })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn()
          .mockReturnValueOnce({ eq: mockClearDefault })
          .mockReturnValueOnce({ eq: mockSetDefault })
      } as any);

      const result = await contextService.setDefaultContext(contextId);

      expect(result).toBeDefined();
    });

    it('should validate ownership before updates', async () => {
      const contextId = 'context-123';
      const updates: UpdateContextData = {
        name: 'Unauthorized Update'
      };

      const mockError = {
        code: 'PGRST116',
        message: 'The result contains 0 rows'
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      await expect(contextService.updateContext(contextId, updates))
        .rejects.toThrow('Context not found or access denied');
    });
  });

  describe('deleteContext', () => {
    it('should delete context and cascade relationships', async () => {
      const contextId = 'context-123';

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { is_default: false }, 
            error: null 
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      } as any);

      await contextService.deleteContext(contextId);

      expect(mockDelete).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('contexts');
    });

    it('should prevent deletion of default context', async () => {
      const contextId = 'context-123';

      // Mock context with is_default = true
      const mockDefaultContext = {
        id: contextId,
        is_default: true
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: mockDefaultContext, 
            error: null 
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      await expect(contextService.deleteContext(contextId))
        .rejects.toThrow('Cannot delete default context');
    });

    it('should handle non-existent context deletion', async () => {
      const contextId = 'non-existent-context';

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' }
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      await expect(contextService.deleteContext(contextId))
        .rejects.toThrow('Context not found');
    });
  });

  describe('addPromptToContext', () => {
    it('should link prompt to context', async () => {
      const contextId = 'context-123';
      const promptId = 'prompt-456';

      const mockInsert = vi.fn().mockResolvedValue({ 
        data: { id: 'association-123' }, 
        error: null 
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      } as any);

      await contextService.addPromptToContext(contextId, promptId);

      expect(mockInsert).toHaveBeenCalledWith({
        context_id: contextId,
        prompt_id: promptId,
        sort_order: 0
      });
    });

    it('should handle duplicate associations gracefully', async () => {
      const contextId = 'context-123';
      const promptId = 'prompt-456';

      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      };

      const mockInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: mockError 
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      } as any);

      await expect(contextService.addPromptToContext(contextId, promptId))
        .rejects.toThrow('Prompt already associated with context');
    });
  });

  describe('removePromptFromContext', () => {
    it('should unlink prompt from context', async () => {
      const contextId = 'context-123';
      const promptId = 'prompt-456';

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete
      } as any);

      await contextService.removePromptFromContext(contextId, promptId);

      expect(mockDelete).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('context_prompts');
    });

    it('should handle non-existent associations', async () => {
      const contextId = 'context-123';
      const promptId = 'non-existent-prompt';

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete
      } as any);

      // Should not throw error, just complete silently
      await expect(contextService.removePromptFromContext(contextId, promptId))
        .resolves.toBeUndefined();
    });
  });
});
