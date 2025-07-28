// Database Types - Main Export
// This file provides easy access to all database-related types

// Re-export the main database helper types (includes Database type)
export * from './database'

// Re-export specific types from supabase that don't conflict
export type { Json } from './supabase'

// Re-export specific commonly used types for convenience
export type {
  // Table types
  Prompt,
  PromptInsert,
  PromptUpdate,
  
  Context,
  ContextInsert,
  ContextUpdate,
  
  Category,
  CategoryInsert,
  CategoryUpdate,
  
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  
  Profile,
  ProfileInsert,
  ProfileUpdate,
  
  Workflow,
  WorkflowInsert,
  WorkflowUpdate,
  
  WorkflowExecution,
  WorkflowExecutionInsert,
  WorkflowExecutionUpdate,
  
  // Utility types
  QueryResult,
  QueryArrayResult,
  DbResult,
  DbResultArray,
  FilterOptions,
  PaginationOptions,
  SortOptions
} from './database'
