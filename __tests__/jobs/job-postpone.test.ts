/**
 * Job Postponement Tests
 *
 * Tests for the postpone() functionality in BaseJob that allows jobs to
 * reschedule themselves when they're not ready to execute.
 */

import { describe, it, expect } from 'vitest';
import JobQueue from '@main/services/JobQueue.js';
import { BaseJob, BaseJobProps } from '@base/jobs/index.js';
import { getEntity } from '@main/db/entityMap.js';
import { createTestDatabase, cleanupTestDatabase } from '@tests/base/index.js';
import DataSourceProvider from '@main/base/db/DataSourceProvider.js';
import { JobStatus } from '@main/db/entities/Job.js';

// Test job implementation for postponement testing
interface TestJobProps {
  dataId: string;
  shouldPostpone?: boolean;
  postponeSeconds?: number;
  invalidPostponeSeconds?: boolean;
}

class TestJob extends BaseJob<TestJobProps> {
  static readonly jobName = 'TestJob';

  async perform(props: TestJobProps): Promise<any> {
    if (props.shouldPostpone) {
      if (props.invalidPostponeSeconds) {
        await this.postpone(-5, 'Invalid negative seconds');
      } else {
        await this.postpone(props.postponeSeconds || 10, 'Test postponement');
      }
      return null; // Won't reach here due to postpone throwing
    }

    return { processed: true, dataId: props.dataId };
  }
}

let testDataSource: any;

/**
 * Test helper to set up real JobQueue for testing
 */
async function setupTestJobQueue(): Promise<JobQueue> {
  // Create isolated test database
  testDataSource = await createTestDatabase();

  // Get User entity
  const User = getEntity('User');

  // Create a test user for foreign key constraints
  const userRepo = testDataSource.getRepository(User);
  const testUser = userRepo.create({
    id: 'test-user-123',
    name: 'Test User',
    username: 'testuser123',
    password: 'test-password-hash'
  });
  await userRepo.save(testUser);

  // Create and start JobQueue
  const jobQueue = new JobQueue();
  jobQueue.registerJob(TestJob);
  await jobQueue.start();

  return jobQueue;
}

/**
 * Test helper to clean up JobQueue
 */
async function cleanupTestJobQueue(jobQueue: JobQueue | undefined): Promise<void> {
  if (jobQueue) {
    await jobQueue.stop();
  }
  if (testDataSource) {
    DataSourceProvider.clearTestDataSource();
    await cleanupTestDatabase(testDataSource);
  }
}

describe('Job Postponement', () => {
  let jobQueue: JobQueue;

  beforeEach(async () => {
    jobQueue = await setupTestJobQueue();
  });

  afterEach(async () => {
    await cleanupTestJobQueue(jobQueue);
  });

  it('should postpone job execution when called from perform()', async () => {
    const userId = 'test-user-123';
    const targetId = 'target-456';
    const dataId = 'data-789';

    // Create a job that will postpone itself
    const job = await TestJob.performLater(
      userId,
      targetId,
      {
        dataId,
        shouldPostpone: true,
        postponeSeconds: 5
      }
    );

    expect(job).toBeDefined();
    expect(job.id).toBeDefined();

    // Wait a moment for job to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check that job was postponed
    const Job = getEntity('Job');
    const jobRepo = testDataSource.getRepository(Job);
    const updatedJob = await jobRepo.findOne({
      where: { id: job.id }
    });

    expect(updatedJob).toBeDefined();
    expect(updatedJob!.status).toBe(JobStatus.POSTPONED);
    expect(updatedJob!.nextRetryAt).toBeDefined();
    expect(updatedJob!.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
    expect(updatedJob!.error).toContain('Test postponement');
  });

  it('should not postpone job when postpone is not called', async () => {
    const userId = 'test-user-123';
    const targetId = 'target-456';
    const dataId = 'data-789';

    // Create a job that will complete normally
    const job = await TestJob.performLater(
      userId,
      targetId,
      {
        dataId,
        shouldPostpone: false
      }
    );

    expect(job).toBeDefined();

    // Wait for job to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check that job completed successfully
    const Job = getEntity('Job');
    const jobRepo = testDataSource.getRepository(Job);
    const updatedJob = await jobRepo.findOne({
      where: { id: job.id }
    });

    expect(updatedJob).toBeDefined();
    expect(updatedJob!.status).toBe(JobStatus.COMPLETED);
    expect(updatedJob!.nextRetryAt).toBeNull();
    expect(updatedJob!.result).toEqual({ processed: true, dataId });
  });

  it('should throw error if postpone is called outside job execution', async () => {
    const testJob = new TestJob();

    await expect(
      testJob.postpone(10, 'Should fail')
    ).rejects.toThrow('postpone() can only be called during job execution');
  });

  it('should throw error if postpone seconds is not positive', async () => {
    const userId = 'test-user-123';
    const targetId = 'target-456';

    // Create job that tries to postpone with negative seconds
    const job = await TestJob.performLater(
      userId,
      targetId,
      {
        dataId: 'test',
        shouldPostpone: true,
        invalidPostponeSeconds: true // This triggers negative seconds
      }
    );

    // Wait for job to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check that job failed due to invalid postpone seconds
    const Job = getEntity('Job');
    const jobRepo = testDataSource.getRepository(Job);
    const updatedJob = await jobRepo.findOne({
      where: { id: job.id }
    });

    expect(updatedJob).toBeDefined();
    expect(updatedJob!.status).toBe(JobStatus.FAILED);
    expect(updatedJob!.error).toContain('requires positive number of seconds');
  });

  it('should schedule postponement at correct time', async () => {
    const userId = 'test-user-123';
    const targetId = 'target-456';
    const postponeSeconds = 30;

    const job = await TestJob.performLater(
      userId,
      targetId,
      {
        dataId: 'time-test',
        shouldPostpone: true,
        postponeSeconds
      }
    );

    // Wait for initial processing
    await new Promise(resolve => setTimeout(resolve, 200));

    const Job = getEntity('Job');
    const jobRepo = testDataSource.getRepository(Job);
    const updatedJob = await jobRepo.findOne({
      where: { id: job.id }
    });

    expect(updatedJob).toBeDefined();
    expect(updatedJob!.nextRetryAt).toBeDefined();

    // Check that nextRetryAt is approximately 30 seconds from now
    const expectedTime = Date.now() + (postponeSeconds * 1000);
    const actualTime = updatedJob!.nextRetryAt!.getTime();
    const tolerance = 1000; // 1 second tolerance

    expect(Math.abs(actualTime - expectedTime)).toBeLessThan(tolerance);
  });

  it('should update job record with proper postponement metadata', async () => {
    const userId = 'test-user-123';
    const targetId = 'target-456';
    const reason = 'External data source unavailable';

    const job = await TestJob.performLater(
      userId,
      targetId,
      {
        dataId: 'metadata-test',
        shouldPostpone: true,
        postponeSeconds: 15
      }
    );

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200));

    const Job = getEntity('Job');
    const jobRepo = testDataSource.getRepository(Job);
    const updatedJob = await jobRepo.findOne({
      where: { id: job.id }
    });

    expect(updatedJob).toBeDefined();
    expect(updatedJob!.status).toBe(JobStatus.POSTPONED);
    expect(updatedJob!.error).toContain('Test postponement');
    expect(updatedJob!.nextRetryAt).toBeDefined();
    expect(updatedJob!.retryCount).toBe(0); // Should not increment retry count for postponement
    expect(updatedJob!.completedAt).toBeNull();
  });
});