/**
 * Job Deduplication Tests
 *
 * Tests for the job deduplication functionality using dedupeKey.
 * Tests various scenarios including string dedupeKeys and function-based dedupeKeys.
 */

import { vi } from 'vitest';
import JobQueue from '@main/services/JobQueue';
import { BaseJob, BaseJobProps } from '@base/jobs/index';
import { Job as JobDecorator } from '@main/base/jobs/decorators/Job';
import { JobStatus } from '@main/db/entities/Job';
import { getEntity } from '@main/db/entityMap';
import { Job } from '@main/db/entities/Job';
import { createTestDatabase, cleanupTestDatabase } from '@tests/base/index';
import { Not, IsNull } from 'typeorm';

/**
 * Test job with simple string deduplication key
 */
interface StringDedupeJobProps {
  resourceId: string;
  action: string;
}

@JobDecorator({
  name: 'StringDedupeJob',
  description: 'Test job with string deduplication key',
  dedupeKey: (props) => `string-dedupe:${props.resourceId}`,  // Dynamic dedupeKey based on resourceId
})
class StringDedupeJob extends BaseJob<StringDedupeJobProps> {
  static readonly jobName = 'StringDedupeJob';

  async perform(props: StringDedupeJobProps & BaseJobProps, signal?: AbortSignal): Promise<any> {
    if (signal?.aborted) {
      throw new Error('Job was cancelled');
    }

    return {
      resourceId: props.resourceId,
      action: props.action,
      processedAt: new Date().toISOString(),
      userId: props.userId
    };
  }
}

/**
 * Test job with function-based deduplication key
 */
interface FunctionDedupeJobProps {
  chatId: string;
  operation: string;
  priority?: number;
}

@JobDecorator({
  name: 'FunctionDedupeJob',
  description: 'Test job with function-based deduplication key',
  dedupeKey: (props) => `function-dedupe:${props.chatId}:${props.operation}`,  // Dynamic dedupeKey based on props
})
class FunctionDedupeJob extends BaseJob<FunctionDedupeJobProps> {
  static readonly jobName = 'FunctionDedupeJob';

  async perform(props: FunctionDedupeJobProps & BaseJobProps, signal?: AbortSignal): Promise<any> {
    if (signal?.aborted) {
      throw new Error('Job was cancelled');
    }

    return {
      chatId: props.chatId,
      operation: props.operation,
      processedAt: new Date().toISOString(),
      userId: props.userId
    };
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

  // Create a test user for foreign key constraints
  const testUser = userRepo.create({
    id: 'test-user-dedupe',
    name: 'Dedupe Test User',
    username: 'dedupetestuser',
    password: 'test-password-hash'
  });
  await userRepo.save(testUser);

  // Create and start JobQueue
  const jobQueue = new JobQueue();
  jobQueue.registerJobs([StringDedupeJob, FunctionDedupeJob]);
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
    await cleanupTestDatabase(testDataSource);
    testDataSource = null;
  }
}

