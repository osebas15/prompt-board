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
