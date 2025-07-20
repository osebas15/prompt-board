Day 6: Context Management System
===============================

## Sprint Day 6 Goals
Implement context management for organizing prompts, conversations, and files into workspaces with proper state management.

## Test-Driven Development Approach

### 1. Red Phase - Write Failing Tests First
```typescript
// Test file: src/features/contexts/__tests__/contextService.test.ts
describe('ContextService', () => {
  it('should create new context', () => {
    // Test context creation
  });

  it('should switch between contexts', () => {
    // Test context switching
  });

  it('should manage context state', () => {
    // Test state persistence
  });
});

// Test file: src/features/contexts/__tests__/useContext.test.ts
describe('useContext hook', () => {
  it('should provide context management', () => {
    // Test context operations
  });

  it('should handle context persistence', () => {
    // Test data persistence
  });
});
```

### 2. Green Phase - Implementation Tasks

#### Task 6.1: Context Data Model
**Acceptance Criteria:**
- [ ] Context entity with metadata and settings
- [ ] Context-prompt relationships
- [ ] Context-conversation associations
- [ ] File attachments per context
- [ ] Context sharing and permissions
- [ ] Database schema and migrations

#### Task 6.2: Context Management UI
**Acceptance Criteria:**
- [ ] ContextSwitcher component in navigation
- [ ] ContextManager for creating/editing contexts
- [ ] Context sidebar with quick access
- [ ] Context settings and configuration
- [ ] Visual context indicators throughout app
- [ ] Drag-and-drop context organization

#### Task 6.3: Context State Management
**Acceptance Criteria:**
- [ ] Global context state with React Context
- [ ] Context persistence in localStorage/database
- [ ] Context-aware data filtering
- [ ] Automatic context switching logic
- [ ] Context sync across browser tabs
- [ ] Context backup and restoration

#### Task 6.4: Advanced Context Features
**Acceptance Criteria:**
- [ ] Context templates for quick setup
- [ ] Context cloning and duplication
- [ ] Context search and filtering
- [ ] Context analytics and insights
- [ ] Context export/import functionality
- [ ] Context collaboration features

### 3. Refactor Phase - Code Quality
- [ ] Extract context utilities and helpers
- [ ] Implement proper error handling
- [ ] Add context validation
- [ ] Optimize context switching performance
- [ ] Add comprehensive documentation

## Deliverables
1. **Context Data Model** - Complete database schema and types
2. **Context Management UI** - User interface for context operations
3. **Context State Management** - Global state and persistence
4. **Advanced Features** - Templates, sharing, analytics

## Database Schema
```sql
-- Context management tables
CREATE TABLE public.contexts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    icon text,
    settings jsonb DEFAULT '{}',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE public.context_prompts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    context_id uuid REFERENCES public.contexts(id) ON DELETE CASCADE,
    prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE,
    added_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(context_id, prompt_id)
);

CREATE TABLE public.context_files (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    context_id uuid REFERENCES public.contexts(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_size integer,
    file_type text,
    file_url text,
    uploaded_at timestamp with time zone DEFAULT NOW()
);
```

## Acceptance Tests
```typescript
// Integration test
describe('Context Management Flow', () => {
  it('should create context and organize content', () => {
    // Test full context management workflow
  });

  it('should persist context state across sessions', () => {
    // Test persistence and restoration
  });
});
```

## Success Metrics
- [ ] Context switching completes in <100ms
- [ ] Context state persists across browser sessions
- [ ] No data loss during context operations
- [ ] UI provides clear context awareness
- [ ] Context organization improves user workflow

## Dependencies Required
Run the setup script: `./day6-setup.sh`

## Definition of Done
- [ ] Users can create and manage multiple contexts
- [ ] Context switching updates UI appropriately
- [ ] Prompts and conversations are properly contextualized
- [ ] Context state persists reliably
- [ ] UI clearly indicates current context
- [ ] Performance remains smooth with multiple contexts
- [ ] All context operations are tested and working
