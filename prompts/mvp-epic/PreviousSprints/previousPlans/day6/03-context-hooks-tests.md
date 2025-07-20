# Context Hooks Tests

## Unit Tests for Context React Hooks

### useContext Hook Tests
```typescript
// src/features/contexts/__tests__/useContext.test.ts
describe('useContext hook', () => {
  describe('context operations', () => {
    it('should create new context')
    it('should switch active context')
    it('should update context data')
    it('should delete context with confirmation')
    it('should handle loading states correctly')
    it('should manage error states')
  })

  describe('state management', () => {
    it('should persist context in Zustand store')
    it('should sync with localStorage')
    it('should handle browser tab synchronization')
    it('should restore state on page refresh')
  })

  describe('context relationships', () => {
    it('should add prompts to context')
    it('should remove prompts from context')
    it('should filter prompts by current context')
    it('should handle context file management')
  })
})
```

### useContexts Hook Tests
```typescript
// src/features/contexts/__tests__/useContexts.test.ts
describe('useContexts hook', () => {
  describe('context listing', () => {
    it('should fetch all user contexts')
    it('should handle context filtering')
    it('should support sorting options')
    it('should implement pagination for large lists')
  })

  describe('real-time updates', () => {
    it('should subscribe to context changes')
    it('should handle context creation events')
    it('should handle context deletion events')
    it('should update context modification events')
  })
})
```

### useContextFiles Hook Tests
```typescript
// src/features/contexts/__tests__/useContextFiles.test.ts
describe('useContextFiles hook', () => {
  describe('file management', () => {
    it('should upload files to context')
    it('should list context files')
    it('should delete context files')
    it('should handle file type validation')
  })

  describe('file processing', () => {
    it('should extract text content from files')
    it('should generate file metadata')
    it('should handle large file uploads')
    it('should support multiple file types')
  })
})
```

## Integration Tests for Hook Interactions
```typescript
// src/features/contexts/__tests__/contextHooks.integration.test.ts
describe('Context Hooks Integration', () => {
  describe('hook coordination', () => {
    it('should sync state between useContext and useContexts')
    it('should handle context switching across components')
    it('should manage file uploads with context changes')
    it('should coordinate with prompt management hooks')
  })

  describe('with Supabase real-time', () => {
    it('should receive real-time context updates')
    it('should handle connection interruptions')
    it('should sync across multiple browser tabs')
    it('should recover from network failures')
  })
})
```

## Test Scenarios
1. **State Synchronization**:
   - Multiple components using context hooks
   - Browser tab synchronization
   - LocalStorage persistence

2. **Real-time Updates**:
   - Context changes from other sessions
   - File upload progress tracking
   - Network reconnection handling

3. **Error Recovery**:
   - Network failures during operations
   - Invalid data handling
   - Conflict resolution

4. **Performance**:
   - Hook re-render optimization
   - Memory leak prevention
   - Large context list handling
