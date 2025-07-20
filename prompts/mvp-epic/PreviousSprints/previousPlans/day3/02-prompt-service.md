# Plan 2: PromptService Database Layer

## Purpose
Implement a clean service layer for all prompt-related database operations using Supabase client with proper TypeScript types and error handling.

## Implementation Details

### Files to Create
- `src/features/prompts/services/PromptService.ts`

### Class Structure
```typescript
export class PromptService {
  private supabase: SupabaseClient;
  
  // CRUD Operations
  async createPrompt(data: CreatePromptData): Promise<Prompt>
  async getPrompts(filters?: PromptFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Prompt>>
  async getPromptById(id: string): Promise<Prompt | null>
  async updatePrompt(id: string, data: UpdatePromptData): Promise<Prompt>
  async deletePrompt(id: string): Promise<void>
  async incrementUsage(id: string): Promise<void>
}
```

### Key Features
1. **Comprehensive CRUD Operations**: Create, Read, Update, Delete prompts
2. **Advanced Filtering**: Support category, tags, search, and visibility filters
3. **Pagination Support**: Efficient data loading with pagination
4. **Tag Management**: Proper handling of the separate prompt_tags table
5. **Usage Tracking**: Increment usage count and last_used_at
6. **Error Handling**: Convert Supabase errors to user-friendly messages

### Database Operations
- **Create**: Insert prompt with tags in transaction
- **Read**: Join with categories and aggregate tags
- **Update**: Handle tags separately, update prompt fields
- **Delete**: Cascade delete tags via database constraints
- **Search**: Use ilike for text search across title/content

### Security
- Row Level Security (RLS) enforced
- User ownership validation
- Input sanitization via Zod schemas

### Performance Optimizations
- Efficient joins for categories
- Indexed queries on user_id, category_id, tags
- Pagination with count optimization
- Selective field fetching

### Error Handling
- Database connection errors
- Validation errors  
- Permission errors
- Not found errors
- Conflict errors (version, ownership)
