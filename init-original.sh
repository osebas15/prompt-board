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
  echo -e "${yellow}Installing Docker...${reset}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew >/dev/null 2>&1; then
      echo -e "${yellow}Installing Docker Desktop via Homebrew...${reset}"
      brew install --cask docker
      echo -e "${yellow}Docker Desktop installed. Please start Docker Desktop from Applications and restart this script.${reset}"
      echo -e "${yellow}You can also install manually from https://www.docker.com/products/docker-desktop/${reset}"
      exit 1
    else
      echo -e "${yellow}Please install Docker Desktop manually from https://www.docker.com/products/docker-desktop/ and restart this script.${reset}"
      exit 1
    fi
  else
    # Linux
    echo -e "${yellow}Installing Docker on Linux...${reset}"
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
    
    echo -e "${green}Docker installed successfully! Please log out and log back in for group changes to take effect.${reset}"
  fi
}

function verify_docker() {
  if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
      echo -e "${green}✔ Docker is installed and running${reset}"
      return 0
    else
      echo -e "${yellow}⚠ Docker is installed but not running. Please start Docker Desktop or the Docker daemon.${reset}"
      return 1
    fi
  else
    echo -e "${red}✗ Docker is NOT installed${reset}"
    return 1
  fi
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
if ! verify_docker; then
  install_docker
  # After installation, verify again
  if ! verify_docker; then
    echo -e "${yellow}Docker installation completed but Docker is not running. Please start Docker Desktop or the Docker daemon and restart this script.${reset}"
    exit 1
  fi
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

# 6. Create Vite project if it doesn't exist
if [ -f "package.json" ]; then
  echo -e "${yellow}package.json found. Skipping Vite project creation.${reset}"
else
    echo -e "${yellow}Creating Vite project...${reset}"
    npm create vite@latest . -- --template react-ts
    echo -e "${green}Vite project created successfully!${reset}"
fi

# 7. Install dependencies and Tailwind CSS
if [ -f "tailwind.config.js" ]; then
    echo -e "${yellow}Tailwind CSS is already configured. Skipping installation.${reset}"
else
    echo -e "${yellow}Installing and configuring Tailwind CSS using @tailwindcss/vite...${reset}"

    # 1. Install Tailwind CSS and the Vite plugin
    echo -e "${yellow}Installing Tailwind CSS and @tailwindcss/vite...${reset}"
    npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer

    # 2. Add Tailwind directives to src/index.css
    echo -e "${yellow}Adding Tailwind directives to src/index.css...${reset}"
    echo -e "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n$(cat src/index.css)" > src/index.css

    echo -e "${green}Tailwind CSS dependencies installed!${reset}"
    echo -e "${yellow}Action required: Please add the Tailwind CSS plugin to your vite.config.ts file:${reset}"
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

    echo -e "${yellow}You can now run 'npm run dev' to start the server.${reset}"
    echo -e "${yellow}If you need to customize Tailwind, create a 'tailwind.config.js' file.${reset}"
fi


npm install @supabase/supabase-js

# Create Docker files if they don't exist
if [ -f "Dockerfile" ]; then
    echo -e "${yellow}Dockerfile already exists. Skipping creation.${reset}"
else
    echo -e "${yellow}Creating Dockerfile...${reset}"
    cat > Dockerfile << 'EOL'
# Use Node.js LTS Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
EOL
    echo -e "${green}Dockerfile created successfully!${reset}"
fi

if [ -f "docker-compose.yml" ]; then
    echo -e "${yellow}docker-compose.yml already exists. Skipping creation.${reset}"
else
    echo -e "${yellow}Creating docker-compose.yml...${reset}"
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add a development service
  app-dev:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    command: npm run dev -- --host 0.0.0.0
    profiles:
      - dev
EOL
    echo -e "${green}docker-compose.yml created successfully!${reset}"
fi

if [ -f "Dockerfile.dev" ]; then
    echo -e "${yellow}Dockerfile.dev already exists. Skipping creation.${reset}"
else
    echo -e "${yellow}Creating Dockerfile.dev for development...${reset}"
    cat > Dockerfile.dev << 'EOL'
# Use Node.js LTS Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOL
    echo -e "${green}Dockerfile.dev created successfully!${reset}"
fi

if [ -f ".dockerignore" ]; then
    echo -e "${yellow}.dockerignore already exists. Skipping creation.${reset}"
else
    echo -e "${yellow}Creating .dockerignore...${reset}"
    cat > .dockerignore << 'EOL'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
*.log
dist
coverage
.nyc_output
EOL
    echo -e "${green}.dockerignore created successfully!${reset}"
fi

# Add Docker scripts to package.json if they don't exist
if grep -q "docker:build" package.json; then
    echo -e "${yellow}Docker scripts already exist in package.json. Skipping addition.${reset}"
else
    echo -e "${yellow}Adding Docker scripts to package.json...${reset}"
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
    " 2>/dev/null || echo -e "${yellow}Note: Could not automatically add Docker scripts to package.json. Please add them manually.${reset}"
    echo -e "${green}Docker scripts added to package.json!${reset}"
fi

# Create .env.example if it doesn't exist
if [ -f ".env.example" ]; then
    echo -e "${yellow}.env.example already exists. Skipping creation.${reset}"
else
    echo -e "${yellow}Creating .env.example file...${reset}"
    cat > .env.example << EOL
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
EOL
    echo -e "${green}.env.example created successfully!${reset}"
fi

# 8. Initialize and Push to GitHub
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

# 9. Reminders for manual requirements
cat <<EOM

${yellow}Manual steps required:${reset}
- Create a Supabase account: https://app.supabase.com/
- Create a Netlify account: https://app.netlify.com/
- Obtain a Google Gemini API key: https://aistudio.google.com/app/apikey

${green}Once you have these, create a '.env' file by copying '.env.example' and fill in the values.${reset}

${yellow}Docker Usage:${reset}
- Build and run in production mode: ${green}npm run docker:prod${reset}
- Run in development mode: ${green}npm run docker:dev${reset}
- Stop all services: ${green}npm run docker:stop${reset}
- View logs: ${green}npm run docker:logs${reset}
- Build image only: ${green}npm run docker:build${reset}
- Run container directly: ${green}npm run docker:run${reset}

${yellow}Alternative Docker Commands:${reset}
- Build and run in production mode: ${green}docker-compose up --build${reset}
- Run in development mode: ${green}docker-compose --profile dev up${reset}
- Stop all services: ${green}docker-compose down${reset}
- View logs: ${green}docker-compose logs -f${reset}

${yellow}Local Development (without Docker):${reset}
- Install dependencies: ${green}npm install${reset}
- Start dev server: ${green}npm run dev${reset}
- Build for production: ${green}npm run build${reset}
- Preview production build: ${green}npm run preview${reset}

EOM
