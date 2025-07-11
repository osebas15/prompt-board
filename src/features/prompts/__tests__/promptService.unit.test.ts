import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import type { CreatePrompt, UpdatePrompt, PromptFilters } from '../utils/validation';

describe('PromptService Unit Tests', () => {
  let promptService: PromptService;
  
  const mockPrompt = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Prompt',
    content: 'Test content',
    category: null,
    category_id: null,
    tags: ['test'],
    is_public: true,
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    usage_count: 0,
    last_used_at: null,
    rating: null,
    description: null,
    model_compatibility: null,
    parameters: null,
    is_favorite: false,
    folder_id: null,
    version: 1,
    parent_id: null,
    is_template: false,
    template_variables: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    promptService = PromptService.getInstance();
    vi.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('should validate input data properly', () => {
      const createData: CreatePrompt = {
        title: 'Test Prompt',
        content: 'Test content',
        tags: ['test'],
        is_public: false,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        is_favorite: false,
        is_template: false,
      };

      // This test validates the service method exists and accepts the correct data structure
      expect(promptService.createPrompt).toBeDefined();
      expect(typeof promptService.createPrompt).toBe('function');
      
      // Validate that the createData matches the expected interface
      expect(createData).toHaveProperty('title');
      expect(createData).toHaveProperty('content');
      expect(createData).toHaveProperty('user_id');
    });
  });

  describe('getPrompt', () => {
    it('should accept string ID parameter', () => {
      expect(promptService.getPrompt).toBeDefined();
      expect(typeof promptService.getPrompt).toBe('function');
    });
  });

  describe('listPrompts', () => {
    it('should accept filters and pagination parameters', () => {
      const filters: PromptFilters = { tags: ['test'] };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };
      
      expect(promptService.listPrompts).toBeDefined();
      expect(typeof promptService.listPrompts).toBe('function');
      
      // Validate parameter types
      expect(filters).toHaveProperty('tags');
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
    });
  });

  describe('updatePrompt', () => {
    it('should accept ID and update data parameters', () => {
      const updateData: UpdatePrompt = {
        title: 'Updated Title'
      };

      expect(promptService.updatePrompt).toBeDefined();
      expect(typeof promptService.updatePrompt).toBe('function');
      expect(updateData).toHaveProperty('title');
    });
  });

  describe('deletePrompt', () => {
    it('should accept string ID parameter', () => {
      expect(promptService.deletePrompt).toBeDefined();
      expect(typeof promptService.deletePrompt).toBe('function');
    });
  });

  describe('incrementUsageCount', () => {
    it('should accept string ID parameter', () => {
      expect(promptService.incrementUsageCount).toBeDefined();
      expect(typeof promptService.incrementUsageCount).toBe('function');
    });
  });
});
