#!/bin/bash
# Prompt Board: Testing setup functions

# Source utilities
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

function install_testing_dependencies() {
  print_step "Installing testing dependencies..."
  
  # Core testing dependencies based on 2025 best practices
  local testing_deps=(
    # Core testing framework - Vitest is the gold standard for Vite projects
    "vitest"
    
    # React testing utilities
    "@testing-library/react"
    "@testing-library/dom"
    "@testing-library/jest-dom"
    "@testing-library/user-event"
    
    # DOM environment for testing
    "jsdom"
    
    # Vitest UI and coverage tools
    "@vitest/ui"
    "@vitest/coverage-v8"
    
    # TypeScript types for testing
    "@types/testing-library__jest-dom"
  )
  
  print_step "Installing testing dependencies: ${testing_deps[*]}"
  npm install -D "${testing_deps[@]}"
  
  print_success "Testing dependencies installed successfully!"
}

function create_vitest_config() {
  if skip_if_exists "vitest.config.ts" "Vitest configuration"; then
    return 0
  fi
  
  print_step "Creating Vitest configuration..."
  
  cat > vitest.config.ts <<'EOF'
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Global test settings
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    
    // Include test files
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude files
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
      '.cache/',
    ],
    
    // Reporter configuration
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Watch options
    watch: true,
    
    // UI configuration
    ui: true,
    open: false,
  },
})
EOF
  
  print_success "Vitest configuration created!"
}

function create_test_setup_file() {
  if skip_if_exists "src/test/setup.ts" "test setup file"; then
    return 0
  fi
  
  print_step "Creating test setup file..."
  
  # Create test directory
  mkdir -p src/test
  
  cat > src/test/setup.ts <<'EOF'
// Vitest test setup file
import '@testing-library/jest-dom'

// Global test configuration
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Custom matchers and global test utilities can be added here
// Example: Mock implementations, global test data, etc.

// Mock fetch for tests (if needed)
global.fetch = vi.fn()

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
EOF
  
  print_success "Test setup file created!"
}

function create_sample_tests() {
  print_step "Creating sample tests..."
  
  # Create __tests__ directory
  mkdir -p src/__tests__
  
  # Create a sample component test
  if [[ ! -f "src/__tests__/App.test.tsx" ]]; then
    cat > src/__tests__/App.test.tsx <<'EOF'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has correct title', () => {
    render(<App />)
    // Add more specific tests based on your App component
    expect(document.title).toBeTruthy()
  })
})
EOF
    print_success "Sample App test created!"
  fi
  
  # Create a utility function test
  if [[ ! -f "src/__tests__/utils.test.ts" ]]; then
    cat > src/__tests__/utils.test.ts <<'EOF'
import { describe, it, expect } from 'vitest'

// Example utility function to test
function add(a: number, b: number): number {
  return a + b
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

describe('Utility Functions', () => {
  describe('add function', () => {
    it('adds two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('adds negative numbers correctly', () => {
      expect(add(-1, -2)).toBe(-3)
    })

    it('adds zero correctly', () => {
      expect(add(5, 0)).toBe(5)
    })
  })

  describe('formatDate function', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-07-08T12:00:00Z')
      expect(formatDate(date)).toBe('2025-07-08')
    })
  })
})
EOF
    print_success "Sample utility test created!"
  fi

  # Create a test for a custom hook (example)
  if [[ ! -f "src/__tests__/hooks.test.ts" ]]; then
    cat > src/__tests__/hooks.test.ts <<'EOF'
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'

// Example custom hook
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = () => setCount(prev => prev + 1)
  const decrement = () => setCount(prev => prev - 1)
  const reset = () => setCount(initialValue)
  
  return { count, increment, decrement, reset }
}

describe('Custom Hooks', () => {
  describe('useCounter', () => {
    it('initializes with default value', () => {
      const { result } = renderHook(() => useCounter())
      expect(result.current.count).toBe(0)
    })

    it('initializes with custom value', () => {
      const { result } = renderHook(() => useCounter(10))
      expect(result.current.count).toBe(10)
    })

    it('increments count', () => {
      const { result } = renderHook(() => useCounter())
      
      act(() => {
        result.current.increment()
      })
      
      expect(result.current.count).toBe(1)
    })

    it('decrements count', () => {
      const { result } = renderHook(() => useCounter(5))
      
      act(() => {
        result.current.decrement()
      })
      
      expect(result.current.count).toBe(4)
    })

    it('resets count to initial value', () => {
      const { result } = renderHook(() => useCounter(10))
      
      act(() => {
        result.current.increment()
        result.current.increment()
      })
      
      expect(result.current.count).toBe(12)
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.count).toBe(10)
    })
  })
})
EOF
    print_success "Sample hook test created!"
  fi
}

function update_package_json_scripts() {
  print_step "Adding test scripts to package.json..."
  
  # Create a temporary file to update package.json
  local temp_file=$(mktemp)
  
  # Use Node.js to update package.json scripts
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add test scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['test'] = 'vitest';
    pkg.scripts['test:ui'] = 'vitest --ui';
    pkg.scripts['test:run'] = 'vitest run';
    pkg.scripts['test:coverage'] = 'vitest run --coverage';
    pkg.scripts['test:watch'] = 'vitest --watch';
    pkg.scripts['test:ci'] = 'vitest run --coverage --reporter=verbose';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  
  print_success "Test scripts added to package.json!"
}

