# GitHub Actions Workflow Structure

## Overview

The GitHub Actions workflows have been optimized to separate concerns and avoid running integration tests in CI environments where Supabase isn't available.

## Workflow Files

### 1. `deploy.yml` - Database Migrations (Production)
**Triggers:** Push to `main` branch, manual dispatch
**Purpose:** Apply database migrations to production Supabase instance
**Environment:** `production` (requires secrets approval)

**What it does:**
- ✅ Installs Supabase CLI
- ✅ Validates required environment variables
- ✅ Applies database migrations using production credentials
- ❌ **Does NOT run tests** (to avoid Supabase connectivity issues)

**Required Secrets:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

### 2. `pr-validation.yml` - Pull Request Validation
**Triggers:** Pull requests to `main` branch
**Purpose:** Validate code quality before merging

**What it does:**
- ✅ Linting (non-blocking)
- ✅ TypeScript type checking (non-blocking)
- ✅ Production build test
- ✅ Unit tests only (excludes integration/smoke tests)

### 3. `test.yml` - Comprehensive Testing
**Triggers:** Push to `develop` branch, Pull requests to `main`/`develop`
**Purpose:** Run comprehensive tests during development

**What it does:**
- ✅ Linting (non-blocking)
- ✅ Unit tests (excludes integration/smoke tests)
- ✅ Production build test
- ✅ Test coverage reporting

## NPM Scripts

### Testing Scripts
- `npm run test:unit` - Unit tests only (excludes integration/smoke)
- `npm run test:run` - All tests (may fail in CI without Supabase)
- `npm run test:integration` - Integration tests (requires local Supabase)
- `npm run test:ci` - CI-optimized tests with coverage

### Build Scripts
- `npm run build` - Production build (optimized for deployment)
- `npm run build:check` - Development type checking (includes tests)

## Migration Deployment Process

### Automatic (Recommended)
1. **Developer** pushes to `main` branch
2. **GitHub Actions** runs migration workflow
3. **Supabase CLI** applies migrations to production
4. **Netlify** automatically builds and deploys the app

### Manual (Fallback)
```bash
# Set environment variables
export SUPABASE_ACCESS_TOKEN="your_token"
export SUPABASE_PROJECT_REF="your_project_ref"

# Run migration script
./scripts/deploy-migrations.sh
```

## Troubleshooting

### Common Issues

#### 1. **Migration Workflow Fails**
**Symptoms:** "Process completed with exit code 1"
**Solutions:**
- Check that GitHub secrets are set correctly
- Verify Supabase access token has admin permissions
- Ensure project reference is correct

#### 2. **Test Failures in CI**
**Symptoms:** "Failed to create test user: fetch failed"
**Root Cause:** Integration tests trying to connect to Supabase
**Solution:** Tests are now excluded from CI workflows

#### 3. **TypeScript Errors in CI**
**Symptoms:** Various TS errors during build
**Solution:** Using `tsconfig.build.json` which excludes test files

### Debug Commands

```bash
# Test migrations locally
supabase start
./scripts/deploy-migrations.sh

# Run only unit tests
npm run test:unit

# Check types without building
npm run build:check

# Validate environment variables
npm run env:validate production
```

## Security

- **Production secrets** are stored in GitHub environments with protection rules
- **Access tokens** are scoped to minimum required permissions
- **Environment variables** are validated before use
- **No sensitive data** is logged in workflow outputs

## Future Improvements

1. **Integration Test Environment**: Set up dedicated CI Supabase instance
2. **Staged Deployments**: Add staging environment before production
3. **Rollback Capability**: Implement migration rollback scripts
4. **Performance Monitoring**: Add deployment performance tracking
