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
