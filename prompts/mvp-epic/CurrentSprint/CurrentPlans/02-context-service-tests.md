# Context Service Tests

## Unit Tests for Context Database Operations

### Test Structure
```typescript
// src/features/contexts/__tests__/contextService.test.ts
describe('ContextService', () => {
  // Context CRUD operations
  describe('createContext', () => {
    it('should create a new context with valid data')
    it('should set as default context if no others exist')
    it('should validate context name uniqueness')
    it('should handle database errors gracefully')
  })

  describe('getContexts', () => {
    it('should fetch user contexts with proper ordering')
    it('should filter out archived contexts by default')
    it('should include context prompt counts')
    it('should handle empty result sets')
  })

  describe('updateContext', () => {
    it('should update context properties')
    it('should handle default context switching')
    it('should validate ownership before updates')
    it('should update timestamps correctly')
  })

  describe('deleteContext', () => {
    it('should delete context and cascade relationships')
    it('should prevent deletion of default context')
    it('should handle non-existent context deletion')
    it('should clean up related files and prompts')
  })

  // Context-Prompt relationships
  describe('addPromptToContext', () => {
    it('should link prompt to context')
    it('should handle duplicate associations gracefully')
    it('should validate prompt ownership')
    it('should maintain sort order')
  })

  describe('removePromptFromContext', () => {
    it('should unlink prompt from context')
    it('should handle non-existent associations')
    it('should preserve prompt data')
  })

  // Context file management
  describe('addFileToContext', () => {
    it('should associate file with context')
    it('should store file metadata')
    it('should handle file upload errors')
    it('should validate file types')
  })
})
```

### Integration Tests
```typescript
// src/features/contexts/__tests__/contextService.integration.test.ts
describe('ContextService Integration', () => {
  describe('with Supabase', () => {
    it('should perform full CRUD lifecycle')
    it('should respect RLS policies')
    it('should handle concurrent operations')
    it('should maintain data integrity')
  })

  describe('with existing prompts', () => {
    it('should create context and associate prompts')
    it('should filter prompts by context')
    it('should handle context switching')
  })
})
```

## Key Test Scenarios
1. **Context Creation Flow**:
   - User creates first context (becomes default)
   - User creates additional contexts
   - Context name validation and uniqueness

2. **Context Management**:
   - Switching between contexts
   - Updating context properties
   - Archiving/unarchiving contexts

3. **Data Relationships**:
   - Adding/removing prompts from contexts
   - File associations
   - Context deletion cascading

4. **Error Handling**:
   - Database connection issues
   - Invalid data validation
   - Permission violations

5. **Performance**:
   - Large number of contexts
   - Context switching responsiveness
   - Memory usage optimization
