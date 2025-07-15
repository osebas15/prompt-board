export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingVars?: string[];
}

export interface ValidationReport {
  requiredVars: ValidationResult;
  supabaseConfig: ValidationResult;
  apiKeys: ValidationResult;
  productionConfig: ValidationResult;
  overallStatus: 'valid' | 'warnings' | 'invalid';
  timestamp: string;
}

export class EnvironmentValidator {
  private readonly requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY'
  ];

  private readonly optionalVars = [
    'VITE_DEBUG',
    'VITE_SENTRY_DSN',
    'NODE_ENV'
  ];

  // Allow injection of environment variables for testing
  private env: Record<string, string>;

  constructor(env?: Record<string, string>) {
    this.env = env || import.meta.env;
  }

  /**
   * Validate that all required environment variables are present
   */
  validateRequiredVars(): ValidationResult {
    const missingVars: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const varName of this.requiredVars) {
      const value = this.env[varName];
      if (!value || value.trim() === '') {
        missingVars.push(varName);
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Check for empty optional vars that might indicate configuration issues
    for (const varName of this.optionalVars) {
      const value = this.env[varName];
      if (value === '') { // Explicitly empty (not undefined)
        warnings.push(`Optional environment variable ${varName} is explicitly empty`);
      }
    }

    return {
      isValid: missingVars.length === 0,
      errors,
      warnings,
      missingVars
    };
  }

  /**
   * Validate Supabase configuration format and accessibility
   */
  validateSupabaseConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const supabaseUrl = this.env.VITE_SUPABASE_URL;
    const supabaseKey = this.env.VITE_SUPABASE_ANON_KEY;

    // Validate URL format
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        
        // Check if it's a valid Supabase URL pattern
        if (!url.hostname.includes('supabase') && !url.hostname.includes('localhost')) {
          warnings.push('Supabase URL does not match expected pattern');
        }

        // Production-specific checks
        if (this.env.NODE_ENV === 'production') {
          if (url.protocol !== 'https:') {
            errors.push('Production Supabase URL must use HTTPS');
          }
          
          if (url.hostname.includes('localhost')) {
            errors.push('Production environment cannot use localhost Supabase URL');
          }
        }
      } catch {
        errors.push('Invalid Supabase URL format');
      }
    }

    // Validate anon key format (basic JWT structure check)
    if (supabaseKey) {
      const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
      if (!jwtPattern.test(supabaseKey)) {
        errors.push('Invalid Supabase anon key format (not a valid JWT)');
      }

      // Check for common test/placeholder keys
      if (supabaseKey.includes('test') || supabaseKey.includes('example')) {
        warnings.push('Supabase anon key appears to be a test/example key');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate API key formats and basic security
   */
  validateAPIKeys(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const geminiKey = this.env.VITE_GEMINI_API_KEY;
    const supabaseKey = this.env.VITE_SUPABASE_ANON_KEY;

    // Validate Gemini API key
    if (geminiKey) {
      if (geminiKey.length < 20) {
        errors.push('Invalid Gemini API key format');
      }

      if (!geminiKey.startsWith('AIza')) {
        warnings.push('Gemini API key does not start with expected prefix (AIza)');
      }

      // Check for placeholder keys
      if (geminiKey.includes('your-api-key') || geminiKey.includes('example')) {
        errors.push('Gemini API key appears to be a placeholder');
      }
    }

    // Re-validate Supabase key
    if (!supabaseKey || supabaseKey.trim() === '') {
      errors.push('Invalid Supabase anon key');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate production-specific configuration requirements
   */
  validateProductionConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const nodeEnv = this.env.NODE_ENV;
    const isProduction = nodeEnv === 'production';

    if (isProduction) {
      // Check debug mode
      const debugMode = this.env.VITE_DEBUG;
      if (debugMode === 'true') {
        warnings.push('Debug mode enabled in production');
      }

      // Check for development-specific URLs
      const supabaseUrl = this.env.VITE_SUPABASE_URL;
      if (supabaseUrl && supabaseUrl.includes('localhost')) {
        errors.push('Production environment using localhost Supabase URL');
      }

      // Validate HTTPS requirements
      if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        errors.push('Production Supabase URL must use HTTPS');
      }

      // Check for required production environment variables
      const sentryDsn = this.env.VITE_SENTRY_DSN;
      if (!sentryDsn) {
        warnings.push('Sentry DSN not configured for production error tracking');
      }
    } else {
      // Development-specific validations
      const supabaseUrl = this.env.VITE_SUPABASE_URL;
      if (supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
        warnings.push('Development environment using production Supabase URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get comprehensive validation report
   */
  getValidationReport(): ValidationReport {
    const requiredVars = this.validateRequiredVars();
    const supabaseConfig = this.validateSupabaseConfig();
    const apiKeys = this.validateAPIKeys();
    const productionConfig = this.validateProductionConfig();

    // Determine overall status
    const hasErrors = [requiredVars, supabaseConfig, apiKeys, productionConfig]
      .some(result => !result.isValid);
    
    const hasWarnings = [requiredVars, supabaseConfig, apiKeys, productionConfig]
      .some(result => result.warnings.length > 0);

    let overallStatus: 'valid' | 'warnings' | 'invalid';
    if (hasErrors) {
      overallStatus = 'invalid';
    } else if (hasWarnings) {
      overallStatus = 'warnings';
    } else {
      overallStatus = 'valid';
    }

    return {
      requiredVars,
      supabaseConfig,
      apiKeys,
      productionConfig,
      overallStatus,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get a simple boolean validation result
   */
  isValidConfiguration(): boolean {
    const report = this.getValidationReport();
    return report.overallStatus !== 'invalid';
  }

  /**
   * Get human-readable configuration summary
   */
  getConfigurationSummary(): string {
    const report = this.getValidationReport();
    const totalErrors = [
      ...report.requiredVars.errors,
      ...report.supabaseConfig.errors,
      ...report.apiKeys.errors,
      ...report.productionConfig.errors
    ].length;

    const totalWarnings = [
      ...report.requiredVars.warnings,
      ...report.supabaseConfig.warnings,
      ...report.apiKeys.warnings,
      ...report.productionConfig.warnings
    ].length;

    const env = import.meta.env.NODE_ENV || 'development';

    return `Environment: ${env} | Status: ${report.overallStatus} | Errors: ${totalErrors} | Warnings: ${totalWarnings}`;
  }
}

// Export singleton instance
export const environmentValidator = new EnvironmentValidator();
