# Day 1: Database Schema & API Foundation

## Task Overview
Implement the database schema for prompts and categories with full-text search capabilities, RLS policies, and proper indexing.

## Test-Driven Development Approach

### Unit Tests to Write First
```typescript
// tests/database/prompts.test.ts
describe('Prompts Database Schema', () => {
  test('should create prompt with all required fields')
  test('should generate full-text search vector automatically')
  test('should enforce user ownership via RLS')
  test('should handle array tags correctly')
  test('should validate visibility enum values')
  test('should auto-update updated_at timestamp')
})

// tests/database/categories.test.ts  
describe('Categories Database Schema', () => {
  test('should create organization-specific categories')
  test('should prevent duplicate category names per org')
  test('should cascade delete when organization removed')
  test('should track category creator')
})
```

### Integration Tests to Write
```typescript
// tests/integration/database-setup.test.ts
describe('Database Setup Integration', () => {
  test('should run all migrations successfully')
  test('should create all required indexes')
  test('should enforce all RLS policies')
  test('should handle concurrent prompt creation')
  test('should perform full-text search efficiently')
})
```

## Implementation Tasks

### 1. Database Migration Files
- Create prompts table with full-text search
- Create categories table with organization relationships
- Create indexes for performance optimization
- Set up Row Level Security policies

### 2. SQL Schema Validation
- Test constraint enforcement
- Validate RLS policy functionality
- Verify index performance with sample data
- Test cascade delete behaviors

### 3. Supabase Type Generation
- Generate TypeScript types from schema
- Validate type accuracy with test data
- Set up type-safe query builders

## Acceptance Criteria
- [ ] All database migrations run without errors
- [ ] Full-text search indexes are functional
- [ ] RLS policies properly restrict access
- [ ] TypeScript types generated and accurate
- [ ] Performance indexes show query improvement
- [ ] All database tests pass with 100% coverage

## Testing Commands
```bash
# Run database tests
npm run test -- tests/database/

# Test migrations
npm run supabase:reset && npm run test:integration

# Performance testing
npm run test -- tests/performance/database.test.ts
```

## Dependencies
- Sprint 1 authentication system must be complete
- Supabase local environment must be running
- Organization table from Sprint 1 must exist

## Success Metrics
- Migration execution time: <10 seconds
- Full-text search query time: <50ms
- RLS policy enforcement: 100% test coverage
- Type generation: Zero TypeScript errors
