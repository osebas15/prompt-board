#!/bin/bash

# Security Monitoring Script for Deployment Tools
# Run this script regularly to monitor security status

set -e

echo "🔍 Security Monitoring Report"
echo "============================"
echo "Generated: $(date)"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📊 Dependency Overview"
echo "----------------------"
echo "Total dependencies: $(npm ls --depth=0 2>/dev/null | grep -c '├──\|└──' || echo 'Error counting')"
echo "Production deps: $(npm ls --depth=0 --omit=dev 2>/dev/null | grep -c '├──\|└──' || echo 'Error counting')"
echo "Development deps: $(npm ls --depth=0 --include=dev 2>/dev/null | grep -c '├──\|└──' || echo 'Error counting')"
echo ""

echo "🚨 Security Audit Results"
echo "-------------------------"
npm audit --audit-level moderate 2>/dev/null || {
    echo "⚠️  Vulnerabilities found. Details:"
    npm audit --audit-level high 2>/dev/null | head -20
    echo ""
    echo "📋 For full details, see: npm audit"
    echo "📋 For production-only audit: npm audit --only=prod"
}

echo ""
echo "📦 Outdated Dependencies"
echo "------------------------"
npm outdated 2>/dev/null | head -10 || echo "✅ All dependencies are up to date"

echo ""
echo "🔧 Deployment Tool Status"
echo "-------------------------"

# Check Vercel CLI
if command -v vercel >/dev/null 2>&1; then
    echo "✅ Vercel CLI: $(vercel --version)"
else
    echo "❌ Vercel CLI: Not installed"
fi

# Check Netlify CLI  
if command -v netlify >/dev/null 2>&1; then
    echo "✅ Netlify CLI: $(netlify --version)"
else
    echo "❌ Netlify CLI: Not installed"
fi

# Check Lighthouse
if command -v lighthouse >/dev/null 2>&1; then
    echo "✅ Lighthouse: $(lighthouse --version)"
else
    echo "❌ Lighthouse: Not installed"
fi

echo ""
echo "📋 Recommendations"
echo "------------------"
echo "• Run 'npm audit fix --only=prod' for production security fixes"
echo "• Review SECURITY-ASSESSMENT.md for detailed vulnerability analysis"
echo "• Consider updating devDependencies quarterly"
echo "• Monitor deployment tool release notes for security updates"

echo ""
echo "🔗 Useful Commands"
echo "------------------"
echo "• Full security audit: npm audit"
echo "• Production audit: npm audit --only=prod"
echo "• Fix production vulnerabilities: npm audit fix --only=prod"
echo "• Update outdated packages: npm update"
echo "• Bundle size analysis: npm run bundle:analyze"

echo ""
echo "✅ Security monitoring complete"
