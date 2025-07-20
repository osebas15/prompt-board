#!/bin/bash

# Day 6 Setup Script - Context Management System
# This script sets up context management infrastructure and database schema

set -e

echo "🗂️  Day 6 Setup: Context Management System"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the project root (assuming it's 3 levels up from CurrentSprint)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "📁 Navigating to project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Could not find package.json in project root"
    echo "   Expected location: $PROJECT_ROOT/package.json"
    exit 1
fi

echo "📦 Installing context management dependencies..."

# Install state management and UI dependencies
npm install --save \
    zustand \
    immer \
    uuid \
    react-use

echo "📦 Installing drag and drop functionality..."

# Install drag and drop libraries
npm install --save \
    @dnd-kit/core \
    @dnd-kit/sortable \
    @dnd-kit/utilities

echo "📁 Creating context feature structure..."

# Create context management directories
mkdir -p src/features/contexts/{components,hooks,services,types,stores,utils,__tests__}
mkdir -p src/features/contexts/components/{ContextSwitcher,ContextManager,ContextSidebar}

echo "🗄️  Creating context database migration..."

# Create migration for context management
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_context_management.sql << 'EOF'
-- Context management schema
-- Adds contexts, context associations, and file management

-- Create contexts table
CREATE TABLE IF NOT EXISTS public.contexts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    icon text DEFAULT 'folder',
    settings jsonb DEFAULT '{}',
    is_default boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Create context_prompts junction table
CREATE TABLE IF NOT EXISTS public.context_prompts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    context_id uuid REFERENCES public.contexts(id) ON DELETE CASCADE NOT NULL,
    prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    sort_order integer DEFAULT 0,
    UNIQUE(context_id, prompt_id)
);

-- Create context_files table for file attachments
CREATE TABLE IF NOT EXISTS public.context_files (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    context_id uuid REFERENCES public.contexts(id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    file_type text,
    file_url text,
    file_content text, -- For text files that can be indexed
    metadata jsonb DEFAULT '{}',
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add context_id to existing tables
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES public.contexts(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON public.contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_contexts_is_default ON public.contexts(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_context_prompts_context_id ON public.context_prompts(context_id);
CREATE INDEX IF NOT EXISTS idx_context_prompts_prompt_id ON public.context_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_context_files_context_id ON public.context_files(context_id);
CREATE INDEX IF NOT EXISTS idx_prompts_context_id ON public.prompts(context_id);

-- Enable RLS
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_files ENABLE ROW LEVEL SECURITY;

-- Create policies for contexts
CREATE POLICY "Users can view own contexts" ON public.contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contexts" ON public.contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contexts" ON public.contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contexts" ON public.contexts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for context_prompts
CREATE POLICY "Users can view context_prompts for own contexts" ON public.context_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contexts 
            WHERE contexts.id = context_prompts.context_id 
            AND contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage context_prompts for own contexts" ON public.context_prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contexts 
            WHERE contexts.id = context_prompts.context_id 
            AND contexts.user_id = auth.uid()
        )
    );

-- Create policies for context_files
CREATE POLICY "Users can view context_files for own contexts" ON public.context_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contexts 
            WHERE contexts.id = context_files.context_id 
            AND contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage context_files for own contexts" ON public.context_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contexts 
            WHERE contexts.id = context_files.context_id 
            AND contexts.user_id = auth.uid()
        )
    );

-- Function to create default context for new users
CREATE OR REPLACE FUNCTION public.create_default_context_for_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.contexts (user_id, name, description, is_default)
    VALUES (NEW.id, 'General', 'Default context for general prompts and conversations', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default context on user creation
DROP TRIGGER IF EXISTS create_default_context_trigger ON public.profiles;
CREATE TRIGGER create_default_context_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_context_for_user();
EOF

echo "📄 Creating context types..."

# Create context types
cat > src/features/contexts/types/index.ts << 'EOF'
// Context management types
export interface Context {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  settings: ContextSettings;
  is_default: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContextSettings {
  auto_save?: boolean;
  default_model?: string;
  default_temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tags?: string[];
}

export interface ContextFile {
  id: string;
  context_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  file_content?: string;
  metadata: Record<string, any>;
  uploaded_at: string;
}

export interface ContextPrompt {
  id: string;
  context_id: string;
  prompt_id: string;
  added_at: string;
  sort_order: number;
}

export interface CreateContextData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ContextSettings>;
}

export interface UpdateContextData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ContextSettings>;
  is_archived?: boolean;
  sort_order?: number;
}

export interface ContextState {
  currentContext: Context | null;
  contexts: Context[];
  loading: boolean;
  error: string | null;
}
EOF

# Create context store with Zustand
cat > src/features/contexts/stores/contextStore.ts << 'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Context, ContextState } from '../types';

interface ContextStore extends ContextState {
  // Actions
  setCurrentContext: (context: Context | null) => void;
  setContexts: (contexts: Context[]) => void;
  addContext: (context: Context) => void;
  updateContext: (id: string, updates: Partial<Context>) => void;
  removeContext: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getContextById: (id: string) => Context | undefined;
  getDefaultContext: () => Context | undefined;
  getActiveContexts: () => Context[];
}

export const useContextStore = create<ContextStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentContext: null,
      contexts: [],
      loading: false,
      error: null,

      // Actions
      setCurrentContext: (context) =>
        set((state) => {
          state.currentContext = context;
        }),

      setContexts: (contexts) =>
        set((state) => {
          state.contexts = contexts;
          // Set default context as current if none selected
          if (!state.currentContext && contexts.length > 0) {
            const defaultContext = contexts.find(c => c.is_default) || contexts[0];
            state.currentContext = defaultContext;
          }
        }),

      addContext: (context) =>
        set((state) => {
          state.contexts.push(context);
        }),

      updateContext: (id, updates) =>
        set((state) => {
          const index = state.contexts.findIndex(c => c.id === id);
          if (index !== -1) {
            state.contexts[index] = { ...state.contexts[index], ...updates };
            
            // Update current context if it's the one being updated
            if (state.currentContext?.id === id) {
              state.currentContext = state.contexts[index];
            }
          }
        }),

      removeContext: (id) =>
        set((state) => {
          state.contexts = state.contexts.filter(c => c.id !== id);
          
          // Clear current context if it was removed
          if (state.currentContext?.id === id) {
            const defaultContext = state.contexts.find(c => c.is_default);
            state.currentContext = defaultContext || state.contexts[0] || null;
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Selectors
      getContextById: (id) => {
        return get().contexts.find(c => c.id === id);
      },

      getDefaultContext: () => {
        return get().contexts.find(c => c.is_default);
      },

      getActiveContexts: () => {
        return get().contexts.filter(c => !c.is_archived);
      },
    })),
    {
      name: 'context-store',
      partialize: (state) => ({
        currentContext: state.currentContext,
        contexts: state.contexts,
      }),
    }
  )
);
EOF

echo "✅ Day 6 setup complete!"
echo ""
echo "Files created:"
echo "- Migration: Context management schema"
echo "- src/features/contexts/types/index.ts"
echo "- src/features/contexts/stores/contextStore.ts"
echo ""
echo "Next steps:"
echo "1. Run migration: npm run supabase:reset"
echo "2. Implement context UI components"
echo "3. Create context management hooks"
echo "4. Add drag-and-drop functionality"
echo ""
echo "Ready for Day 6 development! 🚀"
