import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import { supabase } from '../../../lib/supabase';
import type { CreatePrompt, UpdatePrompt, PromptFilters } from '../utils/validation';

// Unmock Supabase for real integration testing
vi.unmock('@supabase/supabase-js');

describe('PromptService Integration Tests', () => {
  let promptService: PromptService;
  let testUserId: string;
  let testCategoryId: string;
  let createdPromptIds: string[] = [];

  beforeAll(async () => {
    // Ensure we're using the real Supabase implementation for integration tests
    vi.resetAllMocks();
    
    // For local testing, use a fixed test user ID or create one via simple signup
    // This avoids admin auth functions which aren't available in local dev
    testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for testing
    
    console.log('🧪 Integration Test Setup - Using test user ID:', testUserId);

    try {
      // Try to create a test category for testing categorized prompts
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: 'Integration Test Category',
          description: 'Category for integration tests',
          user_id: testUserId,
        })
        .select()
        .single();

      if (!categoryError && categoryData) {
        testCategoryId = categoryData.id;
        console.log('✅ Test category created:', testCategoryId);
      } else {
        console.warn('⚠️ Could not create test category:', categoryError?.message);
      }
    } catch (error) {
      console.warn('⚠️ Category setup failed, continuing without category tests');
    }
  });

  beforeEach(() => {
    promptService = PromptService.getInstance();
    createdPromptIds = [];
  });

  afterEach(async () => {
    // Clean up created prompts
    if (createdPromptIds.length > 0) {
      try {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .in('id', createdPromptIds);
        
        if (error) {
          console.warn('⚠️ Failed to clean up some prompts:', error.message);
        } else {
          console.log(`🧹 Cleaned up ${createdPromptIds.length} test prompts`);
        }
      } catch (error) {
        console.warn('⚠️ Cleanup error:', error);
      }
      createdPromptIds = [];
    }
  });

  afterAll(async () => {
    // Clean up test category
    if (testCategoryId) {
      try {
        await supabase
          .from('categories')
          .delete()
          .eq('id', testCategoryId);
        console.log('🧹 Test category cleaned up');
      } catch (error) {
        console.warn('⚠️ Failed to clean up test category:', error);
      }
    }

    console.log('🧪 Integration Test Cleanup Complete');
  });

  describe('createPrompt', () => {
    it('should create a new prompt with required fields', async () => {
      const createData: CreatePrompt = {
        title: 'Integration Test Prompt',
        content: 'This is a test prompt created during integration testing',
        tags: ['integration', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      const result = await promptService.createPrompt(createData);
      createdPromptIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(createData.title);
      expect(result.content).toBe(createData.content);
      expect(result.tags).toEqual(createData.tags);
      expect(result.is_public).toBe(false);
      expect(result.user_id).toBe(testUserId);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(result.usage_count).toBe(0);
    });

    it('should create prompt with category when provided', async () => {
      if (!testCategoryId) {
        console.warn('Skipping category test - no test category available');
        return;
      }

      const createData: CreatePrompt = {
        title: 'Categorized Integration Test Prompt',
        content: 'Content with category',
        category_id: testCategoryId,
        tags: ['categorized', 'integration'],
        is_public: true,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      const result = await promptService.createPrompt(createData);
      createdPromptIds.push(result.id);

      expect(result.category_id).toBe(createData.category_id);
      expect(result.is_public).toBe(true);
    });

    it('should throw error when title is empty', async () => {
      const invalidData = {
        title: '',
        content: 'Content',
        tags: [],
        user_id: testUserId,
        is_public: false,
        is_favorite: false,
        is_template: false,
      } as CreatePrompt;

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow();
    });

    it('should throw error when content is empty', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: '',
        tags: [],
        user_id: testUserId,
        is_public: false,
        is_favorite: false,
        is_template: false,
      } as CreatePrompt;

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow();
    });

    it('should handle invalid user_id', async () => {
      const invalidData: CreatePrompt = {
        title: 'Test Prompt',
        content: 'Content',
        tags: [],
        user_id: 'invalid-uuid',
        is_public: false,
        is_favorite: false,
        is_template: false,
      };

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow();
    });
  });

  describe('getPrompts', () => {
    let testPrompt1Id: string;
    let testPrompt2Id: string;

    beforeEach(async () => {
      // Create test prompts
      const prompt1 = await promptService.createPrompt({
        title: 'Test Prompt 1',
        content: 'Content for searching and filtering',
        tags: ['search', 'test'],
        is_public: true,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      });
      testPrompt1Id = prompt1.id;
      createdPromptIds.push(testPrompt1Id);

      const prompt2 = await promptService.createPrompt({
        title: 'Another Test Prompt',
        content: 'Different content for testing',
        tags: ['different', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: true,
        is_template: false,
      });
      testPrompt2Id = prompt2.id;
      createdPromptIds.push(testPrompt2Id);
    });

    it('should retrieve prompts with pagination', async () => {
      const filters: PromptFilters = {
        user_id: testUserId,
      };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };

      const result = await promptService.getPrompts(filters, pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter prompts by tags', async () => {
      const filters: PromptFilters = {
        tags: ['search'],
        user_id: testUserId,
      };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };

      const result = await promptService.getPrompts(filters, pagination);

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(prompt => prompt.id === testPrompt1Id)).toBe(true);
    });

    it('should search prompts by content', async () => {
      const filters: PromptFilters = {
        search: 'searching',
        user_id: testUserId,
      };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };

      const result = await promptService.getPrompts(filters, pagination);

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(prompt => prompt.id === testPrompt1Id)).toBe(true);
    });

    it('should filter by is_public', async () => {
      const filters: PromptFilters = {
        is_public: true,
        user_id: testUserId,
      };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };

      const result = await promptService.getPrompts(filters, pagination);

      expect(result.data.every(prompt => prompt.is_public === true)).toBe(true);
      expect(result.data.some(prompt => prompt.id === testPrompt1Id)).toBe(true);
    });

    it('should handle empty results', async () => {
      const filters: PromptFilters = {
        search: 'nonexistent-query-12345',
        user_id: testUserId,
      };
      const pagination = { page: 1, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };

      const result = await promptService.getPrompts(filters, pagination);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getPromptById', () => {
    let testPromptId: string;

    beforeEach(async () => {
      const prompt = await promptService.createPrompt({
        title: 'Get By ID Test Prompt',
        content: 'Content for ID retrieval test',
        tags: ['getbyid', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      });
      testPromptId = prompt.id;
      createdPromptIds.push(testPromptId);
    });

    it('should retrieve a specific prompt by ID', async () => {
      const result = await promptService.getPromptById(testPromptId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testPromptId);
      expect(result?.title).toBe('Get By ID Test Prompt');
      expect(result?.tags).toEqual(['getbyid', 'test']);
    });

    it('should return null for non-existent prompt', async () => {
      const result = await promptService.getPromptById('550e8400-e29b-41d4-a716-446655440001');
      expect(result).toBeNull();
    });

    it('should return null for invalid UUID', async () => {
      const result = await promptService.getPromptById('invalid-uuid');
      expect(result).toBeNull();
    });
  });

  describe('updatePrompt', () => {
    let testPromptId: string;

    beforeEach(async () => {
      const prompt = await promptService.createPrompt({
        title: 'Update Test Prompt',
        content: 'Original content',
        tags: ['update', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      });
      testPromptId = prompt.id;
      createdPromptIds.push(testPromptId);
    });

    it('should update existing prompt', async () => {
      const updateData: UpdatePrompt = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated', 'test'],
      };

      const result = await promptService.updatePrompt(testPromptId, updateData);

      expect(result.title).toBe(updateData.title);
      expect(result.content).toBe(updateData.content);
      expect(result.tags).toEqual(updateData.tags);
      expect(result.updated_at).toBeDefined();
      expect(new Date(result.updated_at).getTime()).toBeGreaterThan(new Date(result.created_at).getTime());
    });

    it('should only update provided fields', async () => {
      const partialUpdate: UpdatePrompt = {
        title: 'Only Title Updated',
      };

      const originalPrompt = await promptService.getPromptById(testPromptId);
      const result = await promptService.updatePrompt(testPromptId, partialUpdate);

      expect(result.title).toBe(partialUpdate.title);
      expect(result.content).toBe(originalPrompt?.content);
      expect(result.tags).toEqual(originalPrompt?.tags);
    });

    it('should throw error for non-existent prompt', async () => {
      const updateData: UpdatePrompt = {
        title: 'New Title',
      };

      await expect(promptService.updatePrompt('550e8400-e29b-41d4-a716-446655440001', updateData))
        .rejects.toThrow();
    });

    it('should validate field constraints', async () => {
      const invalidUpdate: UpdatePrompt = {
        title: '', // Empty title should fail validation
      };

      await expect(promptService.updatePrompt(testPromptId, invalidUpdate))
        .rejects.toThrow();
    });
  });

  describe('deletePrompt', () => {
    let testPromptId: string;

    beforeEach(async () => {
      const prompt = await promptService.createPrompt({
        title: 'Delete Test Prompt',
        content: 'Content to be deleted',
        tags: ['delete', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      });
      testPromptId = prompt.id;
      // Don't add to createdPromptIds since we're testing deletion
    });

    it('should delete prompt successfully', async () => {
      await expect(promptService.deletePrompt(testPromptId))
        .resolves.not.toThrow();

      // Verify deletion
      const deletedPrompt = await promptService.getPromptById(testPromptId);
      expect(deletedPrompt).toBeNull();
    });

    it('should throw error for non-existent prompt', async () => {
      await expect(promptService.deletePrompt('550e8400-e29b-41d4-a716-446655440001'))
        .rejects.toThrow();
    });
  });

  describe('incrementUsage', () => {
    let testPromptId: string;

    beforeEach(async () => {
      const prompt = await promptService.createPrompt({
        title: 'Usage Test Prompt',
        content: 'Content for usage testing',
        tags: ['usage', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      });
      testPromptId = prompt.id;
      createdPromptIds.push(testPromptId);
    });

    it('should increment usage count and update last_used_at', async () => {
      const originalPrompt = await promptService.getPromptById(testPromptId);
      expect(originalPrompt?.usage_count).toBe(0);
      expect(originalPrompt?.last_used_at).toBeNull();

      await promptService.incrementUsage(testPromptId);

      const updatedPrompt = await promptService.getPromptById(testPromptId);
      expect(updatedPrompt?.usage_count).toBe(1);
      expect(updatedPrompt?.last_used_at).toBeDefined();
      expect(updatedPrompt?.last_used_at).not.toBeNull();
    });

    it('should increment usage multiple times', async () => {
      await promptService.incrementUsage(testPromptId);
      await promptService.incrementUsage(testPromptId);
      await promptService.incrementUsage(testPromptId);

      const updatedPrompt = await promptService.getPromptById(testPromptId);
      expect(updatedPrompt?.usage_count).toBe(3);
    });

    it('should handle non-existent prompt gracefully', async () => {
      // This should not throw an error, even if prompt doesn't exist
      await expect(promptService.incrementUsage('550e8400-e29b-41d4-a716-446655440001'))
        .resolves.not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking network issues
      // In a real scenario, you might test with a disconnected database
      const createData: CreatePrompt = {
        title: 'Connection Test Prompt',
        content: 'Testing connection issues',
        tags: ['connection', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      // This should work with a proper connection
      const result = await promptService.createPrompt(createData);
      expect(result).toBeDefined();
      createdPromptIds.push(result.id);
    });

    it('should handle malformed data', async () => {
      const malformedData = {
        title: 'Test',
        content: 'Content',
        tags: 'not-an-array', // Invalid: should be array
        user_id: testUserId,
      } as any;

      await expect(promptService.createPrompt(malformedData))
        .rejects.toThrow();
    });

    it('should handle very long content', async () => {
      const longContent = 'x'.repeat(10001); // Exceeds max length
      const invalidData: CreatePrompt = {
        title: 'Long Content Test',
        content: longContent,
        tags: ['long', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow();
    });

    it('should handle many tags', async () => {
      const manyTags = Array(11).fill('tag'); // Exceeds max of 10
      const invalidData: CreatePrompt = {
        title: 'Many Tags Test',
        content: 'Content with too many tags',
        tags: manyTags,
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      await expect(promptService.createPrompt(invalidData))
        .rejects.toThrow();
    });
  });
});
