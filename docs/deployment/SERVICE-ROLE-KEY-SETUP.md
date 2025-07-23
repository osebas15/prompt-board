# Service Role Key Setup Guide

## 🚀 **Quick Setup (Recommended Solution)**

Your deploy script is already configured to use the Service Role Key method (most reliable). You just need to add the secret:

### Step 1: Get Your Service Role Key
1. **Go to**: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api`
2. **Find the "Project API keys" section**
3. **Copy the `service_role` key** (NOT the `anon` key)
   - ✅ **Correct**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...` (very long)
   - ❌ **Wrong**: The short `anon` key

### Step 2: Add GitHub Secret
1. **Go to**: Your GitHub repository → Settings → Secrets and variables → Actions
2. **Click**: "New repository secret"
3. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
4. **Value**: Paste the long service role key

### Step 3: Re-run Deployment
- Push a commit or manually trigger the workflow
- The script will now use the service role method (most reliable)

## 🔍 **What This Fixes**

**Before (Access Token only):**
```
❌ All migration methods failed
ℹ️  1. The access token not having 'Database Admin' permissions
ℹ️  2. Interactive authentication being required
```

**After (Service Role Key):**
```
✅ Service role key detected - will use for direct database access
✅ Database connection established
✅ Applied 11 new migrations using service role
```

## 🔐 **Security Note**

The service role key has **full database access** and bypasses Row Level Security:
- ✅ **Perfect for migrations** (needs to create tables, policies, etc.)
- ⚠️ **Store securely** (GitHub Secrets are encrypted)
- 🔒 **Don't use in client-side code** (only for server/CI operations)

## 🛠 **Why This Works Better**

| Method | Reliability | Issues |
|--------|-------------|---------|
| **Service Role Key** | ✅ **High** | None - direct database access |
| Access Token + CLI | ❌ **Low** | Interactive prompts, auth issues |
| Management API | ⚠️ **Medium** | Network timeouts, API limits |

## 📋 **Final Setup Checklist**

- [ ] Service role key copied from Supabase Dashboard → Settings → API
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to GitHub Secrets
- [ ] Still keep `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` (needed for linking)
- [ ] PostgreSQL client will be installed automatically in GitHub Actions

Once you add the service role key, your migrations should deploy reliably! 🎉
