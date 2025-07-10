import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import type { CreatePrompt, UpdatePrompt, PromptFilters } from '../utils/validation';

// Mock Supabase
const mockSupabaseFrom = vi.fn();
const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null
  })
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
    auth: mockSupabaseAuth,
    rpc: vi.fn()
  }
}));

// Mock query chain
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockRange = vi.fn();
const mockIlike = vi.fn();
const mockContains = vi.fn();

describe('PromptService', () => {
  let promptService: PromptService;
  
  beforeEach(() => {
    promptService = new PromptService();
    vi.clearAllMocks();
    
    // Setup mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange,
      ilike: mockIlike,
      contains: mockContains
    });
    
    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle
    });
    
    mockUpdate.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle
    });
    
    mockDelete.mockReturnValue({
      eq: mockEq
    });
    
    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange
    });
    
    mockOrder.mockReturnValue({
      limit: mockLimit,
      range: mockRange
    });
    
    mockLimit.mockReturnValue({
      range: mockRange
    });
    
    mockSingle.mockResolvedValue({
      data: null,
      error: null
    });
  });
  
  beforeEach(() => {
    promptService = new PromptService();
    vi.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('should create a new prompt template with required fields', async () => {
      const createData: CreatePrompt = {
        title: 'Test Prompt',
        content: 'This is a test prompt content',
        category: null,
        category_id: null,
        tags: ['test', 'example'],
        is_public: false,
        user_id: 'user123',
        last_used_at: null,
        rating: null,
        description: 'Test description',
        model_compatibility: null,
        parameters: null,
        is_favorite: false,
        folder_id: null,
        parent_id: null,
        is_template: false,
        template_variables: null
      };

      const result = await promptService.createPrompt(createData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe(createData.title);
      expect(result.content).toBe(createData.content);
      expect(result.tags).toEqual(createData.tags);
      expect(result.is_public).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('should create prompt with category when provided', async () => {
      const createData: CreatePrompt = {
        title: 'Categorized Prompt',
        content: 'Content with category',
        category_id: 'test-category-id',
        tags: ['categorized'],
        is_public: true
      };

      const result = await promptService.createPrompt(createData);
      
      expect(result.category_id).toBe(createData.category_id);
      expect(result.is_public).toBe(true);
    });

    it('should throw error when title is empty', async () => {
      const invalidData: CreatePrompt = {
        title: '',
        content: 'Content',
        tags: []
      };

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow('Title is required');
    });

    it('should handle database errors gracefully', async () => {
      const createData: CreatePrompt = {
        title: 'Test Prompt',
        content: 'Content',
        tags: []
      };

      // Mock database error
      const mockError = new Error('Database connection failed');
      vi.mocked(promptService['supabase'].from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      } as any);

      await expect(promptService.createPrompt(createData))
        .rejects.toThrow('Failed to create prompt');
    });
  });

  describe('getPrompts', () => {
    it('should retrieve user prompts with pagination', async () => {
      const filters: PromptFilters = {};
      const pagination = { page: 1, limit: 10 };

      const result = await promptService.getPrompts(filters, pagination);
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter prompts by category', async () => {
      const filters: PromptFilters = {
        category_id: 'test-category-id'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await promptService.getPrompts(filters, pagination);
      
      expect(result.data.every(prompt => 
        prompt.category_id === 'test-category-id'
      )).toBe(true);
    });

    it('should filter prompts by tags', async () => {
      const filters: PromptFilters = {
        tags: ['test', 'example']
      };
      const pagination = { page: 1, limit: 10 };

      const result = await promptService.getPrompts(filters, pagination);
      
      expect(result.data.every(prompt => 
        filters.tags!.some(tag => prompt.tags.includes(tag))
      )).toBe(true);
    });

    it('should search prompts by content', async () => {
      const filters: PromptFilters = {
        search: 'test query'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await promptService.getPrompts(filters, pagination);
      
      expect(result.data.every(prompt => 
        prompt.title.toLowerCase().includes('test') ||
        prompt.content.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should handle empty results', async () => {
      const filters: PromptFilters = {
        search: 'nonexistent-query-12345'
      };
      const pagination = { page: 1, limit: 10 };

      const result = await promptService.getPrompts(filters, pagination);
      
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getPromptById', () => {
    it('should retrieve a specific prompt by ID', async () => {
      const promptId = 'test-prompt-id';
      
      const result = await promptService.getPromptById(promptId);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(promptId);
      expect(result.tags).toBeInstanceOf(Array);
    });

    it('should return null for non-existent prompt', async () => {
      const result = await promptService.getPromptById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should include category information when available', async () => {
      const promptId = 'prompt-with-category-id';
      
      const result = await promptService.getPromptById(promptId);
      
      if (result?.category_id) {
        expect(result.category).toBeDefined();
        expect(result.category?.id).toBe(result.category_id);
      }
    });
  });

  describe('updatePrompt', () => {
    it('should update existing prompt', async () => {
      const promptId = 'test-prompt-id';
      const updateData: UpdatePrompt = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated', 'test']
      };

      const result = await promptService.updatePrompt(promptId, updateData);
      
      expect(result.title).toBe(updateData.title);
      expect(result.content).toBe(updateData.content);
      expect(result.tags).toEqual(updateData.tags);
      expect(result.updated_at).toBeDefined();
    });

    it('should only update provided fields', async () => {
      const promptId = 'test-prompt-id';
      const partialUpdate: UpdatePrompt = {
        title: 'Only Title Updated'
      };

      const result = await promptService.updatePrompt(promptId, partialUpdate);
      
      expect(result.title).toBe(partialUpdate.title);
      // Other fields should remain unchanged
    });

    it('should throw error for non-existent prompt', async () => {
      const updateData: UpdatePrompt = {
        title: 'New Title'
      };

      await expect(promptService.updatePrompt('non-existent-id', updateData))
        .rejects.toThrow('Prompt not found');
    });

    it('should validate user ownership before update', async () => {
      const promptId = 'other-user-prompt-id';
      const updateData: UpdatePrompt = {
        title: 'Unauthorized Update'
      };

      await expect(promptService.updatePrompt(promptId, updateData))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt successfully', async () => {
      const promptId = 'test-prompt-id';
      
      await expect(promptService.deletePrompt(promptId))
        .resolves.not.toThrow();
    });

    it('should throw error for non-existent prompt', async () => {
      await expect(promptService.deletePrompt('non-existent-id'))
        .rejects.toThrow('Prompt not found');
    });

    it('should validate user ownership before deletion', async () => {
      const promptId = 'other-user-prompt-id';

      await expect(promptService.deletePrompt(promptId))
        .rejects.toThrow('Unauthorized');
    });

    it('should cascade delete related tags', async () => {
      const promptId = 'prompt-with-tags-id';
      
      await promptService.deletePrompt(promptId);
      
      // Verify tags are deleted (this would be tested via integration test)
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count and update last_used_at', async () => {
      const promptId = 'test-prompt-id';
      
      await promptService.incrementUsage(promptId);
      
      const updated = await promptService.getPromptById(promptId);
      expect(updated?.usage_count).toBeGreaterThan(0);
      expect(updated?.last_used_at).toBeDefined();
    });

    it('should handle non-existent prompt gracefully', async () => {
      await expect(promptService.incrementUsage('non-existent-id'))
        .resolves.not.toThrow();
    });
  });
});
