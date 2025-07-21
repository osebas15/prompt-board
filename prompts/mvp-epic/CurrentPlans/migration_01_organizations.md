# Migration 01: Create Organizations Table

## Purpose
Create the organizations table to support team collaboration features in Sprint 2. This enables multi-tenant architecture where users can belong to organizations and share prompts within their teams.

## Migration Details

```sql
-- Migration: 01_create_organizations_table.sql
-- Create organizations table for team collaboration

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    settings jsonb DEFAULT '{}',
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_organizations junction table for team membership
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON public.user_organizations(role);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization admins can update organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Organization admins can delete organizations" ON public.organizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their own organization memberships" ON public.user_organizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization admins can view all memberships" ON public.user_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations admin_check
            WHERE admin_check.organization_id = user_organizations.organization_id 
            AND admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Organization admins can manage memberships" ON public.user_organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations admin_check
            WHERE admin_check.organization_id = user_organizations.organization_id 
            AND admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- Function to automatically add creator to organization as admin
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_organizations (user_id, organization_id, role)
    VALUES (NEW.created_by, NEW.id, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add creator as admin
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## Rollback Plan
```sql
-- Rollback script
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
DROP TRIGGER IF EXISTS handle_organizations_updated_at ON public.organizations;
DROP FUNCTION IF EXISTS public.handle_new_organization();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TABLE IF EXISTS public.user_organizations CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
```

## Testing
- Verify organization creation and admin assignment
- Test RLS policies for different user roles
- Validate cascade deletes work correctly
- Check performance with indexes
