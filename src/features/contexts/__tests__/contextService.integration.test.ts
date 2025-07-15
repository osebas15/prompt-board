import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { ContextService } from '../services/ContextService';
import { supabase } from '@/lib/supabase';
import { createTestUser, deleteTestUser } from '@/test/supabase-setup';
import type { Context, CreateContextData } from '../types';

// Integration tests use real Supabase instance
describe.skip('ContextService Integration', () => {
  let contextService: ContextService;
  let testUserId: string;
  let testUser: any;
  let createdContexts: string[] = [];

  beforeAll(async () => {
    // Create and authenticate a test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'test-password-123';
    
    // Create test user with admin client
    testUser = await createTestUser(testEmail, testPassword);
    testUserId = testUser.id;
    
    // Sign in with the test user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }
  });

  afterAll(async () => {
    // Sign out and clean up test user
    await supabase.auth.signOut();
    if (testUser) {
      await deleteTestUser(testUser.id);
    }
  });

  beforeEach(async () => {
    contextService = new ContextService();
    
    // Verify we're still authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== testUserId) {
      throw new Error('Test user authentication lost');
    }
  });

  afterEach(async () => {
    // Clean up created contexts
    if (createdContexts.length > 0) {
      await supabase
        .from('contexts')
        .delete()
        .in('id', createdContexts);
      createdContexts = [];
    }
  });

  describe('with Supabase', () => {
    it('should perform full CRUD lifecycle', async () => {
      // Create context
      const createData: CreateContextData = {
        name: 'Integration Test Context',
        description: 'Created during integration test',
        color: '#8B5CF6',
        icon: 'test'
      };

      const createdContext = await contextService.createContext(createData);
      createdContexts.push(createdContext.id);

      expect(createdContext).toMatchObject({
        name: createData.name,
        description: createData.description,
        color: createData.color,
        icon: createData.icon,
        user_id: testUserId
      });

      // Read context
      const contexts = await contextService.getContexts();
      const foundContext = contexts.find((c: Context) => c.id === createdContext.id);
      expect(foundContext).toBeDefined();

      // Update context
      const updateData = {
        name: 'Updated Integration Test Context',
        description: 'Updated during integration test'
      };

      const updatedContext = await contextService.updateContext(
        createdContext.id, 
        updateData
      );

      expect(updatedContext.name).toBe(updateData.name);
      expect(updatedContext.description).toBe(updateData.description);

      // Delete context
      await contextService.deleteContext(createdContext.id);
      
      // Verify deletion
      const contextsAfterDelete = await contextService.getContexts();
      const deletedContext = contextsAfterDelete.find(c => c.id === createdContext.id);
      expect(deletedContext).toBeUndefined();

      // Remove from cleanup list since it's already deleted
      createdContexts = createdContexts.filter(id => id !== createdContext.id);
    });

    it('should respect RLS policies', async () => {
      // Create context as current user
      const contextData: CreateContextData = {
        name: 'RLS Test Context'
      };

      const context = await contextService.createContext(contextData);
      createdContexts.push(context.id);

      // Verify context is associated with current user
      expect(context.user_id).toBe(testUserId);

      // Verify we can read our own context
      const contexts = await contextService.getContexts();
      const ownContext = contexts.find(c => c.id === context.id);
      expect(ownContext).toBeDefined();

      // Direct database query should only return user's contexts
      const { data: directContexts } = await supabase
        .from('contexts')
        .select('*')
        .eq('user_id', testUserId);

      expect(directContexts?.every(c => c.user_id === testUserId)).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      const contextPromises = Array.from({ length: 3 }, (_, i) =>
        contextService.createContext({
          name: `Concurrent Context ${i + 1}`,
          description: `Created concurrently ${i + 1}`
        })
      );

      const contexts = await Promise.all(contextPromises);
      
      // Track for cleanup
      createdContexts.push(...contexts.map(c => c.id));

      // Verify all contexts were created
      expect(contexts).toHaveLength(3);
      expect(contexts.every(c => c.user_id === testUserId)).toBe(true);

      // Verify unique names
      const names = contexts.map(c => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);
    });

    it('should maintain data integrity', async () => {
      // Create context
      const context = await contextService.createContext({
        name: 'Data Integrity Test',
        description: 'Testing data integrity'
      });
      createdContexts.push(context.id);

      // Create test prompt (assuming prompts table exists)
      const { data: testPrompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          user_id: testUserId,
          title: 'Test Prompt for Context',
          content: 'Test prompt content'
        })
        .select()
        .single();

      if (promptError || !testPrompt) {
        console.warn('Could not create test prompt, skipping prompt association test');
        return;
      }

      try {
        // Associate prompt with context
        await contextService.addPromptToContext(context.id, testPrompt.id);

        // Verify association exists
        const { data: associations } = await supabase
          .from('context_prompts')
          .select('*')
          .eq('context_id', context.id)
          .eq('prompt_id', testPrompt.id);

        expect(associations).toHaveLength(1);

        // Remove association
        await contextService.removePromptFromContext(context.id, testPrompt.id);

        // Verify association removed
        const { data: remainingAssociations } = await supabase
          .from('context_prompts')
          .select('*')
          .eq('context_id', context.id)
          .eq('prompt_id', testPrompt.id);

        expect(remainingAssociations).toHaveLength(0);

      } finally {
        // Clean up test prompt
        await supabase
          .from('prompts')
          .delete()
          .eq('id', testPrompt.id);
      }
    });
  });

  describe('with existing prompts', () => {
    it('should create context and associate prompts', async () => {
      // Create test prompts first
      const { data: testPrompts, error } = await supabase
        .from('prompts')
        .insert([
          {
            user_id: testUserId,
            title: 'Test Prompt 1',
            content: 'Content for prompt 1'
          },
          {
            user_id: testUserId,
            title: 'Test Prompt 2', 
            content: 'Content for prompt 2'
          }
        ])
        .select();

      if (error || !testPrompts) {
        console.warn('Could not create test prompts, skipping test');
        return;
      }

      try {
        // Create context
        const context = await contextService.createContext({
          name: 'Context with Prompts',
          description: 'Testing prompt associations'
        });
        createdContexts.push(context.id);

        // Associate prompts with context
        await Promise.all(
          testPrompts.map(prompt =>
            contextService.addPromptToContext(context.id, prompt.id)
          )
        );

        // Verify associations
        const { data: associations } = await supabase
          .from('context_prompts')
          .select('*')
          .eq('context_id', context.id);

        expect(associations).toHaveLength(testPrompts.length);

      } finally {
        // Clean up test prompts
        await supabase
          .from('prompts')
          .delete()
          .in('id', testPrompts.map(p => p.id));
      }
    });

    it('should filter prompts by context', async () => {
      // Create two contexts
      const context1 = await contextService.createContext({
        name: 'Context 1',
        description: 'First context'
      });
      createdContexts.push(context1.id);

      const context2 = await contextService.createContext({
        name: 'Context 2', 
        description: 'Second context'
      });
      createdContexts.push(context2.id);

      // Create test prompts
      const { data: testPrompts, error } = await supabase
        .from('prompts')
        .insert([
          {
            user_id: testUserId,
            title: 'Prompt for Context 1',
            content: 'Content for context 1',
            context_id: context1.id
          },
          {
            user_id: testUserId,
            title: 'Prompt for Context 2',
            content: 'Content for context 2', 
            context_id: context2.id
          }
        ])
        .select();

      if (error || !testPrompts) {
        console.warn('Could not create test prompts, skipping test');
        return;
      }

      try {
        // Query prompts by context
        const { data: context1Prompts } = await supabase
          .from('prompts')
          .select('*')
          .eq('context_id', context1.id);

        const { data: context2Prompts } = await supabase
          .from('prompts')
          .select('*')
          .eq('context_id', context2.id);

        expect(context1Prompts).toHaveLength(1);
        expect(context2Prompts).toHaveLength(1);
        expect(context1Prompts![0].title).toBe('Prompt for Context 1');
        expect(context2Prompts![0].title).toBe('Prompt for Context 2');

      } finally {
        // Clean up test prompts
        await supabase
          .from('prompts')
          .delete()
          .in('id', testPrompts.map(p => p.id));
      }
    });

    it('should handle context switching', async () => {
      // Create multiple contexts
      const contexts = await Promise.all([
        contextService.createContext({ name: 'Work Context' }),
        contextService.createContext({ name: 'Personal Context' }),
        contextService.createContext({ name: 'Learning Context' })
      ]);

      createdContexts.push(...contexts.map(c => c.id));

      // Set first context as default
      const defaultContext = await contextService.setDefaultContext(contexts[0].id);
      expect(defaultContext.is_default).toBe(true);

      // Verify other contexts are not default
      const allContexts = await contextService.getContexts();
      const otherContexts = allContexts.filter(c => c.id !== contexts[0].id);
      expect(otherContexts.every(c => !c.is_default)).toBe(true);

      // Switch default to another context
      const newDefaultContext = await contextService.setDefaultContext(contexts[1].id);
      expect(newDefaultContext.is_default).toBe(true);

      // Verify previous default is no longer default
      const updatedContexts = await contextService.getContexts();
      const previousDefault = updatedContexts.find(c => c.id === contexts[0].id);
      expect(previousDefault?.is_default).toBe(false);
    });
  });
});
