#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * Validates that required environment variables are set for different environments
 */

const fs = require('fs');
const path = require('path');

// Define required environment variables for different environments
const REQUIRED_VARS = {
  development: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],
  production: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY',
    'SUPABASE_PROJECT_REF',
  ],
  ci: [
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_PROJECT_REF',
  ],
  netlify: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY',
  ]
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printColored(message, color) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment(envType = 'development') {
  printColored(`🔍 Validating ${envType} environment variables...`, 'blue');
  
  const requiredVars = REQUIRED_VARS[envType];
  if (!requiredVars) {
    printColored(`❌ Unknown environment type: ${envType}`, 'red');
    process.exit(1);
  }

  const missingVars = [];
  const presentVars = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });

  // Print results
  if (presentVars.length > 0) {
    printColored(`✅ Present variables (${presentVars.length}):`, 'green');
    presentVars.forEach(varName => {
      const value = process.env[varName];
      const maskedValue = value.length > 10 
        ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`   ${varName}: ${maskedValue}`);
    });
  }

  if (missingVars.length > 0) {
    printColored(`❌ Missing variables (${missingVars.length}):`, 'red');
    missingVars.forEach(varName => {
      console.log(`   ${varName}`);
    });
    
    printColored('\n📖 Setup instructions:', 'yellow');
    console.log('   1. Copy .env.template to .env.local');
    console.log('   2. Fill in the required values');
    console.log('   3. For production, set these in your CI/CD environment');
    
    process.exit(1);
  }

  printColored(`🎉 All ${envType} environment variables are present!`, 'green');
}

function checkEnvFiles() {
  const envFiles = ['.env.local', '.env.production', '.env.template'];
  
  printColored('\n📁 Environment files status:', 'blue');
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
  });
}

// Main execution
const envType = process.argv[2] || process.env.NODE_ENV || 'development';

console.log('🔧 Prompt Board Environment Validator\n');

checkEnvFiles();
validateEnvironment(envType);

console.log('\n🚀 Environment validation complete!');
