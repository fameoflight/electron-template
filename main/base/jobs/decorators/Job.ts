import 'reflect-metadata';
import { z } from 'zod';
import { BaseJob } from '../BaseJob.js';

/**
 * Configuration options for the @Job decorator
 */
export interface JobOptions<TSchema extends z.ZodType = any> {
  // Basic metadata
  name?: string;
  description?: string;

  // Validation with Zod schema
  schema?: TSchema;

  // Retry configuration
  maxRetries?: number;
  retryable?: boolean;
  backoff?: 'exponential' | 'linear' | 'fixed';
  baseDelay?: number;      // milliseconds
  maxDelay?: number;       // milliseconds cap
  retryIf?: (error: Error) => boolean;  // Custom retry condition

  // Timeout configuration
  timeoutMs?: number;

  // Deduplication configuration
  dedupeKey?: string | ((props: any) => string);  // Prevent duplicate jobs

  // Scheduling (future feature placeholder)
  schedule?: {
    cron?: string;      // '0 2 * * *' = 2 AM daily
    every?: string;     // '7d', '1h', '30m'
    startAt?: Date;     // When to start scheduling
  };
}

/**
 * Job decorator that consolidates all job configuration
 *
 * Simplified version that only stores metadata - no auto-registration.
 * Registration is now handled explicitly in main/jobs/index.ts for better
 * transparency and debugging.
 *
 * @example
 * const EmailSchema = z.object({
 *   to: z.string().email(),
 *   subject: z.string().min(1),
 *   body: z.string().min(1)
 * });
 *
 * @Job({
 *   name: 'EmailJob',
 *   description: 'Send emails to users',
 *   schema: EmailSchema,
 *   maxRetries: 3,
 *   backoff: 'exponential',
 *   baseDelay: 1000,
 *   timeoutMs: 30000
 * })
 * export class EmailJob extends BaseJob<EmailProps> {
 *   async perform(props: EmailProps): Promise<any> {
 *     await sendEmail(props.to, props.subject, props.body);
 *     return { sent: true };
 *   }
 * }
 */
export function Job<TSchema extends z.ZodType = any>(
  options: JobOptions<TSchema> = {}
) {
  return function <T extends new (...args: any[]) => BaseJob>(target: T): T {
    const jobName = options.name || target.name;

    // 1. Store all metadata on the class using Reflect API (JobQueue will read this)
    Reflect.defineMetadata('Job:Options', options, target);
    Reflect.defineMetadata('Job:Name', jobName, target);
    Reflect.defineMetadata('Job:Schema', options.schema, target);
    Reflect.defineMetadata('Job:DedupeKey', options.dedupeKey, target);

    // 2. Set static properties for backward compatibility and API consistency
    (target as any).jobName = jobName;

    // Build defaultProps from decorator options (used by BaseJob)
    const defaultProps: any = {};

    if (options.timeoutMs) defaultProps.timeoutMs = options.timeoutMs;
    if (options.maxRetries) defaultProps.maxRetries = options.maxRetries;
    if (options.retryable !== undefined) defaultProps.retryable = options.retryable;

    (target as any).defaultProps = defaultProps;

    // 3. Inject validation if schema provided
    if (options.schema) {
      injectValidation(target.prototype, options.schema);
    }

    // 4. Inject retry logic if custom retry config provided
    if (options.retryIf || options.backoff || options.baseDelay) {
      injectRetryLogic(target.prototype, options);
    }

    // Note: No auto-registration - jobs are registered explicitly in main/jobs/index.ts
    // This makes the registration process transparent and easier to debug

    return target;
  };
}

/**
 * Helper: Inject Zod validation into job instance
 */
function injectValidation(prototype: any, schema: z.ZodType) {
  const originalValidate = prototype.validate;

  prototype.validate = async function (props: any): Promise<boolean> {
    // Call base validation first if it exists
    if (originalValidate) {
      const baseValid = await originalValidate.call(this, props);
      if (!baseValid) return false;
    }

    // Perform Zod validation if schema is available
    if (schema && typeof schema.safeParse === 'function') {
      const result = schema.safeParse(props);
      if (!result.success) {
        console.error(`❌ Job validation failed for ${(this.constructor as any).jobName}:`,
          result.error.format());
        return false;
      }
    }

    return true;
  };
}

/**
 * Helper: Inject custom retry logic into job instance
 */
function injectRetryLogic(prototype: any, options: JobOptions) {
  // Inject custom retry condition (or default if only backoff is provided)
  if (options.retryIf || options.backoff || options.baseDelay) {
    prototype.shouldRetry = function (error: Error, retryCount: number): boolean {
      // Check max retries first
      if (options.maxRetries && retryCount >= options.maxRetries) {
        return false;
      }

      // Apply custom retry condition if provided, otherwise default to true
      if (options.retryIf) {
        return options.retryIf(error);
      }

      // Default retry logic when only backoff is configured
      return true;
    };
  }

  // Inject custom retry delay calculation
  if (options.backoff || options.baseDelay) {
    prototype.getRetryDelay = function (retryCount: number): number {
      const base = options.baseDelay || 1000;
      const max = options.maxDelay || 60000;

      let delay: number;
      switch (options.backoff || 'exponential') {
        case 'exponential':
          delay = base * Math.pow(2, retryCount);
          break;
        case 'linear':
          delay = base * (retryCount + 1);
          break;
        case 'fixed':
          delay = base;
          break;
        default:
          delay = base * Math.pow(2, retryCount);
      }

      return Math.min(delay, max);
    };
  }
}

/**
 * Helper functions to retrieve job metadata
 */
export const JobMetadata = {
  /**
   * Get job options from class
   */
  getOptions<TSchema extends z.ZodType = any>(
    jobClass: typeof BaseJob
  ): JobOptions<TSchema> | undefined {
    return Reflect.getMetadata('Job:Options', jobClass);
  },

  /**
   * Get job name from class
   */
  getName(jobClass: typeof BaseJob): string {
    return Reflect.getMetadata('Job:Name', jobClass) || jobClass.name;
  },

  /**
   * Get job schema from class
   */
  getSchema(jobClass: typeof BaseJob): z.ZodType | undefined {
    return Reflect.getMetadata('Job:Schema', jobClass);
  },

  /**
   * Get job timeout from class
   */
  getTimeout(jobClass: typeof BaseJob): number | undefined {
    return Reflect.getMetadata('Job:Options', jobClass)?.timeoutMs;
  },

  /**
   * Check if job has custom retry logic
   */
  hasCustomRetry(jobClass: typeof BaseJob): boolean {
    const options = Reflect.getMetadata('Job:Options', jobClass);
    return !!(options?.retryIf || options?.backoff || options?.baseDelay);
  },

  /**
   * Get job dedupe key from class
   */
  getDedupeKey(jobClass: typeof BaseJob): string | ((props: any) => string) | undefined {
    return Reflect.getMetadata('Job:DedupeKey', jobClass);
  }
};