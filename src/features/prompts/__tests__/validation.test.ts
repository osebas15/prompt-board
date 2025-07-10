import { describe, it, expect } from 'vitest';
import { 
  createPromptSchema, 
  updatePromptSchema, 
  promptFiltersSchema 
} from '../utils/validation';
import type { CreatePrompt, UpdatePrompt, PromptFilters } from '../utils/validation';

describe('Prompt Validation Schemas', () => {
  describe('createPromptSchema', () => {
    it('should validate valid prompt data', () => {
      const validData: CreatePrompt = {
        title: 'Test Prompt',
        content: 'This is a test prompt with sufficient content',
        tags: ['test', 'example'],
        is_public: false,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        is_favorite: false,
        is_template: false
      };

      const result = createPromptSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty title', () => {
      const invalidData: Partial<CreatePrompt> = {
        title: '',
        content: 'Content',
        tags: [],
        user_id: 'test-user-id'
      };

      const result = createPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['title'],
            message: expect.stringContaining('required')
          })
        );
      }
    });

    it('should reject title longer than 200 characters', () => {
      const invalidData: Partial<CreatePrompt> = {
        title: 'x'.repeat(256),
        content: 'Content',
        tags: [],
        user_id: 'test-user-id'
      };

      const result = createPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['title'],
            message: expect.stringContaining('255')
          })
        );
      }
    });

    it('should reject empty content', () => {
      const invalidData: Partial<CreatePrompt> = {
        title: 'Title',
        content: '',
        tags: [],
        user_id: 'test-user-id'
      };

      const result = createPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['content'],
            message: expect.stringContaining('required')
          })
        );
      }
    });

    it('should reject content longer than 10000 characters', () => {
      const invalidData: Partial<CreatePrompt> = {
        title: 'Title',
        content: 'x'.repeat(10001),
        tags: []
      };

      const result = createPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['content'],
            message: expect.stringContaining('10000')
          })
        );
      }
    });

    it('should validate optional category_id as UUID', () => {
      const validData: CreatePrompt = {
        title: 'Test',
        content: 'Content',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        tags: [],
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        is_public: false,
        is_favorite: false,
        is_template: false
      };

      const result = createPromptSchema.safeParse(validData);
      expect(result.success).toBe(true);

      const invalidData = {
        ...validData,
        category_id: 'invalid-uuid'
      };

      const invalidResult = createPromptSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });

    it('should validate tags array with string elements', () => {
      const validData: CreatePrompt = {
        title: 'Test',
        content: 'Content',
        tags: ['tag1', 'tag-2', 'tag_3']
      };

      const result = createPromptSchema.safeParse(validData);
      expect(result.success).toBe(true);

      const invalidData = {
        ...validData,
        tags: ['', 'valid-tag'] // Empty string in tags
      };

      const invalidResult = createPromptSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });

    it('should limit tags to maximum of 10', () => {
      const invalidData: CreatePrompt = {
        title: 'Test',
        content: 'Content',
        tags: Array(11).fill('tag') // 11 tags
      };

      const result = createPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['tags'],
            message: expect.stringContaining('10')
          })
        );
      }
    });

    it('should validate is_public as boolean with default false', () => {
      const dataWithoutPublic: Omit<CreatePrompt, 'is_public'> = {
        title: 'Test',
        content: 'Content',
        tags: []
      };

      const result = createPromptSchema.safeParse(dataWithoutPublic);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_public).toBe(false);
      }
    });
  });

  describe('updatePromptSchema', () => {
    it('should validate partial updates', () => {
      const validUpdates: UpdatePrompt[] = [
        { title: 'New Title' },
        { content: 'New Content' },
        { tags: ['new', 'tags'] },
        { is_public: true },
        { category_id: '123e4567-e89b-12d3-a456-426614174000' }
      ];

      validUpdates.forEach(update => {
        const result = updatePromptSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });

    it('should allow empty updates', () => {
      const emptyUpdate: UpdatePrompt = {};
      
      const result = updatePromptSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate field constraints when present', () => {
      const invalidUpdates = [
        { title: '' }, // Empty title
        { title: 'x'.repeat(201) }, // Too long
        { content: '' }, // Empty content
        { category_id: 'invalid-uuid' }, // Invalid UUID
        { tags: [''] } // Empty tag
      ];

      invalidUpdates.forEach(update => {
        const result = updatePromptSchema.safeParse(update);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('promptFiltersSchema', () => {
    it('should validate empty filters', () => {
      const emptyFilters: PromptFilters = {};
      
      const result = promptFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
    });

    it('should validate all filter options', () => {
      const validFilters: PromptFilters = {
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        tags: ['tag1', 'tag2'],
        search: 'search query',
        is_public: true
      };

      const result = promptFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should validate search string length', () => {
      const invalidFilters = {
        search: 'x'.repeat(501) // Too long
      };

      const result = promptFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it('should validate tags array when present', () => {
      const invalidFilters = {
        tags: [''] // Empty tag
      };

      const result = promptFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });
  });
});
