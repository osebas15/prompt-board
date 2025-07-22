export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      context_files: {
        Row: {
          context_id: string
          file_content: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          uploaded_at: string
        }
        Insert: {
          context_id: string
          file_content?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          uploaded_at?: string
        }
        Update: {
          context_id?: string
          file_content?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_files_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      context_prompts: {
        Row: {
          added_at: string
          context_id: string
          id: string
          prompt_id: string
          sort_order: number | null
        }
        Insert: {
          added_at?: string
          context_id: string
          id?: string
          prompt_id: string
          sort_order?: number | null
        }
        Update: {
          added_at?: string
          context_id?: string
          id?: string
          prompt_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "context_prompts_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      contexts: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_archived: boolean | null
          is_default: boolean | null
          name: string
          settings: Json | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean | null
          is_default?: boolean | null
          name: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean | null
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contexts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_tags: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tags_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string | null
          category_id: string | null
          content: string
          context_id: string | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          is_template: boolean | null
          last_used_at: string | null
          model_compatibility: string[] | null
          organization_id: string | null
          parameters: Json | null
          parent_id: string | null
          rating: number | null
          tags: string[] | null
          template_variables: string[] | null
          title: string
          tsv: unknown | null
          updated_at: string
          usage_count: number | null
          user_id: string
          version: number | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          content: string
          context_id?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          is_template?: boolean | null
          last_used_at?: string | null
          model_compatibility?: string[] | null
          organization_id?: string | null
          parameters?: Json | null
          parent_id?: string | null
          rating?: number | null
          tags?: string[] | null
          template_variables?: string[] | null
          title: string
          tsv?: unknown | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
          version?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          category?: string | null
          category_id?: string | null
          content?: string
          context_id?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          is_template?: boolean | null
          last_used_at?: string | null
          model_compatibility?: string[] | null
          organization_id?: string | null
          parameters?: Json | null
          parent_id?: string | null
          rating?: number | null
          tags?: string[] | null
          template_variables?: string[] | null
          title?: string
          tsv?: unknown | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          version?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "contexts"
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
            foreignKeyName: "prompts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          results: Json | null
          started_at: string
          status: string
          steps_completed: number | null
          total_steps: number
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          results?: Json | null
          started_at?: string
          status: string
          steps_completed?: number | null
          total_steps: number
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          results?: Json | null
          started_at?: string
          status?: string
          steps_completed?: number | null
          total_steps?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          steps: Json
          tags: string[] | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_template: boolean
          name: string
          run_count: number | null
          schedule: Json | null
          steps: Json
          tags: string[] | null
          updated_at: string | null
          user_id: string
          variables: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_template?: boolean
          name: string
          run_count?: number | null
          schedule?: Json | null
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          variables?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_template?: boolean
          name?: string
          run_count?: number | null
          schedule?: Json | null
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          variables?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_organization_membership: {
        Args: { org_id: string; user_id_param?: string }
        Returns: boolean
      }
      get_categories_with_stats: {
        Args: { org_id?: string }
        Returns: {
          id: string
          name: string
          description: string
          color: string
          organization_id: string
          user_id: string
          created_at: string
          prompt_count: number
        }[]
      }
      get_prompt_stats: {
        Args: { org_id?: string }
        Returns: {
          total_prompts: number
          public_prompts: number
          team_prompts: number
          private_prompts: number
        }[]
      }
      get_user_role_in_organization: {
        Args: { org_id: string; user_id_param?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_prompt_usage: {
        Args: { prompt_id: string }
        Returns: undefined
      }
      search_prompts: {
        Args: {
          search_query?: string
          org_id?: string
          visibility_filter?: Database["public"]["Enums"]["visibility_type"]
          user_id_param?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          content: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          organization_id: string
          user_id: string
          tags: string[]
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
      toggle_prompt_favorite: {
        Args: { prompt_id: string }
        Returns: undefined
      }
      update_prompt_rating: {
        Args: { prompt_id: string; new_rating: number }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "member" | "viewer"
      visibility_type: "private" | "team" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "member", "viewer"],
      visibility_type: ["private", "team", "public"],
    },
  },
} as const

