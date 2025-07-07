#!/bin/bash
# Prompt Board: Git and GitHub setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function initialize_git_repo() {
  if [ -d ".git" ]; then
    print_warning "Git repository already exists. Skipping initialization."
    return 0
  fi
  
  print_step "Initializing Git repository..."
  git init -b main
  git add .
  git commit -m "Initial commit: Setup Vite + React + TS + Tailwind + Docker"
  print_success "Git repository initialized!"
}

function setup_github_repo() {
  if [ -d ".git" ]; then
    # Check if remote already exists
    if git remote get-url origin >/dev/null 2>&1; then
      print_warning "Git repository already has a remote origin. Skipping GitHub setup."
      return 0
    fi
  fi
  
  read -p "Do you want to create a new GitHub repository? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Authenticate with GitHub
    if ! gh auth status >/dev/null 2>&1; then
      print_step "Please log in to GitHub..."
      gh auth login
    fi

    # Create repo and push
    print_step "Creating GitHub repository..."
    gh repo create --source=. --public --push
    print_success "Successfully created and pushed to GitHub!"
  else
    print_info "Skipping GitHub repository creation."
  fi
}

# Main function to set up Git and GitHub
function setup_git() {
  print_info "Setting up Git and GitHub..."
  
  initialize_git_repo
  setup_github_repo
  
  print_success "Git setup completed!"
}
