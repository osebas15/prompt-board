#!/bin/bash

# Day 1 Setup Script - Project Setup & Authentication Foundation
# This script installs dependencies and sets up the development environment

set -e

echo "🚀 Day 1 Setup: Project Setup & Authentication Foundation"
echo "========================================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the project root (assuming it's 3 levels up from CurrentSprint)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "📁 Navigating to project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Could not find package.json in project root"
    echo "   Expected location: $PROJECT_ROOT/package.json"
    exit 1
fi

echo "📦 Installing additional dependencies for authentication..."

# Install authentication and state management dependencies
npm install --save \
    @supabase/supabase-js \
    @tanstack/react-query \
    @tanstack/react-query-devtools \
    react-router-dom \
    react-hook-form \
    @hookform/resolvers \
    zod \
    react-hot-toast

echo "📦 Installing development dependencies..."

# Install testing and development dependencies
npm install --save-dev \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    @vitest/ui \
    jsdom \
    msw \
    @types/react-router-dom

echo "⚙️  Setting up environment files..."

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    cat > .env.example << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key

# App Configuration
VITE_APP_NAME=Prompt Board
VITE_APP_DESCRIPTION=LLM Workflow Management Tool
EOF
    echo "✅ Created .env.example"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Please create .env.local with your actual environment variables"
    echo "   Copy .env.example to .env.local and fill in your values"
fi

echo "📁 Creating directory structure..."

# Create necessary directories
mkdir -p src/features/auth/{components,hooks,types,utils,__tests__}
mkdir -p src/lib/{__tests__}
mkdir -p src/components/{ui,layout}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/test

echo "🧪 Setting up test configuration..."

# Update vitest.config.ts if needed
if [ -f "vitest.config.ts" ]; then
    echo "✅ Vitest config already exists"
else
    echo "⚠️  Please ensure vitest.config.ts is properly configured"
fi

echo "✅ Day 1 setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env.local and add your API keys"
echo "2. Start Supabase: npm run supabase:start"
echo "3. Run tests: npm test"
echo "4. Start development: npm run dev"
echo ""
echo "Happy coding! 🎉"
