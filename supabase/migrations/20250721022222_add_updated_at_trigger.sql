-- Add trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to prompts table to automatically update updated_at
CREATE TRIGGER update_prompts_updated_at 
    BEFORE UPDATE ON prompts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to categories table to automatically update updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to organizations table to automatically update updated_at
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
