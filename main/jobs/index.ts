/**
 * Simple Job Registration System
 *
 * Replaces complex registry auto-discovery with explicit job registration.
 * Much easier to understand, debug, and test.
 *
 * Usage: import { registerJobs } from '@main/jobs/index.js'
 *        await registerJobs(jobQueue)
 */

import JobQueue from '@main/services/JobQueue.js';

// Import all job classes
import { StreamMessageVersionJob } from './StreamMessageVersionJob.js';
import { ChatTitleJob } from '@main/jobs/ChatTitleJob.js';
import { ProcessFileJob } from '@main/jobs/ProcessFileJob.js';

const jobClasses = [
  StreamMessageVersionJob,
  ChatTitleJob,
  ProcessFileJob
];


/**
 * Register all jobs with the JobQueue
 *
 * This is now explicit and transparent - you can see exactly which jobs
 * are being registered and debug any issues easily.
 */
export async function registerJobs(queue: JobQueue): Promise<void> {
  queue.registerJobs(jobClasses);

  console.log(`✓ Registered ${queue.getAvailableJobTypes().length} jobs: ${queue.getAvailableJobTypes().join(', ')}`);
}
/**
 * Get list of all available job classes (useful for testing)
 */
export function getAllJobClasses(): Array<new () => any> {
  return jobClasses;
}