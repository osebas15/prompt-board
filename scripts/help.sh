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
  --tools-only      Install only the required tools (Node.js, Docker, Git, GitHub CLI, Supabase CLI)
  --project-only    Set up only the project (Vite, Tailwind, Supabase client)
  --testing-only    Set up only testing configuration (Vitest, React Testing Library)
  --docker-only     Set up only Docker configuration
  --git-only        Set up only Git and GitHub
  --env-only        Set up only environment files
  --supabase-only   Set up only local Supabase development and testing
  --skip-tools      Skip tool installation
  --skip-project    Skip project setup
  --skip-testing    Skip testing setup
  --skip-docker     Skip Docker setup
  --skip-git        Skip Git setup
  --skip-env        Skip environment setup
  --skip-supabase   Skip local Supabase setup

${yellow}Examples:${reset}
  ./init.sh                    # Full setup (recommended for new projects)
  ./init.sh --tools-only       # Install tools only
  ./init.sh --testing-only     # Set up testing configuration only
  ./init.sh --supabase-only    # Set up local Supabase development only
  ./init.sh --skip-tools       # Skip tool installation, do everything else
  ./init.sh --skip-testing     # Skip testing setup
  ./init.sh --skip-supabase    # Skip local Supabase setup
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

function show_testing_commands() {
  cat <<EOM
${yellow}Testing Commands:${reset}
- Run all tests: ${green}npm run test${reset}
- Run tests in watch mode: ${green}npm run test:watch${reset}
- Run tests with coverage: ${green}npm run test:coverage${reset}
- Run tests with UI: ${green}npm run test:ui${reset}
- Generate coverage report: ${green}npm run test:coverage:html${reset}

EOM
}

function show_supabase_commands() {
  cat <<EOM
${yellow}Local Supabase Development:${reset}
# Start local Supabase stack
${green}npm run supabase:start${reset}

# Access Supabase Studio (local dashboard)
${green}open http://localhost:54323${reset}

# Start development with local Supabase
${green}npm run dev:local${reset}

# Run tests with local database
${green}npm run test:local${reset}

# Reset local database (apply migrations)
${green}npm run supabase:reset${reset}

# Stop local Supabase
${green}npm run supabase:stop${reset}

EOM
}

function show_final_instructions() {
  echo
  print_success "Setup completed successfully!"
  echo
  
  show_docker_commands
  show_development_commands
  show_testing_commands
  show_supabase_commands
  show_supabase_commands
  
  cat <<EOM
${yellow}Next Steps:${reset}
1. Start local Supabase: ${green}npm run supabase:start${reset}
2. Access Supabase Studio: ${green}open http://localhost:54323${reset}
3. Create your production Supabase project at ${blue}https://app.supabase.com/${reset}
4. Get your Google Gemini API key
5. Copy .env.example to .env.production and fill in your production values
6. Start developing locally: ${green}npm run dev:local${reset}
7. Run tests: ${green}npm run test:local${reset}

${yellow}For production deployment:${reset}
- Update .env.production with your live Supabase project URL and keys
- Deploy using Docker: ${green}npm run docker:prod${reset}

${yellow}Need help?${reset} Run ${green}./init.sh --help${reset}

EOM
}
