-- Add is_active column to contexts table for Day 8 advanced search features
-- This column tracks whether a context is actively being used
-- Unlike is_archived (which is user-facing), is_active is for internal logic

ALTER TABLE contexts 
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Add index for better query performance on is_active
CREATE INDEX idx_contexts_is_active ON contexts(user_id, is_active);

-- Update existing records to be active by default (opposite of archived)
UPDATE contexts 
SET is_active = NOT is_archived;

-- Add comment for clarity
COMMENT ON COLUMN contexts.is_active IS 'Whether this context is actively being used (internal logic). Opposite of is_archived.';
