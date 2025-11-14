import { Repository, In, Not, IsNull, LessThanOrEqual } from 'typeorm';
import { Job, JobStatus } from '@main/db/entities/Job.js';
import { User } from '@main/base/db/User.js';
import { DataSourceProvider } from '@base/db/index.js';
import { BaseJob, BaseJobProps } from '@main/base/jobs/BaseJob.js';

/**
 * Job status metadata interface for consolidated updates
 */
export interface JobStatusMetadata {
  error?: string;
  result?: any;
  nextRetryAt?: Date;
}

/**
 * Simple Job Queue - Unified job management system
 *
 * This consolidates JobWorker + JobService into a single class while preserving
 * all the powerful functionality including retries, cancellation, and monitoring.
 *
 * Key simplifications:
 * - Direct BaseJob execution instead of IJobExecutor interface
 * - Single class instead of JobWorker + JobService separation
 * - Simple job registration instead of complex registry pattern
 * - Same polling and retry logic but easier to understand
 */
class JobQueue {
  private jobRepo: Repository<Job>;
  private jobs = new Map<string, new () => BaseJob>();
  private runningJobs = new Map<string, { job: Job; controller: AbortController; startTime: number }>();

  // Configuration
  private MAX_CONCURRENT_JOBS = 20; // Increased for chat streaming (configurable)
  private POLL_INTERVAL_MS = 100; // 100ms for near real-time (configurable)
  private readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly DEFAULT_MAX_RETRIES = 3;

  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCleanupTime = 0;

  // Singleton for BaseJob static methods
  private static instance: JobQueue | null = null;

  constructor() {
    this.jobRepo = DataSourceProvider.get().getRepository(Job);
    JobQueue.instance = this;
  }

  /**
   * Get the current JobQueue instance
   * Used by BaseJob to access the queue
   */
  static getInstance(): JobQueue | null {
    return JobQueue.instance;
  }

  // ==================== Job Registration ====================

  /**
   * Register a job class
   * Simple direct registration instead of complex auto-discovery
   */
  registerJob<T extends BaseJob>(jobClass: new () => T): void {
    const jobName = (jobClass as any).jobName || jobClass.name;
    this.jobs.set(jobName, jobClass);
    console.log(`✓ Registered job: ${jobName}`);
  }

  /**
   * Register multiple jobs at once
   */
  registerJobs(jobClasses: Array<new () => BaseJob>): void {
    for (const jobClass of jobClasses) {
      this.registerJob(jobClass);
    }
  }

  /**
   * Get list of registered job types
   */
  getAvailableJobTypes(): string[] {
    return Array.from(this.jobs.keys());
  }

  // ==================== Queue Lifecycle ====================

  /**
   * Set user and apply their job queue settings
   */
  setUser(user?: User | null): void {
    const settings = user?.metadata?.jobQueue;

    if (settings) {
      this.MAX_CONCURRENT_JOBS = settings.maxConcurrentJobs ?? 20;
      this.POLL_INTERVAL_MS = settings.pollIntervalMs ?? 100;

      console.log(`[JobQueue] Configured for user ${user.username}:`, {
        maxConcurrentJobs: this.MAX_CONCURRENT_JOBS,
        pollIntervalMs: this.POLL_INTERVAL_MS
      });
    }
  }

  /**
   * Start the job queue
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[JobQueue] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[JobQueue] ✓ Started with ${this.jobs.size} job types (max concurrent: ${this.MAX_CONCURRENT_JOBS}, polling: ${this.POLL_INTERVAL_MS}ms)`);

    this.intervalId = setInterval(() => this.tick(), this.POLL_INTERVAL_MS);
  }

  /**
   * Stop the job queue
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[JobQueue] Stopped');
  }

  /**
   * Get queue status
   */
  getStatus(): {
    isRunning: boolean;
    intervalMs: number;
    runningJobs: Array<{
      id: string;
      type: string;
      startTime: number;
      duration: number;
    }>;
    concurrency: {
      max: number;
      current: number;
      available: number;
    };
    jobTypes: string[];
  } {
    const now = Date.now();
    const runningJobInfo = Array.from(this.runningJobs.entries()).map(([id, context]) => ({
      id,
      type: context.job.type,
      startTime: context.startTime,
      duration: now - context.startTime
    }));

    return {
      isRunning: this.isRunning,
      intervalMs: this.POLL_INTERVAL_MS,
      runningJobs: runningJobInfo,
      concurrency: {
        max: this.MAX_CONCURRENT_JOBS,
        current: this.runningJobs.size,
        available: this.MAX_CONCURRENT_JOBS - this.runningJobs.size
      },
      jobTypes: this.getAvailableJobTypes()
    };
  }

  // ==================== Job Creation (Called by BaseJob) ====================

