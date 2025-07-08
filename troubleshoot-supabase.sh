#!/bin/bash
# Supabase troubleshooting script

echo "🔍 Supabase Local Development Troubleshooting"
echo "============================================="
echo

# Check Docker
echo "1. Checking Docker..."
if docker info >/dev/null 2>&1; then
    echo "   ✅ Docker is running"
else
    echo "   ❌ Docker is not running - please start Docker Desktop"
    exit 1
fi

# Check Supabase CLI
echo "2. Checking Supabase CLI..."
if command -v supabase >/dev/null 2>&1; then
    echo "   ✅ Supabase CLI is installed"
    echo "   Version: $(supabase --version)"
else
    echo "   ❌ Supabase CLI is not installed"
    exit 1
fi

# Check if project is initialized
echo "3. Checking project setup..."
if [ -d "supabase" ]; then
    echo "   ✅ Supabase project is initialized"
    if [ -f "supabase/config.toml" ]; then
        echo "   ✅ Configuration file exists"
    else
        echo "   ❌ Configuration file missing"
    fi
else
    echo "   ❌ Supabase project not initialized - run 'supabase init'"
    exit 1
fi

# Check migrations
echo "4. Checking migrations..."
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations 2>/dev/null)" ]; then
    echo "   ✅ Migration files found:"
    ls -la supabase/migrations/
else
    echo "   ⚠️  No migration files found"
fi

# Check if Supabase is running
echo "5. Checking Supabase status..."
if supabase status >/dev/null 2>&1; then
    echo "   ✅ Supabase is running"
    echo
    echo "📊 Connection Details:"
    supabase status
else
    echo "   ❌ Supabase is not running"
    echo "   💡 Try: npm run supabase:start"
fi

echo
echo "🚀 Quick Commands:"
echo "   Start Supabase:    npm run supabase:start"
echo "   Open Studio:       open http://localhost:54323"
echo "   Check status:      npm run supabase:status"
echo "   Reset database:    npm run supabase:reset"
echo "   Stop Supabase:     npm run supabase:stop"
