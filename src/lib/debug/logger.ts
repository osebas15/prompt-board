/**
 * Centralized debug logging utility
 * Controls logging output based on debug environment variable
 */

// Check for debug mode from environment variable
const isDebugMode = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV === true;

// Create a set to track logged messages to ensure each message appears only once
const loggedMessages = new Set<string>();

export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

// Type for console log arguments - supports primitive types and serializable objects
export type LogArg = string | number | boolean | null | undefined | object | Error;

interface LogOptions {
  once?: boolean; // If true, log this message only once
  force?: boolean; // If true, log even when debug mode is off (for critical errors)
}

/**
 * Creates a unique key for a log message to track if it has been logged before
 */
function createLogKey(level: LogLevel, message: string, ...args: LogArg[]): string {
  const argsString = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join('|');
  return `${level}:${message}:${argsString}`;
}

/**
 * Main debug logger function
 */
function debugLog(level: LogLevel, message: string, options: LogOptions = {}, ...args: LogArg[]): void {
  // Check if we should log based on debug mode and force option
  const shouldLog = isDebugMode || options.force || level === 'error';
  
  if (!shouldLog) {
    return;
  }

  // Check if we should log only once
  if (options.once) {
    const logKey = createLogKey(level, message, ...args);
    if (loggedMessages.has(logKey)) {
      return;
    }
    loggedMessages.add(logKey);
  }

  // Log the message using the appropriate console method
  // Fall back to console.log if the specific method doesn't exist (e.g., in test environments)
  const prefix = isDebugMode ? '[DEBUG] ' : '';
  switch (level) {
    case 'log':
      console.log(`${prefix}${message}`, ...args);
      break;
    case 'warn':
      (console.warn || console.log)(`${prefix}${message}`, ...args);
      break;
    case 'error':
      (console.error || console.log)(`${prefix}${message}`, ...args);
      break;
    case 'info':
      (console.info || console.log)(`${prefix}${message}`, ...args);
      break;
    case 'debug':
      (console.debug || console.log)(`${prefix}${message}`, ...args);
      break;
  }
}

/**
 * Exported logger methods
 */
export const logger = {
  log: (message: string, ...args: LogArg[]) => debugLog('log', message, {}, ...args),
  warn: (message: string, ...args: LogArg[]) => debugLog('warn', message, {}, ...args),
  error: (message: string, ...args: LogArg[]) => debugLog('error', message, {}, ...args),
  info: (message: string, ...args: LogArg[]) => debugLog('info', message, {}, ...args),
  debug: (message: string, ...args: LogArg[]) => debugLog('debug', message, {}, ...args),
  
  // Methods with options
  logOnce: (message: string, ...args: LogArg[]) => debugLog('log', message, { once: true }, ...args),
  warnOnce: (message: string, ...args: LogArg[]) => debugLog('warn', message, { once: true }, ...args),
  errorOnce: (message: string, ...args: LogArg[]) => debugLog('error', message, { once: true }, ...args),
  infoOnce: (message: string, ...args: LogArg[]) => debugLog('info', message, { once: true }, ...args),
  debugOnce: (message: string, ...args: LogArg[]) => debugLog('debug', message, { once: true }, ...args),
  
  // Force logging (even when debug is off)
  forceLog: (message: string, ...args: LogArg[]) => debugLog('log', message, { force: true }, ...args),
  forceWarn: (message: string, ...args: LogArg[]) => debugLog('warn', message, { force: true }, ...args),
  forceError: (message: string, ...args: LogArg[]) => debugLog('error', message, { force: true }, ...args),
  forceInfo: (message: string, ...args: LogArg[]) => debugLog('info', message, { force: true }, ...args),
  
  // Combination: force and once
  forceLogOnce: (message: string, ...args: LogArg[]) => debugLog('log', message, { force: true, once: true }, ...args),
  forceWarnOnce: (message: string, ...args: LogArg[]) => debugLog('warn', message, { force: true, once: true }, ...args),
  forceErrorOnce: (message: string, ...args: LogArg[]) => debugLog('error', message, { force: true, once: true }, ...args),
  forceInfoOnce: (message: string, ...args: LogArg[]) => debugLog('info', message, { force: true, once: true }, ...args),
};

/**
 * Utility to check if debug mode is enabled
 */
export const isDebugEnabled = () => isDebugMode;

/**
 * Utility to clear the logged messages cache (useful for testing)
 */
export const clearLogCache = () => loggedMessages.clear();

/**
 * Get the current debug status and configuration
 */
export const getDebugInfo = () => ({
  isDebugMode,
  loggedMessagesCount: loggedMessages.size,
  env: {
    VITE_DEBUG: import.meta.env.VITE_DEBUG,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
  }
});

export default logger;
