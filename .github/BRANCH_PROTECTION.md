# Branch Protection Setup Guide

This document explains how to set up branch protection rules in GitHub to ensure all tests pass before merging to main.

## Required Setup Steps

### 1. Configure Branch Protection Rules

Go to your GitHub repository settings and set up the following branch protection rules for the `main` branch:

#### Repository Settings → Branches → Add Rule

**Branch name pattern:** `main`

**Protect matching branches:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if you have a CODEOWNERS file)
  - ✅ Restrict pushes that create files that change the code owner

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `Lint Code`
    - `Run Tests (20.x)`
    - `Run Tests (22.x)`
    - `Build Application`
    - `Validate Pull Request`
    - `Test Matrix (18.x, unit)`
    - `Test Matrix (20.x, unit)`
    - `Test Matrix (22.x, unit)`
    - `Test Matrix (18.x, integration)`
    - `Test Matrix (20.x, integration)`
    - `Test Matrix (22.x, integration)`
    - `All Required Checks`

- ✅ Require conversation resolution before merging
- ✅ Require signed commits (optional, for enhanced security)
- ✅ Require linear history (prevents merge commits)
- ✅ Require deployments to succeed before merging (if using environments)

**Restrictions:**
- ✅ Restrict pushes that create files
- ✅ Do not allow bypassing the above settings
- ✅ Allow force pushes: Everyone (or restrict to admins only)
- ✅ Allow deletions: Nobody

### 2. Set Up Repository Secrets (if needed)

For deployment workflows, you may need to add secrets:

Go to **Settings → Secrets and variables → Actions**

Common secrets you might need:
- `CODECOV_TOKEN` - For code coverage reporting
- `SUPABASE_ACCESS_TOKEN` - For Supabase deployments
- `DEPLOYMENT_KEY` - For deployment access
- `SLACK_WEBHOOK` - For notifications

### 3. Set Up Environments (optional)

Go to **Settings → Environments** and create:

- **staging** - For staging deployments
- **production** - For production deployments
  - Add protection rules:
    - Required reviewers: 1-2 people
    - Wait timer: 5 minutes
    - Deployment branches: `main` only

### 4. Create CODEOWNERS File (optional)

Create `.github/CODEOWNERS` to define code ownership:

```
# Global owners
* @your-username

# Frontend specific
src/components/ @frontend-team
src/hooks/ @frontend-team

# Backend/API specific
src/api/ @backend-team
supabase/ @backend-team

# Configuration files
.github/ @devops-team
docker* @devops-team
package.json @senior-dev
```

## Workflow Overview

The GitHub Actions workflows will:

1. **On Pull Request Creation/Update:**
   - Run PR validation checks
   - Execute linting
   - Run comprehensive test matrix (unit + integration tests)
   - Check for security vulnerabilities
   - Validate commit messages
   - Check bundle size

2. **On Main Branch Push (after PR merge):**
   - Run final tests
   - Build for production
   - Deploy to staging/production
   - Send notifications

3. **Daily Security Checks:**
   - Audit dependencies for vulnerabilities
   - Check for license compliance
   - Create issues for outdated dependencies

## Testing Locally

Before pushing your changes, run these commands locally:

```bash
# Run all checks locally
npm run lint
npm run test:ci
npm run build

# Start Supabase and run integration tests
npm run supabase:start
npm run test:local
```

## Troubleshooting

If status checks fail:

1. **Lint failures:** Run `npm run lint` locally and fix issues
2. **Test failures:** Run `npm run test` locally to debug
3. **Build failures:** Run `npm run build` locally to identify issues
4. **Supabase issues:** Use the troubleshooting script: `./troubleshoot-supabase.sh`

## Emergency Bypass

In case of emergencies, repository admins can:
1. Temporarily disable branch protection
2. Merge critical fixes
3. Re-enable protection immediately after

**Note:** This should be used sparingly and documented.