  /**
   * Create a new job (called by BaseJob.performLater)
   */
  async createJob(data: {
    type: string;
    targetId: string;
    userId: string;
    parameters?: any;
    scheduledAt?: Date;
    priority?: number;
    dedupeKey?: string;
  }): Promise<Job | null> {
    // Check for deduplication
    if (data.dedupeKey) {
      const existingJob = await this.jobRepo.findOne({
        where: {
          dedupeKey: data.dedupeKey,
          status: In([JobStatus.PENDING, JobStatus.RUNNING])
        }
      });

      if (existingJob) {
        console.log(`🔄 Job with dedupeKey '${data.dedupeKey}' already exists (status: ${existingJob.status}), skipping`);
        return null;  // Return null to trigger placeholder creation in BaseJob
      }
    }

    const job = this.jobRepo.create({
      ...data,
      status: JobStatus.PENDING,
      queuedAt: new Date(),
      retryCount: 0,
      priority: data.priority ?? 0
    });

    return await this.jobRepo.save(job);
  }

  // ==================== Main Execution Loop ====================

  /**
   * Main polling loop - looks for pending jobs and executes them
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Check job capacity
    if (this.runningJobs.size >= this.MAX_CONCURRENT_JOBS) {
      return;
    }

    try {
      // Periodic cleanup
      await this.performCleanup();

      // Get available job slots
      const availableSlots = this.MAX_CONCURRENT_JOBS - this.runningJobs.size;

      // Get pending jobs
      const pendingJobs = await this.getPendingJobs(availableSlots);

      if (pendingJobs.length === 0) {
        return;
      }

      console.log(`[JobQueue] Found ${pendingJobs.length} pending jobs`);

      // Start jobs in parallel
      const executionPromises = pendingJobs.map(job => this.executeJob(job));
      await Promise.allSettled(executionPromises);

    } catch (error) {
      console.error('[JobQueue] Error during tick:', error);
    }
  }

  // ==================== Job Execution ====================

  /**
   * Execute a single job with full error handling and retry logic
   */
  private async executeJob(job: Job): Promise<void> {
    // Check if already running
    if (this.runningJobs.has(job.id)) {
      console.log(`[JobQueue] ⚠️  Job ${job.id} already running, skipping`);
      return;
    }

    // Get job class
    const JobClass = this.jobs.get(job.type);
    if (!JobClass) {
      console.error(`[JobQueue] ✗ No job class found for type: ${job.type}`);
      await this.updateJobStatus(job.id, JobStatus.FAILED, {
        error: `No job class found for type: ${job.type}`
      });
      return;
    }

    // Create job instance and execution context
    const controller = new AbortController();
    const jobInstance = new JobClass();

    // Set the current job entity on the instance so postpone() can access it
    jobInstance.setCurrentJob(job);

    this.runningJobs.set(job.id, {
      job,
      controller,
      startTime: Date.now()
    });

    try {
      console.log(`[JobQueue] 🚀 Starting job ${job.id} (${job.type})`);

      // Mark job as running
      await this.updateJobStatus(job.id, JobStatus.RUNNING);

      // Get job metadata for configuration
      const jobMetadata = this.getJobMetadata(jobInstance);

      // Create timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (jobMetadata.timeoutMs) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, jobMetadata.timeoutMs);
      }

      // Execute the job with cancellation support
      const result = await jobInstance.perform(job.parameters!, controller.signal);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle successful completion
      await this.updateJobStatus(job.id, JobStatus.COMPLETED, { result });
      console.log(`[JobQueue] ✅ Job ${job.id} completed successfully`);

    } catch (error) {
      // Check if this is a postponement request
      if (error && (error as any).isPostponement) {
        console.log(`[JobQueue] ⏰ Job ${job.id} postponed, will retry at ${(error as any).nextRetryAt}`);
        // The job status has already been updated by the postpone() method
        // Don't treat this as an error - just log and continue
      } else {
        await this.handleJobError(job, error, controller.signal.aborted);
      }
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  /**
   * Handle job errors with retry logic
   */
  private async handleJobError(job: Job, error: unknown, wasAborted: boolean): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (wasAborted) {
      console.log(`[JobQueue] 🛑 Job ${job.id} was cancelled or timed out`);
      await this.updateJobStatus(job.id, JobStatus.FAILED, {
        error: 'Job was cancelled or timed out'
      });
      return;
    }

    // Get job instance to check retry logic
    const JobClass = this.jobs.get(job.type);
    if (!JobClass) {
      await this.updateJobStatus(job.id, JobStatus.FAILED, {
        error: errorMessage
      });
      return;
    }

    const jobInstance = new JobClass();
    const jobMetadata = this.getJobMetadata(jobInstance);
    const maxRetries = jobMetadata.maxRetries || this.DEFAULT_MAX_RETRIES;

    // Check if should retry
    const shouldRetry = job.retryCount < maxRetries &&
      (!jobMetadata.retryIf || jobMetadata.retryIf(error as Error));

    if (shouldRetry) {
      console.log(`[JobQueue] 🔄 Retrying job ${job.id} (attempt ${job.retryCount + 1}/${maxRetries})`);
      await this.processJobRetry(job.id, errorMessage, jobMetadata);
    } else {
      console.log(`[JobQueue] ❌ Job ${job.id} failed permanently: ${errorMessage}`);
      await this.updateJobStatus(job.id, JobStatus.FAILED, {
        error: errorMessage
      });
    }
  }

