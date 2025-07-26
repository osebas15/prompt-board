-- Fix infinite recursion in user_organizations RLS policies
-- This migration resolves the circular reference issue

-- Drop problematic policies
DROP POLICY IF EXISTS "Organization admins can view all memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON user_organizations;

-- Recreate policies without recursion

-- Simple policy: users can view their own memberships (already correct)
-- CREATE POLICY "Users can view their own memberships" ON user_organizations
--     FOR SELECT USING (user_id = auth.uid());

-- Fix admin policies by using a security definer function instead of recursive queries
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Direct query without RLS to avoid recursion
    SELECT EXISTS (
        SELECT 1 FROM user_organizations 
        WHERE organization_id = org_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$;

-- New non-recursive policies using the security definer function
CREATE POLICY "Organization admins can view all memberships" ON user_organizations
    FOR SELECT USING (
        user_id = auth.uid() OR is_organization_admin(organization_id)
    );

CREATE POLICY "Organization admins can manage memberships" ON user_organizations
    FOR ALL USING (
        is_organization_admin(organization_id)
    );

-- Also update the helper function to use security definer approach
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
    -- Direct query without RLS to avoid recursion
    SELECT EXISTS (
        SELECT 1 FROM user_organizations
        WHERE organization_id = org_id
        AND user_id = user_id_param
    ) INTO is_member;
    
    RETURN is_member;
END;
$$;

-- Update get_user_role_in_organization to use security definer
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
    -- Direct query without RLS to avoid recursion
    SELECT role INTO user_role_result
    FROM user_organizations
    WHERE organization_id = org_id
    AND user_id = user_id_param;
    
    RETURN user_role_result;
END;
$$;
