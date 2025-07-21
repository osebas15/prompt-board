# Day 3: React Query Integration & API Hooks

## Task Overview
Implement React Query integration with custom hooks for prompt management, including optimistic updates and caching strategies.

## Test-Driven Development Approach

### Unit Tests to Write First
```typescript
// tests/hooks/usePrompts.test.ts
describe('usePrompts Hook', () => {
  test('should fetch prompts for current user')
  test('should apply filters and pagination')
  test('should handle loading and error states')
  test('should cache results appropriately')
  test('should invalidate cache on data changes')
  test('should retry failed requests')
})

// tests/hooks/useCreatePrompt.test.ts
describe('useCreatePrompt Hook', () => {
  test('should create prompt successfully')
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
describe('React Query Integration', () => {
  test('should configure query client properly')
  test('should handle query invalidation across hooks')
  test('should manage cache persistence')
  test('should handle network status changes')
  test('should implement proper error boundaries')
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
This task requires React Query testing utilities and mock service worker for API mocking.

## Installation Script
```bash
#!/bin/bash
# install-day3-dependencies.sh

echo "Installing Day 3 dependencies..."

# Install React Query testing utilities
npm install --save-dev @testing-library/react-hooks@^8.0.1

# Install MSW for API mocking (already installed, but ensuring version)
npm install --save-dev msw@^2.0.0

# Install React Query development tools
npm install --save @tanstack/react-query-devtools@^5.0.0

# Install additional testing utilities for hooks
npm install --save-dev react-hooks-testing-library@^1.0.0

echo "Day 3 dependencies installed successfully!"
echo "Run 'npm run test:hooks' to verify React Query integration"
```

## Success Metrics
- Hook test coverage: >95%
- Cache hit ratio: >80% for repeated queries
- Optimistic update success: >98% of operations
- Error recovery: 100% of failed operations handled gracefully
- Background refetch: Updates within 30 seconds of data changes
