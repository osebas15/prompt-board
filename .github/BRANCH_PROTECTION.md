# Simple CI/CD Setup Guide

This document explains the simplified GitHub Actions setup for running tests on pull requests.

## What's Included

### 1. Main Test Workflow (`.github/workflows/test.yml`)
- **Triggers:** Push to main, Pull requests to main
- **Steps:** Lint → Test → Build
- Runs on Node.js 20.x
- No external services required

### 2. PR Check (`.github/workflows/pr-validation.yml`)
- **Triggers:** Pull requests to main
- **Steps:** Quick lint, test, and build verification
- Fast feedback for contributors

### 3. Security Check (`.github/workflows/security.yml`)
- **Triggers:** Changes to package.json/package-lock.json
- **Steps:** Basic npm audit
- Warns about security vulnerabilities

### 4. Deploy (`.github/workflows/deploy.yml`)
- **Triggers:** Push to main branch
- **Steps:** Test → Build → Deploy placeholder
- Ready for your deployment commands

## How It Works

### For Pull Requests:
1. Developer creates a PR to main
2. Both `CI Tests` and `PR Check` workflows run
3. If tests pass, PR is ready for manual review and merge
4. No automatic blocking - relies on team discipline

### For Main Branch:
1. After manual merge to main
2. `CI Tests` and `Deploy` workflows run
3. If tests pass, deployment can proceed

## Best Practices

Since we don't have branch protection rules, follow these practices:

### Before Creating a PR:
```bash
# Run locally first
npm run lint
npm run test:run
npm run build
```

### PR Review Process:
1. ✅ Check that GitHub Actions are green
2. ✅ Code review by team member
3. ✅ Manual merge after approval

### Emergency Fixes:
1. Create hotfix branch from main
2. Make minimal changes
3. Follow same PR process
4. Merge and deploy quickly

## Local Development

```bash
# Quick test everything
npm run lint && npm run test:run && npm run build

# Start development with Supabase
npm run dev:local

# Run tests with Supabase
npm run test:local
```

## GitHub Actions Status

Monitor your workflows at: `https://github.com/OWNER/REPO/actions`

- 🟢 Green = Tests passed, ready to merge
- 🔴 Red = Tests failed, needs fixes
- 🟡 Yellow = Tests running

## Troubleshooting

If workflows fail:

1. **Lint errors:** Run `npm run lint` locally
2. **Test failures:** Run `npm run test` locally  
3. **Build errors:** Run `npm run build` locally
4. **Supabase issues:** Use `./troubleshoot-supabase.sh`

## Future Improvements

When ready to add more protection:
- Enable GitHub branch protection rules
- Add required status checks
- Set up code review requirements
- Add deployment environments
