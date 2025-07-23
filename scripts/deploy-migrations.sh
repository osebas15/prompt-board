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
    
        # Check if service role key is available (optional but deprecated for CI/CD)
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_warning "Service role key detected but CLI method is recommended for CI/CD"
        print_info "💡 Consider using only SUPABASE_ACCESS_TOKEN for better reliability"
        print_info "💡 See: https://supabase.com/docs/guides/cli/cicd-workflows"
        USE_SERVICE_ROLE=true
    else
        print_info "Using recommended CLI method for CI/CD deployment"
        USE_SERVICE_ROLE=false
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

# Run migrations using service role (direct database connection)
run_migrations_service_role() {
    print_info "Applying migrations using service role key..."
    
    # Find the migrations directory - handle different working directories
    local migrations_dir=""
    if [ -d "supabase/migrations" ]; then
        migrations_dir="supabase/migrations"
    elif [ -d "./supabase/migrations" ]; then
        migrations_dir="./supabase/migrations"
    elif [ -d "../supabase/migrations" ]; then
        migrations_dir="../supabase/migrations"
    else
        print_error "Cannot find migrations directory"
        print_info "Current working directory: $(pwd)"
        print_info "Looking for: supabase/migrations/"
        print_info "Available directories:"
        ls -la . | grep -E '^d' || echo "No directories found"
        return 1
    fi
    
    print_info "Using migrations directory: $migrations_dir"
    
    # Extract project details from project ref
    local project_ref="$SUPABASE_PROJECT_REF"
    local host="aws-0-us-east-1.pooler.supabase.com"
    local port="5432"
    local database="postgres"
    local username="postgres.${project_ref}"
    
    # Show connection details (without exposing the key)
    print_info "🔍 Connection Details:"
    print_info "  Host: $host"
    print_info "  Port: $port"
    print_info "  Database: $database"
    print_info "  Username: $username"
    print_info "  Service Key Length: ${#SUPABASE_SERVICE_ROLE_KEY} characters"
    print_info "  Service Key Format: ${SUPABASE_SERVICE_ROLE_KEY:0:10}...(JWT token)"
    
    # Validate service role key format (should be a JWT token)
    if [[ ! "$SUPABASE_SERVICE_ROLE_KEY" =~ ^eyJ.* ]]; then
        print_error "Service role key format invalid - should start with 'eyJ' (JWT token)"
        print_info "Current key starts with: '${SUPABASE_SERVICE_ROLE_KEY:0:10}'"
        print_info "Expected format: JWT token starting with 'eyJ'"
        print_info "Get the correct key from: Supabase Dashboard → Settings → API → service_role key"
        return 1
    fi
    
    # Construct database URL - service role key is used as the password
    local db_url="postgresql://${username}:${SUPABASE_SERVICE_ROLE_KEY}@${host}:${port}/${database}"
    
    # Test basic connectivity first
    print_info "🔄 Testing database connection..."
    
    # Capture the full error output
    local connection_test_output
    local connection_test_exit_code
    connection_test_output=$(psql "$db_url" -c "SELECT 1;" 2>&1)
    connection_test_exit_code=$?
    
    if [ $connection_test_exit_code -ne 0 ]; then
        print_error "Failed to connect to database with service role key"
        print_info "Connection test exit code: $connection_test_exit_code"
        print_info "Connection error output:"
        echo "$connection_test_output" | sed 's/^/    /'
        
        # Parse common error types
        if echo "$connection_test_output" | grep -qi "authentication failed"; then
            print_error "Authentication failed - service role key is incorrect"
            print_info "🔑 The service role key appears to be wrong or expired"
            print_info "📋 To fix:"
            print_info "   1. Go to Supabase Dashboard → Settings → API"
            print_info "   2. Copy the 'service_role' key (NOT the 'anon' key)"
            print_info "   3. Update SUPABASE_SERVICE_ROLE_KEY in GitHub secrets"
        elif echo "$connection_test_output" | grep -qi "could not translate host name\|host.*not found"; then
            print_error "DNS/Network error - cannot reach Supabase servers"
            print_info "🌐 Network connectivity issue"
            print_info "📋 Host: $host"
            print_info "📋 This might be a temporary network issue"
        elif echo "$connection_test_output" | grep -qi "connection refused\|timeout"; then
            print_error "Connection refused or timeout"
            print_info "🔌 Cannot connect to database server"
            print_info "📋 Port: $port"
            print_info "📋 This might be a firewall or server issue"
        elif echo "$connection_test_output" | grep -qi "role.*does not exist"; then
            print_error "Database role/user does not exist"
            print_info "👤 Username issue: $username"
            print_info "📋 Check if project ref is correct: $project_ref"
        elif echo "$connection_test_output" | grep -qi "tenant or user not found"; then
            print_error "Tenant or user not found - Project reference mismatch"
            print_info "🎯 This error means either:"
            print_info "   1. SUPABASE_PROJECT_REF is incorrect"
            print_info "   2. Service role key is from a different project"
            print_info "   3. Project was deleted or doesn't exist"
            print_info ""
            print_info "🔍 To fix this:"
            print_info "   1. Go to your Supabase dashboard"
            print_info "   2. Check the URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
            print_info "   3. Copy the project ref from the URL (20 character string)"
            print_info "   4. Ensure SUPABASE_PROJECT_REF matches exactly: $project_ref"
            print_info "   5. Get the service role key from the SAME project"
            print_info ""
            print_info "🔑 Both secrets must be from the same Supabase project!"
        else
            print_error "Unknown database connection error"
            print_info "📋 Raw error details above"
        fi
        
        return 1
    fi
    
    print_success "Database connection established"
    
    # Apply each migration file in order
    local applied_count=0
    for migration_file in "$migrations_dir"/*.sql; do
        if [ -f "$migration_file" ]; then
            local filename=$(basename "$migration_file")
            print_info "Applying migration: $filename"
            
            # Use psql to apply the migration directly
            if psql "$db_url" -f "$migration_file" > /dev/null 2>&1; then
                print_success "✅ Applied: $filename"
                ((applied_count++))
            else
                # Migration might already be applied, check if it's a duplicate key error
                local error_output=$(psql "$db_url" -f "$migration_file" 2>&1)
                if echo "$error_output" | grep -q "already exists\|duplicate key\|relation.*already exists"; then
                    print_warning "⚠️  Already applied: $filename"
                else
                    print_error "❌ Failed to apply: $filename"
                    print_info "Error: $error_output"
                    return 1
                fi
            fi
        fi
    done
    
    print_success "Applied $applied_count new migrations using service role"
    return 0
}

# Run migrations
run_migrations() {
    print_info "Applying database migrations..."
    
    # Find the migrations directory - handle different working directories
    local migrations_dir=""
    if [ -d "supabase/migrations" ]; then
        migrations_dir="supabase/migrations"
    elif [ -d "./supabase/migrations" ]; then
        migrations_dir="./supabase/migrations"
    elif [ -d "../supabase/migrations" ]; then
        migrations_dir="../supabase/migrations"
    else
        print_error "Cannot find migrations directory"
        print_info "Current working directory: $(pwd)"
        print_info "Looking for: supabase/migrations/"
        print_info "Available directories:"
        ls -la . | grep -E '^d' || echo "No directories found"
        if [ -d "supabase" ]; then
            print_info "Contents of supabase directory:"
            ls -la supabase/ || echo "Cannot list supabase contents"
        fi
        return 1
    fi
    
    print_info "Using migrations directory: $migrations_dir"
    
    # List migration files for verification
    if [ -d "$migrations_dir" ]; then
        migration_count=$(ls -1 "$migrations_dir"/*.sql 2>/dev/null | wc -l)
        print_info "Found $migration_count migration files"
        
        if [ "$migration_count" -eq 0 ]; then
            print_warning "No migration files found - nothing to deploy"
            return 0
        fi
        
        # List the migration files for debugging
        print_info "Migration files:"
        for file in "$migrations_dir"/*.sql; do
            if [ -f "$file" ]; then
                print_info "  - $(basename "$file")"
            fi
        done
    else
        print_warning "No migrations directory found - nothing to deploy"
        return 0
    fi
    
    # If service role key is available, try that first (most reliable)
    if [ "$USE_SERVICE_ROLE" = true ]; then
        print_info "Attempting service role migration (Recommended method)..."
        if command -v psql &> /dev/null && run_migrations_service_role; then
            return 0
        else
            print_warning "Service role method failed, falling back to CLI methods..."
        fi
    fi
    
    # Method 1: Try using the Management API approach (most reliable for CI/CD)
    print_info "Attempting to push migrations (Method 1: Management API)..."
    if supabase db push --experimental 2>/dev/null; then
        print_success "Migrations applied successfully using Management API"
        return 0
    fi
    
    print_warning "Method 1 failed, trying Method 2..."
    
    # Method 2: Try db push with include-all flag
    print_info "Attempting to push migrations (Method 2: --include-all)..."
    if supabase db push --include-all --password="" 2>/dev/null; then
        print_success "Migrations applied successfully"
        return 0
    fi
    
    print_warning "Method 2 failed, trying Method 3..."
    
    # Method 3: Try with linked project and skip confirmation
    print_info "Attempting to push migrations (Method 3: force push)..."
    export SUPABASE_INTERNAL_DID_WARN_ABOUT_1_X_DEPRECATION=true
    if yes "" | timeout 60 supabase db push 2>/dev/null; then
        print_success "Migrations applied successfully"
        return 0
    fi
    
    # All methods failed - provide detailed debugging
    print_error "All migration methods failed"
    print_info ""
    print_info "🔍 Debugging Information:"
    print_info "• Project linked: ✅ (confirmed above)"
    print_info "• Migration files: $migration_count found"
    print_info "• Access token: $([ -n "$SUPABASE_ACCESS_TOKEN" ] && echo "✅ Set" || echo "❌ Missing")"
    print_info "• Service role key: $([ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✅ Available" || echo "❌ Not set")"
    print_info ""
    print_info "💡 Recommended Solution:"
    print_info "1. **Add Service Role Key (Most Reliable)**:"
    print_info "   → Go to https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
    print_info "   → Copy the 'service_role' key (not anon key)"
    print_info "   → Add as SUPABASE_SERVICE_ROLE_KEY in GitHub secrets"
    print_info "   → Service role bypasses RLS and auth requirements"
    print_info ""
    print_info "2. **Alternative: Fix Access Token**:"
    print_info "   → Go to https://supabase.com/dashboard/account/tokens"
    print_info "   → Ensure token has 'All' or 'Database' permissions"
    print_info "   → Regenerate token if unsure"
    print_info ""
    print_info "3. **Check Migration Status**:"
    if [ -d "supabase/migrations" ] && [ "$migration_count" -gt 0 ]; then
        print_info "   → Latest migration: $(ls -t supabase/migrations/*.sql 2>/dev/null | head -1 | xargs basename)"
        print_info "   → Check if migrations are already applied in Dashboard"
    fi
    
    exit 1
}

# Main execution
main() {
    print_info "🚀 Starting Supabase migration deployment"
    echo
    
    # Debug information
    print_info "🔍 Environment Information:"
    print_info "Current working directory: $(pwd)"
    print_info "Script location: $0"
    print_info "Available files in current directory:"
    ls -la . | head -10
    if [ -d "supabase" ]; then
        print_info "Contents of supabase directory:"
        ls -la supabase/
    fi
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
