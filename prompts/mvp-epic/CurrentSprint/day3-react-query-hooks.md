# Day 3: React Query Integration & API Hooks

## Task Overview
Implement React Query integration with custom hooks for prompt management, including optimistic updates and caching strategies.

## Test-Driven Development Approach

### Unit Tests to Write First
```typescript
// tests/hooks/usePrompts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { usePrompts } from '../../src/hooks/usePrompts'

const server = setupServer(
  http.get('/api/prompts', () => {
    return HttpResponse.json([
      { id: 1, title: 'Test Prompt', content: 'Test content' }
    ])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePrompts Hook', () => {
  test('should fetch prompts for current user', async () => {
    const { result } = renderHook(() => usePrompts(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0].title).toBe('Test Prompt')
  })

  test('should apply filters and pagination', async () => {
    const { result } = renderHook(() => usePrompts({ 
      filters: { category: 'work' }, 
      page: 2 
    }), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  test('should handle loading and error states', async () => {
    server.use(
      http.get('/api/prompts', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => usePrompts(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  test('should cache results appropriately')
  test('should invalidate cache on data changes')
  test('should retry failed requests')
})

// tests/hooks/useCreatePrompt.test.ts
describe('useCreatePrompt Hook', () => {
  test('should create prompt successfully', async () => {
    server.use(
      http.post('/api/prompts', async ({ request }) => {
        const data = await request.json()
        return HttpResponse.json({ 
          id: 2, 
          ...data 
        }, { status: 201 })
      })
    )

    const { result } = renderHook(() => useCreatePrompt(), {
      wrapper: createWrapper()
    })

    act(() => {
      result.current.mutate({
        title: 'New Prompt',
        content: 'New content'
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  test('should handle optimistic updates')
  test('should rollback on error')
  test('should validate input data')
  test('should update cache after creation')
  test('should handle concurrent creation attempts')
})

// tests/hooks/useUpdatePrompt.test.ts
describe('useUpdatePrompt Hook', () => {
  test('should update prompt and refresh cache')
  test('should handle partial updates')
  test('should show loading states during update')
  test('should handle validation errors')
  test('should implement optimistic UI updates')
})
```

### Integration Tests to Write
```typescript
// tests/integration/react-query-setup.test.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { PromptsList } from '../../src/components/PromptsList'

const server = setupServer(
  http.get('/api/prompts', () => {
    return HttpResponse.json([
      { id: 1, title: 'Integration Test Prompt' }
    ])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('React Query Integration', () => {
  test('should configure query client properly', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
        },
        mutations: {
          retry: 1,
        }
      }
    })

    render(
      <QueryClientProvider client={queryClient}>
        <PromptsList />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Integration Test Prompt')).toBeInTheDocument()
    })
  })

  test('should handle query invalidation across hooks', async () => {
    // Test cache invalidation after mutations
  })

  test('should manage cache persistence', () => {
    // Test cache persistence strategies
  })

  test('should handle network status changes', async () => {
    // Test offline/online behavior
    server.use(
      http.get('/api/prompts', () => {
        return HttpResponse.error()
      })
    )
  })

  test('should implement proper error boundaries', () => {
    // Test error boundary integration
  })
})
```

## Implementation Tasks

### 1. React Query Setup
- Configure QueryClient with proper defaults
- Set up error handling and retry logic
- Implement cache persistence strategies
- Create development tools integration

### 2. Core Prompt Hooks
- usePrompts - fetch and filter prompts
- useCreatePrompt - create with optimistic updates
- useUpdatePrompt - update with cache invalidation
- useDeletePrompt - delete with confirmation
- usePromptById - fetch individual prompt

### 3. Search and Filter Hooks
- usePromptSearch - debounced search with filters
- useCategories - manage category data
- useTags - auto-complete and tag management
- usePromptFilters - complex filter combinations

### 4. Cache Management
- Implement optimistic updates
- Handle cache invalidation strategies
- Set up background refetch policies
- Create offline-first capabilities

## Acceptance Criteria
- [ ] All prompt management hooks implemented
- [ ] Optimistic updates work correctly
- [ ] Cache invalidation handles all scenarios
- [ ] Error states provide clear feedback
- [ ] Loading states enhance user experience
- [ ] Background refetch works properly
- [ ] All hooks have comprehensive test coverage

## Testing Commands
```bash
# Run hook tests
npm run test -- tests/hooks/

# Test React Query integration
npm run test -- tests/integration/react-query-setup.test.ts

# Test optimistic updates
npm run test -- tests/hooks/optimistic-updates.test.ts
```

## Dependencies Required
This task requires React Query testing utilities and MSW v2 for API mocking. Modern React 19 compatible packages only.

## Installation Script
```bash
#!/bin/bash
# install-day3-dependencies.sh

echo "Installing Day 3 dependencies..."

# Note: @testing-library/react-hooks is deprecated and incompatible with React 19
# Hook testing is now built into @testing-library/react (already installed)

# Install MSW v2 for API mocking (React 19 compatible)
npm install --save-dev msw@^2.0.0

# Install React Query development tools
npm install --save @tanstack/react-query-devtools@^5.0.0

# Ensure we have the latest @testing-library/react for hook testing
npm install --save-dev @testing-library/react@^16.0.0

echo "Day 3 dependencies installed successfully!"
echo "Note: Hook testing is now built into @testing-library/react"
echo "Use renderHook from @testing-library/react instead of @testing-library/react-hooks"
echo "Run 'npm run test' to verify React Query integration"
```

## Success Metrics
- Hook test coverage: >95%
- Cache hit ratio: >80% for repeated queries
- Optimistic update success: >98% of operations
- Error recovery: 100% of failed operations handled gracefully
- Background refetch: Updates within 30 seconds of data changes
