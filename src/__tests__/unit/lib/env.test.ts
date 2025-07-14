import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock import.meta.env for testing
const mockImportMeta = {
  env: {
    MODE: 'development',
    DEV: true,
    PROD: false,
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    VITE_GEMINI_API_KEY: undefined as string | undefined,
    VITE_APP_NAME: undefined as string | undefined,
    VITE_APP_DESCRIPTION: undefined as string | undefined,
  } as any
};

// Mock console methods
const consoleSpy = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  table: vi.fn(),
};

vi.stubGlobal('console', consoleSpy);

// Mock import.meta globally
vi.stubGlobal('import', { meta: mockImportMeta });

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to get fresh import
    vi.resetModules();
    // Reset import.meta.env to default valid state
    mockImportMeta.env = {
      MODE: 'development',
      DEV: true,
      PROD: false,
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      VITE_GEMINI_API_KEY: undefined,
      VITE_APP_NAME: undefined,
      VITE_APP_DESCRIPTION: undefined,
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Valid Environment', () => {
    it('should validate localhost Supabase URL', async () => {
      // Import after setting up mocks
      const envModule = await import('@/lib/env');
      
      expect(envModule.env).toBeDefined();
      expect(envModule.VITE_SUPABASE_URL).toBe('http://localhost:54321');
      expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Environment Validation Starting...');
    });

    it('should validate production Supabase URL', async () => {
      mockImportMeta.env.VITE_SUPABASE_URL = 'https://abcd.supabase.co';
      
      const envModule = await import('@/lib/env');
      
      expect(envModule.env).toBeDefined();
      expect(envModule.VITE_SUPABASE_URL).toBe('https://abcd.supabase.co');
    });

    it('should handle optional Gemini API key', async () => {
      mockImportMeta.env.VITE_GEMINI_API_KEY = 'test-api-key';
      
      const envModule = await import('@/lib/env');
      
      expect(envModule.env).toBeDefined();
      expect(envModule.VITE_GEMINI_API_KEY).toBe('test-api-key');
    });

    it('should handle optional app metadata', async () => {
      mockImportMeta.env.VITE_APP_NAME = 'Prompt Board';
      mockImportMeta.env.VITE_APP_DESCRIPTION = 'A collaborative prompt management platform';
      
      const envModule = await import('@/lib/env');
      
      expect(envModule.env).toBeDefined();
      expect(envModule.VITE_APP_NAME).toBe('Prompt Board');
      expect(envModule.VITE_APP_DESCRIPTION).toBe('A collaborative prompt management platform');
    });
  });

  describe('Invalid Environment', () => {
    it('should throw error for missing Supabase URL', async () => {
      mockImportMeta.env.VITE_SUPABASE_URL = undefined;
      
      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow('Missing or invalid environment variables');
    });

    it('should throw error for invalid Supabase URL format', async () => {
      mockImportMeta.env.VITE_SUPABASE_URL = 'not-a-url';
      
      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow('Invalid Supabase URL');
    });

    it('should throw error for non-Supabase URL', async () => {
      mockImportMeta.env.VITE_SUPABASE_URL = 'https://google.com';
      
      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow('URL must be a valid Supabase URL or localhost');
    });

    it('should throw error for missing Supabase anonymous key', async () => {
      mockImportMeta.env.VITE_SUPABASE_ANON_KEY = undefined;
      
      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow('Supabase anonymous key is required');
    });

    it('should throw error for invalid Supabase key format', async () => {
      mockImportMeta.env.VITE_SUPABASE_ANON_KEY = 'invalid-key-format';
      
      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow('Invalid Supabase anonymous key format');
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', async () => {
      mockImportMeta.env.MODE = 'development';
      mockImportMeta.env.DEV = true;
      mockImportMeta.env.PROD = false;
      
      await import('@/lib/env');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite mode:', 'development');
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite dev mode:', true);
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite prod mode:', false);
    });

    it('should detect production environment', async () => {
      mockImportMeta.env.MODE = 'production';
      mockImportMeta.env.DEV = false;
      mockImportMeta.env.PROD = true;
      
      await import('@/lib/env');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite mode:', 'production');
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite dev mode:', false);
      expect(consoleSpy.log).toHaveBeenCalledWith('🏗️ Vite prod mode:', true);
    });
  });

  describe('Environment Export', () => {
    it('should export validated environment variables', async () => {
      const envModule = await import('@/lib/env');
      
      expect(envModule.VITE_SUPABASE_URL).toBe('http://localhost:54321');
      expect(envModule.VITE_SUPABASE_ANON_KEY).toContain('eyJ');
    });

    it('should provide undefined for optional variables when not set', async () => {
      const envModule = await import('@/lib/env');
      
      expect(envModule.VITE_GEMINI_API_KEY).toBeUndefined();
      expect(envModule.VITE_APP_NAME).toBeUndefined();
      expect(envModule.VITE_APP_DESCRIPTION).toBeUndefined();
    });
  });
});
