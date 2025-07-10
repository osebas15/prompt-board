-- Add missing fields to prompts table for enhanced prompt management

-- Add the missing fields to prompts table
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS model_compatibility text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS parameters jsonb,
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS folder_id uuid,
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.prompts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_variables text[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_rating ON public.prompts(rating DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON public.prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_folder_id ON public.prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON public.prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_template ON public.prompts(is_template);
CREATE INDEX IF NOT EXISTS idx_prompts_model_compatibility ON public.prompts USING gin(model_compatibility);

-- Add function to toggle favorite status
CREATE OR REPLACE FUNCTION public.toggle_prompt_favorite(prompt_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts 
    SET 
        is_favorite = NOT is_favorite,
        updated_at = timezone('utc'::text, now())
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to update prompt rating
CREATE OR REPLACE FUNCTION public.update_prompt_rating(prompt_id uuid, new_rating numeric)
RETURNS void AS $$
BEGIN
    UPDATE public.prompts 
    SET 
        rating = new_rating,
        updated_at = timezone('utc'::text, now())
    WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
