import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { SearchService } from '../services/SearchService'
import type { GlobalSearchItem } from '../types'

describe('SearchService Integration', () => {
  let searchService: SearchService
  let testPromptIds: string[] = []
  let testContextIds: string[] = []
  let testUserId: string

  beforeEach(async () => {
    // Initialize search service
    searchService = new SearchService()

    // Create a test user first
    const { data: authData } = await supabase.auth.signUp({
      email: `test-search-${Date.now()}@example.com`,
      password: 'password123',
      options: {
        emailRedirectTo: undefined // Disable email confirmation for tests
      }
    })

    testUserId = authData.user?.id || 'test-user'

    // Create test prompts in Supabase
    const testPrompts = [
      {
        title: 'JavaScript Testing Guide',
        content: 'A comprehensive guide for testing JavaScript applications with Jest and Vitest',
        category: 'development',
        tags: ['javascript', 'testing', 'jest', 'vitest'],
        user_id: testUserId,
        is_public: true
      },
      {
        title: 'React Component Best Practices',
        content: 'Best practices for creating reusable React components with TypeScript',
        category: 'frontend',
        tags: ['react', 'typescript', 'components'],
        user_id: testUserId,
        is_public: true
      },
      {
        title: 'API Integration Patterns',
        content: 'Common patterns for integrating with REST and GraphQL APIs',
        category: 'backend',
        tags: ['api', 'rest', 'graphql', 'integration'],
        user_id: testUserId,
        is_public: false
      }
    ]

    for (const prompt of testPrompts) {
      const { data, error } = await supabase
        .from('prompts')
        .insert(prompt)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating test prompt:', error)
        throw error
      }

      if (data) {
        testPromptIds.push(data.id)
      }
    }

    // Create test contexts in Supabase
    const testContexts = [
      {
        name: 'Frontend Development Context',
        description: 'Context for frontend development tasks',
        user_id: testUserId,
        is_active: true,
        settings: { framework: 'react', language: 'typescript' }
      },
      {
        name: 'Testing Context',
        description: 'Context for testing and QA activities',
        user_id: testUserId,
        is_active: false,
        settings: { testFramework: 'vitest', coverage: '90%' }
      }
    ]

    for (const context of testContexts) {
      const { data, error } = await supabase
        .from('contexts')
        .insert(context)
        .select('id')
        .single()

      if (error) {
        console.error('Error creating test context:', error)
        throw error
      }

      if (data) {
        testContextIds.push(data.id)
      }
    }
  })

  afterEach(async () => {
    // Clean up test data
    if (testPromptIds.length > 0) {
      await supabase
        .from('prompts')
        .delete()
        .in('id', testPromptIds)
    }

    if (testContextIds.length > 0) {
      await supabase
        .from('contexts')
        .delete()
        .in('id', testContextIds)
    }

    // Clean up test user
    if (testUserId && testUserId !== 'test-user') {
      await supabase.auth.admin.deleteUser(testUserId)
    }

    // Reset arrays
    testPromptIds = []
    testContextIds = []
  })

  describe('Data Integration', () => {
    it('should index prompts from Supabase', async () => {
      // Fetch prompts from Supabase and convert to search items
      const { data: prompts, error } = await supabase
        .from('prompts')
        .select('*')
        .in('id', testPromptIds)

      expect(error).toBeNull()
      expect(prompts).toBeDefined()
      expect(prompts!.length).toBe(3)

      // Convert to search items
      const searchItems: GlobalSearchItem[] = prompts!.map(prompt => ({
        id: prompt.id,
        type: 'prompt' as const,
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        category: prompt.category,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        metadata: {
          user_id: prompt.user_id,
          is_public: prompt.is_public
        }
      }))

      // Update search index
      searchService.updateItems(searchItems)

      // Test search functionality
      const results = await searchService.search('JavaScript')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].item.title).toBe('JavaScript Testing Guide')
    })

    it('should index contexts from Supabase', async () => {
      // Fetch contexts from Supabase and convert to search items
      const { data: contexts, error } = await supabase
        .from('contexts')
        .select('*')
        .in('id', testContextIds)

      expect(error).toBeNull()
      expect(contexts).toBeDefined()
      expect(contexts!.length).toBe(2)

      // Convert to search items
      const searchItems: GlobalSearchItem[] = contexts!.map(context => ({
        id: context.id,
        type: 'context' as const,
        title: context.name,
        content: context.description || '',
        tags: Object.keys(context.variables || {}),
        category: 'context',
        created_at: context.created_at,
        updated_at: context.updated_at,
        metadata: {
          user_id: context.user_id,
          is_active: context.is_active,
          variables: context.variables
        }
      }))

      // Update search index
      searchService.updateItems(searchItems)

      // Test search functionality
      const results = await searchService.search('Frontend')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].item.title).toBe('Frontend Development Context')
    })

    it('should search across all content types', async () => {
      // Fetch both prompts and contexts
      const [{ data: prompts }, { data: contexts }] = await Promise.all([
        supabase.from('prompts').select('*').in('id', testPromptIds),
        supabase.from('contexts').select('*').in('id', testContextIds)
      ])

      // Convert to search items
      const allItems: GlobalSearchItem[] = [
        ...(prompts || []).map(prompt => ({
          id: prompt.id,
          type: 'prompt' as const,
          title: prompt.title,
          content: prompt.content,
          tags: prompt.tags || [],
          category: prompt.category,
          created_at: prompt.created_at,
          updated_at: prompt.updated_at,
          metadata: { user_id: prompt.user_id, is_public: prompt.is_public }
        })),
        ...(contexts || []).map(context => ({
          id: context.id,
          type: 'context' as const,
          title: context.name,
          content: context.description || '',
          tags: Object.keys(context.variables || {}),
          category: 'context',
          created_at: context.created_at,
          updated_at: context.updated_at,
          metadata: {
            user_id: context.user_id,
            is_active: context.is_active,
            variables: context.variables
          }
        }))
      ]

      // Update search index
      searchService.updateItems(allItems)

      // Search for common term that appears in both types
      const results = await searchService.search('testing')
      expect(results.length).toBeGreaterThan(0)

      // Verify we get both prompts and contexts
      const types = results.map(r => r.item.type)
      expect(types).toContain('prompt')
      expect(types).toContain('context')
    })
  })

  describe('Filtering Integration', () => {
    beforeEach(async () => {
      // Setup search index with all data
      const [{ data: prompts }, { data: contexts }] = await Promise.all([
        supabase.from('prompts').select('*').in('id', testPromptIds),
        supabase.from('contexts').select('*').in('id', testContextIds)
      ])

      const allItems: GlobalSearchItem[] = [
        ...(prompts || []).map(prompt => ({
          id: prompt.id,
          type: 'prompt' as const,
          title: prompt.title,
          content: prompt.content,
          tags: prompt.tags || [],
          category: prompt.category,
          created_at: prompt.created_at,
          updated_at: prompt.updated_at,
          metadata: { user_id: prompt.user_id, is_public: prompt.is_public }
        })),
        ...(contexts || []).map(context => ({
          id: context.id,
          type: 'context' as const,
          title: context.name,
          content: context.description || '',
          tags: Object.keys(context.variables || {}),
          category: 'context',
          created_at: context.created_at,
          updated_at: context.updated_at,
          metadata: {
            user_id: context.user_id,
            is_active: context.is_active,
            variables: context.variables
          }
        }))
      ]

      searchService.updateItems(allItems)
    })

    it('should filter by content type', async () => {
      const promptResults = await searchService.search('', { type: 'prompt' })
      const contextResults = await searchService.search('', { type: 'context' })

      expect(promptResults.every(r => r.item.type === 'prompt')).toBe(true)
      expect(contextResults.every(r => r.item.type === 'context')).toBe(true)
      expect(promptResults.length).toBe(3)
      expect(contextResults.length).toBe(2)
    })

    it('should filter by category', async () => {
      const devResults = await searchService.search('', { category: 'development' })
      expect(devResults.length).toBeGreaterThan(0)
      expect(devResults.every(r => r.item.category === 'development')).toBe(true)
    })

    it('should filter by tags', async () => {
      const reactResults = await searchService.search('', { tags: ['react'] })
      expect(reactResults.length).toBeGreaterThan(0)
      expect(reactResults.every(r => r.item.tags.includes('react'))).toBe(true)
    })
  })
