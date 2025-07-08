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
