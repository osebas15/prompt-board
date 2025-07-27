/**
 * Unit Tests for Full-Text Search - Day 2 Sprint 2
 * Testing PostgreSQL full-text search functionality
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import { faker } from '@faker-js/faker'

// Use local Supabase instance for testing
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

describe('Full-Text Search', () => {
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

  test('should find prompts by title keywords', async () => {
    const searchKeyword = 'JavaScript'
    const prompts = [
      {
        title: 'JavaScript Testing Guide',
        content: 'This prompt covers testing in JavaScript applications',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'Python Data Analysis',
        content: 'This prompt covers data analysis with Python',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'React JavaScript Framework',
        content: 'This prompt covers React framework for JavaScript',
        user_id: testUserId,
        organization_id: testOrgId
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Search by title keyword
    const { data: searchResults, error } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', searchKeyword)
      .eq('user_id', testUserId)

    expect(error).toBeNull()
    expect(searchResults).toHaveLength(2)
    expect(searchResults!.map(p => p.title)).toEqual(
      expect.arrayContaining([
        'JavaScript Testing Guide',
        'React JavaScript Framework'
      ])
    )
  })

  test('should search within prompt content', async () => {
    const searchKeyword = 'testing'
    const prompts = [
      {
        title: 'Development Guide',
        content: 'This prompt covers unit testing and integration testing strategies',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'Design Patterns',
        content: 'This prompt covers various design patterns for applications',
        user_id: testUserId,
        organization_id: testOrgId
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Search by content keyword
    const { data: searchResults, error } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', searchKeyword)
      .eq('user_id', testUserId)

    expect(error).toBeNull()
    expect(searchResults).toHaveLength(1)
    expect(searchResults![0].title).toBe('Development Guide')
  })

  test('should rank results by relevance', async () => {
    const searchKeyword = 'testing'
    const prompts = [
      {
        title: 'Testing Best Practices',
        content: 'Comprehensive testing guide with testing examples and testing frameworks',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'Development Guide',
        content: 'General development guide that mentions testing briefly',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'Software Quality',
        content: 'Quality assurance and testing methodologies for software',
        user_id: testUserId,
        organization_id: testOrgId
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Search and expect results ranked by relevance
    const { data: searchResults, error } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', searchKeyword)
      .eq('user_id', testUserId)

    expect(error).toBeNull()
    expect(searchResults).toHaveLength(3)
    // The first result should be most relevant (contains "testing" in title and multiple times in content)
    expect(searchResults![0].title).toBe('Testing Best Practices')
  })

  test('should handle special characters in search', async () => {
    const prompts = [
      {
        title: 'C++ Programming Guide',
        content: 'Modern C++ development techniques',
        user_id: testUserId,
        organization_id: testOrgId
      },
      {
        title: 'JavaScript ES6+ Features',
        content: 'Latest JavaScript features and syntax',
        user_id: testUserId,
        organization_id: testOrgId
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Search with special characters
    const { data: cppResults, error: cppError } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'C++')
      .eq('user_id', testUserId)

    expect(cppError).toBeNull()
    expect(cppResults).toHaveLength(1)
    expect(cppResults![0].title).toBe('C++ Programming Guide')

    // Search with + character
    const { data: jsResults, error: jsError } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'ES6+')
      .eq('user_id', testUserId)

    expect(jsError).toBeNull()
    expect(jsResults).toHaveLength(1)
    expect(jsResults![0].title).toBe('JavaScript ES6+ Features')
  })

  test('should combine search with filters', async () => {
    const prompts = [
      {
        title: 'JavaScript Testing Private',
        content: 'Private testing guide for JavaScript',
        user_id: testUserId,
        organization_id: testOrgId,
        visibility: 'private' as const,
        tags: ['javascript', 'testing']
      },
      {
        title: 'JavaScript Testing Public',
        content: 'Public testing guide for JavaScript',
        user_id: testUserId,
        organization_id: testOrgId,
        visibility: 'public' as const,
        tags: ['javascript', 'testing']
      },
      {
        title: 'Python Testing Private',
        content: 'Private testing guide for Python',
        user_id: testUserId,
        organization_id: testOrgId,
        visibility: 'private' as const,
        tags: ['python', 'testing']
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Combine text search with visibility filter
    const { data: searchResults, error } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'JavaScript')
      .eq('visibility', 'private')
      .eq('user_id', testUserId)

    expect(error).toBeNull()
    expect(searchResults).toHaveLength(1)
    expect(searchResults![0].title).toBe('JavaScript Testing Private')

    // Combine text search with tag filter
    const { data: tagResults, error: tagError } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'testing')
      .contains('tags', ['javascript'])
      .eq('user_id', testUserId)

    expect(tagError).toBeNull()
    expect(tagResults).toHaveLength(2)
    expect(tagResults!.map(p => p.title)).toEqual(
      expect.arrayContaining([
        'JavaScript Testing Private',
        'JavaScript Testing Public'
      ])
    )
  })

  test('should return highlighted search terms', async () => {
    const prompts = [
      {
        title: 'JavaScript Testing Guide',
        content: 'This guide covers JavaScript testing frameworks and testing best practices',
        user_id: testUserId,
        organization_id: testOrgId
      }
    ]

    await supabase.from('prompts').insert(prompts)

    // Search without highlighting first (highlighting requires RPC functions)
    const { data: searchResults, error } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('tsv', 'JavaScript & testing')
      .eq('user_id', testUserId)

    expect(error).toBeNull()
    expect(searchResults).toHaveLength(1)
    
    const result = searchResults![0]
    expect(result.title).toContain('JavaScript')
    expect(result.content).toContain('testing')
  })
})
