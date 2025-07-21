-- Migration 02: Enhance Prompts Table
-- Purpose: Add visibility controls, organization support, and full-text search

-- Create visibility enum
CREATE TYPE visibility_type AS ENUM ('private', 'team', 'public');

-- Add new columns to existing prompts table
ALTER TABLE prompts 
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN visibility visibility_type DEFAULT 'private' NOT NULL,
ADD COLUMN tsv tsvector;

-- Create indexes for performance
CREATE INDEX idx_prompts_organization_id ON prompts(organization_id);
CREATE INDEX idx_prompts_visibility ON prompts(visibility);
CREATE INDEX idx_prompts_user_org_visibility ON prompts(user_id, organization_id, visibility);

-- Full-text search index with custom weights
CREATE INDEX idx_prompts_tsv_gin ON prompts USING gin(tsv);

-- Function to update tsvector for full-text search
CREATE OR REPLACE FUNCTION update_prompts_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tsv := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tsvector updates
CREATE TRIGGER trigger_update_prompts_tsv
    BEFORE INSERT OR UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_prompts_tsv();

-- Update existing prompts to have tsvector values
UPDATE prompts SET 
    tsv = setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
          setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D');

-- Enhanced RLS policies for prompts (replace existing)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON prompts;

-- New comprehensive RLS policies
CREATE POLICY "Users can view accessible prompts" ON prompts
    FOR SELECT USING (
        -- Own prompts
        user_id = auth.uid()
        OR
        -- Public prompts
        visibility = 'public'
        OR
        -- Team prompts if user is in the organization
        (visibility = 'team' AND organization_id IS NOT NULL AND
         check_organization_membership(organization_id))
    );

CREATE POLICY "Users can insert prompts" ON prompts
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND
        -- If organization_id is provided, user must be a member
        (organization_id IS NULL OR check_organization_membership(organization_id))
        AND
        -- Visibility rules based on organization membership
        (
            visibility = 'private'
            OR
            (visibility = 'public')
            OR
            (visibility = 'team' AND organization_id IS NOT NULL)
        )
    );

CREATE POLICY "Users can update own prompts" ON prompts
    FOR UPDATE USING (
        user_id = auth.uid()
        AND
        -- If changing organization, must be member of new org
        (organization_id IS NULL OR check_organization_membership(organization_id))
    )
    WITH CHECK (
        user_id = auth.uid()
        AND
        -- Same constraints as insert for the updated values
        (organization_id IS NULL OR check_organization_membership(organization_id))
    );

CREATE POLICY "Users can delete own prompts" ON prompts
    FOR DELETE USING (user_id = auth.uid());

-- Advanced search function with organization and visibility filtering
CREATE OR REPLACE FUNCTION search_prompts(
    search_query text DEFAULT '',
    org_id UUID DEFAULT NULL,
    visibility_filter visibility_type DEFAULT NULL,
    user_id_param UUID DEFAULT auth.uid(),
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    content TEXT,
    visibility visibility_type,
    organization_id UUID,
    user_id UUID,
    tags text[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
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
            WHEN search_query = '' THEN 0
            ELSE ts_rank_cd(p.tsv, plainto_tsquery('english', search_query))
        END as rank
    FROM prompts p
    WHERE 
        -- Apply visibility and organization access rules
        (
            p.user_id = user_id_param
            OR
            p.visibility = 'public'
            OR
            (p.visibility = 'team' AND p.organization_id IS NOT NULL AND
             check_organization_membership(p.organization_id, user_id_param))
        )
        AND
        -- Apply organization filter if provided
        (org_id IS NULL OR p.organization_id = org_id)
        AND
        -- Apply visibility filter if provided
        (visibility_filter IS NULL OR p.visibility = visibility_filter)
        AND
        -- Apply search query if provided
        (search_query = '' OR p.tsv @@ plainto_tsquery('english', search_query))
    ORDER BY 
        CASE 
            WHEN search_query = '' THEN p.updated_at
            ELSE ts_rank_cd(p.tsv, plainto_tsquery('english', search_query))
        END DESC,
        p.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Function to get prompt statistics for an organization
CREATE OR REPLACE FUNCTION get_prompt_stats(
    org_id UUID DEFAULT NULL
)
RETURNS TABLE (
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
    FROM prompts p
    WHERE 
        -- Filter by organization if provided
        (org_id IS NULL OR p.organization_id = org_id)
        AND
        -- Apply visibility rules for current user
        (
            p.user_id = auth.uid()
            OR
            p.visibility = 'public'
            OR
            (p.visibility = 'team' AND p.organization_id IS NOT NULL AND
             check_organization_membership(p.organization_id))
        );
END;
$$;

-- Function to increment usage count (for analytics)
CREATE OR REPLACE FUNCTION increment_prompt_usage(prompt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE prompts 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = prompt_id
    AND (
        user_id = auth.uid()
        OR
        visibility = 'public'
        OR
        (visibility = 'team' AND organization_id IS NOT NULL AND
         check_organization_membership(organization_id))
    );
END;
$$;

-- Performance optimization: Update statistics for better query planning
ANALYZE prompts;