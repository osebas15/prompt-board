#!/bin/bash
# Prompt Board: Supabase local development setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function initialize_supabase() {
  if [ -d "supabase" ]; then
    print_warning "Supabase project already initialized. Skipping initialization."
    return 0
  fi
  
  print_step "Initializing Supabase project..."
  supabase init
  print_success "Supabase project initialized!"
}

function setup_supabase_config() {
  print_step "Setting up Supabase configuration..."
  
  # Check if config.toml exists
  if [ -f "supabase/config.toml" ]; then
    print_step "Updating Supabase config.toml for local development..."
    
    # Backup original config
    cp supabase/config.toml supabase/config.toml.bak
    
    # Add or update development-friendly settings
    cat >> supabase/config.toml << 'EOL'

# Local development settings
[analytics]
enabled = false

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
# Optional: Configure external auth providers for local development
# [auth.external.github]
# enabled = false
# client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
# secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"

[storage]
enabled = true
file_size_limit = "50MiB"

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[edge_runtime]
enabled = true
port = 54325

[logflare]
enabled = false
EOL

    print_success "Supabase config.toml updated for local development!"
  else
    print_warning "supabase/config.toml not found. Run 'supabase init' first."
    return 1
  fi
}

function create_supabase_env_files() {
  print_step "Creating Supabase environment files..."
  
  # Create .env.local with local Supabase settings
  if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOL'
# Local Supabase Development Environment
# These are the standard default values when running `supabase start`
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
VITE_GEMINI_API_KEY=your-gemini-api-key-here
EOL
    print_success ".env.local created with local Supabase settings!"
  else
    print_info ".env.local already exists. Skipping creation."
  fi
  
  # Update .env.example with local development notes
  if [ -f ".env.example" ]; then
    if ! grep -q "# Local Development" .env.example; then
      cat >> .env.example << 'EOL'

# Local Development (when using `supabase start`)
# Use these values for local development:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOL
      print_success "Updated .env.example with local development notes!"
    fi
  fi
}

function create_initial_migration() {
  print_step "Creating initial database migration..."
  
  if [ ! -d "supabase/migrations" ] || [ -z "$(ls -A supabase/migrations 2>/dev/null)" ]; then
    # Create a basic initial migration
    supabase migration new create_initial_schema
    
    # Get the latest migration file
    MIGRATION_FILE=$(ls -t supabase/migrations/*.sql | head -n 1)
    
    if [ -n "$MIGRATION_FILE" ]; then
      cat > "$MIGRATION_FILE" << 'EOL'
-- Initial schema setup for Prompt Board
-- This migration sets up the basic tables and functions

-- Enable the uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create prompts table for storing user prompts
create table if not exists public.prompts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    content text not null,
    category text,
    tags text[],
    is_public boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.prompts enable row level security;

-- Create policies for profiles
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id);

-- Create policies for prompts
create policy "Users can view own prompts" on public.prompts
    for select using (auth.uid() = user_id);

create policy "Users can view public prompts" on public.prompts
    for select using (is_public = true);

create policy "Users can insert own prompts" on public.prompts
    for insert with check (auth.uid() = user_id);

create policy "Users can update own prompts" on public.prompts
    for update using (auth.uid() = user_id);

create policy "Users can delete own prompts" on public.prompts
    for delete using (auth.uid() = user_id);

-- Create a function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
EOL
      print_success "Initial migration created with basic schema!"
    fi
  else
    print_info "Migrations already exist. Skipping initial migration creation."
  fi
}

function create_seed_data() {
  print_step "Creating seed data..."
  
  if [ ! -f "supabase/seed.sql" ]; then
    cat > supabase/seed.sql << 'EOL'
-- Seed data for local development
-- This file is executed when running `supabase db reset`

-- Note: In local development, you can create test users through the Supabase Studio Auth panel
-- or by signing up through your application

-- Example: Insert some sample prompts (these will be associated with users when they exist)
-- You can uncomment and modify these after creating test users

/*
-- Example seed data (uncomment after creating test users)
insert into public.prompts (user_id, title, content, category, tags, is_public) values
(
    'your-test-user-uuid-here',
    'Welcome Prompt',
    'Welcome to Prompt Board! This is your first prompt.',
    'general',
    array['welcome', 'intro'],
    true
),
(
    'your-test-user-uuid-here',
    'Code Review Template',
    'Please review the following code for:\n1. Best practices\n2. Performance\n3. Security\n4. Readability',
    'development',
    array['code', 'review', 'template'],
    true
);
*/

-- You can add more seed data here as needed
-- Remember to use actual user UUIDs from your test accounts
EOL
    print_success "Seed data template created!"
  else
    print_info "supabase/seed.sql already exists. Skipping creation."
  fi
}

function add_npm_scripts() {
  print_step "Adding Supabase npm scripts..."
  
  if [ -f "package.json" ]; then
    # Check if supabase scripts already exist
    if ! grep -q "supabase:start" package.json; then
      # Create a temporary file with the updated package.json
      # This approach safely adds the scripts without breaking existing JSON
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add supabase scripts
        pkg.scripts['supabase:start'] = 'supabase start';
        pkg.scripts['supabase:stop'] = 'supabase stop';
        pkg.scripts['supabase:restart'] = 'supabase stop && supabase start';
        pkg.scripts['supabase:reset'] = 'supabase db reset';
        pkg.scripts['supabase:status'] = 'supabase status';
        pkg.scripts['supabase:studio'] = 'supabase studio';
        pkg.scripts['dev:local'] = 'npm run supabase:start && npm run dev';
        pkg.scripts['test:local'] = 'npm run supabase:start && npm run test';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      " 2>/dev/null || {
        print_warning "Could not automatically add npm scripts. Please add them manually:"
        cat << 'EOL'
Add these scripts to your package.json:
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop", 
    "supabase:restart": "supabase stop && supabase start",
    "supabase:reset": "supabase db reset",
    "supabase:status": "supabase status",
    "supabase:studio": "supabase studio",
    "dev:local": "npm run supabase:start && npm run dev",
    "test:local": "npm run supabase:start && npm run test"
  }
}
EOL
        return 1
      }
      print_success "Supabase npm scripts added!"
    else
      print_info "Supabase npm scripts already exist. Skipping addition."
    fi
  else
    print_warning "package.json not found. Cannot add npm scripts."
    return 1
  fi
}

