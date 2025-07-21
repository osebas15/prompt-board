# Migration 03: Update Categories for Organizations

## Purpose
Update the categories table to support organization-scoped categories, enabling teams to have their own category systems while maintaining proper constraints and performance.

## Migration Details

```sql
-- Migration: 03_update_categories_for_organizations.sql
-- Update categories to support organization-specific categories

-- Add organization_id to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update the unique constraint to be per-organization
-- First drop the existing unique constraint
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add new constraint that allows same name in different organizations
ALTER TABLE public.categories 
ADD CONSTRAINT categories_name_org_unique UNIQUE (name, organization_id);

-- Allow null organization_id for global/system categories (if needed)
-- This enables having both global categories and org-specific categories
-- If you only want org-specific categories, you can make organization_id NOT NULL

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON public.categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_name_org ON public.categories(name, organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

-- Enhanced RLS policies for organization-based categories
CREATE POLICY "Users can view organization categories" ON public.categories
    FOR SELECT USING (
        -- Users can see categories from their organizations
        organization_id IN (
            SELECT organization_id FROM public.user_organizations 
            WHERE user_id = auth.uid()
        ) OR
        -- Or global categories (where organization_id is null)
        organization_id IS NULL
    );

CREATE POLICY "Organization members can create categories" ON public.categories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (organization_id IS NULL OR organization_id IN (
            SELECT organization_id FROM public.user_organizations 
            WHERE user_id = auth.uid()
        ))
    );

CREATE POLICY "Category creators can update their categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Category creators can delete their categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Function to create default categories for new organizations
CREATE OR REPLACE FUNCTION public.create_default_categories(org_id uuid)
RETURNS void AS $$
DECLARE
    creator_id uuid;
BEGIN
    -- Get the organization creator
    SELECT created_by INTO creator_id 
    FROM public.organizations 
    WHERE id = org_id;
    
    -- Create default categories
    INSERT INTO public.categories (name, description, color, organization_id, user_id) VALUES
    ('General', 'General purpose prompts', '#6B7280', org_id, creator_id),
    ('Development', 'Software development prompts', '#10B981', org_id, creator_id),
    ('Writing', 'Content and writing prompts', '#8B5CF6', org_id, creator_id),
    ('Analysis', 'Data analysis and research prompts', '#F59E0B', org_id, creator_id),
    ('Creative', 'Creative and artistic prompts', '#EF4444', org_id, creator_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories for new organizations
CREATE OR REPLACE FUNCTION public.handle_new_organization_categories()
RETURNS trigger AS $$
BEGIN
    PERFORM public.create_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created_categories
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_categories();

-- Function to get categories with usage stats
CREATE OR REPLACE FUNCTION public.get_categories_with_stats(org_id uuid DEFAULT NULL)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    color text,
    organization_id uuid,
    user_id uuid,
    created_at timestamp with time zone,
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
    FROM public.categories c
    LEFT JOIN public.prompts p ON p.category_id = c.id
    WHERE 
        (org_id IS NULL OR c.organization_id = org_id OR c.organization_id IS NULL) AND
        (
            c.organization_id IN (
                SELECT organization_id FROM public.user_organizations 
                WHERE user_id = auth.uid()
            ) OR
            c.organization_id IS NULL
        )
    GROUP BY c.id, c.name, c.description, c.color, c.organization_id, c.user_id, c.created_at
    ORDER BY c.name;
END;
$$;

-- Update existing categories to assign them to organizations
-- This is a data migration step that should be handled carefully in production
-- For now, we'll leave existing categories as global (organization_id = NULL)

-- Function to migrate user categories to their primary organization
CREATE OR REPLACE FUNCTION public.migrate_user_categories_to_org()
RETURNS void AS $$
DECLARE
    category_record RECORD;
    user_org_id uuid;
BEGIN
    -- Iterate through categories that don't have an organization_id
    FOR category_record IN 
        SELECT * FROM public.categories 
        WHERE organization_id IS NULL AND user_id IS NOT NULL
    LOOP
        -- Find the user's primary organization (first admin role)
        SELECT organization_id INTO user_org_id
        FROM public.user_organizations 
        WHERE user_id = category_record.user_id 
        AND role = 'admin'
        LIMIT 1;
        
        -- Update the category if we found an organization
        IF user_org_id IS NOT NULL THEN
            UPDATE public.categories 
            SET organization_id = user_org_id 
            WHERE id = category_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Call migrate_user_categories_to_org() after organizations are set up
-- SELECT public.migrate_user_categories_to_org();
```

## Data Migration Considerations
1. Existing categories without organization_id will be treated as global
2. You can run the migration function to assign categories to users' primary organizations
3. Handle conflicts where category names might duplicate across organizations

## Performance Impact
- New indexes ensure efficient queries
- Compound index on (name, organization_id) for uniqueness checks
- RLS policies optimized to avoid unnecessary joins

## Testing
- Verify category isolation between organizations
- Test unique constraint works per organization
- Validate default categories are created for new orgs
- Check migration function handles existing data correctly
