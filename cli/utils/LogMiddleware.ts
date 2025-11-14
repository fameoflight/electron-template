/**
 * Log Middleware - Flexible logging system for filtering and transforming log statements
 *
 * Features:
 * - Filter logs by service, level, or pattern
 * - Transform/reformat log messages
 * - Suppress unwanted logs
 * - Route different services to different outputs
 * - Buffer logs for delayed output
 */

export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5
}

export interface LogEntry {
  service: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  originalMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface LogFilter {
  service?: string | string[];
  level?: LogLevel;
  pattern?: RegExp;
  custom?: (entry: LogEntry) => boolean;
}

export interface LogTransformer {
  service?: string | string[];
  pattern?: RegExp;
  transform: (entry: LogEntry) => LogEntry | null;
}

export interface LogMiddlewareConfig {
  globalLevel: LogLevel;
  filters: LogFilter[];
  transformers: LogTransformer[];
  services: {
    [serviceName: string]: {
      level?: LogLevel;
      color?: string;
      prefix?: string;
      enabled?: boolean;
    };
  };
  output: {
    timestamps?: boolean;
    colors?: boolean;
    serviceNames?: boolean;
  };
}

/**
 * Log Middleware class
 */
export class LogMiddleware {
  private config: LogMiddlewareConfig;
  private originalMethods: Map<string, (...args: unknown[]) => void> = new Map();
  private buffer: LogEntry[] = [];
  private isBuffering = false;

  constructor(config: Partial<LogMiddlewareConfig> = {}) {
    this.config = {
      globalLevel: LogLevel.INFO,
      filters: [],
      transformers: [],
      services: {},
      output: {
        timestamps: false,
        colors: true,
        serviceNames: true
      },
      ...config
    };
  }

  /**
   * Configure service-specific settings
   */
  configureService(serviceName: string, options: {
    level?: LogLevel;
    color?: string;
    prefix?: string;
    enabled?: boolean;
  }): void {
    this.config.services[serviceName] = {
      ...this.config.services[serviceName],
      ...options
    };
  }

  /**
   * Add a filter to the middleware
   */
  addFilter(filter: LogFilter): void {
    this.config.filters.push(filter);
  }

  /**
   * Add a transformer to the middleware
   */
  addTransformer(transformer: LogTransformer): void {
    this.config.transformers.push(transformer);
  }

  /**
   * Start buffering logs
   */
  startBuffering(): void {
    this.isBuffering = true;
  }

  /**
   * Stop buffering and flush buffered logs
   */
  stopBuffering(): void {
    this.isBuffering = false;
    this.flushBuffer();
  }

  /**
   * Clear buffered logs
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * Intercept console methods for a specific service
   */
  interceptService(serviceName: string, target: Console = console): void {
    const methods = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach(method => {
      const original = (target[method as keyof Console] as (...args: unknown[]) => void).bind(target);
      const key = `${serviceName}:${method}`;

      this.originalMethods.set(key, original);

      (target as any)[method] = (...args: unknown[]) => {
        const level = this.getMethodLevel(method);
        const entry: LogEntry = {
          service: serviceName,
          level,
          message: args.join(' '),
          timestamp: new Date(),
          originalMessage: args.join(' '),
          metadata: { args }
        };

        this.processLogEntry(entry, original);
      };
    });
  }

  /**
   * Restore original console methods
   */
  restoreService(serviceName: string, target: Console = console): void {
    const methods = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach(method => {
      const key = `${serviceName}:${method}`;
      const original = this.originalMethods.get(key);

      if (original) {
        (target as any)[method] = original;
        this.originalMethods.delete(key);
      }
    });
  }

  /**
   * Process a log entry through filters and transformers
   */
  private processLogEntry(entry: LogEntry, originalMethod: (...args: unknown[]) => void): void {
    // Check global level
    if (entry.level > this.config.globalLevel) {
      return;
    }

    // Check service-specific level
    const serviceConfig = this.config.services[entry.service];
    if (serviceConfig?.level && entry.level > serviceConfig.level) {
      return;
    }

    // Check if service is enabled
    if (serviceConfig?.enabled === false) {
      return;
    }

    // Apply filters
    const shouldLog = this.config.filters.every(filter => this.matchesFilter(entry, filter));
    if (!shouldLog) {
      return;
    }

    // Apply transformers
    let transformedEntry = entry;
    for (const transformer of this.config.transformers) {
      if (this.matchesTransformer(transformer, entry)) {
        const result = transformer.transform(transformedEntry);
        if (result === null) {
          return; // Transformer suppressed the log
        }
        transformedEntry = result;
      }
    }

    // Buffer or output
    if (this.isBuffering) {
      this.buffer.push(transformedEntry);
    } else {
      this.outputLog(transformedEntry, originalMethod);
    }
  }