function setup_testing_with_supabase() {
  print_step "Setting up testing with local Supabase..."
  
  # Create test setup file if it doesn't exist
  if [ ! -f "src/test/supabase-setup.ts" ]; then
    mkdir -p src/test
    
    cat > src/test/supabase-setup.ts << 'EOL'
import { createClient } from '@supabase/supabase-js'

// Test database configuration
export const supabaseUrl = 'http://localhost:54321'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
export const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create test client
export const supabaseTest = createClient(supabaseUrl, supabaseAnonKey)

// Create admin client for test setup/teardown
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Test helpers
export const createTestUser = async (email: string, password: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  
  if (error) throw error
  return data.user
}

export const deleteTestUser = async (userId: string) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}

export const cleanupTestData = async () => {
  // Clean up test data after tests
  await supabaseAdmin.from('prompts').delete().neq('id', '')
  await supabaseAdmin.from('profiles').delete().neq('id', '')
}
EOL
    print_success "Test setup file created!"
  fi

  # Update main test setup to include Supabase
  if [ -f "src/test/setup.ts" ]; then
    if ! grep -q "supabase-setup" src/test/setup.ts; then
      echo "" >> src/test/setup.ts
      echo "// Supabase test setup" >> src/test/setup.ts
      echo "import './supabase-setup'" >> src/test/setup.ts
      print_success "Updated test setup to include Supabase!"
    fi
  fi
}

function create_docker_test_setup() {
  print_step "Creating Docker test setup..."
  
  # Create a test-specific docker-compose file
  if [ ! -f "docker-compose.test.yml" ]; then
    cat > docker-compose.test.yml << 'EOL'
version: '3.8'

services:
  # Test application with local Supabase
  app-test:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=test
      - VITE_SUPABASE_URL=http://localhost:54321
      - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
    command: npm run test:ci
    depends_on:
      - supabase-start
    networks:
      - test-network

  # Helper service to ensure Supabase is started
  supabase-start:
    image: supabase/cli:latest
    volumes:
      - .:/app
      - /var/run/docker.sock:/var/run/docker.sock
    working_dir: /app
    command: supabase start
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
EOL
    print_success "Docker test setup created!"
  fi

  # Add test scripts to package.json
  if [ -f "package.json" ]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      pkg.scripts['test:docker'] = 'docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit';
      pkg.scripts['test:docker:clean'] = 'docker-compose -f docker-compose.test.yml down -v';
      
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    " 2>/dev/null || {
      print_warning "Could not add Docker test scripts automatically."
    }
  fi
}

function verify_supabase_setup() {
  print_step "Verifying Supabase setup..."
  
  # Check if CLI is installed
  if ! command -v supabase >/dev/null 2>&1; then
    print_error "Supabase CLI is not installed. Please install it first."
    return 1
  fi
  
  # Check if project is initialized
  if [ ! -d "supabase" ]; then
    print_error "Supabase project not initialized. Run 'supabase init' first."
    return 1
  fi
  
  # Check if Docker is running (required for local Supabase)
  if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop or the Docker daemon."
    return 1
  fi
  
  print_success "Supabase setup verification passed!"
  return 0
}

# Main function to set up local Supabase development
function setup_local_supabase() {
  print_info "Setting up local Supabase development and testing..."
  
  # Verify prerequisites
  if ! verify_supabase_setup; then
    print_error "Prerequisites not met. Please ensure Supabase CLI and Docker are installed and running."
    return 1
  fi
  
  # Initialize Supabase project
  initialize_supabase
  
  # Set up configuration
  setup_supabase_config
  
  # Create environment files
  create_supabase_env_files
  
  # Create initial migration
  create_initial_migration
  
  # Create seed data
  create_seed_data
  
  # Add npm scripts
  add_npm_scripts
  
  # Set up testing
  setup_testing_with_supabase
  
  # Create Docker test setup
  create_docker_test_setup
  
  print_success "Local Supabase development setup completed!"
  
  print_info "Next steps:"
  echo "1. Start local Supabase: ${blue}npm run supabase:start${reset}"
  echo "2. Access Supabase Studio: ${blue}http://localhost:54323${reset}"
  echo "3. Start development server: ${blue}npm run dev:local${reset}"
  echo "4. Run tests with local DB: ${blue}npm run test:local${reset}"
  echo ""
  echo "For Docker testing: ${blue}npm run test:docker${reset}"
  echo ""
  echo "Remember to update your .env files with actual API keys for production!"
}
