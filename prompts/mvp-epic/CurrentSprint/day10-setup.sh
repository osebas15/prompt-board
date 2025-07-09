#!/bin/bash

# Day 10 Setup Script - Production Deployment & Documentation
# This script sets up tools and dependencies for production deployment tasks

set -e

echo "🚀 Day 10 Setup: Production Deployment & Documentation"
echo "======================================================"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the project root (assuming it's 3 levels up from CurrentSprint)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "📁 Navigating to project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Could not find package.json in project root"
    echo "   Expected location: $PROJECT_ROOT/package.json"
    exit 1
fi

echo "📦 Installing production deployment dependencies..."

# Production deployment tools
npm install --save-dev @vercel/cli
npm install --save-dev netlify-cli
npm install --save-dev lighthouse
npm install --save-dev bundlesize

# Documentation tools
npm install --save-dev @storybook/react
npm install --save-dev @storybook/addon-essentials
npm install --save-dev @storybook/addon-interactions
npm install --save-dev @storybook/testing-library
npm install --save-dev typedoc
npm install --save-dev jsdoc

# Performance monitoring
npm install @sentry/react @sentry/tracing
npm install web-vitals

# Production optimization
npm install --save-dev webpack-bundle-analyzer
npm install --save-dev @next/bundle-analyzer

echo "📁 Creating production deployment directories..."

# Create deployment configuration directories
mkdir -p deployment/
mkdir -p deployment/scripts/
mkdir -p deployment/docker/
mkdir -p deployment/kubernetes/

# Create documentation directories
mkdir -p docs/
mkdir -p docs/api/
mkdir -p docs/deployment/
mkdir -p docs/user-guide/

# Create Storybook configuration
mkdir -p .storybook/

echo "📄 Creating production configuration files..."

# Create Vercel configuration
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
EOF

# Create Netlify configuration
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
EOF

# Create Dockerfile
cat > deployment/docker/Dockerfile << 'EOF'
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
EOF

# Create Docker Compose
cat > deployment/docker/docker-compose.yml << 'EOF'
version: '3.8'
services:
  prompt-board:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
EOF

# Create deployment script
cat > deployment/scripts/deploy.sh << 'EOF'
#!/bin/bash

# Production deployment script

echo "🚀 Starting production deployment..."

# Run tests
echo "🧪 Running tests..."
npm run test:ci

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Build production bundle
echo "🏗️ Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level high

if [ $? -ne 0 ]; then
    echo "⚠️ Security vulnerabilities found. Please review before deploying."
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment completed successfully!"
EOF

chmod +x deployment/scripts/deploy.sh

# Create basic Storybook configuration
cat > .storybook/main.js << 'EOF'
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
};
EOF

# Create TypeDoc configuration
cat > typedoc.json << 'EOF'
{
  "entryPoints": ["src/"],
  "out": "docs/api/",
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "excludePrivate": true,
  "excludeProtected": true,
  "readme": "README.md"
}
EOF

# Create bundle size configuration
cat > .bundlesizerc << 'EOF'
[
  {
    "path": ".next/static/chunks/*.js",
    "maxSize": "250 kB"
  },
  {
    "path": ".next/static/css/*.css",
    "maxSize": "50 kB"
  }
]
EOF

# Create production environment template
cat > .env.production.example << 'EOF'
# Production Environment Variables
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_api_key

# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id

# Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-production-domain.com
EOF

# Create deployment checklist
cat > docs/deployment/checklist.md << 'EOF'
# Production Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CDN configured
- [ ] SSL certificates installed

## Deployment
- [ ] Build completed successfully
- [ ] Static assets uploaded
- [ ] Database backup created
- [ ] Health checks passing
- [ ] Monitoring configured

## Post-Deployment
- [ ] Smoke tests completed
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Analytics tracking verified
- [ ] User acceptance testing
- [ ] Documentation updated
EOF

# Update package.json scripts for production
echo "📝 Updating package.json scripts..."

# Create a temporary file for package.json updates
cat > temp_scripts.json << 'EOF'
{
  "build:analyze": "ANALYZE=true npm run build",
  "deploy": "deployment/scripts/deploy.sh",
  "deploy:vercel": "vercel --prod",
  "deploy:netlify": "netlify deploy --prod",
  "docs:build": "typedoc",
  "docs:serve": "npm run docs:build && http-server docs/api",
  "storybook": "start-storybook -p 6006",
  "build-storybook": "build-storybook",
  "lighthouse": "lighthouse http://localhost:3000 --output-path=./lighthouse-report.html",
  "bundle:analyze": "bundlesize",
  "test:ci": "npm run test -- --coverage --watchAll=false",
  "audit:security": "npm audit --audit-level high",
  "audit:deps": "npm outdated"
}
EOF

echo "✅ Day 10 setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure production environment variables in .env.production"
echo "2. Set up Vercel/Netlify accounts and configure deployment tokens"
echo "3. Configure Sentry for error monitoring"
echo "4. Set up Google Analytics and other tracking services"
echo "5. Review and customize deployment scripts in deployment/scripts/"
echo "6. Test deployment process in staging environment"
echo "7. Complete the deployment checklist in docs/deployment/checklist.md"
echo ""
echo "🚀 Production deployment tools are now ready!"
echo "Run 'npm run deploy' when ready to deploy to production"

# Cleanup
rm -f temp_scripts.json
