#!/bin/bash

# Day 4 Setup Script - Prompt Template CRUD Operations
# This script sets up UI components and rich text editing dependencies

set -e

echo "📝 Day 4 Setup: Prompt Template CRUD Operations"
echo "==============================================="

echo "📦 Installing UI and rich text editing dependencies..."

# Install rich text editing and UI components
npm install --save \
    @headlessui/react \
    @tanstack/react-virtual \
    react-use \
    use-debounce \
    fuse.js \
    clsx

echo "📦 Installing icon and utility libraries..."

# Install icon library and utilities
npm install --save \
    lucide-react \
    date-fns \
    lodash

echo "📦 Installing development and testing utilities..."

# Install additional testing utilities
npm install --save-dev \
    @testing-library/user-event \
    @vitest/ui

echo "📁 Creating component structure..."

# Create comprehensive component structure
mkdir -p src/features/prompts/components/{PromptList,PromptEditor,PromptDetail}
mkdir -p src/components/ui/{Button,Input,Modal,Dropdown,Card,Badge}
mkdir -p src/hooks
mkdir -p src/utils

echo "📄 Creating UI component foundations..."

# Create Button component
cat > src/components/ui/Button/Button.tsx << 'EOF'
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
EOF

# Create Input component
cat > src/components/ui/Input/Input.tsx << 'EOF'
import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
EOF

# Create utility functions
cat > src/utils/promptUtils.ts << 'EOF'
// Utility functions for prompt operations
export interface PromptVariable {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export function extractVariables(content: string): PromptVariable[] {
  const variableRegex = /\{\{(\w+)(?:\|([^}]+))?\}\}/g;
  const variables: PromptVariable[] = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    const [, name, defaultValue] = match;
    if (!seen.has(name)) {
      variables.push({
        name,
        defaultValue: defaultValue?.trim(),
        required: !defaultValue,
      });
      seen.add(name);
    }
  }
  
  return variables;
}

export function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)(?:\|([^}]+))?\}\}/g, (match, name, defaultValue) => {
    return variables[name] ?? defaultValue ?? match;
  });
}

export function validatePromptContent(content: string): string[] {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Prompt content cannot be empty');
  }
  
  if (content.length > 10000) {
    errors.push('Prompt content cannot exceed 10,000 characters');
  }
  
  // Check for unclosed variable brackets
  const openBrackets = (content.match(/\{\{/g) || []).length;
  const closeBrackets = (content.match(/\}\}/g) || []).length;
  
  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched variable brackets detected');
  }
  
  return errors;
}
EOF

# Create search utilities
cat > src/utils/searchUtils.ts << 'EOF'
import Fuse from 'fuse.js';
import type { Prompt } from '../features/prompts/types';

export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  shouldSort?: boolean;
}

export function createPromptSearcher(prompts: Prompt[], options: SearchOptions = {}) {
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'content', weight: 1 },
      { name: 'tags', weight: 1.5 },
      { name: 'category.name', weight: 1.2 },
    ],
    threshold: options.threshold ?? 0.3,
    includeScore: options.includeScore ?? false,
    shouldSort: options.shouldSort ?? true,
  };

  return new Fuse(prompts, fuseOptions);
}

export function searchPrompts(
  searcher: Fuse<Prompt>,
  query: string
): Prompt[] {
  if (!query.trim()) {
    return searcher.getIndex().docs as Prompt[];
  }

  const results = searcher.search(query);
  return results.map(result => result.item);
}
EOF

echo "📄 Creating component index files..."

# Create component index files
cat > src/components/ui/index.ts << 'EOF'
export { Button } from './Button/Button';
export { Input } from './Input/Input';
EOF

cat > src/features/prompts/components/index.ts << 'EOF'
// Component exports will be added as components are created
EOF

echo "✅ Day 4 setup complete!"
echo ""
echo "Files created:"
echo "- src/components/ui/Button/Button.tsx"
echo "- src/components/ui/Input/Input.tsx"
echo "- src/utils/promptUtils.ts"
echo "- src/utils/searchUtils.ts"
echo ""
echo "Next steps:"
echo "1. Implement PromptList component"
echo "2. Create PromptEditor with rich text"
echo "3. Build PromptDetail view"
echo "4. Add search and filtering"
echo ""
echo "Ready for Day 4 development! 🚀"
