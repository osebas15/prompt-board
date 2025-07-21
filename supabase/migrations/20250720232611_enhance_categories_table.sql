-- Migration 03: Enhance Categories Table
-- Purpose: Add organization support and improved scoping for categories

-- Add organization support to categories (user_id already exists)
ALTER TABLE categories 
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_categories_organization_id ON categories(organization_id);
CREATE INDEX idx_categories_org_user ON categories(organization_id, user_id);

-- Add constraint to ensure categories belong to either a user or organization (but not both)
ALTER TABLE categories 
ADD CONSTRAINT categories_ownership_check 
CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) 
    OR 
    (organization_id IS NULL AND user_id IS NOT NULL)
);

-- Add unique constraint for category names within scope
CREATE UNIQUE INDEX idx_categories_unique_org_name 
ON categories(organization_id, name) 
WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX idx_categories_unique_user_name 
ON categories(user_id, name) 
WHERE user_id IS NOT NULL;

-- Enhanced RLS policies for categories

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- New comprehensive RLS policies
CREATE POLICY "Users can view accessible categories" ON categories
    FOR SELECT USING (
        -- Own personal categories
        user_id = auth.uid()
        OR
        -- Organization categories if user is a member
        (organization_id IS NOT NULL AND 
         check_organization_membership(organization_id))
    );

CREATE POLICY "Users can create categories" ON categories
    FOR INSERT WITH CHECK (
        -- Personal categories
        (user_id = auth.uid() AND organization_id IS NULL)
        OR
        -- Organization categories if user is a member with appropriate permissions
        (organization_id IS NOT NULL AND user_id IS NULL AND
         check_organization_membership(organization_id) AND
         get_user_role_in_organization(organization_id) IN ('admin', 'member'))
    );

CREATE POLICY "Users can update accessible categories" ON categories
    FOR UPDATE USING (
        -- Own personal categories
        user_id = auth.uid()
        OR
        -- Organization categories if user has appropriate role
        (organization_id IS NOT NULL AND
         check_organization_membership(organization_id) AND
         get_user_role_in_organization(organization_id) IN ('admin', 'member'))
    )
    WITH CHECK (
        -- Same constraints as insert for the updated values
        (user_id = auth.uid() AND organization_id IS NULL)
        OR
        (organization_id IS NOT NULL AND user_id IS NULL AND
         check_organization_membership(organization_id) AND
         get_user_role_in_organization(organization_id) IN ('admin', 'member'))
    );

CREATE POLICY "Users can delete accessible categories" ON categories
    FOR DELETE USING (
        -- Own personal categories
        user_id = auth.uid()
        OR
        -- Organization categories if user is admin
        (organization_id IS NOT NULL AND
         check_organization_membership(organization_id) AND
         get_user_role_in_organization(organization_id) = 'admin')
    );

-- Function to get categories with prompt counts
CREATE OR REPLACE FUNCTION get_categories_with_stats(
    org_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    color VARCHAR,
    organization_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    prompt_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.color,
        c.organization_id,
        c.user_id,
        c.created_at,
        COUNT(p.id) as prompt_count
    FROM categories c
    LEFT JOIN prompts p ON p.category_id = c.id
        AND (
            p.user_id = auth.uid()
            OR
            p.visibility = 'public'
            OR
            (p.visibility = 'team' AND p.organization_id IS NOT NULL AND
             check_organization_membership(p.organization_id))
        )
    WHERE 
        -- Apply access control for categories
        (
            c.user_id = auth.uid()
            OR
            (c.organization_id IS NOT NULL AND 
             check_organization_membership(c.organization_id))
        )
        AND
        -- Filter by organization if provided
        (org_id IS NULL OR c.organization_id = org_id)
    GROUP BY c.id, c.name, c.description, c.color, c.organization_id, c.user_id, c.created_at
    ORDER BY c.name;
END;
$$;

-- Function to validate category assignment for prompts
CREATE OR REPLACE FUNCTION validate_category_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_id is provided, validate access
    IF NEW.category_id IS NOT NULL THEN
        -- Check if user has access to this category
        IF NOT EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = NEW.category_id
            AND (
                c.user_id = NEW.user_id
                OR
                (c.organization_id = NEW.organization_id AND c.organization_id IS NOT NULL)
            )
        ) THEN
            RAISE EXCEPTION 'Cannot assign prompt to inaccessible category';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category assignment validation
CREATE TRIGGER trigger_validate_category_assignment
    BEFORE INSERT OR UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION validate_category_assignment();

-- Categories already have user ownership via existing user_id column
-- No migration needed for existing categories

-- Performance optimization
ANALYZE categories;