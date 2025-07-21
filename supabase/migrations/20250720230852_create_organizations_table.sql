-- Migration 01: Create Organizations Table
-- Purpose: Enable team collaboration and organization-scoped prompts

-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');

-- Create organizations table
CREATE TABLE organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL CHECK (length(name) >= 2 AND length(name) <= 255),
    slug VARCHAR(100) NOT NULL UNIQUE CHECK (
        slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND 
        length(slug) >= 2 AND 
        length(slug) <= 100
    ),
    description TEXT,
    settings JSONB DEFAULT '{
        "allowPublicPrompts": true,
        "requireApprovalForPublic": false,
        "defaultVisibility": "team",
        "enableCategories": true,
        "maxPromptsPerUser": null,
        "invitePermissions": ["admin"]
    }'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_organizations junction table for memberships
CREATE TABLE user_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);

-- Create updated_at trigger for organizations
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Organizations are viewable by members" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.organization_id = id 
            AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organization admins can update organizations" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.organization_id = id 
            AND uo.user_id = auth.uid() 
            AND uo.role = 'admin'
        )
    );

CREATE POLICY "Organization creators can delete organizations" ON organizations
    FOR DELETE USING (created_by = auth.uid());

-- User organizations policies
CREATE POLICY "Users can view their own memberships" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view all memberships" ON user_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.organization_id = organization_id 
            AND uo.user_id = auth.uid() 
            AND uo.role = 'admin'
        )
    );

CREATE POLICY "Organization admins can manage memberships" ON user_organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.organization_id = organization_id 
            AND uo.user_id = auth.uid() 
            AND uo.role = 'admin'
        )
    );

-- Helper functions

-- Function to check organization membership
CREATE OR REPLACE FUNCTION check_organization_membership(
    org_id UUID,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_member boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.organization_id = org_id
        AND uo.user_id = user_id_param
    ) INTO is_member;
    
    RETURN is_member;
END;
$$;

-- Function to get user role in organization
CREATE OR REPLACE FUNCTION get_user_role_in_organization(
    org_id UUID,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT uo.role INTO user_role_result
    FROM user_organizations uo
    WHERE uo.organization_id = org_id
    AND uo.user_id = user_id_param;
    
    RETURN user_role_result;
END;
$$;

-- Trigger to automatically add creator as admin when organization is created
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_organizations (user_id, organization_id, role)
    VALUES (NEW.created_by, NEW.id, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_creator_as_admin
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_admin();