function create_test_github_workflow() {
  if skip_if_exists ".github/workflows/test.yml" "GitHub test workflow"; then
    return 0
  fi
  
  print_step "Creating GitHub Actions test workflow..."
  
  # Create .github/workflows directory
  mkdir -p .github/workflows
  
  cat > .github/workflows/test.yml <<'EOF'
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm run test:ci
      
    - name: Upload coverage reports
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
EOF
  
  print_success "GitHub Actions test workflow created!"
}

function create_test_documentation() {
  if skip_if_exists "TESTING.md" "testing documentation"; then
    return 0
  fi
  
  print_step "Creating testing documentation..."
  
  cat > TESTING.md <<'EOF'
# Testing Guide

This project uses a modern testing stack optimized for React and Vite applications.

## Testing Stack

- **[Vitest](https://vitest.dev/)** - Next generation testing framework powered by Vite
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Testing utilities for React components
- **[jsdom](https://github.com/jsdom/jsdom)** - DOM implementation for testing
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Custom Jest matchers for DOM elements
- **[@testing-library/user-event](https://github.com/testing-library/user-event)** - Utilities for simulating user interactions

## Available Scripts

```bash
# Run tests in watch mode (development)
npm run test

# Run tests with UI interface
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (explicit)
npm run test:watch

# Run tests optimized for CI environments
npm run test:ci
```

## Test Structure

```
src/
├── __tests__/          # Test files
│   ├── App.test.tsx    # Component tests
│   ├── utils.test.ts   # Utility function tests
│   └── hooks.test.ts   # Custom hook tests
└── test/
    └── setup.ts        # Test configuration and setup
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../hooks/useMyHook'

describe('useMyHook', () => {
  it('returns expected values', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(0)
  })

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.value).toBe(1)
  })
})
```

### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myUtilFunction } from '../utils/myUtils'

describe('myUtilFunction', () => {
  it('returns correct result for valid input', () => {
    expect(myUtilFunction('test')).toBe('TEST')
  })

  it('throws error for invalid input', () => {
    expect(() => myUtilFunction(null)).toThrow()
  })
})
```

## Best Practices

### 1. Test Organization
- Keep tests close to the code they test
- Use descriptive test names that explain the behavior
- Group related tests using `describe` blocks
- Use `it` or `test` for individual test cases

### 2. Testing Patterns
- **Arrange**: Set up the test data and environment
- **Act**: Execute the function or interaction being tested
- **Assert**: Verify the expected outcome

### 3. Component Testing
- Test behavior, not implementation details
- Use semantic queries (getByRole, getByText) over test IDs when possible
- Test user interactions and state changes
- Mock external dependencies

### 4. Coverage Guidelines
- Aim for 80%+ code coverage
- Focus on critical business logic
- Don't obsess over 100% coverage
- Use coverage reports to find untested edge cases

## Configuration

### Vitest Configuration (`vitest.config.ts`)
- Environment: jsdom for DOM testing
- Setup files: Custom matchers and global configuration
- Coverage: v8 provider with HTML and JSON reports
- Thresholds: 80% coverage requirement

### Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON data for CI/CD

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI pipeline:
1. Installs dependencies
2. Runs linting
3. Runs test suite with coverage
4. Uploads coverage reports

## Tips

### Debugging Tests
- Use `test.only()` to run a single test
- Use `test.skip()` to temporarily skip tests
- Add `console.log` statements in tests for debugging
- Use the Vitest UI for visual debugging: `npm run test:ui`

### Mocking
```typescript
import { vi } from 'vitest'

// Mock functions
const mockFn = vi.fn()

// Mock modules
vi.mock('../api/client', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' }))
}))

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
```

### Testing Async Code
```typescript
import { waitFor } from '@testing-library/react'

it('handles async operations', async () => {
  render(<AsyncComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing JavaScript Applications](https://testingjavascript.com/)
EOF
  
  print_success "Testing documentation created!"
}

function setup_testing() {
  print_step "🧪 Setting up testing environment..."
  
  # Install testing dependencies
  install_testing_dependencies
  
  # Create configuration files
  create_vitest_config
  create_test_setup_file
  
  # Update package.json with test scripts
  update_package_json_scripts
  
  # Create sample tests
  create_sample_tests
  
  # Create CI/CD workflow
  create_test_github_workflow
  
  # Create documentation
  create_test_documentation
  
  print_success "Testing environment setup complete!"
  
  # Show final instructions
  cat <<EOM

${green}✅ Testing setup complete!${reset}

${yellow}Available commands:${reset}
  ${green}npm test${reset}              - Run tests in watch mode
  ${green}npm run test:ui${reset}       - Run tests with UI interface
  ${green}npm run test:coverage${reset} - Run tests with coverage report
  ${green}npm run test:run${reset}      - Run tests once (CI mode)

${yellow}Next steps:${reset}
1. Run ${green}npm test${reset} to start the test runner
2. Write tests for your components in ${blue}src/__tests__/${reset}
3. Check coverage with ${green}npm run test:coverage${reset}
4. Open test UI with ${green}npm run test:ui${reset}

${yellow}Files created:${reset}
- ${blue}vitest.config.ts${reset}      - Vitest configuration
- ${blue}src/test/setup.ts${reset}     - Test setup and global configuration  
- ${blue}src/__tests__/${reset}        - Sample test files
- ${blue}TESTING.md${reset}            - Testing guide and documentation
- ${blue}.github/workflows/test.yml${reset} - CI/CD test automation

${green}Happy testing! 🧪${reset}

EOM
}