  /**
   * Check if log entry matches a filter
   */
  private matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (filter.service) {
      const services = Array.isArray(filter.service) ? filter.service : [filter.service];
      if (!services.includes(entry.service)) {
        return false;
      }
    }

    if (filter.level && entry.level > filter.level) {
      return false;
    }

    if (filter.pattern && !filter.pattern.test(entry.message)) {
      return false;
    }

    if (filter.custom && !filter.custom(entry)) {
      return false;
    }

    return true;
  }

  /**
   * Check if log entry matches a transformer
   */
  private matchesTransformer(transformer: LogTransformer, entry: LogEntry): boolean {
    if (transformer.service) {
      const services = Array.isArray(transformer.service) ? transformer.service : [transformer.service];
      if (!services.includes(entry.service)) {
        return false;
      }
    }

    if (transformer.pattern && !transformer.pattern.test(entry.message)) {
      return false;
    }

    return true;
  }

  /**
   * Output a log entry
   */
  private outputLog(entry: LogEntry, originalMethod: (...args: unknown[]) => void): void {
    const serviceConfig = this.config.services[entry.service];
    const color = serviceConfig?.color || '\x1b[36m';
    const prefix = serviceConfig?.prefix || entry.service;

    let output = '';

    // Add timestamp
    if (this.config.output.timestamps) {
      output += `[${entry.timestamp.toISOString()}] `;
    }

    // Add service name
    if (this.config.output.serviceNames && prefix) {
      output += `${this.config.output.colors ? color : ''}[${prefix}]${this.config.output.colors ? '\x1b[0m' : ''} `;
    }

    // Add message
    output += entry.message;

    // Use the original method to maintain stack traces and behavior
    originalMethod(output);
  }

  /**
   * Flush buffered logs
   */
  private flushBuffer(): void {
    const entries = [...this.buffer];
    this.buffer = [];

    entries.forEach(entry => {
      const method = this.getLevelMethod(entry.level);
      const original = this.originalMethods.get(`console:${method}`) || (console[method as keyof Console] as (...args: unknown[]) => void).bind(console);
      this.outputLog(entry, original);
    });
  }

  /**
   * Convert console method name to LogLevel
   */
  private getMethodLevel(method: string): LogLevel {
    switch (method) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'log': return LogLevel.VERBOSE;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Convert LogLevel to console method name
   */
  private getLevelMethod(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return 'error';
      case LogLevel.WARN: return 'warn';
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.VERBOSE: return 'log';
      default: return 'info';
    }
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): { count: number; services: Record<string, number> } {
    const services: Record<string, number> = {};

    this.buffer.forEach(entry => {
      services[entry.service] = (services[entry.service] || 0) + 1;
    });

    return {
      count: this.buffer.length,
      services
    };
  }

  /**
   * Create preset configurations
   */
  static presets = {
    // Only show errors and warnings
    quiet: {
      globalLevel: LogLevel.WARN,
      output: { timestamps: true, colors: true, serviceNames: true }
    },

    // Only show Vite and Relay logs
    frontend: {
      globalLevel: LogLevel.INFO,
      filters: [
        { service: ['vite', 'relay'] }
      ],
      output: { timestamps: false, colors: true, serviceNames: true }
    },

    // Filter out common noise
    clean: {
      globalLevel: LogLevel.INFO,
      filters: [
        {
          pattern: /^(compiled|built|watching for changes|\[INFO\])/i,
          custom: (entry: LogEntry) => !entry.message.match(/^(compiled|built|watching for changes|\[INFO\])/i)
        }
      ],
      output: { timestamps: false, colors: true, serviceNames: false }
    },

    // Development mode with everything
    development: {
      globalLevel: LogLevel.DEBUG,
      output: { timestamps: true, colors: true, serviceNames: true }
    }
  };
}