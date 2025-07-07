#!/bin/bash
# Prompt Board: Docker setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function create_dockerfile() {
  if skip_if_exists "Dockerfile" "Dockerfile"; then
    return 0
  fi
  
  print_step "Creating Dockerfile..."
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
  print_success "Dockerfile created successfully!"
}

function create_dockerfile_dev() {
  if skip_if_exists "Dockerfile.dev" "Dockerfile.dev"; then
    return 0
  fi
  
  print_step "Creating Dockerfile.dev for development..."
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
  print_success "Dockerfile.dev created successfully!"
}

function create_docker_compose() {
  if skip_if_exists "docker-compose.yml" "docker-compose.yml"; then
    return 0
  fi
  
  print_step "Creating docker-compose.yml..."
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
  print_success "docker-compose.yml created successfully!"
}

function create_dockerignore() {
  if skip_if_exists ".dockerignore" ".dockerignore"; then
    return 0
  fi
  
  print_step "Creating .dockerignore..."
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
scripts
EOL
  print_success ".dockerignore created successfully!"
}

# Main function to set up Docker files
function setup_docker() {
  print_info "Setting up Docker configuration..."
  
  create_dockerfile
  create_dockerfile_dev
  create_docker_compose
  create_dockerignore
  
  print_success "Docker setup completed!"
}
