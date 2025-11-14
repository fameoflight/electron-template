/**
 * Simplified job system infrastructure
 *
 * Clean job system with decorator-based configuration:
 * - @Job: Single decorator for all job configuration
 * - BaseJob<T>: Base class for creating jobs
 * - JobHelper: Global job enqueue helper
 */

export { BaseJob, JobHelper } from './BaseJob.js';
export { Job, JobMetadata } from './decorators/Job.js';
export type {
  BaseJobProps,
  SystemJobProps
} from './BaseJob.js';