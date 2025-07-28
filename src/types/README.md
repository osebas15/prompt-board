# Database Types Usage Guide

This guide explains how to use the auto-generated Supabase database types in your TypeScript project.

## Generated Files

- `src/types/supabase.ts` - Raw types generated from Supabase CLI
- `src/types/database.ts` - Helper types and utilities for easier usage
- `src/types/index.ts` - Convenient exports of all database types

## Basic Usage

### Importing Types

```typescript
// Import specific table types
import type { Prompt, PromptInsert, PromptUpdate } from '@/types'

// Import utility types
import type { QueryResult, FilterOptions } from '@/types'

// Import the full database type
import type { Database } from '@/types'
```

### Table Types

Each table has three main type variants:

- `TableName` - The full row type (for reading)
- `TableNameInsert` - Type for inserting new records
- `TableNameUpdate` - Type for updating existing records

```typescript
// Example with Prompt table
const newPrompt: PromptInsert = {
  title: 'My Prompt',
  content: 'Hello {{name}}!',
  user_id: '123',
  // created_at, updated_at are optional (auto-generated)
}

const updateData: PromptUpdate = {
  title: 'Updated Title',
  // Only include fields you want to update
}
```

### Query Results

Use the provided result types for consistent error handling:

```typescript
import type { QueryResult, QueryArrayResult } from '@/types'

// For single record queries
const result: QueryResult<Prompt> = await supabase
  .from('prompts')
  .select('*')
  .eq('id', promptId)
  .single()

// For multiple records
const results: QueryArrayResult<Prompt> = await supabase
  .from('prompts')
  .select('*')
  .limit(10)
```

### Database Client Integration

```typescript
import type { Database } from '@/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

## Advanced Usage

### Enum Types

Access database enums easily:

```typescript
import type { Enums } from '@/types'

type VisibilityType = Enums<'visibility_type'> // "private" | "team" | "public"
type UserRole = Enums<'user_role'> // "admin" | "member" | "viewer"
```

### Utility Types

```typescript
import type { PartialUpdate, FilterOptions } from '@/types'

// For form data that allows partial updates
const formData: PartialUpdate<Prompt> = {
  title: 'New Title'
  // id, created_at, updated_at are automatically excluded
}

// For query filtering
const filters: FilterOptions = {
  limit: 20,
  offset: 0,
  sort: { column: 'created_at', ascending: false }
}
```

### Function Types

Access database function types:

```typescript
import type { DatabaseFunctions } from '@/types'

type SearchPromptsArgs = DatabaseFunctions['search_prompts']['Args']
type SearchPromptsResult = DatabaseFunctions['search_prompts']['Returns']
```

## Regenerating Types

When you make changes to your database schema:

1. **Using the script (recommended):**
   ```bash
   ./scripts/generate-types.sh
   ```

2. **Manual command:**
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```

## Best Practices

1. **Always use the helper types** from `@/types` instead of importing directly from `supabase.ts`

2. **Use specific table types** rather than generic `any` or `unknown`

3. **Leverage the Insert/Update variants** for type safety when creating/modifying records

4. **Use enum types** instead of string literals for database enums

5. **Handle query results consistently** using the provided result types

## Example: Complete CRUD Operations

```typescript
import type { Prompt, PromptInsert, PromptUpdate, QueryResult } from '@/types'
import { supabase } from '@/lib/supabase'

class PromptService {
  async create(data: PromptInsert): Promise<QueryResult<Prompt>> {
    return await supabase
      .from('prompts')
      .insert(data)
      .select()
      .single()
  }

  async getById(id: string): Promise<QueryResult<Prompt>> {
    return await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()
  }

  async update(id: string, data: PromptUpdate): Promise<QueryResult<Prompt>> {
    return await supabase
      .from('prompts')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  }

  async delete(id: string): Promise<QueryResult<null>> {
    return await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
  }
}
```

This approach ensures type safety throughout your application and makes database operations more predictable and maintainable.
