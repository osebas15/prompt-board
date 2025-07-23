# Supabase CLI Installation Update

## Overview

As of July 2025, the Supabase CLI no longer supports global npm installation. Our GitHub Actions workflows have been updated to use the recommended binary installation method.

## What Changed

### ❌ **Old Method (No longer works)**
```bash
npm install -g supabase
```

**Error:** `Installing Supabase CLI as a global module is not supported.`

### ✅ **New Method (Recommended for CI/CD)**
```bash
# Primary method - Official installer
curl -fsSL https://supabase.com/install.sh | sh

# Alternative method - Direct GitHub release download
SUPABASE_VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
wget -O supabase-cli.tar.gz "https://github.com/supabase/cli/releases/download/${SUPABASE_VERSION}/supabase_linux_amd64.tar.gz"
tar -xzf supabase-cli.tar.gz
mkdir -p "$HOME/.local/bin"
mv supabase "$HOME/.local/bin/supabase"
chmod +x "$HOME/.local/bin/supabase"
```

## Updated Files

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- ✅ Updated to use binary installer with fallback method
- ✅ Added comprehensive error handling and debugging
- ✅ Includes PATH management for GitHub Actions environment

### 2. Deploy Script (`scripts/deploy-migrations.sh`)
- ✅ Updated error messages to reference new installation method
- ✅ Added version logging for debugging
- ✅ Better error handling for CLI detection

## Local Development

For local development, you can install the Supabase CLI using:

```bash
# Option 1: Official installer (recommended)
curl -fsSL https://supabase.com/install.sh | sh

# Option 2: Package managers
# macOS with Homebrew
brew install supabase/tap/supabase

# Windows with Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux with APT (Ubuntu/Debian)
# See: https://github.com/supabase/cli#install-the-cli
```

## Verification

After installation, verify the CLI is working:

```bash
# Check if CLI is accessible
which supabase

# Check version
supabase --version

# Test basic functionality
supabase --help
```

## Troubleshooting

### CLI Not Found After Installation
```bash
# Add to PATH manually if needed
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or for zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### GitHub Actions Issues
- The workflow includes fallback installation methods
- Check the "Verify Supabase CLI installation" step for detailed debugging
- Binary location is logged for troubleshooting

## References

- [Supabase CLI Installation Guide](https://github.com/supabase/cli#install-the-cli)
- [Official Installation Script](https://supabase.com/install.sh)
- [GitHub Releases](https://github.com/supabase/cli/releases)

## Migration Timeline

- **July 23, 2025**: Updated workflows to use binary installation
- **Previous**: Used `npm install -g supabase` (no longer supported)

This change ensures our deployment pipeline remains stable and uses the officially supported installation method.
