/**
 * Database Type Definitions for Prompt Board
 * Auto-generated types for TypeScript integration with Supabase
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          is_public: boolean
          created_at: string
          updated_at: string
          tsv?: unknown // tsvector type for full-text search
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
          is_public?: boolean
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
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          user_id_param?: string
        }
        Returns: boolean
      }
      get_user_role_in_organization: {
        Args: {
          org_id: string
          user_id_param?: string
        }
        Returns: UserRole | null
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
