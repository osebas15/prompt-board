/**
 * Unit tests for Prompts Database Schema
 * Testing Day 1 Sprint 2 requirements for enhanced prompt management
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

// Use local Supabase instance for testing
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
const anonSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

describe('Prompts Database Schema', () => {
  let testUserId: string
  let testOrgId: string

  beforeEach(async () => {
    // Create test user and organization for each test
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }
    
    testUserId = userData.user.id

    // Create test organization with unique slug to avoid conflicts
    const orgSlug = `test-org-${Date.now()}-${Math.random().toString(36).substring(2)}`
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `Test Org ${Date.now()}`,
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

  test('should create prompt with all required fields', async () => {
    const promptData = {
      title: 'Test Prompt',
      description: 'A test prompt description',
      content: 'This is the content of the test prompt',
      user_id: testUserId,
      organization_id: testOrgId,
      visibility: 'private' as const,
      tags: ['test', 'prompt']
    }

    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({
      title: promptData.title,
      description: promptData.description,
      content: promptData.content,
      user_id: testUserId,
      organization_id: testOrgId,
      visibility: 'private',
      tags: ['test', 'prompt']
    })
    expect(data.id).toBeDefined()
    expect(data.created_at).toBeDefined()
    expect(data.updated_at).toBeDefined()
  })

  test('should generate full-text search vector automatically', async () => {
    const promptData = {
      title: 'JavaScript Testing Guide',
      description: 'Comprehensive guide for testing JavaScript applications',
      content: 'This prompt covers unit testing, integration testing, and end-to-end testing strategies for modern JavaScript applications.',
      user_id: testUserId,
      organization_id: testOrgId,
      visibility: 'team' as const
    }

    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()

    // Test full-text search functionality
    const { data: searchResults, error: searchError } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'JavaScript & testing')
      .eq('user_id', testUserId)

    expect(searchError).toBeNull()
    expect(searchResults).toHaveLength(1)
    expect(searchResults?.[0].id).toBe(data.id)
  })

  test('should enforce user ownership via RLS', async () => {
    // Create prompt as test user
    const { data: promptData } = await supabase
      .from('prompts')
      .insert({
        title: 'Private Test Prompt',
        content: 'This should only be visible to the owner',
        user_id: testUserId,
        organization_id: testOrgId,
        visibility: 'private'
      })
      .select()
      .single()

    // Try to access as anonymous user (should fail)
    const { data: anonData, error: _anonError } = await anonSupabase
      .from('prompts')
      .select('*')
      .eq('id', promptData!.id)

    expect(anonData).toHaveLength(0) // RLS should prevent access
  })

  test('should handle array tags correctly', async () => {
    const tags = ['javascript', 'react', 'testing', 'frontend']
    
    const { data, error } = await supabase
      .from('prompts')
      .insert({
        title: 'React Testing Prompt',
        content: 'Testing React components',
        user_id: testUserId,
        organization_id: testOrgId,
        tags
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.tags).toEqual(tags)

    // Test tag-based filtering
    const { data: taggedPrompts } = await supabase
      .from('prompts')
      .select('*')
      .contains('tags', ['react'])
      .eq('user_id', testUserId)

    expect(taggedPrompts).toHaveLength(1)
    expect(taggedPrompts?.[0].id).toBe(data.id)
  })

  test('should validate visibility enum values', async () => {
    // Test valid visibility values
    const validVisibilities = ['private', 'team', 'public'] as const
    
    for (const visibility of validVisibilities) {
      const { error } = await supabase
        .from('prompts')
        .insert({
          title: `Test Prompt ${visibility}`,
          content: 'Test content',
          user_id: testUserId,
          organization_id: testOrgId,
          visibility
        })

      expect(error).toBeNull()
    }

    // Test invalid visibility value
    const { error: invalidError } = await supabase
      .from('prompts')
      .insert({
        title: 'Invalid Visibility Prompt',
        content: 'Test content',
        user_id: testUserId,
        organization_id: testOrgId,
        // @ts-expect-error - Testing invalid value
        visibility: 'invalid_visibility'
      })

    expect(invalidError).toBeDefined()
    expect(invalidError?.message).toContain('invalid input value')
  })

  test('should auto-update updated_at timestamp', async () => {
    // Create prompt
    const { data: initialData } = await supabase
      .from('prompts')
      .insert({
        title: 'Timestamp Test Prompt',
        content: 'Initial content',
        user_id: testUserId,
        organization_id: testOrgId
      })
      .select()
      .single()

    const initialTimestamp = initialData!.updated_at

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update prompt
    const { data: updatedData } = await supabase
      .from('prompts')
      .update({ content: 'Updated content' })
      .eq('id', initialData!.id)
      .select()
      .single()

    expect(updatedData!.updated_at).not.toBe(initialTimestamp)
    expect(new Date(updatedData!.updated_at).getTime()).toBeGreaterThan(
      new Date(initialTimestamp).getTime()
    )
  })
})
