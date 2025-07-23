#!/bin/bash
# Supabase Migration Deployment Script
# This script applies migrations to your production Supabase instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Validate required environment variables
validate_env() {
    print_info "Validating environment variables..."
    
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        print_error "SUPABASE_PROJECT_REF is required"
        print_info "Find your project ref in your Supabase dashboard URL:"
        print_info "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
        exit 1
    fi
    
    # Validate project ref format (should be 20 alphanumeric characters)
    if [[ ! "$SUPABASE_PROJECT_REF" =~ ^[a-zA-Z0-9]{20}$ ]]; then
        print_error "Invalid SUPABASE_PROJECT_REF format: '$SUPABASE_PROJECT_REF'"
        print_info "Project ref should be exactly 20 alphanumeric characters"
        print_info "Example: abcdefghijklmnopqrst"
        print_info "Find your project ref in your Supabase dashboard URL:"
        print_info "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
        exit 1
    fi
    
    if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
        print_error "SUPABASE_ACCESS_TOKEN is required"
        print_info "Generate a token at: https://supabase.com/dashboard/account/tokens"
        exit 1
    fi
    
    print_success "Environment variables validated"
    print_info "Project ref: ${SUPABASE_PROJECT_REF:0:4}...${SUPABASE_PROJECT_REF: -4} (masked)"
}

# Check if supabase CLI is installed
check_supabase_cli() {
    print_info "Checking Supabase CLI..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed"
        print_info "For GitHub Actions, ensure the installation step completed successfully"
        print_info "For local development, install with: curl -fsSL https://supabase.com/install.sh | sh"
        exit 1
    fi
    
    # Print version for debugging
    local version=$(supabase --version 2>&1 || echo "unknown")
    print_info "Supabase CLI version: $version"
    print_success "Supabase CLI found"
}

# Link to remote project
link_project() {
    print_info "Linking to Supabase project: $SUPABASE_PROJECT_REF"
    
    # Link to the project using access token authentication
    # The --create-client flag helps avoid some interactive prompts
    if supabase link --project-ref "$SUPABASE_PROJECT_REF" --create-client; then
        print_success "Successfully linked to project"
    else
        print_warning "Link with --create-client failed, trying without flag..."
        if supabase link --project-ref "$SUPABASE_PROJECT_REF"; then
            print_success "Successfully linked to project"
        else
            print_error "Failed to link to project"
            print_info "Make sure your SUPABASE_ACCESS_TOKEN has the necessary permissions"
            exit 1
        fi
    fi
}

# Run migrations
run_migrations() {
    print_info "Applying database migrations..."
    
    # List migration files for verification
    if [ -d "supabase/migrations" ]; then
        migration_count=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
        print_info "Found $migration_count migration files"
    fi
    
    # Set non-interactive mode to avoid password prompts
    export SUPABASE_INTERNAL_DID_WARN_ABOUT_1_X_DEPRECATION=true
    
    # Method 1: Try db push with include-all flag
    print_info "Attempting to push migrations (Method 1: --include-all)..."
    if supabase db push --include-all 2>/dev/null; then
        print_success "Migrations applied successfully"
        return 0
    fi
    
    print_warning "Method 1 failed, trying Method 2..."
    
    # Method 2: Try with piped empty password
    print_info "Attempting to push migrations (Method 2: empty password)..."
    if echo "" | supabase db push 2>/dev/null; then
        print_success "Migrations applied successfully"
        return 0
    fi
    
    print_warning "Method 2 failed, trying Method 3..."
    
    # Method 3: Try with explicit non-interactive flag if available
    print_info "Attempting to push migrations (Method 3: standard push)..."
    if timeout 30 supabase db push < /dev/null 2>/dev/null; then
        print_success "Migrations applied successfully"
        return 0
    fi
    
    # All methods failed
    print_error "All migration methods failed"
    print_info "This might be due to:"
    print_info "1. The access token not having 'Database Admin' permissions"
    print_info "2. Interactive authentication being required"
    print_info "3. No pending migrations to apply"
    print_info "4. Network or database connectivity issues"
    print_info ""
    print_info "To fix this:"
    print_info "1. Go to Supabase Dashboard → Settings → Access Tokens"
    print_info "2. Ensure your token has 'Database Admin' permissions"
    print_info "3. If using environment protection, verify secrets are set correctly"
    
    exit 1
}

# Main execution
main() {
    print_info "🚀 Starting Supabase migration deployment"
    echo
    
    validate_env
    check_supabase_cli
    link_project
    run_migrations
    
    echo
    print_success "🎉 Migration deployment completed successfully!"
}

# Run the script
main "$@"