describe('Job Deduplication', () => {
  let jobQueue: JobQueue;

  beforeEach(async () => {
    jobQueue = await setupTestJobQueue();
  });

  afterEach(async () => {
    await cleanupTestJobQueue(jobQueue);
  });

  describe('String Dedupe Key', () => {
    it('should prevent duplicate jobs with same dedupeKey', async () => {
      const resourceId = `resource-${Math.random().toString(36).substr(2, 9)}`;

      // Create first job
      const job1 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId }
      );

      expect(job1).toBeDefined();
      expect(job1.id).not.toBe('deduplicated');
      expect(job1.type).toBe('StringDedupeJob');

      // Create second job with same dedupeKey
      const job2 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId }
      );

      // Second job should be deduplicated (placeholder)
      expect(job2).toBeDefined();
      expect(job2.id).toBe('deduplicated');
      expect(job2.type).toBe('StringDedupeJob');
      expect(job2.status).toBe('COMPLETED');
    });

    it('should allow jobs with different dedupeKeys', async () => {
      const resourceId1 = `resource-${Math.random().toString(36).substr(2, 9)}`;
      const resourceId2 = `resource-${Math.random().toString(36).substr(2, 9)}`;

      // Create two jobs with different dedupeKeys
      const job1 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId1,
        { action: 'process', resourceId: resourceId1 }
      );

      const job2 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId2,
        { action: 'process', resourceId: resourceId2 }
      );

      // Both jobs should be created normally
      expect(job1.id).not.toBe('deduplicated');
      expect(job2.id).not.toBe('deduplicated');
      expect(job1.id).not.toBe(job2.id);
    });

    it('should allow new job after previous job completes', async () => {
      const resourceId = `resource-${Math.random().toString(36).substr(2, 9)}`;

      // Create first job with high priority to ensure it gets processed quickly
      const job1 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId },
        { priority: 100 } // High priority
      );

      expect(job1.id).not.toBe('deduplicated');
      expect(job1.type).toBe('StringDedupeJob');

      // Wait for job to be processed and completed
      // JobQueue polls every 100ms, so we need to wait for it to pick up and complete the job
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      let jobCompleted = false;

      while (attempts < maxAttempts && !jobCompleted) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;

        // Check job status in database
        const jobRepo = jobQueue['jobRepo'];
        const currentJob = await jobRepo.findOne({ where: { id: job1.id } });

        if (currentJob && currentJob.status === JobStatus.COMPLETED) {
          jobCompleted = true;
        }
      }

      // Verify the job actually completed
      expect(jobCompleted).toBe(true);

      // Now create a second job with the same dedupeKey
      // This should be allowed since the first job is COMPLETED
      const job2 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId },
        { priority: 100 }
      );

      // Should create new job since first one is completed
      expect(job2.id).not.toBe('deduplicated');
      expect(job2.id).not.toBe(job1.id);
      expect(job2.type).toBe('StringDedupeJob');

    });
  });

  describe('Function Dedupe Key', () => {
    it('should prevent duplicate jobs with function-based dedupeKey', async () => {
      const chatId = `chat-${Math.random().toString(36).substr(2, 9)}`;

      // Create first job
      const job1 = await FunctionDedupeJob.performLater(
        'test-user-dedupe',
        chatId,
        { chatId, operation: 'generate-title' }
      );

      expect(job1).toBeDefined();
      expect(job1.id).not.toBe('deduplicated');

      // Create second job with same dedupeKey (function generates same key)
      const job2 = await FunctionDedupeJob.performLater(
        'test-user-dedupe',
        chatId,
        { chatId, operation: 'generate-title' }
      );

      // Second job should be deduplicated
      expect(job2.id).toBe('deduplicated');
    });

    it('should allow jobs with different parameters', async () => {
      const chatId = `chat-${Math.random().toString(36).substr(2, 9)}`;

      // Create two jobs with different operations
      const job1 = await FunctionDedupeJob.performLater(
        'test-user-dedupe',
        chatId,
        { chatId, operation: 'generate-title' }
      );

      const job2 = await FunctionDedupeJob.performLater(
        'test-user-dedupe',
        chatId,
        { chatId, operation: 'generate-summary' }
      );

      // Both jobs should be created normally (different dedupeKeys)
      expect(job1.id).not.toBe('deduplicated');
      expect(job2.id).not.toBe('deduplicated');
      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('Dedupe Key Persistence', () => {
    it('should persist dedupeKey in database', async () => {
      const resourceId = `resource-${Math.random().toString(36).substr(2, 9)}`;

      const job = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId }
      );

      // Skip if job was deduplicated
      if (job.id === 'deduplicated') {
        return;
      }

      // Get the job from database
      const jobRepo = jobQueue['jobRepo'];
      const savedJob = await jobRepo.findOne({ where: { id: job.id } });

      expect(savedJob).toBeDefined();
      expect(savedJob!.dedupeKey).toBe(`string-dedupe:${resourceId}`);
    });

    it('should check dedupeKey against database', async () => {
      const resourceId = `resource-${Math.random().toString(36).substr(2, 9)}`;

      // Manually create a job in database with dedupeKey
      const jobRepo = jobQueue['jobRepo'];
      const manualJob = jobRepo.create({
        id: 'manual-job-123',
        type: 'StringDedupeJob',
        userId: 'test-user-dedupe',
        targetId: resourceId,
        status: JobStatus.PENDING,
        parameters: { action: 'process', resourceId },
        dedupeKey: `string-dedupe:${resourceId}`,
        queuedAt: new Date(),
        retryCount: 0,
        priority: 0
      });
      await jobRepo.save(manualJob);

      // Try to create job with same dedupeKey
      const job2 = await StringDedupeJob.performLater(
        'test-user-dedupe',
        resourceId,
        { action: 'process', resourceId }
      );

      // Should be deduplicated
      expect(job2.id).toBe('deduplicated');
    });
  });

  describe('Edge Cases', () => {
    // Define a job without dedupe key for edge case testing
    class NoDedupeJob extends BaseJob<BaseJobProps> {
      static readonly jobName = 'NoDedupeJob';

      async perform(props: BaseJobProps, signal?: AbortSignal): Promise<any> {
        return { processed: true, userId: props.userId };
      }
    }

    it('should handle jobs without dedupeKey normally', async () => {
      // Register the NoDedupeJob for this test
      jobQueue.registerJob(NoDedupeJob);
      const targetId = `target-${Math.random().toString(36).substr(2, 9)}`;

      const job1 = await NoDedupeJob.performLater(
        'test-user-dedupe',
        targetId,
        {}
      );

      const job2 = await NoDedupeJob.performLater(
        'test-user-dedupe',
        targetId,
        {}
      );

      // Both jobs should be created (no deduplication)
      expect(job1.id).not.toBe('deduplicated');
      expect(job2.id).not.toBe('deduplicated');
      expect(job1.id).not.toBe(job2.id);
    });

    it('should handle empty/null dedupeKey gracefully', async () => {
      // This test verifies that the system doesn't break when dedupeKey is not set
      // Since StringDedupeJob now uses dedupeKeys, we use NoDedupeJob instead
      jobQueue.registerJob(NoDedupeJob);

      const job = await NoDedupeJob.performLater(
        'test-user-dedupe',
        `target-${Math.random().toString(36).substr(2, 9)}`,
        {}
      );

      expect(job).toBeDefined();
      expect(job.id).not.toBe('deduplicated');
    });
  });
});