# Migration 02: Enhance Prompts Table for Sprint 2

## Purpose
Enhance the existing prompts table to support Sprint 2 requirements:
- Add organization_id for team collaboration
- Replace is_public boolean with visibility enum
- Add full-text search (tsvector) capability
- Update RLS policies for team-based access

## Migration Details

```sql
-- Migration: 02_enhance_prompts_for_sprint2.sql
-- Enhance prompts table for team collaboration and full-text search

-- Create visibility enum
DO $$ BEGIN
    CREATE TYPE visibility_type AS ENUM ('private', 'team', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to prompts table
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS visibility visibility_type DEFAULT 'private',
ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', content), 'C') ||
    setweight(to_tsvector('english', COALESCE(category, '')), 'D')
) STORED;

-- Migrate existing data: set organization_id and visibility based on is_public
-- For this migration, we'll assign existing prompts to a default organization
-- In production, you'd need a data migration strategy
UPDATE public.prompts 
SET visibility = CASE 
    WHEN is_public = true THEN 'public'::visibility_type 
    ELSE 'private'::visibility_type 
END
WHERE visibility IS NULL;

-- Create indexes for performance (following PostgreSQL best practices)
CREATE INDEX IF NOT EXISTS idx_prompts_organization_id ON public.prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON public.prompts(visibility);
CREATE INDEX IF NOT EXISTS idx_prompts_tsv ON public.prompts USING gin(tsv);
CREATE INDEX IF NOT EXISTS idx_prompts_user_org ON public.prompts(user_id, organization_id);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS idx_prompts_org_visibility_created ON public.prompts(organization_id, visibility, created_at DESC);

-- Drop old policies first
DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can view public prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;

-- Create enhanced RLS policies for team collaboration
CREATE POLICY "Users can view own prompts" ON public.prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view team prompts" ON public.prompts
    FOR SELECT USING (
        visibility = 'team' AND
        organization_id IN (
            SELECT organization_id FROM public.user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view public prompts" ON public.prompts
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can insert prompts" ON public.prompts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (organization_id IS NULL OR organization_id IN (
            SELECT organization_id FROM public.user_organizations 
            WHERE user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Function to validate organization membership
CREATE OR REPLACE FUNCTION public.check_organization_membership(org_id uuid, user_id_param uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_organizations 
        WHERE organization_id = org_id 
        AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for optimized prompt search with filters
CREATE OR REPLACE FUNCTION public.search_prompts(
    search_query text DEFAULT '',
    org_id uuid DEFAULT NULL,
    visibility_filter visibility_type DEFAULT NULL,
    user_id_param uuid DEFAULT NULL,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    content text,
    visibility visibility_type,
    organization_id uuid,
    user_id uuid,
    tags text[],
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.content,
        p.visibility,
        p.organization_id,
        p.user_id,
        p.tags,
        p.created_at,
        p.updated_at,
        CASE 
            WHEN search_query = '' THEN 0::real
            ELSE ts_rank(p.tsv, plainto_tsquery('english', search_query))
        END as rank
    FROM public.prompts p
    WHERE 
        -- RLS-like filtering for security definer function
        (
            p.user_id = COALESCE(user_id_param, auth.uid()) OR
            (p.visibility = 'team' AND public.check_organization_membership(p.organization_id, COALESCE(user_id_param, auth.uid()))) OR
            p.visibility = 'public'
        )
        AND (search_query = '' OR p.tsv @@ plainto_tsquery('english', search_query))
        AND (org_id IS NULL OR p.organization_id = org_id)
        AND (visibility_filter IS NULL OR p.visibility = visibility_filter)
    ORDER BY 
        CASE WHEN search_query = '' THEN p.created_at ELSE NULL END DESC,
        CASE WHEN search_query != '' THEN ts_rank(p.tsv, plainto_tsquery('english', search_query)) ELSE NULL END DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Remove is_public column after migration (uncomment after data migration is complete)
-- ALTER TABLE public.prompts DROP COLUMN IF EXISTS is_public;

-- Create function to get prompt stats
CREATE OR REPLACE FUNCTION public.get_prompt_stats(org_id uuid DEFAULT NULL)
RETURNS TABLE(
    total_prompts bigint,
    public_prompts bigint,
    team_prompts bigint,
    private_prompts bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_prompts,
        COUNT(*) FILTER (WHERE visibility = 'public') as public_prompts,
        COUNT(*) FILTER (WHERE visibility = 'team') as team_prompts,
        COUNT(*) FILTER (WHERE visibility = 'private') as private_prompts
    FROM public.prompts p
    WHERE 
        (org_id IS NULL OR p.organization_id = org_id) AND
        (
            p.user_id = auth.uid() OR
            (p.visibility = 'team' AND public.check_organization_membership(p.organization_id, auth.uid())) OR
            p.visibility = 'public'
        );
END;
$$;
```

## Data Migration Strategy
```sql
-- For existing data, you may need to handle prompts without organization_id
-- This would typically be done as a separate data migration

-- Example: Assign orphaned prompts to user's default organization
-- UPDATE public.prompts 
-- SET organization_id = (
--     SELECT organization_id 
--     FROM public.user_organizations uo 
--     WHERE uo.user_id = prompts.user_id 
--     AND uo.role = 'admin' 
--     LIMIT 1
-- )
-- WHERE organization_id IS NULL;
```

## Performance Notes
- GIN index on tsvector for <50ms full-text search
- Compound indexes for common query patterns
- Security definer functions to bypass RLS for performance
- Proper index strategy following PostgreSQL best practices

## Testing
- Verify full-text search performs under 50ms
- Test visibility controls work correctly
- Validate RLS policies for different scenarios
- Check migration handles existing data properly
