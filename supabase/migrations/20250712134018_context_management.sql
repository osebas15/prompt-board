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
