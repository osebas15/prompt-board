/**
 * Database Type Generation and Updates
 * Generates TypeScript types from enhanced database schema
 */

import { createClient } from '@supabase/supabase-js'

// Configuration for type generation
const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

/**
 * Enhanced Database Types for Sprint 2
 * These types should be generated using supabase gen types
 * but we'll define them manually for now to proceed with implementation
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VisibilityType = 'private' | 'team' | 'public'
export type UserRole = 'admin' | 'member' | 'viewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          settings: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          settings?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          settings?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: UserRole
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: UserRole
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: UserRole
          joined_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          title: string
          description: string | null
          content: string
          category: string | null
          category_id: string | null
          tags: string[] | null
          visibility: VisibilityType
          usage_count: number
          last_used_at: string | null
          version: number
          rating: number | null
          model_compatibility: string[] | null
          parameters: Json | null
          is_favorite: boolean
          folder_id: string | null
          parent_id: string | null
          is_template: boolean
          template_variables: string[] | null
          context_id: string | null
          created_at: string
          updated_at: string
          tsv?: unknown // tsvector type
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          title: string
          description?: string | null
          content: string
          category?: string | null
          category_id?: string | null
          tags?: string[] | null
          visibility?: VisibilityType
          usage_count?: number
          last_used_at?: string | null
          version?: number
          rating?: number | null
          model_compatibility?: string[] | null
          parameters?: Json | null
          is_favorite?: boolean
          folder_id?: string | null
          parent_id?: string | null
          is_template?: boolean
          template_variables?: string[] | null
          context_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          title?: string
          description?: string | null
          content?: string
          category?: string | null
          category_id?: string | null
          tags?: string[] | null
          visibility?: VisibilityType
          usage_count?: number
          last_used_at?: string | null
          version?: number
          rating?: number | null
          model_compatibility?: string[] | null
          parameters?: Json | null
          is_favorite?: boolean
          folder_id?: string | null
          parent_id?: string | null
          is_template?: boolean
          template_variables?: string[] | null
          context_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          organization_id: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          organization_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          organization_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_prompts: {
        Args: {
          search_query?: string
          org_id?: string
          visibility_filter?: VisibilityType
          user_id_param?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          content: string
          visibility: VisibilityType
          organization_id: string | null
          user_id: string
          tags: string[] | null
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
      get_prompt_stats: {
        Args: {
          org_id?: string
        }
        Returns: {
          total_prompts: number
          public_prompts: number
          team_prompts: number
          private_prompts: number
        }[]
      }
      get_categories_with_stats: {
        Args: {
          org_id?: string
        }
        Returns: {
          id: string
          name: string
          description: string | null
          color: string | null
          organization_id: string | null
          user_id: string | null
          created_at: string
          prompt_count: number
        }[]
      }
      increment_prompt_usage: {
        Args: {
          prompt_id: string
        }
        Returns: void
      }
      check_organization_membership: {
        Args: {
          org_id: string
          user_id_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      visibility_type: VisibilityType
      user_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type-safe client setup
export function createTypedSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

// Helper types for common operations
export type Prompt = Database['public']['Tables']['prompts']['Row']
export type PromptInsert = Database['public']['Tables']['prompts']['Insert']
export type PromptUpdate = Database['public']['Tables']['prompts']['Update']

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type UserOrganization = Database['public']['Tables']['user_organizations']['Row']
export type UserOrganizationInsert = Database['public']['Tables']['user_organizations']['Insert']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Search result type
export type SearchResult = Database['public']['Functions']['search_prompts']['Returns'][0]

// Stats types
export type PromptStats = Database['public']['Functions']['get_prompt_stats']['Returns'][0]
export type CategoryWithStats = Database['public']['Functions']['get_categories_with_stats']['Returns'][0]

// Filter types for API
export interface PromptFilters {
  search?: string
  organizationId?: string
  visibility?: VisibilityType
  categoryId?: string
  tags?: string[]
  userId?: string
  limit?: number
  offset?: number
}

export interface CategoryFilters {
  organizationId?: string
  userId?: string
}

/**
 * Generate types command:
 * npx supabase gen types typescript --local > src/types/database.types.ts
 */

export default Database
