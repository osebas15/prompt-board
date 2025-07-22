/**
 * Type-Safe Database Client
 * Wrapper around Supabase client with proper error handling and validation
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import { DatabaseError } from './database-error-handling'

// Type aliases for cleaner code
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Table row types
type Prompt = Tables['prompts']['Row']
type PromptInsert = Tables['prompts']['Insert']
type PromptUpdate = Tables['prompts']['Update']

type Organization = Tables['organizations']['Row']
type OrganizationInsert = Tables['organizations']['Insert']

type Category = Tables['categories']['Row']
type CategoryInsert = Tables['categories']['Insert']

// Result types
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseListResult<T> {
  data: T[] | null
  error: DatabaseError | null
  count?: number
}

// Filter types
interface PromptFilters {
  search?: string
  organizationId?: string
  visibility?: Enums['visibility_type']
  categoryId?: string
  tags?: string[]
  userId?: string
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'updated_at' | 'title'
  orderDirection?: 'asc' | 'desc'
}

interface CategoryFilters {
  organizationId?: string
  userId?: string
}

export class DatabaseClient {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  // Prompts operations
  async createPrompt(data: PromptInsert): Promise<DatabaseResult<Prompt>> {
    try {
      const { data: result, error } = await this.supabase
        .from('prompts')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async updatePrompt(id: string, data: PromptUpdate): Promise<DatabaseResult<Prompt>> {
    try {
      const { data: result, error } = await this.supabase
        .from('prompts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async deletePrompt(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.supabase
        .from('prompts')
        .delete()
        .eq('id', id)

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async getPrompt(id: string): Promise<DatabaseResult<Prompt>> {
    try {
      const { data: result, error } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async getPrompts(filters: PromptFilters = {}): Promise<DatabaseListResult<Prompt>> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }

      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'created_at'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data: result, error, count } = await query

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async searchPrompts(searchQuery: string, filters: PromptFilters = {}): Promise<DatabaseListResult<Prompt>> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*', { count: 'exact' })
        .textSearch('tsv', searchQuery)

      // Apply additional filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }

      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      // Order by relevance (handled by full-text search)
      query = query.order('created_at', { ascending: false })

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data: result, error, count } = await query

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  // Organizations operations
  async createOrganization(data: OrganizationInsert): Promise<DatabaseResult<Organization>> {
    try {
      const { data: result, error } = await this.supabase
        .from('organizations')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async getOrganization(id: string): Promise<DatabaseResult<Organization>> {
    try {
      const { data: result, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  // Categories operations
  async createCategory(data: CategoryInsert): Promise<DatabaseResult<Category>> {
    try {
      const { data: result, error } = await this.supabase
        .from('categories')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }

  async getCategories(filters: CategoryFilters = {}): Promise<DatabaseListResult<Category>> {
    try {
      let query = this.supabase
        .from('categories')
        .select('*')

      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      query = query.order('name', { ascending: true })

      const { data: result, error } = await query

      if (error) {
        return { data: null, error: DatabaseError.fromPostgrestError(error) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: DatabaseError.fromUnknownError(error) }
    }
  }
}

// Export types for use in other modules
export type {
  Prompt,
  PromptInsert,
  PromptUpdate,
  Organization,
  OrganizationInsert,
  Category,
  CategoryInsert,
  PromptFilters,
  CategoryFilters
}
