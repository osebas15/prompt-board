// Integration test setup file - doesn't mock Supabase
import '@testing-library/jest-dom'

// Global test configuration
import { afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Set environment for integration tests
process.env.NODE_ENV = 'test'

// Wait for Supabase to be ready before running tests
beforeAll(async () => {
  // Simple health check for local Supabase
  const supabaseUrl = 'http://localhost:54321';
  
  try {
    const response = await fetch(`${supabaseUrl}/health`);
    if (!response.ok) {
      console.warn('Supabase health check failed, but continuing with tests...');
    }
  } catch (error) {
    console.warn('Could not connect to Supabase health endpoint:', error);
    console.warn('Make sure Supabase is running locally with: npm run supabase:start');
  }
});

// Note: We don't mock Supabase here because these are integration tests
// that should connect to the actual local Supabase instance
