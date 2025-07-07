#!/bin/bash
# Prompt Board: Project setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function create_vite_project() {
  if skip_if_exists "package.json" "package.json"; then
    return 0
  fi
  
  print_step "Creating Vite project..."
  npm create vite@latest . -- --template react-ts
  print_success "Vite project created successfully!"
}

function setup_tailwind() {
  if skip_if_exists "tailwind.config.js" "Tailwind CSS configuration"; then
    return 0
  fi
  
  print_step "Installing and configuring Tailwind CSS using @tailwindcss/vite..."

  # Install Tailwind CSS and the Vite plugin
  print_step "Installing Tailwind CSS and @tailwindcss/vite..."
  npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer

  # Add Tailwind directives to src/index.css
  if [ -f "src/index.css" ]; then
    print_step "Adding Tailwind directives to src/index.css..."
    echo -e "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n$(cat src/index.css)" > src/index.css
  fi

  print_success "Tailwind CSS dependencies installed!"
  print_warning "Action required: Please add the Tailwind CSS plugin to your vite.config.ts file:"
  
  cat <<EOM

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // Make sure this import is added
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // And add the plugin here
  ],
})

EOM

  print_info "You can now run 'npm run dev' to start the server."
  print_info "If you need to customize Tailwind, create a 'tailwind.config.js' file."
}

function install_supabase() {
  print_step "Installing Supabase client..."
  npm install @supabase/supabase-js
  print_success "Supabase client installed!"
}

function add_docker_scripts_to_package_json() {
  if grep -q "docker:build" package.json 2>/dev/null; then
    print_warning "Docker scripts already exist in package.json. Skipping addition."
    return 0
  fi
  
  if [ ! -f "package.json" ]; then
    print_warning "package.json not found. Skipping Docker scripts addition."
    return 1
  fi
  
  print_step "Adding Docker scripts to package.json..."
  
  # Create a temporary file with the updated package.json
  node -e "
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.scripts = {
    ...packageJson.scripts,
    'docker:build': 'docker build -t prompt-board .',
    'docker:run': 'docker run -p 3000:3000 --env-file .env prompt-board',
    'docker:dev': 'docker-compose --profile dev up',
    'docker:prod': 'docker-compose up --build',
    'docker:stop': 'docker-compose down',
    'docker:logs': 'docker-compose logs -f'
  };
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  " 2>/dev/null || {
    print_warning "Could not automatically add Docker scripts to package.json. Please add them manually."
    return 1
  }
  
  print_success "Docker scripts added to package.json!"
  return 0
}

# Main function to set up the project
function setup_project() {
  print_info "Setting up the project..."
  
  create_vite_project
  setup_tailwind
  install_supabase
  add_docker_scripts_to_package_json
  
  print_success "Project setup completed!"
}
