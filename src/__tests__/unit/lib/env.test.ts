import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

// Mock console methods
const consoleSpy = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  table: vi.fn(),
};

vi.stubGlobal('console', consoleSpy);

// Mock logger to prevent actual logging during tests
vi.mock('@/lib/debug/logger', () => ({
  logger: {
    infoOnce: vi.fn(),
    debug: vi.fn(),
    forceError: vi.fn(),
  },
  isDebugEnabled: vi.fn(() => false),
}));

// Re-create the validation schema from env.ts for testing
const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .refine(
      (url) => url.includes('supabase') || url.includes('localhost'),
      'URL must be a valid Supabase URL or localhost for development'
    ),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is required')
    .refine(
      (key) => key.startsWith('eyJ'),
      'Invalid Supabase anonymous key format (must be a JWT starting with "eyJ")'
    ),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_DESCRIPTION: z.string().optional(),
  VITE_DEBUG: z.string().optional(),
});

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set override flag to prevent global env setup
    (globalThis as any).__TEST_ENV_OVERRIDE__ = true;
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear override flag
    delete (globalThis as any).__TEST_ENV_OVERRIDE__;
  });

  describe('Schema Validation', () => {
    it('should validate valid localhost Supabase URL', () => {
      const validEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      const result = envSchema.parse(validEnv);
      expect(result.VITE_SUPABASE_URL).toBe('http://localhost:54321');
    });

    it('should validate production Supabase URL', () => {
      const validEnv = {
        VITE_SUPABASE_URL: 'https://abcd.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      const result = envSchema.parse(validEnv);
      expect(result.VITE_SUPABASE_URL).toBe('https://abcd.supabase.co');
    });

    it('should handle optional Gemini API key', () => {
      const validEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: 'test-api-key',
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      const result = envSchema.parse(validEnv);
      expect(result.VITE_GEMINI_API_KEY).toBe('test-api-key');
    });

    it('should handle optional app metadata', () => {
      const validEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: 'Prompt Board',
        VITE_APP_DESCRIPTION: 'A collaborative prompt management platform',
      };
      
      const result = envSchema.parse(validEnv);
      expect(result.VITE_APP_NAME).toBe('Prompt Board');
      expect(result.VITE_APP_DESCRIPTION).toBe('A collaborative prompt management platform');
    });

    it('should provide undefined for optional variables when not set', () => {
      const validEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      const result = envSchema.parse(validEnv);
      expect(result.VITE_GEMINI_API_KEY).toBeUndefined();
      expect(result.VITE_APP_NAME).toBeUndefined();
      expect(result.VITE_APP_DESCRIPTION).toBeUndefined();
    });
  });

  describe('Invalid Environment', () => {
    it('should throw error for missing Supabase URL', () => {
      const invalidEnv = {
        VITE_SUPABASE_URL: undefined,
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should throw error for invalid Supabase URL format', () => {
      const invalidEnv = {
        VITE_SUPABASE_URL: 'not-a-url',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      expect(() => envSchema.parse(invalidEnv)).toThrow('Invalid Supabase URL');
    });

    it('should throw error for non-Supabase URL', () => {
      const invalidEnv = {
        VITE_SUPABASE_URL: 'https://google.com',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      expect(() => envSchema.parse(invalidEnv)).toThrow('URL must be a valid Supabase URL or localhost');
    });

    it('should throw error for missing Supabase anonymous key', () => {
      const invalidEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: undefined,
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should throw error for invalid Supabase key format', () => {
      const invalidEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'invalid-key-format',
        VITE_GEMINI_API_KEY: undefined,
        VITE_APP_NAME: undefined,
        VITE_APP_DESCRIPTION: undefined,
      };
      
      expect(() => envSchema.parse(invalidEnv)).toThrow('Invalid Supabase anonymous key format');
    });
  });

  describe('Module Export', () => {
    it('should export environment variables from cached module', async () => {
      // Test that the module loads and exports are available
      const envModule = await import('@/lib/env');
      
      // Just check that the exports exist and have some values
      expect(envModule.VITE_SUPABASE_URL).toBeDefined();
      expect(envModule.VITE_SUPABASE_ANON_KEY).toBeDefined();
      expect(envModule.env).toBeDefined();
    });
  });
});
