#!/bin/bash
# Prompt Board: Environment Requirements Checker and Installer
# This script checks for required tools and guides the user to install them if missing.

set -e

# Colors for output
green='\033[0;32m'
red='\033[0;31m'
yellow='\033[1;33m'
reset='\033[0m'

function check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    echo -e "${green}✔ $1 is installed${reset}"
    return 0
  else
    echo -e "${red}✗ $1 is NOT installed${reset}"
    return 1
  fi
}

function install_node() {
  echo -e "${yellow}Installing Node.js (LTS) and npm...${reset}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew >/dev/null 2>&1; then
      brew install node
    else
      echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  else
    # Linux
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
}

function install_yarn() {
  echo -e "${yellow}Installing Yarn...${reset}"
  npm install -g yarn
}

function install_docker() {
  echo -e "${yellow}Please install Docker manually from https://www.docker.com/products/docker-desktop/ and restart this script.${reset}"
}

function install_git() {
  echo -e "${yellow}Installing Git...${reset}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install git
    else
      echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  else
    sudo apt-get update && sudo apt-get install -y git
  fi
}

function install_gh() {
  echo -e "${yellow}Installing GitHub CLI (gh)...${reset}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install gh
    else
      echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
      exit 1
    fi
  else
    # Linux (Debian/Ubuntu)
    (type -p wget >/dev/null || (sudo apt-get update && sudo apt-get install -y wget)) &&
    sudo mkdir -p -m 755 /etc/apt/keyrings &&
    wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null &&
    sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg &&
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null &&
    sudo apt-get update &&
    sudo apt-get install -y gh
  fi
}

# 1. Node.js
if ! check_command node; then
  install_node
fi

# 2. npm or yarn
if ! check_command npm; then
  echo -e "${red}npm not found. It should be installed with Node.js. Please check your Node.js installation.${reset}"
  exit 1
fi
if ! check_command yarn; then
  install_yarn
fi

# 3. Docker
if ! check_command docker; then
  install_docker
fi

# 4. Git
if ! check_command git; then
  install_git
fi

# 5. GitHub CLI
if ! check_command gh; then
  install_gh
fi

echo -e "${green}All required tools are installed!${reset}"

# 6. Initialize and Push to GitHub
if [ -d ".git" ]; then
  echo -e "${yellow}Git repository already exists. Skipping initialization.${reset}"
else
  read -p "Do you want to initialize a new GitHub repository? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Initialize git
    git init -b main
    git add .
    git commit -m "Initial commit"

    # Authenticate with GitHub
    if ! gh auth status >/dev/null 2>&1; then
      echo -e "${yellow}Please log in to GitHub...${reset}"
      gh auth login
    fi

    # Create repo and push
    echo -e "${yellow}Creating GitHub repository...${reset}"
    gh repo create --source=. --public --push
    echo -e "${green}Successfully created and pushed to GitHub!${reset}"
  fi
fi


# 7. Reminders for manual requirements
cat <<EOM

${yellow}Manual steps required:${reset}
- Create a Supabase account: https://app.supabase.com/
- Create a Netlify account: https://app.netlify.com/
- Obtain a Google Gemini API key: https://aistudio.google.com/app/apikey

${green}Once you have these, add them to your .env file as described in the documentation.${reset}

EOM
