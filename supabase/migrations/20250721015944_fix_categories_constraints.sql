-- Migration 04: Fix Categories Constraints
-- Purpose: Remove global unique constraint and fix RLS policies

-- Drop the old global unique constraint on category name
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- The scoped unique constraints we created earlier should already exist:
-- - idx_categories_unique_org_name for organization-scoped categories
-- - idx_categories_unique_user_name for user-scoped categories

-- Verify constraint exists for categories ownership check
-- (This should already exist from the previous migration)
-- ALTER TABLE categories 
-- ADD CONSTRAINT categories_ownership_check 
-- CHECK (
--     (organization_id IS NOT NULL AND user_id IS NULL) 
--     OR 
--     (organization_id IS NULL AND user_id IS NOT NULL)
-- );
