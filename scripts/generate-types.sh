#!/bin/bash

# Script to regenerate Supabase types
# Run this whenever you make changes to your database schema

echo "🔄 Regenerating Supabase types..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: supabase/config.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "📖 Install it with: npm install -g @supabase/cli"
    exit 1
fi

# Generate types from local database
echo "📊 Generating types from local database..."
supabase gen types typescript --local > src/types/supabase.ts

if [ $? -eq 0 ]; then
    echo "✅ Types generated successfully!"
    echo "📁 Updated: src/types/supabase.ts"
    echo ""
    echo "💡 Don't forget to:"
    echo "   - Review the generated types"
    echo "   - Update any dependent files if needed"
    echo "   - Run your tests to ensure compatibility"
else
    echo "❌ Failed to generate types. Please check your Supabase setup."
    exit 1
fi
