/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files - using integration setup instead of regular setup
    setupFiles: ['./src/test/integration-setup.ts'],
    
    // Global test settings
    globals: true,
    
    // Test environment variables for local Supabase
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    },
    
    // Include only integration test files
    include: [
      '**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude other test files
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
      '.cache/',
    ],
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Longer timeout for integration tests
    testTimeout: 30000,
    
    // Pool options for integration tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run integration tests in sequence to avoid conflicts
      },
    },
    
    // Sequential execution for database tests
    sequence: {
      concurrent: false,
    },
  },
})
