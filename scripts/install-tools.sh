#!/bin/bash
# Prompt Board: Tool installation functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function install_node() {
  print_step "Installing Node.js (LTS) and npm..."
  
  if [[ "$(get_os)" == "macos" ]]; then
    # macOS
    if has_homebrew; then
      brew install node
    else
      print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  elif [[ "$(get_os)" == "linux" ]]; then
    # Linux
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    print_error "Unsupported operating system for automatic Node.js installation"
    exit 1
  fi
  
  print_success "Node.js and npm installed successfully!"
}

function install_yarn() {
  print_step "Installing Yarn..."
  npm install -g yarn
  print_success "Yarn installed successfully!"
}

function install_docker() {
  print_step "Installing Docker..."
  
  if [[ "$(get_os)" == "macos" ]]; then
    # macOS
    if has_homebrew; then
      print_step "Installing Docker Desktop via Homebrew..."
      brew install --cask docker
      print_warning "Docker Desktop installed. Please start Docker Desktop from Applications and restart this script."
      print_info "You can also install manually from https://www.docker.com/products/docker-desktop/"
      exit 1
    else
      print_warning "Please install Docker Desktop manually from https://www.docker.com/products/docker-desktop/ and restart this script."
      exit 1
    fi
  elif [[ "$(get_os)" == "linux" ]]; then
    # Linux
    print_step "Installing Docker on Linux..."
    
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install prerequisites
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully! Please log out and log back in for group changes to take effect."
  else
    print_error "Unsupported operating system for automatic Docker installation"
    exit 1
  fi
}

function verify_docker() {
  if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
      print_success "Docker is installed and running"
      return 0
    else
      print_warning "Docker is installed but not running. Please start Docker Desktop or the Docker daemon."
      return 1
    fi
  else
    print_error "Docker is NOT installed"
    return 1
  fi
}

function install_git() {
  print_step "Installing Git..."
  
  if [[ "$(get_os)" == "macos" ]]; then
    if has_homebrew; then
      brew install git
    else
      print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  elif [[ "$(get_os)" == "linux" ]]; then
    sudo apt-get update && sudo apt-get install -y git
  else
    print_error "Unsupported operating system for automatic Git installation"
    exit 1
  fi
  
  print_success "Git installed successfully!"
}

function install_gh() {
  print_step "Installing GitHub CLI (gh)..."
  
  if [[ "$(get_os)" == "macos" ]]; then
    if has_homebrew; then
      brew install gh
    else
      print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  elif [[ "$(get_os)" == "linux" ]]; then
    # Linux (Debian/Ubuntu)
    (type -p wget >/dev/null || (sudo apt-get update && sudo apt-get install -y wget)) &&
    sudo mkdir -p -m 755 /etc/apt/keyrings &&
    wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null &&
    sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg &&
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null &&
    sudo apt-get update &&
    sudo apt-get install -y gh
  else
    print_error "Unsupported operating system for automatic GitHub CLI installation"
    exit 1
  fi
  
  print_success "GitHub CLI installed successfully!"
}

function install_supabase_cli() {
  print_step "Installing Supabase CLI..."
  
  if [[ "$(get_os)" == "macos" ]]; then
    if has_homebrew; then
      brew install supabase/tap/supabase
    else
      print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  elif [[ "$(get_os)" == "linux" ]]; then
    # Linux installation
    print_step "Installing Supabase CLI for Linux..."
    # Download and install the binary
    curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
    sudo mv supabase /usr/local/bin/supabase
    sudo chmod +x /usr/local/bin/supabase
  else
    print_warning "Unsupported OS. Installing via npm as fallback..."
    npm install -g supabase
  fi
  
  print_success "Supabase CLI installed successfully!"
}

# Main function to install all tools
function install_all_tools() {
  print_info "Checking and installing required tools..."
  
  # 1. Node.js
  if ! check_command node; then
    install_node
  fi

  # 2. npm (should come with Node.js)
  if ! check_command npm; then
    print_error "npm not found. It should be installed with Node.js. Please check your Node.js installation."
    exit 1
  fi

  # 3. yarn
  if ! check_command yarn; then
    install_yarn
  fi

  # 4. Docker
  if ! verify_docker; then
    install_docker
    # After installation, verify again
    if ! verify_docker; then
      print_warning "Docker installation completed but Docker is not running. Please start Docker Desktop or the Docker daemon and restart this script."
      exit 1
    fi
  fi

  # 5. Git
  if ! check_command git; then
    install_git
  fi

  # 6. GitHub CLI
  if ! check_command gh; then
    install_gh
  fi

  # 7. Supabase CLI
  if ! check_command supabase; then
    install_supabase_cli
  fi

  print_success "All required tools are installed!"
}
