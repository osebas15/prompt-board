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
