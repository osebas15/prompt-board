# Debug Logger

A centralized logging utility that controls debug output based on environment variables.

## Features

- **Environment-controlled**: Only logs when `VITE_DEBUG=true` or in development mode
- **Once-only logging**: Prevents spam by ensuring each unique message logs only once
- **Force logging**: Critical errors always log regardless of debug mode
- **Multiple log levels**: log, warn, error, info, debug

## Usage

```typescript
import { logger } from './debug/logger';

// Basic logging (only shows in debug mode)
logger.log('Basic message');
logger.warn('Warning message');
logger.error('Error message'); // Always shows (errors are important)
logger.info('Info message');
logger.debug('Debug message');

// Log only once (prevents spam)
logger.logOnce('This will only appear once');
logger.warnOnce('Warning that appears once');

// Force logging (even when debug is off)
logger.forceLog('Always visible');
logger.forceError('Critical error');

// Combination: force and once
logger.forceLogOnce('Critical message shown once');
```

## Configuration

### Environment Variables

Set `VITE_DEBUG=true` in your `.env.local` file to enable debug logging:

```bash
# Enable debug mode
VITE_DEBUG=true
```

### NPM Scripts

Use the debug script for development:

```bash
# Start with debug logging enabled
npm run dev:debug

# Regular development (debug controlled by .env.local)
npm run dev
```

## Default Behavior

- **Development mode**: Shows info, warn, error logs by default
- **Production mode**: Shows only error logs by default
- **Debug mode**: Shows all log levels
- **Force logging**: Always shows regardless of mode

## API Reference

### Main Logger Methods

- `logger.log(message, ...args)` - Basic logging
- `logger.warn(message, ...args)` - Warning messages
- `logger.error(message, ...args)` - Error messages (always shown)
- `logger.info(message, ...args)` - Informational messages
- `logger.debug(message, ...args)` - Debug messages

### Once-Only Methods

- `logger.logOnce(message, ...args)` - Log message once
- `logger.warnOnce(message, ...args)` - Warn message once
- `logger.errorOnce(message, ...args)` - Error message once
- `logger.infoOnce(message, ...args)` - Info message once
- `logger.debugOnce(message, ...args)` - Debug message once

### Force Methods

- `logger.forceLog(message, ...args)` - Always log
- `logger.forceWarn(message, ...args)` - Always warn
- `logger.forceError(message, ...args)` - Always error
- `logger.forceInfo(message, ...args)` - Always info

### Force + Once Methods

- `logger.forceLogOnce(message, ...args)` - Always log, but once
- `logger.forceWarnOnce(message, ...args)` - Always warn, but once
- `logger.forceErrorOnce(message, ...args)` - Always error, but once
- `logger.forceInfoOnce(message, ...args)` - Always info, but once

### Utility Functions

- `isDebugEnabled()` - Check if debug mode is active
- `clearLogCache()` - Clear the once-only message cache (useful for tests)
- `getDebugInfo()` - Get current debug configuration

## Migration from console

Replace direct console calls:

```typescript
// Before
console.log('Debug info');
console.error('Error occurred');

// After
import { logger } from './lib/debug/logger';
logger.debug('Debug info');
logger.error('Error occurred');
```

## Best Practices

1. **Use appropriate log levels**:
   - `debug` for development information
   - `info` for application flow
   - `warn` for recoverable issues
   - `error` for critical problems

2. **Use once-only logging for repeated operations**:
   ```typescript
   // In a loop or frequently called function
   logger.warnOnce('This warning appears only once');
   ```

3. **Force critical errors**:
   ```typescript
   logger.forceError('Critical system error');
   ```

4. **Use debug mode for development**:
   ```bash
   npm run dev:debug
   ```
