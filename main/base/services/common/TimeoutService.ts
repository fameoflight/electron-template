/**
 * TimeoutService - Provides configurable timeout functionality for async operations
 *
 * This service abstracts timeout logic that can be reused across different services
 * like file hashing, API calls, database operations, etc.
 */

export interface TimeoutOptions {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  /** Optional error message for timeout */
  timeoutMessage?: string;
  /** Optional custom error for timeout */
  timeoutError?: Error;
}

export interface WithTimeoutOptions extends TimeoutOptions {
  /** Optional operation name for logging */
  operationName?: string;
  /** Optional AbortSignal for cancellation support */
  signal?: AbortSignal;
}

/**
 * TimeoutService provides reusable timeout functionality
 */
export class TimeoutService {
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs: number = 30000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Execute an operation with a timeout and optional cancellation support
   *
   * @param operation - The async operation to execute
   * @param options - Timeout configuration options
   * @returns Promise that resolves with the operation result or rejects on timeout/cancellation
   */
  async withTimeout<T>(
    operation: Promise<T>,
    options?: WithTimeoutOptions
  ): Promise<T> {
    const {
      timeoutMs = this.defaultTimeoutMs,
      timeoutMessage = `Operation timed out after ${timeoutMs}ms`,
      timeoutError,
      operationName = 'operation',
      signal
    } = options || {};

    if (operationName) {
      console.log(`[TimeoutService] Starting ${operationName} with ${timeoutMs}ms timeout`);
    }

    // Create cancellation promise if signal is provided
    let cancellationPromise: Promise<never> | null = null;
    let cleanupCancellation: (() => void) | undefined;

    if (signal) {
      if (signal.aborted) {
        const error = new Error('Operation was cancelled before it started');
        if (operationName) {
          console.error(`[TimeoutService] ${operationName} cancelled before start`);
        }
        throw error;
      }

      cancellationPromise = new Promise<never>((_, reject) => {
        const handleAbort = () => {
          const error = new Error('Operation was cancelled');
          if (operationName) {
            console.error(`[TimeoutService] ${operationName} cancelled`);
          }
          reject(error);
        };

        signal.addEventListener('abort', handleAbort);
        cleanupCancellation = () => {
          signal.removeEventListener('abort', handleAbort);
        };
      });
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = timeoutError || new Error(timeoutMessage);
        if (operationName) {
          console.error(`[TimeoutService] ${operationName} timed out after ${timeoutMs}ms`);
        }
        reject(error);
      }, timeoutMs);
    });

    try {
      // Race operation against timeout and cancellation
      const promises = [operation, timeoutPromise];
      if (cancellationPromise) {
        promises.push(cancellationPromise);
      }

      const result = await Promise.race(promises);

      if (operationName) {
        console.log(`[TimeoutService] ✅ ${operationName} completed successfully`);
      }
      return result;
    } catch (error) {
      if (operationName) {
        console.error(`[TimeoutService] ✗ ${operationName} failed:`, error);
      }
      throw error;
    } finally {
      // Cleanup cancellation listener if set
      if (cleanupCancellation) {
        cleanupCancellation();
      }
    }
  }

  /**
   * Execute a function with timeout handling
   *
   * @param operationFn - Function that returns a Promise
   * @param options - Timeout configuration options
   * @returns Promise that resolves with the operation result or rejects on timeout
   */
  async executeWithTimeout<T>(
    operationFn: () => Promise<T>,
    options?: WithTimeoutOptions
  ): Promise<T> {
    return this.withTimeout(operationFn(), options);
  }

  /**
   * Create a timeout service instance with a different default timeout
   *
   * @param defaultTimeoutMs - New default timeout in milliseconds
   * @returns New TimeoutService instance
   */
  static withDefaultTimeout(defaultTimeoutMs: number): TimeoutService {
    return new TimeoutService(defaultTimeoutMs);
  }

  /**
   * Convenience method for common timeout durations
   */
  static readonly presets = {
    /** 5 seconds - good for quick operations */
    quick: () => new TimeoutService(5000),
    /** 30 seconds - good for file operations */
    fileOperations: () => new TimeoutService(30000),
    /** 2 minutes - good for API calls */
    apiCalls: () => new TimeoutService(120000),
    /** 10 minutes - good for long-running processes */
    longRunning: () => new TimeoutService(600000),
  } as const;

  /**
   * Get the default timeout value
   */
  getDefaultTimeout(): number {
    return this.defaultTimeoutMs;
  }

  /**
   * Update the default timeout value
   *
   * @param timeoutMs - New default timeout in milliseconds
   */
  setDefaultTimeout(timeoutMs: number): void {
    this.defaultTimeoutMs = timeoutMs;
  }
}

/**
 * Default instance with 30-second timeout
 * Good for file operations and general use
 */
export const defaultTimeoutService = TimeoutService.presets.fileOperations();

/**
 * Quick timeout instance (5 seconds)
 * Good for fast operations like network checks
 */
export const quickTimeoutService = TimeoutService.presets.quick();