/*
  describe('Real-time Updates', () => {
    it('should update search index when data changes', async () => {
      // Initial setup
      const { data: prompts } = await supabase
        .from('prompts')
        .select('*')
        .in('id', testPromptIds)

      const searchItems: GlobalSearchItem[] = (prompts || []).map(prompt => ({
        id: prompt.id,
        type: 'prompt' as const,
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        category: prompt.category,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        metadata: { user_id: prompt.user_id, is_public: prompt.is_public }
      }))

      searchService.updateItems(searchItems)

      // Verify initial search
      let results = await searchService.search('Python')
      expect(results.length).toBe(0)

      // Update a prompt in the database
      const { error } = await supabase
        .from('prompts')
        .update({
          title: 'Python Testing Guide',
          content: 'A comprehensive guide for testing Python applications',
          tags: ['python', 'testing', 'pytest']
        })
        .eq('id', testPromptIds[0])

      expect(error).toBeNull()

      // Fetch updated data and update search index
      const { data: updatedPrompts } = await supabase
        .from('prompts')
        .select('*')
        .in('id', testPromptIds)

      const updatedSearchItems: GlobalSearchItem[] = (updatedPrompts || []).map(prompt => ({
        id: prompt.id,
        type: 'prompt' as const,
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        category: prompt.category,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        metadata: { user_id: prompt.user_id, is_public: prompt.is_public }
      }))

      searchService.updateItems(updatedSearchItems)

      // Verify updated search
      results = await searchService.search('Python')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].item.title).toBe('Python Testing Guide')
    })
  })
*/
  describe('Performance with Real Data', () => {
    it('should handle large datasets from database', async () => {
      // Create additional test data for performance testing
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        title: `Performance Test Prompt ${i}`,
        content: `This is performance test prompt number ${i} with various keywords and content`,
        category: 'test',
        tags: [`tag${i % 10}`, 'performance', 'test'],
        user_id: testUserId,
        is_public: true
      }))

      // Insert large dataset
      const { data: insertedPrompts, error } = await supabase
        .from('prompts')
        .insert(largeDataset)
        .select('id')

      expect(error).toBeNull()
      expect(insertedPrompts).toBeDefined()

      const insertedIds = insertedPrompts!.map(p => p.id)

      try {
        // Fetch all data
        const { data: allPrompts } = await supabase
          .from('prompts')
          .select('*')
          .in('id', [...testPromptIds, ...insertedIds])

        const searchItems: GlobalSearchItem[] = (allPrompts || []).map(prompt => ({
          id: prompt.id,
          type: 'prompt' as const,
          title: prompt.title,
          content: prompt.content,
          tags: prompt.tags || [],
          category: prompt.category,
          created_at: prompt.created_at,
          updated_at: prompt.updated_at,
          metadata: { user_id: prompt.user_id, is_public: prompt.is_public }
        }))

        // Measure search performance
        const startTime = Date.now()
        searchService.updateItems(searchItems)
        const results = await searchService.search('performance')
        const duration = Date.now() - startTime

        expect(results.length).toBeGreaterThan(0)
        expect(duration).toBeLessThan(1000) // Should complete within 1 second
      } finally {
        // Clean up large dataset
        await supabase
          .from('prompts')
          .delete()
          .in('id', insertedIds)
      }
    })
  })
})
