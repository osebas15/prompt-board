#!/bin/bash
# Prompt Board: Environment setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function create_env_example() {
  if skip_if_exists ".env.example" ".env.example"; then
    return 0
  fi
  
  print_step "Creating .env.example file..."
  cat > .env.example << EOL
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
EOL
  print_success ".env.example created successfully!"
}

function create_env_file() {
  if [ -f ".env" ]; then
    print_warning ".env file already exists. Please update it manually if needed."
    return 0
  fi
  
  read -p "Do you want to create a .env file now? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f ".env.example" ]; then
      cp ".env.example" ".env"
      print_success ".env file created from .env.example template."
      print_warning "Please edit .env file and add your actual API keys and URLs."
    else
      print_error ".env.example not found. Cannot create .env file."
      return 1
    fi
  else
    print_info "Skipping .env file creation. Remember to create it later!"
  fi
}

function check_gitignore() {
  if [ -f ".gitignore" ]; then
    # Check if any .env pattern already exists (*.env*, .env*, or .env)
    if ! grep -q "\.env" .gitignore; then
      print_step "Adding *.env* to .gitignore..."
      echo "*.env*" >> .gitignore
      print_success "*.env* added to .gitignore"
    else
      print_info "Environment files pattern is already in .gitignore"
    fi
  else
    print_warning ".gitignore not found. Please ensure *.env* is added to .gitignore manually."
  fi
}

# Main function to set up environment
function setup_environment() {
  print_info "Setting up environment configuration..."
  
  create_env_example
  check_gitignore
  create_env_file
  
  print_success "Environment setup completed!"
}
