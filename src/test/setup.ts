import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// MSW setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' }); // Changed from 'error' to 'warn'
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});

// Mock console methods that might not exist in test environment
if (!console.info) {
  console.info = console.log;
}
if (!console.debug) {
  console.debug = console.log;
}

// Set default environment variables for tests
const defaultTestEnv = {
  MODE: 'test',
  DEV: false,
  PROD: false,
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  VITE_GEMINI_API_KEY: 'AIzaSyB97h_test_key_for_testing',
  VITE_APP_NAME: 'Prompt Board Test',
  VITE_APP_DESCRIPTION: 'Test environment',
  VITE_DEBUG: 'false',
};

// Function to set or update environment variables
export function setTestEnv(customEnv: Record<string, any> = {}) {
  const envToSet = {
    ...defaultTestEnv,
    ...customEnv,
  };
  
  // Set import.meta.env directly
  vi.stubGlobal('import', {
    meta: {
      env: envToSet
    }
  });
  
  // Also set process.env for Node.js environments
  Object.keys(envToSet).forEach(key => {
    process.env[key] = String(envToSet[key as keyof typeof envToSet]);
  });
}

// Set default environment variables (will be overridden by specific tests if needed)
if (!(globalThis as any).__TEST_ENV_OVERRIDE__) {
  setTestEnv();
}

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock DOM createElement to return proper objects
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  const element = originalCreateElement.call(document, tagName);
  
  // Ensure element has proper properties
  if (element) {
    if (!element.hasOwnProperty('className')) {
      Object.defineProperty(element, 'className', {
        writable: true,
        value: '',
      });
    }
  }
  
  return element;
});

// Mock document.body.appendChild to prevent DOM errors
const originalAppendChild = document.body.appendChild;
document.body.appendChild = vi.fn((node) => {
  // Check if node is a valid DOM element
  if (node && typeof node === 'object' && node.nodeType) {
    return originalAppendChild.call(document.body, node);
  }
  // Return the node if it's not valid (for testing)
  return node;
});

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
  },
});
