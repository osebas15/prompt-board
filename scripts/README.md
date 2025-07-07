# Scripts Directory

This directory contains modular scripts for setting up the Prompt Board project.

## Scripts Overview

### Core Scripts

- **`utils.sh`** - Common utility functions, colors, and helper methods
- **`install-tools.sh`** - Installs required tools (Node.js, Docker, Git, GitHub CLI)
- **`setup-project.sh`** - Sets up the Vite project, Tailwind CSS, and Supabase
- **`setup-docker.sh`** - Creates Docker configuration files
- **`setup-git.sh`** - Initializes Git repository and GitHub integration
- **`setup-env.sh`** - Creates environment configuration files
- **`help.sh`** - Usage information and final instructions

### Usage

Each script can be run independently, but they're designed to be orchestrated by the main `init.sh` script:

```bash
# Full setup
./init.sh

# Tools only
./init.sh --tools-only

# Project setup only
./init.sh --project-only

# Docker setup only
./init.sh --docker-only

# Skip certain steps
./init.sh --skip-tools --skip-git
```

### Script Dependencies

- All scripts depend on `utils.sh` for common functions
- Scripts are designed to be idempotent (can be run multiple times safely)
- Each script checks for existing files/configurations before creating new ones

### Development

When modifying these scripts:

1. Keep utility functions in `utils.sh`
2. Make each script focused on a single responsibility
3. Use the common color and print functions from `utils.sh`
4. Test scripts individually before integrating
5. Ensure scripts are idempotent and handle edge cases gracefully

### Testing

To test individual scripts:

```bash
# Test tool installation
source scripts/install-tools.sh && install_all_tools

# Test project setup
source scripts/setup-project.sh && setup_project

# Test Docker setup
source scripts/setup-docker.sh && setup_docker
```
