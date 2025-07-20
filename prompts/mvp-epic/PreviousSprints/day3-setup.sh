#!/bin/bash

# Day 3 Setup Script - Core Database Schema & Prompt Model
# This script sets up database migrations and data modeling dependencies

set -e

echo "🗄️  Day 3 Setup: Core Database Schema & Prompt Model"
echo "===================================================="

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

echo "📦 Installing data management dependencies..."

# Install data fetching and state management
npm install --save \
    @tanstack/react-query \
    @tanstack/react-query-devtools \
    date-fns \
    lodash \
    fuse.js

echo "📦 Installing additional validation libraries..."

# Install validation and utility libraries
npm install --save \
    zod \
    use-debounce

echo "📦 Installing type definitions..."

# Install type definitions
npm install --save-dev \
    @types/lodash

echo "📁 Creating prompt feature structure..."

# Create prompt feature directories
mkdir -p src/features/prompts/{components,hooks,services,types,utils,__tests__}
mkdir -p src/features/categories/{hooks,types,services}
mkdir -p src/lib/database

echo "🗄️  Creating database migration..."

# Create migration for enhanced schema
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_enhanced_prompt_schema.sql << 'EOF'
-- Enhanced prompt schema migration
-- Adds categories, improved tags, and analytics

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    icon text,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add category reference to prompts
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Create prompt_tags table for better tag management
CREATE TABLE IF NOT EXISTS public.prompt_tags (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(prompt_id, tag)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_usage_count ON public.prompts(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON public.prompt_tags(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON public.prompt_tags(tag);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for prompt_tags
CREATE POLICY "Users can view tags for own prompts" ON public.prompt_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.prompts 
            WHERE prompts.id = prompt_tags.prompt_id 
            AND prompts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tags for own prompts" ON public.prompt_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts 
            WHERE prompts.id = prompt_tags.prompt_id 
            AND prompts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags for own prompts" ON public.prompt_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.prompts 
            WHERE prompts.id = prompt_tags.prompt_id 
            AND prompts.user_id = auth.uid()
        )
    );

-- Create function to update prompt usage
CREATE OR REPLACE FUNCTION public.increment_prompt_usage(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts 
    SET 
        usage_count = usage_count + 1,
        last_used_at = timezone('utc'::text, now())
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF

echo "📄 Creating TypeScript type definitions..."

# Create prompt types
cat > src/features/prompts/types/index.ts << 'EOF'
// Prompt types and interfaces
export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category_id?: string;
  category?: Category;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  last_used_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptData {
  title: string;
  content: string;
  category_id?: string;
  tags: string[];
  is_public?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface PromptFilters {
  category_id?: string;
  tags?: string[];
  search?: string;
  is_public?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
EOF

# Create category types
cat > src/features/categories/types/index.ts << 'EOF'
// Category types
export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}
EOF

echo "📄 Creating database service base..."

# Create database service
cat > src/lib/database/index.ts << 'EOF'
import { supabase } from '../supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: PostgrestError): never {
  throw new DatabaseError(
    error.message,
    error.code,
    error.details
  );
}

export { supabase };
EOF

echo "✅ Day 3 setup complete!"
echo ""
echo "Files created:"
echo "- Migration: Enhanced prompt schema"
echo "- src/features/prompts/types/index.ts"
echo "- src/features/categories/types/index.ts"
echo "- src/lib/database/index.ts"
echo ""
echo "Next steps:"
echo "1. Run migration: npm run supabase:reset"
echo "2. Implement prompt service layer"
echo "3. Create React Query hooks"
echo "4. Write comprehensive tests"
echo ""
echo "Ready for Day 3 development! 🚀"
