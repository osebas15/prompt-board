#!/bin/bash
# Prompt Board: Help and usage information

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function show_usage() {
  cat <<EOM
${blue}Prompt Board Setup Script${reset}

${yellow}Usage:${reset}
  ./init.sh [options]

${yellow}Options:${reset}
  -h, --help        Show this help message
  --tools-only      Install only the required tools (Node.js, Docker, Git, GitHub CLI)
  --project-only    Set up only the project (Vite, Tailwind, Supabase)
  --docker-only     Set up only Docker configuration
  --git-only        Set up only Git and GitHub
  --env-only        Set up only environment files
  --skip-tools      Skip tool installation
  --skip-project    Skip project setup
  --skip-docker     Skip Docker setup
  --skip-git        Skip Git setup
  --skip-env        Skip environment setup

${yellow}Examples:${reset}
  ./init.sh                    # Full setup (recommended for new projects)
  ./init.sh --tools-only       # Install tools only
  ./init.sh --skip-tools       # Skip tool installation, do everything else
  ./init.sh --docker-only      # Create Docker files only

${yellow}Manual steps required after setup:${reset}
- Create a Supabase account: ${blue}https://app.supabase.com/${reset}
- Create a Netlify account: ${blue}https://app.netlify.com/${reset}
- Obtain a Google Gemini API key: ${blue}https://aistudio.google.com/app/apikey${reset}

${green}Once you have these, create a '.env' file by copying '.env.example' and fill in the values.${reset}

EOM
}

function show_docker_commands() {
  cat <<EOM
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

EOM
}

function show_development_commands() {
  cat <<EOM
${yellow}Local Development (without Docker):${reset}
- Install dependencies: ${green}npm install${reset}
- Start dev server: ${green}npm run dev${reset}
- Build for production: ${green}npm run build${reset}
- Preview production build: ${green}npm run preview${reset}

EOM
}

function show_final_instructions() {
  echo
  print_success "Setup completed successfully!"
  echo
  
  show_docker_commands
  show_development_commands
  
  cat <<EOM
${yellow}Next Steps:${reset}
1. Create your Supabase project and get your API keys
2. Create your Netlify account for deployment
3. Get your Google Gemini API key
4. Copy .env.example to .env and fill in your actual values
5. Start developing: ${green}npm run dev${reset}

${yellow}Need help?${reset} Run ${green}./init.sh --help${reset}

EOM
}