  /**
   * Process job retry with exponential backoff
   */
  private async processJobRetry(
    jobId: string,
    error: string,
    jobMetadata: any
  ): Promise<Job | null> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) return null;

    job.retryCount += 1;
    job.error = error;

    // Calculate retry delay
    let delayMs: number;
    if (jobMetadata.retryDelay) {
      delayMs = jobMetadata.retryDelay(job.retryCount);
    } else if (jobMetadata.backoff === 'exponential') {
      const baseDelay = jobMetadata.baseDelay || 60000; // 1 minute default
      const maxDelay = jobMetadata.maxDelay || 2 * 60 * 60 * 1000; // 2 hours max
      delayMs = Math.min(baseDelay * Math.pow(job.retryCount, 2), maxDelay);
    } else {
      // Default linear backoff: 1min, 2min, 3min...
      delayMs = 60000 * job.retryCount;
    }

    job.nextRetryAt = new Date(Date.now() + delayMs);
    job.status = JobStatus.FAILED; // Keep as FAILED until nextRetryAt is reached

    return await this.jobRepo.save(job);
  }

  /**
   * Get job metadata from job instance
   */
  private getJobMetadata(jobInstance: BaseJob): any {
    return Reflect.getMetadata('Job:Options', jobInstance.constructor) || {};
  }

  // ==================== Database Operations ====================

  /**
   * Get pending jobs that are ready to run (ordered by priority, then FIFO)
   */
  private async getPendingJobs(limit: number = 10): Promise<Job[]> {
    return await this.jobRepo.find({
      where: [
        { status: JobStatus.PENDING },
        {
          status: JobStatus.FAILED,
          nextRetryAt: LessThanOrEqual(new Date())
        }
      ],
      order: {
        priority: 'DESC',  // Higher priority first
        queuedAt: 'ASC',   // Then FIFO
        nextRetryAt: 'ASC'
      },
      take: limit,
      relations: ['user']
    });
  }

  /**
   * Update job status with optional metadata
   */
  private async updateJobStatus(
    id: string,
    status: JobStatus,
    metadata?: JobStatusMetadata
  ): Promise<Job | null> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) return null;

    job.status = status;

    if (metadata?.error) {
      job.error = metadata.error;
    }

    if (metadata?.result) {
      job.result = metadata.result;
    }

    if (metadata?.nextRetryAt) {
      job.nextRetryAt = metadata.nextRetryAt;
    }

    // Update timestamps based on status
    if (status === JobStatus.RUNNING && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
    }

    return await this.jobRepo.save(job);
  }

  // ==================== Job Status Management ====================

  /**
   * Postpone a job for execution at a later time
   * Public method for BaseJob.postpone() to call
   */
  async postponeJob(
    jobId: string,
    nextRetryAt: Date,
    reason?: string,
    status: JobStatus = JobStatus.POSTPONED
  ): Promise<Job | null> {
    return await this.updateJobStatus(jobId, status, {
      nextRetryAt,
      error: reason || `Postponed until ${nextRetryAt.toISOString()}`
    });
  }

  // ==================== Maintenance ====================

  /**
   * Perform periodic cleanup
   */
  private async performCleanup(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL_MS) {
      return;
    }

    this.lastCleanupTime = now;

    try {
      console.log('[JobQueue] 🧹 Performing cleanup...');

      // Clean up old completed jobs
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const result = await this.jobRepo.delete({
        status: In([JobStatus.COMPLETED, JobStatus.FAILED]),
        completedAt: LessThanOrEqual(cutoffDate)
      });

      if (result.affected && result.affected > 0) {
        console.log(`[JobQueue] ✓ Deleted ${result.affected} old completed jobs`);
      }

    } catch (error) {
      console.error('[JobQueue] Cleanup failed:', error);
    }
  }

  // ==================== Public API ====================

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const context = this.runningJobs.get(jobId);
    if (!context) {
      return false;
    }

    console.log(`[JobQueue] 🛑 Cancelling job ${jobId}`);
    context.controller.abort();
    return true;
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const [pending, running, completed, failed] = await Promise.all([
      this.jobRepo.count({ where: { status: JobStatus.PENDING } }),
      this.jobRepo.count({ where: { status: JobStatus.RUNNING } }),
      this.jobRepo.count({ where: { status: JobStatus.COMPLETED } }),
      this.jobRepo.count({ where: { status: JobStatus.FAILED } })
    ]);

    return { pending, running, completed, failed };
  }

  /**
   * Execute job immediately (bypass queue)
   */
  async executeJobById(jobId: string): Promise<boolean> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      console.error(`[JobQueue] Job not found: ${jobId}`);
      return false;
    }

    if (job.status !== JobStatus.PENDING) {
      console.error(`[JobQueue] Job ${jobId} not in PENDING status (current: ${job.status})`);
      return false;
    }

    try {
      await this.executeJob(job);
      return true;
    } catch (error) {
      console.error(`[JobQueue] Manual execution failed for job ${jobId}:`, error);
      return false;
    }
  }
}

export default JobQueue;