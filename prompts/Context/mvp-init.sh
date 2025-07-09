#!/bin/bash

# Prompt Board MVP - Package Installation Script
# This script installs all required dependencies for the MVP implementation

echo "🚀 Installing Prompt Board MVP Dependencies..."

# Core React Router for navigation
echo "📍 Installing React Router..."
npm install react-router-dom@^6.28.0
npm install -D @types/react-router-dom

# State Management & Data Fetching
echo "🔄 Installing data fetching and state management..."
npm install @tanstack/react-query@^5.56.2
npm install @tanstack/react-query-devtools@^5.56.2

# Form Handling & Validation
echo "📝 Installing form handling..."
npm install react-hook-form@^7.53.2
npm install zod@^3.23.8
npm install @hookform/resolvers@^3.9.1

# UI Components & Styling
echo "🎨 Installing UI components..."
npm install @headlessui/react@^2.2.0
npm install lucide-react@^0.454.0
npm install clsx@^2.1.1
npm install react-hot-toast@^2.4.1

# Search & Utilities
echo "🔍 Installing search and utilities..."
npm install fuse.js@^7.0.0
npm install date-fns@^4.1.0
npm install lodash@^4.17.21
npm install -D @types/lodash

# Charts & Analytics
echo "📊 Installing chart library..."
npm install recharts@^2.13.3

# Virtual Scrolling (for large lists)
echo "📜 Installing virtualization..."
npm install @tanstack/react-virtual@^3.10.8

# Development & Code Quality
echo "🛠️ Installing development tools..."
npm install -D @typescript-eslint/eslint-plugin@^8.15.0
npm install -D @typescript-eslint/parser@^8.15.0
npm install -D prettier@^3.3.3
npm install -D eslint-plugin-react@^7.37.2
npm install -D eslint-plugin-react-hooks@^5.0.0

# Testing Enhancements
echo "🧪 Installing additional testing utilities..."
npm install -D @testing-library/user-event@^14.5.2
npm install -D @testing-library/jest-dom@^6.6.3
npm install -D msw@^2.6.6

# Type Generation for Supabase
echo "🔧 Installing Supabase type generation..."
npm install -D supabase@^1.210.3

# Environment Management
echo "🌍 Installing environment utilities..."
npm install dotenv@^16.4.7

# Additional React utilities
echo "⚛️ Installing React utilities..."
npm install use-debounce@^10.0.4
npm install react-use@^17.5.1

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📦 Next steps:"
echo "1. Run 'npm run supabase:start' to start local Supabase"
echo "2. Generate Supabase types: 'npx supabase gen types typescript --local > src/types/database.types.ts'"
echo "3. Start development: 'npm run dev'"
echo ""
echo "🎯 MVP Ready for development!"

# Create basic directory structure
echo "📁 Creating module directory structure..."
mkdir -p src/modules/{auth,prompts,organization,collaboration,analytics,ui,router,database,utils,hooks}
mkdir -p src/pages
mkdir -p src/types
mkdir -p src/components/ui

# Create placeholder files to maintain git structure
touch src/modules/auth/.gitkeep
touch src/modules/prompts/.gitkeep
touch src/modules/organization/.gitkeep
touch src/modules/collaboration/.gitkeep
touch src/modules/analytics/.gitkeep
touch src/modules/ui/.gitkeep
touch src/modules/router/.gitkeep
touch src/modules/database/.gitkeep
touch src/modules/utils/.gitkeep
touch src/modules/hooks/.gitkeep
touch src/pages/.gitkeep
touch src/types/.gitkeep

echo "📁 Directory structure created!"
echo ""
echo "🚀 Ready to start building the MVP!"
