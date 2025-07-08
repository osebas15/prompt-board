#!/bin/bash
# Prompt Board: Main initialization script
# This script orchestrates the setup of a new Prompt Board project.

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source all the utility and setup scripts
source "$SCRIPT_DIR/scripts/utils.sh"
source "$SCRIPT_DIR/scripts/help.sh"

# Default options
INSTALL_TOOLS=true
SETUP_PROJECT=true
SETUP_TESTING=true
SETUP_DOCKER=true
SETUP_GIT=true
SETUP_ENV=true
SETUP_SUPABASE=true
TOOLS_ONLY=false
PROJECT_ONLY=false
TESTING_ONLY=false
DOCKER_ONLY=false
GIT_ONLY=false
ENV_ONLY=false
SUPABASE_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    --tools-only)
      TOOLS_ONLY=true
      SETUP_PROJECT=false
      SETUP_TESTING=false
      SETUP_DOCKER=false
      SETUP_GIT=false
      SETUP_ENV=false
      SETUP_SUPABASE=false
      shift
      ;;
    --project-only)
      PROJECT_ONLY=true
      INSTALL_TOOLS=false
      SETUP_TESTING=false
      SETUP_DOCKER=false
      SETUP_GIT=false
      SETUP_ENV=false
      SETUP_SUPABASE=false
      shift
      ;;
    --testing-only)
      TESTING_ONLY=true
      INSTALL_TOOLS=false
      SETUP_PROJECT=false
      SETUP_DOCKER=false
      SETUP_GIT=false
      SETUP_ENV=false
      SETUP_SUPABASE=false
      shift
      ;;
    --docker-only)
      DOCKER_ONLY=true
      INSTALL_TOOLS=false
      SETUP_PROJECT=false
      SETUP_TESTING=false
      SETUP_GIT=false
      SETUP_ENV=false
      SETUP_SUPABASE=false
      shift
      ;;
    --git-only)
      GIT_ONLY=true
      INSTALL_TOOLS=false
      SETUP_PROJECT=false
      SETUP_TESTING=false
      SETUP_DOCKER=false
      SETUP_ENV=false
      SETUP_SUPABASE=false
      shift
      ;;
    --env-only)
      ENV_ONLY=true
      INSTALL_TOOLS=false
      SETUP_PROJECT=false
      SETUP_TESTING=false
      SETUP_DOCKER=false
      SETUP_GIT=false
      shift
      ;;
    --supabase-only)
      SUPABASE_ONLY=true
      INSTALL_TOOLS=false
      SETUP_PROJECT=false
      SETUP_TESTING=false
      SETUP_DOCKER=false
      SETUP_GIT=false
      SETUP_ENV=false
      shift
      ;;
    --skip-tools)
      INSTALL_TOOLS=false
      shift
      ;;
    --skip-project)
      SETUP_PROJECT=false
      shift
      ;;
    --skip-testing)
      SETUP_TESTING=false
      shift
      ;;
    --skip-docker)
      SETUP_DOCKER=false
      shift
      ;;
    --skip-git)
      SETUP_GIT=false
      shift
      ;;
    --skip-env)
      SETUP_ENV=false
      shift
      ;;
    --skip-supabase)
      SETUP_SUPABASE=false
      shift
      ;;
    *)
      print_error "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Main execution
echo -e "${blue}🚀 Prompt Board Setup Script${reset}"
echo -e "${blue}=============================${reset}"
echo

# Install tools
if [[ "$INSTALL_TOOLS" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/install-tools.sh"
  install_all_tools
  echo
fi

# Set up project
if [[ "$SETUP_PROJECT" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-project.sh"
  setup_project
  echo
fi

# Set up testing
if [[ "$SETUP_TESTING" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-testing.sh"
  setup_testing
  echo
fi

# Set up Docker
if [[ "$SETUP_DOCKER" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-docker.sh"
  setup_docker
  echo
fi

# Set up environment
if [[ "$SETUP_ENV" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-env.sh"
  setup_environment
  echo
fi

# Set up local Supabase development
if [[ "$SETUP_SUPABASE" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-supabase.sh"
  setup_local_supabase
  echo
fi

# Set up Git (do this last to include all files)
if [[ "$SETUP_GIT" == "true" ]]; then
  source "$SCRIPT_DIR/scripts/setup-git.sh"
  setup_git
  echo
fi

# Show final instructions
if [[ "$TOOLS_ONLY" == "false" && "$PROJECT_ONLY" == "false" && "$TESTING_ONLY" == "false" && "$DOCKER_ONLY" == "false" && "$GIT_ONLY" == "false" && "$ENV_ONLY" == "false" && "$SUPABASE_ONLY" == "false" ]]; then
  show_final_instructions
fi
