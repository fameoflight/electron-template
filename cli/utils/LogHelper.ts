/**
 * LogHelper - Convenience utilities for using LogMiddleware with DevCommand
 */

import { LogMiddleware, LogLevel, LogFilter, LogTransformer } from './LogMiddleware.js';

export interface DevLogOptions {
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  filter?: string[];
  verbose?: boolean;
  timestamps?: boolean;
  colors?: boolean;
}

/**
 * Create and configure a LogMiddleware instance for development
 */
export function createDevLogger(options: DevLogOptions = {}): LogMiddleware {
  const logLevel = options.logLevel ? LogLevel[options.logLevel.toUpperCase() as keyof typeof LogLevel] : LogLevel.INFO;

  const logger = new LogMiddleware({
    globalLevel: logLevel,
    output: {
      timestamps: options.timestamps || false,
      colors: options.colors !== false,
      serviceNames: true
    }
  });

  // Configure service-specific settings
  logger.configureService('vite', {
    color: '\x1b[33m', // Yellow
    prefix: 'VITE',
    level: options.verbose ? LogLevel.VERBOSE : LogLevel.INFO
  });

  logger.configureService('relay', {
    color: '\x1b[35m', // Magenta
    prefix: 'RELAY',
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO
  });

  logger.configureService('schema', {
    color: '\x1b[32m', // Green
    prefix: 'SCHEMA',
    level: LogLevel.INFO
  });

  logger.configureService('preload', {
    color: '\x1b[36m', // Cyan
    prefix: 'PRELOAD',
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO
  });

  logger.configureService('dev', {
    color: '\x1b[34m', // Blue
    prefix: 'DEV',
    level: LogLevel.INFO
  });

  // Apply service filters if specified
  if (options.filter && options.filter.length > 0) {
    logger.addFilter({
      service: options.filter
    });
  }

  // Add common noise filters unless verbose mode
  if (!options.verbose) {
    logger.addFilter({
      custom: (entry) => {
        // Filter out common development noise
        const noisePatterns = [
          /^compiled$/,
      /^built$/,
      /^watching for file changes/i,
          /^\[INFO\]/,
          /^ℹ️.*completed in/i,
          /^⏱️.*completed in/i,
          // Vite noise
          /^Local:/,
          /^Network:/,
          /^press h/i,
          // Relay noise
          /^Querying files to compile/,
          /^Compilation completed/,
          /^Done\.$/
        ];

        return !noisePatterns.some(pattern => pattern.test(entry.message));
      }
    });
  }

  // Add transformers for common log formats
  logger.addTransformer({
    service: 'vite',
    transform: (entry) => {
      // Transform Vite URLs to be more clickable
      if (entry.message.includes('Local:')) {
        const urlMatch = entry.message.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          entry.message = `🌐 ${urlMatch[1]}`;
        }
      }
      return entry;
    }
  });

  logger.addTransformer({
    service: 'relay',
    transform: (entry) => {
      // Make Relay compilation messages more concise
      if (entry.message.includes('compiled documents:')) {
        const match = entry.message.match(/compiled documents: (\d+) reader, (\d+) normalization, (\d+) operation text/);
        if (match) {
          entry.message = `🔗 Compiled: ${match[1]} queries, ${match[2]} normalizations, ${match[3]} operations`;
        }
      }
      return entry;
    }
  });

  return logger;
}

/**
 * Create a filter for only showing errors and warnings
 */
export function createErrorOnlyFilter(): LogFilter {
  return {
    level: LogLevel.WARN
  };
}

/**
 * Create a filter for specific services
 */
export function createServiceFilter(...services: string[]): LogFilter {
  return {
    service: services
  };
}

/**
 * Create a pattern filter
 */
export function createPatternFilter(pattern: RegExp | string, include = true): LogFilter {
  const regexPattern = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  return {
    pattern: regexPattern,
    custom: include
      ? (entry) => regexPattern.test(entry.message)
      : (entry) => !regexPattern.test(entry.message)
  };
}

/**
 * Create a transformer that highlights certain patterns
 */
export function createHighlightTransformer(pattern: RegExp | string, color: string): LogTransformer {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'gi') : pattern;

  return {
    transform: (entry) => {
      entry.message = entry.message.replace(regex, `${color}$&\x1b[0m`);
      return entry;
    }
  };
}

/**
 * Create a transformer that suppresses certain patterns
 */
export function createSuppressTransformer(pattern: RegExp | string): LogTransformer {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

  return {
    pattern: regex,
    transform: () => null // Suppress matching logs
  };
}

/**
 * Common preset configurations
 */
export const LogPresets = {
  /**
   * Only show errors and critical warnings
   */
  quiet: () => createDevLogger({ logLevel: 'warn', filter: [] }),

  /**
   * Only show frontend-related services (Vite, Relay)
   */
  frontend: () => createDevLogger({
    logLevel: 'info',
    filter: ['vite', 'relay'],
    timestamps: false
  }),

  /**
   * Show everything with verbose output
   */
  verbose: () => createDevLogger({
    logLevel: 'debug',
    verbose: true,
    timestamps: true
  }),

  /**
   * Clean output without common noise
   */
  clean: () => createDevLogger({
    logLevel: 'info',
    timestamps: false,
    colors: true
  }),

  /**
   * Default development mode
   */
  development: () => createDevLogger({
    logLevel: 'info',
    timestamps: false,
    colors: true
  })
};