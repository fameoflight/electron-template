import { Job, JobStatus } from '@main/db/entities/Job.js';
import JobQueue from '@main/services/JobQueue.js';
import { JobMetadata } from './decorators/Job.js';

/**
 * System job properties that can be applied to any job
 */
export interface SystemJobProps {
  /** Timeout in milliseconds for this job execution */
  timeoutMs?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether this job should be retried on failure */
  retryable?: boolean;
  /** Custom retry delay function */
  retryDelay?: (retryCount: number) => number;
  /** Priority of the job (higher = more priority) */
  priority?: number;
  /** Queue to run this job in */
  queue?: string;
}

/**
 * Base job payload interface that all job payloads should extend
 */
export interface BaseJobProps extends SystemJobProps {
  /** User ID that owns this job */
  userId: string;
  /** Target entity ID this job operates on */
  targetId: string;
}

/**
 * Job execution options that can be applied to any job
 * These are the options passed in the 4th parameter of performLater calls
 */
export interface JobOptions {
  /** Timeout in milliseconds for this job execution */
  timeoutMs?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether this job should be retried on failure */
  retryable?: boolean;
  /** Custom retry delay function */
  retryDelay?: (retryCount: number) => number;
  /** Priority of the job (higher = more priority) */
  priority?: number;
  /** Queue to run this job in */
  queue?: string;
  /** Additional metadata to attach to the job */
  metadata?: Record<string, any>;
  /** Abort signal to cancel the job */
  abortSignal?: AbortSignal;
}

/**
 * BaseJob - Simplified base class for all jobs
 *
 * Provides Rails ActiveJob-style APIs with a cleaner positional parameter pattern:
 * - performLater(userId, targetId, jobParams, options) - Enqueue for background execution
 * - performAt(scheduledAt, userId, targetId, jobParams, options) - Schedule for specific time
 * - performNow(userId, targetId, jobParams, options) - Execute synchronously
 *
 * Key simplifications:
 * - Direct access to JobQueue instead of complex JobWorker → JobService chain
 * - No IJobExecutor interface - jobs execute directly
 * - Same validation and retry logic but simpler implementation
 * - Cleaner API with positional parameters + options pattern
 *
 * Usage:
 * class MyJob extends BaseJob<MyJobProps> {
 *   static readonly jobName = 'MyJob';
 *
 *   async perform(props: MyJobProps): Promise<any> {
 *     // Your job logic here
 *   }
 * }
 *
 * // Enqueue for later execution with positional parameters
 * await MyJob.performLater(
 *   'user-123',                    // userId
 *   'target-456',                  // targetId
 *   {                              // job parameters
 *     title: 'Welcome Email',
 *     message: 'Thanks for joining!'
 *   },
 *   {                              // options
 *     priority: 'high',
 *     timeoutMs: 30000
 *   }
 * );
 *
 * // Schedule for specific time
 * await MyJob.performAt(
 *   new Date(Date.now() + 3600000), // scheduledAt
 *   'user-123',                     // userId
 *   'target-456',                   // targetId
 *   { message: 'Reminder!' },       // job parameters
 *   { queue: 'notifications' }      // options
 * );
 *
 * // Execute immediately
 * await MyJob.performNow('user-123', 'target-456', { message: 'Urgent!' });
 *
 * // Inside job class - postpone if not ready
 * class DataProcessingJob extends BaseJob<DataProcessingProps> {
 *   static readonly jobName = 'DataProcessingJob';
 *
 *   async perform(props: DataProcessingProps): Promise<any> {
 *     const dataReady = await this.checkDataReady(props.sourceId);
 *
 *     if (!dataReady) {
 *       // Postpone for 30 seconds because data isn't ready yet
 *       await this.postpone(30, 'Waiting for data to be available');
 *       return; // This line won't be reached due to postpone throwing
 *     }
 *
 *     // Process the data
 *     return await this.processData(props);
 *   }
 * }
 */
export abstract class BaseJob<TProps = any> {
  /**
   * Override this in your job class to set the job name
   */
  static readonly jobName: string;

  /**
   * Override this to set default system properties for this job type
   */
  static readonly defaultProps?: Partial<SystemJobProps>;

  /**
   * Current job record instance (set by JobQueue during execution)
   */
  private jobRecord?: Job;

