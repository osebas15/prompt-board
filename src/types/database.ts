// Database helper types
// Auto-generated types from Supabase CLI with additional utilities

import type { Database } from './supabase'

// Export the main database type
export type { Database }

// Utility types for easier access to table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table row types for easier imports
export type Category = Tables<'categories'>['Row']
export type CategoryInsert = TablesInsert<'categories'>
export type CategoryUpdate = TablesUpdate<'categories'>

export type Context = Tables<'contexts'>['Row']
export type ContextInsert = TablesInsert<'contexts'>
export type ContextUpdate = TablesUpdate<'contexts'>

export type ContextFile = Tables<'context_files'>['Row']
export type ContextFileInsert = TablesInsert<'context_files'>
export type ContextFileUpdate = TablesUpdate<'context_files'>

export type ContextPrompt = Tables<'context_prompts'>['Row']
export type ContextPromptInsert = TablesInsert<'context_prompts'>
export type ContextPromptUpdate = TablesUpdate<'context_prompts'>

export type Organization = Tables<'organizations'>['Row']
export type OrganizationInsert = TablesInsert<'organizations'>
export type OrganizationUpdate = TablesUpdate<'organizations'>

export type Profile = Tables<'profiles'>['Row']
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Prompt = Tables<'prompts'>['Row']
export type PromptInsert = TablesInsert<'prompts'>
export type PromptUpdate = TablesUpdate<'prompts'>

export type PromptTag = Tables<'prompt_tags'>['Row']
export type PromptTagInsert = TablesInsert<'prompt_tags'>
export type PromptTagUpdate = TablesUpdate<'prompt_tags'>

export type UserOrganization = Tables<'user_organizations'>['Row']
export type UserOrganizationInsert = TablesInsert<'user_organizations'>
export type UserOrganizationUpdate = TablesUpdate<'user_organizations'>

export type Workflow = Tables<'workflows'>['Row']
export type WorkflowInsert = TablesInsert<'workflows'>
export type WorkflowUpdate = TablesUpdate<'workflows'>

export type WorkflowExecution = Tables<'workflow_executions'>['Row']
export type WorkflowExecutionInsert = TablesInsert<'workflow_executions'>
export type WorkflowExecutionUpdate = TablesUpdate<'workflow_executions'>

export type WorkflowTemplate = Tables<'workflow_templates'>['Row']
export type WorkflowTemplateInsert = TablesInsert<'workflow_templates'>
export type WorkflowTemplateUpdate = TablesUpdate<'workflow_templates'>

// Function types
export type DatabaseFunctions = Database['public']['Functions']

// Common query result types
export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

export interface QueryArrayResult<T> {
  data: T[] | null
  error: Error | null
  count?: number | null
}

// Utility type for partial updates (useful for forms)
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

// Common filter types for database queries
export interface PaginationOptions {
  limit?: number
  offset?: number
}

export interface SortOptions {
  column: string
  ascending?: boolean
}

export interface FilterOptions extends PaginationOptions {
  sort?: SortOptions
}

// Database response helpers
export type DbResult<T> = {
  data: T
  error: null
} | {
  data: null
  error: Error
}

export type DbResultArray<T> = {
  data: T[]
  error: null
  count?: number
} | {
  data: null
  error: Error
  count?: null
}
