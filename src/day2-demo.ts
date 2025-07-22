/**
 * Day 2 TDD Implementation Demo
 * Demonstrates the complete database operations layer with type safety,
 * React Query integration, and performance monitoring
 */
import { createClient } from '@supabase/supabase-js'
import { DatabaseClient } from './lib/database/database-client'
import { PerformanceMonitor, createPerformanceMonitor } from './lib/database/performance-monitor'
import type { Database } from './types/database.types'

// Example usage of the complete Day 2 implementation
async function demonstrateDay2Implementation() {
  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
  )

  // Initialize database client with type safety
  const dbClient = new DatabaseClient(supabase)

  // Initialize performance monitoring
  const performanceMonitor = createPerformanceMonitor(dbClient)

  console.log('🚀 Day 2 Sprint 2: Database Setup Completion & API Layer Foundation')
  console.log('================================================================')

  try {
    // Example 1: Type-safe prompt creation with error handling
    console.log('\n1. Creating a new prompt with type safety...')
    const createResult = await dbClient.createPrompt({
      title: 'Test Prompt',
      content: 'This is a test prompt demonstrating our type-safe database operations.',
      user_id: 'user-123',
      organization_id: 'org-456',
      visibility: 'public',
      tags: ['test', 'demo']
    })

    if (createResult.error) {
      console.error('❌ Create failed:', createResult.error.message)
      console.log('   User-friendly message:', createResult.error.getUserFriendlyMessage())
    } else {
      console.log('✅ Prompt created successfully:', createResult.data?.id)
    }

    // Example 2: Performance-monitored search
    console.log('\n2. Performing monitored full-text search...')
    const searchStart = performance.now()
    const searchResult = await performanceMonitor.monitoredSearchPrompts('test', {
      visibility: 'public',
      limit: 10
    })
    const searchTime = performance.now() - searchStart

    if (searchResult.error) {
      console.error('❌ Search failed:', searchResult.error.message)
    } else {
      console.log(`✅ Search completed in ${searchTime.toFixed(2)}ms`)
      console.log(`   Found ${searchResult.data?.length || 0} results`)
    }

    // Example 3: Performance monitoring report
    console.log('\n3. Performance monitoring report...')
    const healthCheck = performanceMonitor.isPerformanceHealthy()
    
    if (healthCheck.healthy) {
      console.log('✅ System performance is healthy')
      console.log(`   Average query time: ${healthCheck.stats.averageDuration.toFixed(2)}ms`)
      console.log(`   Success rate: ${(healthCheck.stats.successRate * 100).toFixed(1)}%`)
    } else {
      console.log('⚠️  Performance issues detected:')
      healthCheck.issues.forEach(issue => console.log(`   - ${issue}`))
    }

    // Example 4: Filtered queries with proper error handling
    console.log('\n4. Filtered query example...')
    const filteredResult = await dbClient.getPrompts({
      visibility: 'public',
      tags: ['test'],
      orderBy: 'created_at',
      orderDirection: 'desc',
      limit: 5
    })

    if (filteredResult.error) {
      console.error('❌ Filtered query failed:', filteredResult.error.message)
    } else {
      console.log(`✅ Found ${filteredResult.data?.length || 0} public test prompts`)
      console.log(`   Total count: ${filteredResult.count || 0}`)
    }

    console.log('\n🎉 Day 2 implementation demonstration completed!')
    console.log('   ✅ Type-safe database operations')
    console.log('   ✅ Comprehensive error handling')
    console.log('   ✅ Full-text search functionality')
    console.log('   ✅ Performance monitoring')
    console.log('   ✅ React Query hooks ready')

  } catch (error) {
    console.error('💥 Unexpected error during demonstration:', error)
  }
}

export { demonstrateDay2Implementation, DatabaseClient, PerformanceMonitor }

// React Query Hook Usage Examples (for reference)
/*
// Example hook usage in a React component:

import { usePrompts, useCreatePrompt, useSearchPrompts } from './hooks/usePrompts'
import { DatabaseClient } from './lib/database/database-client'

function PromptsComponent() {
  const dbClient = new DatabaseClient(supabase)
  
  // Fetch prompts with caching and error handling
  const { data: prompts, isLoading, error } = usePrompts(dbClient, {
    visibility: 'public',
    limit: 20
  })
  
  // Create prompt with optimistic updates
  const createPromptMutation = useCreatePrompt(dbClient, {
    onSuccess: () => {
      toast.success('Prompt created successfully!')
    },
    onError: (error) => {
      toast.error(error.getUserFriendlyMessage() || 'Failed to create prompt')
    }
  })
  
  // Search with debouncing and caching
  const { data: searchResults } = useSearchPrompts(dbClient, searchQuery, {
    visibility: 'public'
  })
  
  return (
    <div>
      {isLoading && <div>Loading prompts...</div>}
      {error && <div>Error: {error.getUserFriendlyMessage()}</div>}
      {prompts?.map(prompt => (
        <div key={prompt.id}>{prompt.title}</div>
      ))}
    </div>
  )
}
*/