  /**
   * Set the current job record (called by JobQueue during execution)
   */
  public setCurrentJob(job: Job): void {
    this.jobRecord = job;
  }

  /**
   * Postpone job execution by specified number of seconds
   * Can only be called from within the perform() method
   *
   * @param seconds - Number of seconds to postpone execution
   * @param reason - Optional reason for postponement
   */
  public async postpone(seconds: number, reason?: string): Promise<void> {
    if (!this.jobRecord) {
      throw new Error('postpone() can only be called during job execution');
    }

    if (seconds <= 0) {
      throw new Error('postpone() requires positive number of seconds');
    }

    const queue = JobQueue.getInstance();
    if (!queue) {
      throw new Error('Job queue not available');
    }

    const nextRetryAt = new Date(Date.now() + seconds * 1000);

    console.log(`[${this.constructor.name}] ⏰ Postponing job ${this.jobRecord.id} for ${seconds}s${reason ? ` (${reason})` : ''}`);

    // Update the job record with new retry time
    await queue.postponeJob(this.jobRecord.id, nextRetryAt, reason || `Postponed for ${seconds} seconds`, JobStatus.POSTPONED);

    // Throw a special error to signal postponement to the JobQueue
    const postponeError = new Error(`Job postponed for ${seconds} seconds`);
    (postponeError as any).isPostponement = true;
    (postponeError as any).nextRetryAt = nextRetryAt;
    throw postponeError;
  }

  /**
   * Utility method to merge default properties with provided props
   */
  public static mergeProps<T>(defaultProps: any, props: T): T {
    return defaultProps ? { ...defaultProps, ...props } : props;
  }

  /**
   * Create a placeholder job for deduplicated jobs to maintain API compatibility
   */
  public static createDeduplicatedPlaceholder(jobName: string, action: string = 'enqueued'): Job {
    console.log(`⏭️ Job ${jobName} was deduplicated, not ${action}`);
    const placeholderJob = new Job();
    placeholderJob.id = 'deduplicated';
    placeholderJob.type = jobName;
    placeholderJob.status = 'COMPLETED' as any;
    return placeholderJob;
  }

  /**
   * Enqueue job for background execution (Rails performLater equivalent)
   *
   * SIGNATURE: performLater(userId, targetId, jobParams, options)
   */
  static async performLater<T = any>(
    this: new () => BaseJob<T>,
    userId: string,
    targetId: string,
    jobParams?: T,
    options?: JobOptions
  ): Promise<Job> {
    const queue = JobQueue.getInstance();
    if (!queue) {
      throw new Error('Job queue not initialized - call JobQueue.start() first');
    }

    const constructor = this as any;
    const jobName = constructor.jobName || constructor.name;

    // Build the complete job properties
    const finalProps = {
      userId,
      targetId,
      ...jobParams
    };

    // Merge with default properties
    const mergedProps = BaseJob.mergeProps(constructor.defaultProps, finalProps);

    // Merge with options (some options become part of job parameters)
    const propsWithOptions = { ...mergedProps, ...options };

    // Handle deduplication key
    let dedupeKey: string | undefined;
    const jobDedupeKey = JobMetadata.getDedupeKey(constructor);

    if (jobDedupeKey) {
      if (typeof jobDedupeKey === 'string') {
        dedupeKey = jobDedupeKey;
      } else if (typeof jobDedupeKey === 'function') {
        dedupeKey = jobDedupeKey(finalProps);
      }
    }

    const job = await queue.createJob({
      type: jobName,
      targetId: propsWithOptions.targetId,
      userId: propsWithOptions.userId,
      parameters: propsWithOptions,
      priority: options?.priority,
      dedupeKey
    });

    if (!job) {
      return BaseJob.createDeduplicatedPlaceholder(jobName);
    }

    return job;
  }

