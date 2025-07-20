# Simplified Release Process

## Overview

The release process has been streamlined to focus on core functionality with minimal friction.

## ✅ What Happens on Release

### **Push to `main` branch:**
1. **Unit Tests** - Runs tests excluding integration/smoke tests
2. **Build** - Creates production-ready bundle
3. **Deploy** - Netlify automatically deploys if CI passes

### **No Longer Required:**
- ❌ Linting checks (ignored for now)
- ❌ Type checking (build handles this)
- ❌ Database migrations (manual when needed)
- ❌ Integration tests (local development only)

## 🚀 Deployment Workflow

```
Developer Push → GitHub Actions → Unit Tests → Build → Netlify Deploy
```

### **GitHub Actions**: `deploy.yml`
- Install dependencies
- Run unit tests (`npm run test:unit`)
- Build application (`npm run build`)
- ✅ **Success** = Netlify deploys automatically

### **Netlify**: 
- Watches `main` branch
- Uses environment variables from Netlify dashboard
- Deploys `dist/` folder automatically

## 📋 Quick Commands

```bash
# Local development
npm run dev

# Test before pushing (recommended)
npm run deploy:check

# Run only unit tests
npm run test:unit

# Build for production
npm run build
```

## 🔧 Manual Database Migrations (When Needed)

```bash
# Set up environment variables first
export SUPABASE_ACCESS_TOKEN="your_token"
export SUPABASE_PROJECT_REF="your_project_ref"

# Run migrations
./scripts/deploy-migrations.sh
```

## 🎯 Current Focus

**Priority**: Get working deployments with reliable unit tests
**Later**: Add back linting, type checking, and automated migrations

This simplified process ensures:
- ✅ Fast iterations
- ✅ Reliable deployments  
- ✅ Core functionality validation
- ✅ No CI bottlenecks
