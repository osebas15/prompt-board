# Production Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Production Supabase project created
- [ ] Database migrations tested locally with `supabase db push`
- [ ] Row Level Security (RLS) policies configured
- [ ] API keys generated (anon key, service role key)
- [ ] Access token created for CLI operations

### 2. Environment Variables
- [ ] All required secrets added to GitHub repository
- [ ] Production environment created in GitHub with protection rules
- [ ] Environment variables validated using `npm run env:validate production`
- [ ] No sensitive data committed to git

### 3. Netlify Configuration
- [ ] Netlify site connected to GitHub repository
- [ ] Build settings configured (Node.js 22, `npm run build`, publish directory: `dist`)
- [ ] Environment variables set in Netlify dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` 
  - `VITE_GEMINI_API_KEY`
- [ ] Auto-deploy from GitHub enabled
- [ ] Custom domain configured (if applicable)

## GitHub Actions Secrets Required

Copy these to GitHub → Settings → Secrets and variables → Actions:

```
SUPABASE_ACCESS_TOKEN      # From Supabase Dashboard → Settings → Access Tokens
SUPABASE_PROJECT_REF       # Your project reference ID
```

## Netlify Environment Variables Required

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL         # https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY    # From Supabase Dashboard → Settings → API
VITE_GEMINI_API_KEY       # From Google AI Studio
```

## Deployment Process

### Automatic Deployment
1. [ ] Push to `main` branch
2. [ ] GitHub Actions applies database migrations automatically
3. [ ] Netlify detects the push and builds/deploys automatically
4. [ ] Application deployed with environment variables from Netlify

### Manual Operations (if needed)
```bash
# Apply migrations manually
npm run deploy:migrations

# Test build locally
npm run build
npm run preview
```

## Post-Deployment Verification

### 1. Application Health
- [ ] Site loads without errors
- [ ] Authentication works (if implemented)
- [ ] Database connections successful
- [ ] API integrations working

### 2. Security Checks
- [ ] Environment variables not exposed in client bundle
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] No sensitive data in logs

### 3. Performance
- [ ] Build size acceptable
- [ ] Page load times reasonable
- [ ] Core Web Vitals in good range

## Rollback Plan

### If Deployment Fails
1. [ ] Check GitHub Actions logs for migration errors
2. [ ] Check Netlify build logs for application errors
3. [ ] Verify all environment variables are set correctly
4. [ ] Test migrations locally
5. [ ] Revert to previous working commit if necessary

### Database Migration Rollback
```bash
# If you need to rollback migrations
supabase db reset --project-ref YOUR_PROJECT_REF
```

## Monitoring

### After Deployment
- [ ] Monitor application logs
- [ ] Watch for error reports
- [ ] Check database performance
- [ ] Monitor API quotas and usage

### Regular Maintenance
- [ ] Rotate API keys regularly
- [ ] Update dependencies
- [ ] Review security configurations
- [ ] Backup database

## Troubleshooting

### Common Issues
1. **Migration fails**: Check Supabase access token permissions
2. **Build fails**: Verify all VITE_ environment variables are set
3. **Site not loading**: Check Netlify build logs and redirect rules
4. **API errors**: Verify Supabase project settings and RLS policies

### Debug Commands
```bash
# Test environment
npm run env:validate production

# Test migrations locally
supabase start
supabase db push

# Test build locally
npm run build
npm run preview
```

## Emergency Contacts
- **Supabase Support**: https://supabase.com/support
- **Netlify Support**: https://www.netlify.com/support/
- **GitHub Support**: https://support.github.com/
