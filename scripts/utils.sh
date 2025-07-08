#!/bin/bash
# Prompt Board: Utility functions and common variables

# Colors for output
export green='\033[0;32m'
export red='\033[0;31m'
export yellow='\033[1;33m'
export blue='\033[0;34m'
export reset='\033[0m'

# Check if a command exists
function check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    echo -e "${green}✔ $1 is installed${reset}"
    return 0
  else
    echo -e "${red}✗ $1 is NOT installed${reset}"
    return 1
  fi
}

# Print colored status messages
function print_success() {
  echo -e "${green}✔ $1${reset}"
}

function print_error() {
  echo -e "${red}✗ $1${reset}"
}

function print_warning() {
  echo -e "${yellow}⚠ $1${reset}"
}

function print_info() {
  echo -e "${blue}ℹ $1${reset}"
}

function print_step() {
  echo -e "${yellow}$1${reset}"
}

function print_section() {
  echo -e "\n${blue}$1${reset}"
  echo -e "${blue}$(printf '=%.0s' {1..50})${reset}"
}

# Check if file exists and skip creation
function skip_if_exists() {
  local file_path="$1"
  local description="$2"
  
  if [ -f "$file_path" ]; then
    print_warning "$description already exists. Skipping creation."
    return 0
  else
    return 1
  fi
}

# Get OS type
function get_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macos"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "linux"
  else
    echo "unknown"
  fi
}

# Check if Homebrew is available (macOS only)
function has_homebrew() {
  if [[ "$(get_os)" == "macos" ]] && command -v brew >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