  /**
   * Schedule job for execution at specific time (Rails performAt equivalent)
   *
   * SIGNATURE: performAt(scheduledAt, userId, targetId, jobParams, options)
   */
  static async performAt<T = any>(
    this: new () => BaseJob<T>,
    scheduledAt: Date,
    userId: string,
    targetId: string,
    jobParams?: T,
    options?: JobOptions
  ): Promise<Job> {
    const queue = JobQueue.getInstance();
    if (!queue) {
      throw new Error('Job queue not initialized - call JobQueue.start() first');
    }

    const constructor = this as any;
    const jobName = constructor.jobName || constructor.name;

    // Build the complete job properties
    const finalProps = {
      userId,
      targetId,
      ...jobParams
    };

    // Merge with default properties
    const mergedProps = BaseJob.mergeProps(constructor.defaultProps, finalProps);

    // Merge with options (some options become part of job parameters)
    const propsWithOptions = { ...mergedProps, ...options };

    const job = await queue.createJob({
      type: jobName,
      targetId: propsWithOptions.targetId,
      userId: propsWithOptions.userId,
      parameters: propsWithOptions,
      scheduledAt,
      priority: options?.priority
    });

    if (!job) {
      return BaseJob.createDeduplicatedPlaceholder(jobName, 'scheduled');
    }

    return job;
  }

  /**
   * Execute job immediately, bypassing queue (Rails performNow equivalent)
   *
   * SIGNATURE: performNow(userId, targetId, jobParams, options)
   */
  static async performNow<T = any>(
    this: new () => BaseJob<T>,
    userId: string,
    targetId: string,
    jobParams?: T,
    options?: JobOptions
  ): Promise<any> {
    const constructor = this as any;
    const jobName = constructor.jobName || constructor.name;

    // Build the complete job properties
    const finalProps = {
      userId,
      targetId,
      ...jobParams
    } as T;

    // Merge with default properties
    const mergedProps = BaseJob.mergeProps(constructor.defaultProps, finalProps);

    // Merge with options
    const propsWithOptions = { ...mergedProps, ...options };

    // Create a new instance and execute directly
    const jobInstance = new constructor();

    // For performNow, use provided abortSignal or create one for timeout
    let signal: AbortSignal | undefined;

    if (options?.abortSignal) {
      signal = options.abortSignal;
    } else if (options?.timeoutMs) {
      const abortController = new AbortController();
      setTimeout(() => abortController.abort(), options.timeoutMs);
      signal = abortController.signal;
    }

    // Execute job directly
    const result = await jobInstance.perform(propsWithOptions, signal);

    return result;
  }

  /**
   * Abstract method that must be implemented by concrete job classes
   * This contains the actual job logic
   */
  abstract perform(props: TProps & BaseJobProps, signal?: AbortSignal): Promise<any>;

  /**
   * Optional validation method - override to add custom validation
   * Note: Can be enhanced by @Job decorator with Zod schema validation
   */
  async validate(props: TProps & BaseJobProps): Promise<boolean> {
    // Basic validation
    if (!props.userId || !props.targetId) {
      return false;
    }
    return true;
  }

  protected log(...args: any[]) {
    const identifier = (this.constructor as any).jobName || (this.constructor as any).name;
    console.log(`[${identifier}]`, ...args);
  }
}

/**
 * Global Job helper for universal enqueue methods
 * Provides convenient access to job operations (same API as before)
 */
export class GlobalJobHelper {
  private static get queue() {
    const queue = JobQueue.getInstance();
    if (!queue) {
      throw new Error('Job queue not initialized - call JobQueue.start() first');
    }
    return queue;
  }

  /**
   * Enqueue any registered job by name
   */
  static async enqueue<T extends BaseJobProps>(
    jobName: string,
    props: T
  ): Promise<Job> {
    const job = await this.queue.createJob({
      type: jobName,
      targetId: props.targetId,
      userId: props.userId,
      parameters: props
    });

    if (!job) {
      return BaseJob.createDeduplicatedPlaceholder(jobName);
    }

    return job;
  }

  /**
   * Schedule any registered job by name
   */
  static async schedule<T extends BaseJobProps>(
    jobName: string,
    scheduledAt: Date,
    props: T
  ): Promise<Job> {
    const job = await this.queue.createJob({
      type: jobName,
      targetId: props.targetId,
      userId: props.userId,
      parameters: props,
      scheduledAt
    });

    if (!job) {
      return BaseJob.createDeduplicatedPlaceholder(jobName);
    }

    return job;
  }

  /**
   * Get list of available job types
   */
  static getAvailableJobTypes(): string[] {
    return this.queue.getAvailableJobTypes();
  }
}

/**
 * Export global JobHelper for convenient access
 * Usage: JobHelper.enqueue('MyJob', props) or JobHelper.schedule('MyJob', date, props)
 */
export const JobHelper = GlobalJobHelper;