#!/bin/bash

# Day 2 Setup Script - User Authentication Implementation
# This script sets up additional dependencies for form handling and validation

set -e

echo "🔐 Day 2 Setup: User Authentication Implementation"
echo "================================================="

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

echo "📦 Installing form handling dependencies..."

# Install form and validation dependencies
npm install --save \
    react-hook-form \
    @hookform/resolvers \
    zod \
    react-hot-toast

echo "📦 Installing UI component dependencies..."

# Install UI dependencies for forms
npm install --save \
    @headlessui/react \
    lucide-react \
    clsx

echo "🧪 Installing additional testing utilities..."

# Install testing utilities for form testing
npm install --save-dev \
    @testing-library/user-event

echo "📁 Creating authentication feature structure..."

# Create auth feature directories
mkdir -p src/features/auth/{components,hooks,types,utils,pages,__tests__}

# Create auth component directories
mkdir -p src/features/auth/components/{forms,ui}

echo "📄 Creating auth type definitions..."

# Create auth types file
cat > src/features/auth/types/index.ts << 'EOF'
// Authentication types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}
EOF

echo "📄 Creating validation schemas..."

# Create validation schemas
cat > src/features/auth/utils/validationSchemas.ts << 'EOF'
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  full_name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
EOF

echo "✅ Day 2 setup complete!"
echo ""
echo "Files created:"
echo "- src/features/auth/types/index.ts"
echo "- src/features/auth/utils/validationSchemas.ts"
echo ""
echo "Next steps:"
echo "1. Implement authentication forms"
echo "2. Create useAuth hook"
echo "3. Set up authentication pages"
echo "4. Write comprehensive tests"
echo ""
echo "Ready for Day 2 development! 🚀"
