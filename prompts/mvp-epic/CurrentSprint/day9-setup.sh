#!/bin/bash

# Day 9 Setup Script - Testing, Error Handling & Performance
# This script sets up comprehensive testing, error handling, and performance monitoring

set -e

echo "🧪 Day 9 Setup: Testing, Error Handling & Performance"
echo "====================================================="

echo "📦 Installing testing dependencies..."

# Install comprehensive testing tools
npm install --save-dev \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    @vitest/ui \
    @vitest/coverage-v8 \
    jsdom \
    msw \
    @axe-core/react

echo "📦 Installing error handling dependencies..."

# Install error tracking and monitoring
npm install --save \
    react-error-boundary \
    @sentry/react \
    @sentry/vite-plugin

echo "📦 Installing performance monitoring dependencies..."

# Install performance tools
npm install --save \
    web-vitals \
    @vercel/analytics

echo "📦 Installing E2E testing dependencies..."

# Install Playwright for E2E testing
npm install --save-dev \
    @playwright/test

echo "📁 Creating testing and monitoring structure..."

# Create comprehensive testing structure
mkdir -p src/__tests__/{unit,integration,e2e,performance,accessibility}
mkdir -p src/__tests__/unit/{components,hooks,utils,services}
mkdir -p src/__tests__/integration/{auth,prompts,chat,contexts}
mkdir -p src/__tests__/e2e/{user-flows,error-scenarios}
mkdir -p src/__tests__/performance/{load-tests,memory-tests}
mkdir -p src/lib/{errors,monitoring,performance}
mkdir -p src/test/{mocks,utils,fixtures}

echo "🚨 Creating error handling system..."

# Create error types
cat > src/lib/errors/types.ts << 'EOF'
// Error types and interfaces
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp?: Date;
  userMessage?: string;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorDetails {
  error: AppError;
  errorInfo?: ErrorInfo;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLogEntry {
  id: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  details: ErrorDetails;
  resolved: boolean;
  created_at: Date;
}
EOF

# Create error boundary component
cat > src/lib/errors/ErrorBoundary.tsx << 'EOF'
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '../../components/ui/Button/Button';
import { errorLogger } from './errorLogger';
import type { AppError, ErrorInfo } from './types';

interface ErrorFallbackProps {
  error: AppError;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {error.userMessage || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex flex-col space-y-3">
          <Button onClick={resetErrorBoundary} className="w-full">
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error details (dev only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

export function ErrorBoundary({ 
  children, 
  fallback = ErrorFallback,
  onError 
}: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    const appError = error as AppError;
    
    // Log error to monitoring service
    errorLogger.logError(appError, errorInfo);
    
    // Call custom error handler if provided
    onError?.(appError, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
EOF

# Create error logger
cat > src/lib/errors/errorLogger.ts << 'EOF'
import type { AppError, ErrorInfo, ErrorDetails, ErrorSeverity } from './types';

class ErrorLogger {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  logError(error: AppError, errorInfo?: ErrorInfo): void {
    const errorDetails: ErrorDetails = {
      error,
      errorInfo,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
    };

    // Add to local storage
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorDetails);
    }

    // Send to monitoring service (e.g., Sentry)
    this.sendToMonitoring(errorDetails);
  }

  logWarning(message: string, context?: Record<string, any>): void {
    const warning: AppError = {
      name: 'Warning',
      message,
      context,
      timestamp: new Date(),
    };

    console.warn('Warning:', warning);
  }

  logInfo(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.info('Info:', { message, context, timestamp: new Date() });
    }
  }

  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context or localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private sendToMonitoring(errorDetails: ErrorDetails): void {
    // In production, send to Sentry or other monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Sentry integration would go here
      console.error('Error to be sent to monitoring:', errorDetails);
    }
  }

  private getSeverity(error: AppError): ErrorSeverity {
    if (error.statusCode && error.statusCode >= 500) return 'critical';
    if (error.statusCode && error.statusCode >= 400) return 'high';
    if (error.name === 'Warning') return 'low';
    return 'medium';
  }
}

export const errorLogger = new ErrorLogger();
EOF

# Create performance monitoring
cat > src/lib/performance/performanceMonitor.ts << 'EOF'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  initialize(): void {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Custom performance monitoring
    this.monitorRouteChanges();
    this.monitorAPIRequests();
  }

  private handleMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }

    // Send to analytics service
    this.sendToAnalytics(metric);
  }

  private monitorRouteChanges(): void {
    let startTime = performance.now();

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          this.handleMetric({
            name: 'route-change',
            value: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
            delta: 0,
            id: 'route-' + Date.now(),
            timestamp: Date.now(),
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  private monitorAPIRequests(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.handleMetric({
          name: 'api-request',
          value: endTime - startTime,
          delta: 0,
          id: 'api-' + Date.now(),
          timestamp: Date.now(),
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.handleMetric({
          name: 'api-error',
          value: endTime - startTime,
          delta: 0,
          id: 'api-error-' + Date.now(),
          timestamp: Date.now(),
        });
        
        throw error;
      }
    };
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
    if (process.env.NODE_ENV === 'production') {
      // Analytics integration would go here
      console.log('Metric to be sent to analytics:', metric);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageMetric(metricName: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();
EOF

# Create test utilities
cat > src/test/utils/testUtils.tsx << 'EOF'
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../components/providers/ThemeProvider';

// Mock providers for testing
function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
EOF

# Create Vitest configuration
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
EOF

# Create test setup file
cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// MSW setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});

// Mock environment variables
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};
EOF

# Create MSW handlers
cat > src/test/mocks/handlers.ts << 'EOF'
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth handlers
  http.post('/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    });
  }),

  // Prompts handlers
  http.get('/rest/v1/prompts', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Prompt',
        content: 'Test content',
        user_id: '123',
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Error handler for testing
  http.get('/rest/v1/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];
EOF

cat > src/test/mocks/server.ts << 'EOF'
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
EOF

echo "📄 Creating Playwright configuration..."

# Create Playwright config
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

echo "✅ Day 9 setup complete!"
echo ""
echo "Files created:"
echo "- src/lib/errors/types.ts"
echo "- src/lib/errors/ErrorBoundary.tsx"
echo "- src/lib/errors/errorLogger.ts"
echo "- src/lib/performance/performanceMonitor.ts"
echo "- src/test/utils/testUtils.tsx"
echo "- vitest.config.ts"
echo "- playwright.config.ts"
echo "- src/test/setup.ts"
echo "- MSW mock handlers"
echo ""
echo "Next steps:"
echo "1. Write comprehensive unit tests"
echo "2. Implement integration tests"
echo "3. Create E2E test scenarios"
echo "4. Set up error monitoring"
echo "5. Add performance benchmarks"
echo ""
echo "Ready for Day 9 development! 🚀"
