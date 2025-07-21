/**
 * Unit tests for Categories Database Schema
 * Testing Day 1 Sprint 2 requirements for category management
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

// Use local Supabase instance for testing
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

describe('Categories Database Schema', () => {
  let testUserId: string
  let testOrgId: string

  beforeEach(async () => {
    // Create test user and organization for each test
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }
    
    testUserId = userData.user.id

    // Create test organization
    const orgSlug = `test-org-${Date.now()}`
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

  test('should create organization-specific categories', async () => {
    const categoryData = {
      name: 'Development',
      description: 'Software development related prompts',
      color: '#10B981',
      organization_id: testOrgId
      // Note: for organization categories, user_id should be null
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({
      name: categoryData.name,
      description: categoryData.description,
      color: categoryData.color,
      organization_id: testOrgId,
      user_id: null
    })
    expect(data.id).toBeDefined()
    expect(data.created_at).toBeDefined()
  })

  test('should prevent duplicate category names per organization', async () => {
    const categoryName = 'Duplicate Test Category'

    // Create first category
    const { error: firstError } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        organization_id: testOrgId
      })

    expect(firstError).toBeNull()

    // Try to create duplicate category in same organization
    const { error: duplicateError } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        organization_id: testOrgId
      })

    expect(duplicateError).toBeDefined()
    expect(duplicateError?.code).toBe('23505') // Unique constraint violation
  })

  test('should allow same category name in different organizations', async () => {
    const categoryName = 'Cross-Org Category'

    // Create second organization
    const { data: org2Data } = await supabase
      .from('organizations')
      .insert({
        name: `Test Org 2 ${Date.now()}`,
        slug: `test-org-2-${Date.now()}`,
        created_by: testUserId
      })
      .select()
      .single()

    // Create category in first organization
    const { error: org1Error } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        organization_id: testOrgId
      })

    expect(org1Error).toBeNull()

    // Create category with same name in second organization (should succeed)
    const { error: org2Error } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        organization_id: org2Data!.id
      })

    expect(org2Error).toBeNull()

    // Clean up second org
    await supabase.from('organizations').delete().eq('id', org2Data!.id)
  })

  test('should cascade delete when organization removed', async () => {
    // Create category
    const { data: categoryData } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category for Cascade',
        organization_id: testOrgId
      })
      .select()
      .single()

    expect(categoryData).toBeDefined()

    // Delete organization
    const { error: deleteOrgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrgId)

    expect(deleteOrgError).toBeNull()

    // Check that category was also deleted
    const { data: remainingCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryData!.id)

    expect(remainingCategories).toHaveLength(0)

    // Prevent cleanup from running since we already deleted the org
    testOrgId = ''
  })

  test('should track category creator via user_id for personal categories', async () => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: 'Personal Category',
        description: 'My personal category',
        user_id: testUserId
        // Note: for personal categories, organization_id should be null
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.user_id).toBe(testUserId)
    expect(data.organization_id).toBeNull()
    expect(data.created_at).toBeDefined()
    expect(data.updated_at).toBeDefined()
  })

  test('should enforce RLS policies for categories', async () => {
    // Create category as test user
    const { data: categoryData } = await supabase
      .from('categories')
      .insert({
        name: 'RLS Test Category',
        user_id: testUserId
      })
      .select()
      .single()

    expect(categoryData).toBeDefined()

    // Create second user
    const { data: user2Data } = await supabase.auth.admin.createUser({
      email: `test2-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })

    // Create a client with anon key and sign in as user2
    const anonSupabaseUrl = 'http://127.0.0.1:54321'
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    const user2Client = createClient<Database>(anonSupabaseUrl, anonKey)
    
    // Sign in as user2
    const { error: signInError } = await user2Client.auth.signInWithPassword({
      email: user2Data.user!.email!,
      password: 'testpassword123'
    })

    expect(signInError).toBeNull()

    // User 2 should not be able to see user 1's categories
    const { data: user2Categories } = await user2Client
      .from('categories')
      .select('*')
      .eq('id', categoryData!.id)

    expect(user2Categories).toHaveLength(0)

    // Clean up second user
    await supabase.auth.admin.deleteUser(user2Data.user!.id)
  })
})
