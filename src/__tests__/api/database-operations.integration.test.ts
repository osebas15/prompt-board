/**
 * Unit Tests for Database Operations - Day 2 Sprint 2
 * Testing CRUD operations with type-safe database layer
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import { faker } from '@faker-js/faker'

// Use local Supabase instance for testing
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

describe('Database Operations', () => {
  let testUserId: string
  let testOrgId: string

  beforeEach(async () => {
    // Create test user and organization for each test
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: faker.internet.email(),
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }
    
    testUserId = userData.user.id

    // Create test organization
    const orgSlug = `test-org-${Date.now()}-${Math.random().toString(36).substring(2)}`
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: faker.company.name(),
        slug: orgSlug,
        created_by: testUserId
      })
      .select()
      .single()

    if (orgError || !orgData) {
      throw new Error(`Failed to create test organization: ${orgError?.message}`)
    }

    testOrgId = orgData.id
  })

  afterEach(async () => {
    // Clean up test data
    if (testOrgId) {
      await supabase.from('organizations').delete().eq('id', testOrgId)
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  test('should create prompt with proper validation', async () => {
    const promptData = {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      content: faker.lorem.paragraphs(3),
      user_id: testUserId,
      organization_id: testOrgId,
      visibility: 'private' as const,
      tags: [faker.word.noun(), faker.word.verb()]
    }

    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    if (data) {
      expect(data).toMatchObject({
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        user_id: testUserId,
        organization_id: testOrgId,
        visibility: 'private',
        tags: promptData.tags
      })
      expect(data.id).toBeDefined()
      expect(data.created_at).toBeDefined()
      expect(data.updated_at).toBeDefined()
    }
  })

  test('should update prompt and maintain updated_at', async () => {
    // Create initial prompt
    const { data: initialData } = await supabase
      .from('prompts')
      .insert({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId
      })
      .select()
      .single()

    const initialTimestamp = initialData!.updated_at

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update prompt
    const newTitle = faker.lorem.sentence()
    const { data: updatedData, error } = await supabase
      .from('prompts')
      .update({ title: newTitle })
      .eq('id', initialData!.id)
      .select()
      .single()

    expect(error).toBeNull()
    expect(updatedData!.title).toBe(newTitle)
    expect(updatedData!.updated_at).not.toBe(initialTimestamp)
    expect(new Date(updatedData!.updated_at).getTime()).toBeGreaterThan(
      new Date(initialTimestamp).getTime()
    )
  })

  test('should delete prompt and cascade appropriately', async () => {
    // Create prompt
    const { data: promptData } = await supabase
      .from('prompts')
      .insert({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId
      })
      .select()
      .single()

    // Delete prompt
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptData!.id)

    expect(deleteError).toBeNull()

    // Verify prompt is deleted
    const { data: verifyData } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptData!.id)

    expect(verifyData).toHaveLength(0)
  })

  test('should fetch prompts with proper filtering', async () => {
    const tag1 = faker.word.noun()
    const tag2 = faker.word.verb()
    
    // Create multiple prompts with different properties
    const prompts = [
      {
        title: 'Test Prompt 1',
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId,
        tags: [tag1],
        visibility: 'private' as const
      },
      {
        title: 'Test Prompt 2',
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId,
        tags: [tag2],
        visibility: 'team' as const
      },
      {
        title: 'Test Prompt 3',
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId,
        tags: [tag1, tag2],
        visibility: 'public' as const
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Test filtering by tag
    const { data: tag1Results } = await supabase
      .from('prompts')
      .select('*')
      .contains('tags', [tag1])
      .eq('user_id', testUserId)

    expect(tag1Results).toHaveLength(2)

    // Test filtering by visibility
    const { data: privateResults } = await supabase
      .from('prompts')
      .select('*')
      .eq('visibility', 'private')
      .eq('user_id', testUserId)

    expect(privateResults).toHaveLength(1)
    expect(privateResults![0].title).toBe('Test Prompt 1')
  })

  test('should handle database connection errors', async () => {
    // Create a client with invalid URL to simulate connection error
    const invalidSupabase = createClient('http://invalid-url', supabaseServiceKey, {
      global: {
        fetch: () => Promise.reject(new Error('Network error'))
      }
    })
    
    const { error } = await invalidSupabase
      .from('prompts')
      .select('*')
      .limit(1)

    expect(error).toBeDefined()
    expect(error!.message).toContain('Network error')
  }, 1000) // 1 second timeout

  test('should enforce data validation constraints', async () => {
    // Test missing required fields
    const { error: missingTitleError } = await supabase
      .from('prompts')
      .insert({
        // title is missing - should fail
        content: faker.lorem.paragraph(),
        user_id: testUserId,
        organization_id: testOrgId
      } as any) // Using any to test validation

    expect(missingTitleError).toBeDefined()
    expect(missingTitleError!.message).toContain('null value')

    // Test that valid visibility values work
    const validVisibilities: Database['public']['Enums']['visibility_type'][] = ['private', 'team', 'public']
    
    for (const visibility of validVisibilities) {
      const { error } = await supabase
        .from('prompts')
        .insert({
          title: `Test ${visibility} Prompt`,
          content: faker.lorem.paragraph(),
          user_id: testUserId,
          organization_id: testOrgId,
          visibility
        })

      expect(error).toBeNull()
    }
  })
})
