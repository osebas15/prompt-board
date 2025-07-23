# GitHub Secrets Troubleshooting Guide

## Quick Fix for "Invalid project ref format" Error

### 🔍 **Check Your Project Reference**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Look at the URL**: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. **Copy the PROJECT_REF** - it should be exactly **20 alphanumeric characters**

**Example:**
- ✅ **Correct**: `abcdefghijklmnopqrst` (20 characters)
- ❌ **Wrong**: `my-project-name` (contains hyphens, wrong length)
- ❌ **Wrong**: `https://supabase.com/dashboard/project/abcdefghijklmnopqrst` (full URL)

### 🔑 **Set GitHub Secrets**

1. **Go to your GitHub repository**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**

**Add these two secrets:**

#### Secret 1: `SUPABASE_PROJECT_REF`
- **Name**: `SUPABASE_PROJECT_REF`
- **Value**: Your 20-character project reference (e.g., `abcdefghijklmnopqrst`)

#### Secret 2: `SUPABASE_ACCESS_TOKEN`
- **Name**: `SUPABASE_ACCESS_TOKEN`
- **Value**: Your access token from Supabase Dashboard → Account → Access Tokens
- **⚠️ Important**: The token MUST have **"Database Admin"** permissions for migrations to work

#### 🔑 **Creating the Access Token**
1. Go to [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate new token"**
3. **Name**: `GitHub Actions Deploy` (or similar)
4. **Scopes**: Select **"Database Admin"** (required for migrations)
5. **Copy the token** immediately (it won't be shown again)
6. **Add to GitHub Secrets** as `SUPABASE_ACCESS_TOKEN`

### 🔒 **For Production Environment Protection**

If you're using environment protection rules:

1. **Go to**: Repository Settings → Environments → production
2. **Add the secrets there instead** (or in addition to repository secrets)
3. **Set up protection rules** as needed

### 🚨 **Common Mistakes**

| ❌ **Wrong** | ✅ **Correct** |
|-------------|---------------|
| `my-awesome-project` | `abcdefghijklmnopqrst` |
| `project-ref-with-hyphens` | `xyz123abc456def789gh` |
| `https://supabase.com/dashboard/project/abc123` | `abc123def456ghi789jk` |
| `"abcdefghijklmnopqrst"` (with quotes) | `abcdefghijklmnopqrst` (no quotes) |

### 📋 **Validation Checklist**

- [ ] Project ref is exactly 20 characters
- [ ] Project ref contains only letters and numbers (no special characters)
- [ ] Both secrets are set in GitHub (check the secrets page)
- [ ] If using environment protection, secrets are set in the environment
- [ ] No extra spaces or quotes in the secret values

### 🛠 **How to Find Your Project Reference**

#### Method 1: From Dashboard URL
1. Open your Supabase project dashboard
2. The URL will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
3. Copy the part after `/project/`

#### Method 2: From Project Settings
1. Go to **Settings** → **General** in your Supabase dashboard
2. Look for **Project reference** or **Reference ID**

#### Method 3: From Database URL
Your database URL contains the project ref:
`postgresql://postgres:[password]@db.[PROJECT_REF].supabase.co:5432/postgres`

### � **Common Deployment Errors**

#### Error: "failed SASL auth" Database Connection 
```
failed to connect to postgres: failed SASL auth (invalid SCRAM server-final-message received from server)
```

**Solutions:**
1. **Check Access Token Permissions**: Your token MUST have "Database Admin" scope
2. **Verify Token Format**: Make sure the token is copied correctly (no extra spaces/characters)
3. **Regenerate Token**: Sometimes tokens can become invalid - create a new one

#### Error: Interactive Password Prompts in CI
```
Enter your database password (or leave blank to skip):
```

**Cause**: The CLI is trying to authenticate interactively, which doesn't work in GitHub Actions.
**Solution**: The updated deploy script handles this automatically with multiple fallback methods.

### �🔧 **Testing Your Setup**

After setting the secrets, you can test by:

1. **Triggering the workflow manually** (if `workflow_dispatch` is enabled)
2. **Pushing a commit to main branch**
3. **Checking the workflow logs** for validation messages

### 📞 **Still Having Issues?**

If you're still seeing the error:

1. **Double-check the project ref length**: Should be exactly 20 characters
2. **Verify no extra characters**: No spaces, quotes, or special characters
3. **Check environment protection**: Make sure secrets are in the right place
4. **Try a fresh secret**: Delete and recreate the secret

The updated workflow will now show:
- ✅ Length of your project ref
- ❌ Clear error messages if secrets are missing
- 🔍 Better validation in the deploy script

Your project ref should look something like: `abcdefghijklmnopqrst` (exactly 20 alphanumeric characters).
