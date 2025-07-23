# Database Password Setup for CI/CD

Based on the latest 2025 Supabase CLI documentation, database migrations require **dual authentication**:

1. **Access Token** (`SUPABASE_ACCESS_TOKEN`) - for Management API operations
2. **Database Password** (`SUPABASE_DB_PASSWORD`) - for direct database operations

## Why Both Are Required

The Supabase CLI uses different authentication methods for different operations:

- **Management API Operations** (linking, project management): Access Token
- **Database Operations** (migrations, dumps, pulls): Database Password

This is confirmed in the official documentation:
- [`supabase link` docs](https://supabase.com/docs/reference/cli/supabase-link): "If you do not want to be prompted for the database password, such as in a CI environment, you may specify it explicitly via the `SUPABASE_DB_PASSWORD` environment variable."
- [`supabase db push` docs](https://supabase.com/docs/reference/cli/supabase-db-push): Shows `-p, --password <string>` flag for database operations

## How to Get Your Database Password

### Option 1: From Supabase Dashboard (Recommended)

1. Go to your project in the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **Database**
3. Look for **Database password** section
4. Copy the password (it should be the same password you set when creating the project)

### Option 2: Reset Database Password

If you don't remember your database password:

1. Go to **Settings** → **Database** in your Supabase Dashboard
2. Click **Reset database password**
3. Enter a new secure password
4. Click **Reset password**
5. Use this new password for `SUPABASE_DB_PASSWORD`

## Setting Up GitHub Secrets

Add the database password to your GitHub repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Under **Repository secrets**, click **New repository secret**
4. Name: `SUPABASE_DB_PASSWORD`
5. Value: Your database password from step above
6. Click **Add secret**

## Complete Secret Setup

Your production environment should have these three secrets:

```
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx    # Access token for API
SUPABASE_PROJECT_REF=xxxxxxxxxxxxxxxxxxxxxx   # Project reference
SUPABASE_DB_PASSWORD=your_database_password    # Database password
```

## Security Notes

- **Never commit passwords to code**: Always use GitHub secrets
- **Database password is highly sensitive**: It provides full database access
- **Use environment protection rules**: Require approval for production deployments
- **Rotate credentials regularly**: Update both access token and database password periodically

## Verification

After setting up both secrets, your workflow will:

1. ✅ Authenticate with Management API using access token
2. ✅ Link to project using access token  
3. ✅ Deploy migrations using database password
4. ✅ Complete without password prompts

## Troubleshooting

### "Enter your database password" prompt
- **Cause**: `SUPABASE_DB_PASSWORD` environment variable not set
- **Solution**: Add the secret to GitHub environment

### "Authentication failed" with access token
- **Cause**: Access token issue (separate from database password)
- **Solution**: Check `SUPABASE_ACCESS_TOKEN` format (should start with `sbp_`)

### "FATAL: password authentication failed"
- **Cause**: Incorrect database password
- **Solution**: Reset password in Supabase Dashboard and update GitHub secret

### "Permission denied" errors
- **Cause**: Database password doesn't have required permissions
- **Solution**: Use the main database password, not a limited user password

## Modern Best Practice (2025)

This dual authentication approach is the current best practice recommended by Supabase:

- ✅ **Access tokens** for Management API operations (secure, scoped permissions)
- ✅ **Database passwords** for direct database operations (required for migrations)
- ❌ **Service role keys** (deprecated for CI/CD, still JWT format eyJ...)

This ensures both security and functionality for automated deployments.
