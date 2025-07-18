# GitHub Secrets Setup Guide

This guide explains how to set up the required GitHub secrets for your production deployment.

## Required Secrets

### 1. Supabase Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, then add:

#### `SUPABASE_ACCESS_TOKEN`
- **Where to get it**: Supabase Dashboard → Settings → Access Tokens
- **Description**: Personal access token for Supabase CLI operations
- **Usage**: Used for applying database migrations

#### `SUPABASE_PROJECT_REF`
- **Where to get it**: Your Supabase project URL: `https://YOUR_PROJECT_REF.supabase.co`
- **Example**: `abcdefghijklmnop`
- **Description**: Your Supabase project reference ID

### 2. Netlify Environment Variables

Set these in your Netlify dashboard → Site Settings → Environment Variables:

#### `VITE_SUPABASE_URL`
- **Where to get it**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Description**: Your Supabase project URL

#### `VITE_SUPABASE_ANON_KEY`
- **Where to get it**: Supabase Dashboard → Settings → API → Project API keys → anon/public
- **Description**: Public API key for client-side operations
- **Note**: This is safe to expose in client-side code

#### `VITE_GEMINI_API_KEY`
- **Where to get it**: Google AI Studio → API Keys
- **Description**: Google Gemini API key for AI features

## Setting Up GitHub Environment Protection

1. Go to your repository → Settings → Environments
2. Create a new environment named `production`
3. Add protection rules:
   - Required reviewers (recommended)
   - Restrict to main branch only
   - Add secrets to this environment

## Supabase Project Setup

### 1. Create Production Project
```bash
# If you don't have a production project yet
supabase projects create your-production-project
```

### 2. Get Project Details
```bash
# List your projects
supabase projects list

# Get project details
supabase projects api-keys --project-ref YOUR_PROJECT_REF
```

### 3. Apply Migrations Manually (First Time)
```bash
# Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Security Best Practices

1. **Never commit real secrets to git**
2. **Use environment-specific secrets**
3. **Rotate keys regularly**
4. **Monitor secret usage in GitHub Actions logs**
5. **Use least-privilege access tokens**

## Validation

After setting up secrets, you can test the deployment by:

1. Push to main branch
2. Check GitHub Actions workflow (migrations only)
3. Verify migrations are applied in Supabase Dashboard
4. Site will be deployed automatically by Netlify

## Troubleshooting

### Common Issues

1. **Migration fails**: Check that `SUPABASE_ACCESS_TOKEN` has admin permissions
2. **Build fails in Netlify**: Verify all `VITE_*` environment variables are set in Netlify dashboard
3. **Database connection fails**: Check Supabase project settings and environment variables

### Debugging

Enable debug logging in GitHub Actions by adding this secret:
- `ACTIONS_STEP_DEBUG`: `true`
