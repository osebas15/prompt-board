import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { PromptService } from '../services/PromptService';
import { supabase } from '@/lib/supabase';
import type { CreatePrompt, UpdatePrompt } from '../utils/validation';

// Integration tests that connect to actual Supabase instance
describe.skip('PromptService Integration Tests', () => {
  let promptService: PromptService;
  let testUserId: string;
  let createdPromptIds: string[] = [];

  beforeAll(async () => {
    // Verify Supabase client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    if (!supabase.auth) {
      throw new Error('Supabase auth is not available');
    }

    // Wait a bit for the client to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Create a test user for our integration tests
      console.log('🧪 Creating test user for integration tests...');
      const email = `test-${Date.now()}@example.com`;
      console.log('📧 Using email:', email);
      
      const signUpResponse = await supabase.auth.signUp({
        email,
        password: 'test-password-123',
      });

      console.log('📝 SignUp response:', signUpResponse);

      // Check if the response is defined
      if (!signUpResponse) {
        throw new Error('SignUp response is undefined - check if Supabase is running locally');
      }

      const { data: authData, error: authError } = signUpResponse;

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Failed to create test user: ${authError.message}`);
      }

      if (!authData || !authData.user) {
        console.error('❌ No user data in response:', authData);
        throw new Error('No user data returned from signUp');
      }

      testUserId = authData.user.id;
      console.log('✅ Test user created with ID:', testUserId);
    } catch (error) {
      console.error('❌ Error in beforeAll:', error);
      throw error;
    }
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(() => {
    promptService = PromptService.getInstance();
    createdPromptIds = [];
  });

  afterEach(async () => {
    // Cleanup created prompts after each test
    if (createdPromptIds.length > 0) {
      await supabase
        .from('prompts')
        .delete()
        .in('id', createdPromptIds);
    }
  });

  afterAll(async () => {
    // Cleanup test user (if admin functions are available)
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        // Admin functions might not be available in local setup, that's okay
        console.warn('Could not delete test user (admin functions not available):', error);
      }
    }
  });

  describe('Database Connection', () => {
    it('should successfully connect to Supabase and verify database access', async () => {
      // Test basic connection by querying the prompts table
      const { data, error } = await supabase
        .from('prompts')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should verify authentication is working', async () => {
      const { data, error } = await supabase.auth.getSession();
      
      expect(error).toBeNull();
      // Session might be null if no user is logged in, which is fine for this test
      expect(data).toBeDefined();
    });

    it('should verify table structure by checking required columns exist', async () => {
      // This test ensures our database schema is properly set up
      const { data, error } = await supabase
        .from('prompts')
        .select('id, title, content, user_id, created_at, updated_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // If there's data, verify it has the expected structure
      if (data && data.length > 0) {
        const prompt = data[0];
        expect(prompt).toHaveProperty('id');
        expect(prompt).toHaveProperty('title');
        expect(prompt).toHaveProperty('content');
        expect(prompt).toHaveProperty('user_id');
        expect(prompt).toHaveProperty('created_at');
        expect(prompt).toHaveProperty('updated_at');
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new prompt and retrieve it', async () => {
      const createData: CreatePrompt = {
        title: 'Integration Test Prompt',
        content: 'This is a test prompt for integration testing',
        tags: ['integration', 'test'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      // Create the prompt
      const createdPrompt = await promptService.createPrompt(createData);
      createdPromptIds.push(createdPrompt.id);

      // Verify the prompt was created
      expect(createdPrompt).toBeDefined();
      expect(createdPrompt.id).toBeDefined();
      expect(createdPrompt.title).toBe(createData.title);
      expect(createdPrompt.content).toBe(createData.content);
      expect(createdPrompt.user_id).toBe(testUserId);
      expect(createdPrompt.tags).toEqual(createData.tags);

      // Retrieve the prompt to verify it exists in the database
      const retrievedPrompt = await promptService.getPrompt(createdPrompt.id);
      expect(retrievedPrompt).toBeDefined();
      expect(retrievedPrompt?.id).toBe(createdPrompt.id);
      expect(retrievedPrompt?.title).toBe(createData.title);
    });

    it('should update an existing prompt', async () => {
      // First create a prompt
      const createData: CreatePrompt = {
        title: 'Original Title',
        content: 'Original content',
        tags: ['original'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      const createdPrompt = await promptService.createPrompt(createData);
      createdPromptIds.push(createdPrompt.id);

      // Update the prompt
      const updateData: UpdatePrompt = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated', 'modified'],
      };

      const updatedPrompt = await promptService.updatePrompt(createdPrompt.id, updateData);

      // Verify the update
      expect(updatedPrompt).toBeDefined();
      expect(updatedPrompt.title).toBe(updateData.title);
      expect(updatedPrompt.content).toBe(updateData.content);
      expect(updatedPrompt.tags).toEqual(updateData.tags);
      expect(updatedPrompt.user_id).toBe(testUserId); // Should remain unchanged
    });

    it('should delete a prompt', async () => {
      // First create a prompt
      const createData: CreatePrompt = {
        title: 'To Be Deleted',
        content: 'This prompt will be deleted',
        tags: ['temporary'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      const createdPrompt = await promptService.createPrompt(createData);
      
      // Delete the prompt
      await promptService.deletePrompt(createdPrompt.id);

      // Verify it's deleted by trying to retrieve it
      const deletedPrompt = await promptService.getPrompt(createdPrompt.id);
      expect(deletedPrompt).toBeNull();
    });

    it('should list prompts with filters', async () => {
      // Create multiple test prompts
      const prompts = await Promise.all([
        promptService.createPrompt({
          title: 'Public Prompt 1',
          content: 'Content 1',
          tags: ['public', 'test1'],
          is_public: true,
          user_id: testUserId,
          is_favorite: false,
          is_template: false,
        }),
        promptService.createPrompt({
          title: 'Private Prompt 2',
          content: 'Content 2',
          tags: ['private', 'test2'],
          is_public: false,
          user_id: testUserId,
          is_favorite: true,
          is_template: false,
        }),
      ]);

      createdPromptIds.push(...prompts.map(p => p.id));

      // Test listing with filters
      const result = await promptService.listPrompts(
        { tags: ['test1'] },
        { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      
      // Should find at least one prompt with 'test1' tag
      const foundPrompt = result.data.find(p => p.tags?.includes('test1'));
      expect(foundPrompt).toBeDefined();
    });

    it('should increment usage count', async () => {
      // Create a prompt
      const createData: CreatePrompt = {
        title: 'Usage Test Prompt',
        content: 'Test usage counting',
        tags: ['usage'],
        is_public: false,
        user_id: testUserId,
        is_favorite: false,
        is_template: false,
      };

      const createdPrompt = await promptService.createPrompt(createData);
      createdPromptIds.push(createdPrompt.id);

      expect(createdPrompt.usage_count).toBe(0);

      // Increment usage count
      const updatedPrompt = await promptService.incrementUsageCount(createdPrompt.id);

      expect(updatedPrompt).toBeDefined();
      expect(updatedPrompt.usage_count).toBe(1);
      expect(updatedPrompt.last_used_at).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent prompt retrieval gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await promptService.getPrompt(nonExistentId);
      expect(result).toBeNull();
    });

    it('should handle invalid update operations', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        promptService.updatePrompt(nonExistentId, { title: 'New Title' })
      ).rejects.toThrow();
    });

    it('should handle invalid delete operations', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Delete operations on non-existent records should succeed (no-op)
      // This is the typical behavior for Supabase/PostgreSQL
      await expect(
        promptService.deletePrompt(nonExistentId)
      ).resolves.not.toThrow();
    });
  });
});
