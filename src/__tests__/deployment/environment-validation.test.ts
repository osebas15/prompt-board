import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentValidator } from '../../lib/deployment/EnvironmentValidator';

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiJ9.test',
  VITE_GEMINI_API_KEY: 'AIzaSyDtest1234567890123456789',
};

describe('EnvironmentValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Environment Variables', () => {
    it('should validate all required environment variables are present', () => {
      // Act
      const validator = new EnvironmentValidator(mockEnv);
      const result = validator.validateRequiredVars();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.missingVars).toHaveLength(0);
    });

    it('should identify missing environment variables', () => {
      // Arrange
      const envWithMissing = {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        // Missing VITE_SUPABASE_ANON_KEY and VITE_GEMINI_API_KEY
      };

      // Act
      const validator = new EnvironmentValidator(envWithMissing);
      const result = validator.validateRequiredVars();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('VITE_SUPABASE_ANON_KEY');
      expect(result.missingVars).toContain('VITE_GEMINI_API_KEY');
    });

    it('should validate Supabase URL format', () => {
      // Arrange
      const envWithInvalidUrl = {
        ...mockEnv,
        VITE_SUPABASE_URL: 'invalid-url',
      };

      // Act
      const validator = new EnvironmentValidator(envWithInvalidUrl);
      const result = validator.validateSupabaseConfig();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Supabase URL format');
    });

    it('should validate API key formats', () => {
      // Arrange
      const envWithInvalidKeys = {
        ...mockEnv,
        VITE_SUPABASE_ANON_KEY: '', // Empty key
        VITE_GEMINI_API_KEY: 'short', // Too short
      };

      // Act
      const validator = new EnvironmentValidator(envWithInvalidKeys);
      const result = validator.validateAPIKeys();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid Supabase anon key');
      expect(result.errors).toContain('Invalid Gemini API key format');
    });
  });

  describe('Production Environment Checks', () => {
    it('should validate production-specific requirements', () => {
      // Arrange
      const prodEnv = {
        ...mockEnv,
        VITE_DEBUG: 'false',
        NODE_ENV: 'production',
      };

      // Act
      const validator = new EnvironmentValidator(prodEnv);
      const result = validator.validateProductionConfig();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1); // Sentry DSN not configured warning
    });

    it('should warn about debug mode in production', () => {
      // Arrange
      const prodEnvWithDebug = {
        ...mockEnv,
        VITE_DEBUG: 'true',
        NODE_ENV: 'production',
      };

      // Act
      const validator = new EnvironmentValidator(prodEnvWithDebug);
      const result = validator.validateProductionConfig();

      // Assert
      expect(result.warnings).toContain('Debug mode enabled in production');
    });

    it('should validate HTTPS URLs in production', () => {
      // Arrange
      const prodEnvWithHttp = {
        ...mockEnv,
        VITE_SUPABASE_URL: 'http://insecure.supabase.co',
        NODE_ENV: 'production',
      };

      // Act
      const validator = new EnvironmentValidator(prodEnvWithHttp);
      const result = validator.validateProductionConfig();

      // Assert
      expect(result.errors).toContain('Production Supabase URL must use HTTPS');
    });
  });

  describe('Complete Environment Validation', () => {
    it('should provide comprehensive validation report', () => {
      // Act
      const validator = new EnvironmentValidator(mockEnv);
      const result = validator.getValidationReport();

      // Assert
      expect(result).toHaveProperty('requiredVars');
      expect(result).toHaveProperty('supabaseConfig');
      expect(result).toHaveProperty('apiKeys');
      expect(result).toHaveProperty('productionConfig');
      expect(result).toHaveProperty('overallStatus');
      expect(result.timestamp).toBeDefined();
    });

    it('should return overall invalid status if any validation fails', () => {
      // Arrange
      const invalidEnv = {
        VITE_SUPABASE_URL: 'invalid-url',
      };

      // Act
      const validator = new EnvironmentValidator(invalidEnv);
      const result = validator.getValidationReport();

      // Assert
      expect(result.overallStatus).toBe('invalid');
    });
  });
});
