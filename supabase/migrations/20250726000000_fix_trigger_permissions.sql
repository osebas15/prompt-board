-- Fix trigger function permissions to prevent chicken-and-egg RLS issues
-- This migration ensures that organization creation triggers can bypass RLS

-- Recreate the trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes the function run with the creator's (postgres) privileges
AS $$
BEGIN
    -- Insert into user_organizations with elevated privileges
    -- This bypasses RLS because the function runs as the postgres user
    INSERT INTO user_organizations (user_id, organization_id, role)
    VALUES (NEW.created_by, NEW.id, 'admin');
    RETURN NEW;
END;
$$;

-- Also ensure our other helper functions maintain SECURITY DEFINER
-- (They were already created with SECURITY DEFINER in the previous migration)

-- Optional: Grant execute permissions to authenticated users if needed
-- GRANT EXECUTE ON FUNCTION add_creator_as_admin() TO authenticated;
