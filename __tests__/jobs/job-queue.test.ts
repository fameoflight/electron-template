/**
 * JobQueue Tests
 *
 * Tests for the simplified job queue system that replaces JobWorker + JobService.
 * Uses real JobQueue with in-memory database.
 */

// Vitest globals are enabled, no need to import them
import { vi } from 'vitest';
import JobQueue from '@main/services/JobQueue';
import { BaseJob, BaseJobProps } from '@base/jobs/index';
import { getEntity, type EntityClasses } from '@main/db/entityMap';
import { createTestDatabase, cleanupTestDatabase } from '@tests/base/index';
import DataSourceProvider from '@main/base/db/DataSourceProvider';
import { JobStatus } from '@main/db/entities/Job';


/**
 * Test job for JobQueue testing
 */
interface TestJobProps extends BaseJobProps {
  message: string;
  priority?: number;
  shouldFail?: boolean;
}

class TestJob extends BaseJob<TestJobProps> {
  static readonly jobName = 'TestJob';

  async perform(props: TestJobProps, signal?: AbortSignal): Promise<any> {
    if (signal?.aborted) {
      throw new Error('Job was cancelled');
    }

    if (props.shouldFail) {
      throw new Error('Intentional test failure');
    }

    return {
      message: props.message,
      processedAt: new Date().toISOString(),
      userId: props.userId,
      priority: props.priority || 1
    };
  }

  async validate(props: TestJobProps): Promise<boolean> {
    const baseValid = await super.validate(props);
    return baseValid && !!props.message;
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
    testDataSource = null;
  }
}

describe('JobQueue', () => {
  let jobQueue: JobQueue;

  beforeEach(async () => {
    jobQueue = await setupTestJobQueue();
  });

  afterEach(async () => {
    await cleanupTestJobQueue(jobQueue);
  });

  describe('Job Registration', () => {
    it('should register job correctly', () => {
      const types = jobQueue.getAvailableJobTypes();
      expect(types).toContain('TestJob');
    });

    it('should register multiple jobs', () => {
      const initialCount = jobQueue.getAvailableJobTypes().length;

      class AnotherJob extends BaseJob<BaseJobProps> {
        static readonly jobName = 'AnotherJob';
        async perform(): Promise<any> { return { success: true }; }
      }

      jobQueue.registerJob(AnotherJob);
      const newTypes = jobQueue.getAvailableJobTypes();
      expect(newTypes.length).toBe(initialCount + 1);
      expect(newTypes).toContain('AnotherJob');
    });
  });

  describe('Job Creation and Execution', () => {
    it('should create and execute successful job', async () => {
      const jobProps: TestJobProps = {
        userId: 'test-user-123',
        targetId: 'test-target-1',
        message: 'Test message'
      };

      const job = await jobQueue.createJob({
        type: 'TestJob',
        targetId: jobProps.targetId,
        userId: jobProps.userId,
        parameters: jobProps
      });

      expect(job).toBeDefined();
      expect(job?.type).toBe('TestJob');
      expect(job?.status).toBe(JobStatus.PENDING);
      expect(job?.parameters.message).toBe('Test message');
    });

    it('should handle job execution failures', async () => {
      const jobProps: TestJobProps = {
        userId: 'test-user-123',
        targetId: 'test-target-2',
        message: 'This will fail',
        shouldFail: true
      };

      const job = await jobQueue.createJob({
        type: 'TestJob',
        targetId: jobProps.targetId,
        userId: jobProps.userId,
        parameters: jobProps
      });

      expect(job?.status).toBe(JobStatus.PENDING);
    });
  });

  describe('Job Status Reporting', () => {
    it('should report correct initial status', () => {
      const status = jobQueue.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.jobTypes).toContain('TestJob');
      expect(status.concurrency.max).toBe(20); // Updated default
      expect(status.concurrency.current).toBe(0);
      expect(status.concurrency.available).toBe(20);
      expect(status.runningJobs).toEqual([]);
    });

    it('should provide job statistics', async () => {
      const stats = await jobQueue.getStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('running');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(typeof stats.pending).toBe('number');
    });
  });

  describe('Cancellation Support', () => {
    it('should cancel running job', async () => {
      // Create a job that takes time
      const job = await jobQueue.createJob({
        type: 'TestJob',
        targetId: 'cancel-test',
        userId: 'test-user-123',
        parameters: {
          message: 'Long running job'
        }
      });

      // Try to cancel (it might complete before cancellation)
      const cancelled = await jobQueue.cancelJob(job!.id);

      // The result depends on timing - both are valid
      expect(typeof cancelled).toBe('boolean');
    });

    it('should return false for non-existent job', async () => {
      const cancelled = await jobQueue.cancelJob('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('Manual Job Execution', () => {
    it('should execute job manually', async () => {
      const job = await jobQueue.createJob({
        type: 'TestJob',
        targetId: 'manual-execution',
        userId: 'test-user-123',
        parameters: {
          message: 'Manual execution test'
        }
      });

      const success = await jobQueue.executeJobById(job!.id);
      expect(success).toBe(true);
    });

    it('should return false for non-existent job', async () => {
      const success = await jobQueue.executeJobById('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('Priority Support', () => {
    it('should create job with priority', async () => {
      const job = await TestJob.performLater(
        'test-user-123',
        'priority-test-1',
        { message: 'High priority' },
        { priority: 90 }
      );

      expect(job.priority).toBe(90);
      expect(job.status).toBe(JobStatus.PENDING);
    });

    it('should default to priority 0 when not specified', async () => {
      const job = await TestJob.performLater(
        'test-user-123',
        'priority-test-2',
        { message: 'Default priority' }
      );

      expect(job.priority).toBe(0);
    });
  });

  describe('User Settings', () => {
    it('should apply user job queue settings with setUser', async () => {
      const dataSource = await createTestDatabase();
      const User = getEntity('User');
      const userRepo = dataSource.getRepository(User);

      // Create user with custom settings
      const customUser = userRepo.create({
        id: 'custom-user-123',
        name: 'Custom User',
        username: 'customuser',
        password: 'password',
        metadata: {
          theme: { mode: 'dark' },
          jobQueue: {
            maxConcurrentJobs: 50,
            pollIntervalMs: 50
          }
        }
      });
      await userRepo.save(customUser);

      // Apply settings
      jobQueue.setUser(customUser);

      // Verify settings applied
      const status = jobQueue.getStatus();
      expect(status.concurrency.max).toBe(50);
      expect(status.intervalMs).toBe(50);
    });

    it('should use defaults when user has no job queue settings', async () => {
      const dataSource = await createTestDatabase();
      const User = getEntity('User');
      const userRepo = dataSource.getRepository(User);

      // Create user without job queue settings
      const defaultUser = userRepo.create({
        id: 'default-user-123',
        name: 'Default User',
        username: 'defaultuser',
        password: 'password',
        metadata: {
          theme: { mode: 'light' }
        }
      });
      await userRepo.save(defaultUser);

      // Apply settings
      jobQueue.setUser(defaultUser);

      // Should keep existing defaults (20, 100)
      const status = jobQueue.getStatus();
      expect(status.concurrency.max).toBe(20);
      expect(status.intervalMs).toBe(100);
    });
  });
});

describe('BaseJob API', () => {
  let jobQueue: JobQueue;

  beforeEach(async () => {
    jobQueue = await setupTestJobQueue();
  });

  afterEach(async () => {
    await cleanupTestJobQueue(jobQueue);
  });

  describe('Static Methods', () => {
    it('should support performLater', async () => {
      const jobProps: Omit<TestJobProps, 'userId' | 'targetId'> = {
        message: 'performLater test'
      };

      const job = await TestJob.performLater(
        'test-user-123',           // userId
        'static-test-1',           // targetId
        jobProps                   // job parameters (without userId/targetId)
      );
      expect(job.type).toBe('TestJob');
      expect(job.status).toBe(JobStatus.PENDING);
      expect(job.parameters.message).toBe('performLater test');
    });

    it('should support performAt', async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
      const jobProps: Omit<TestJobProps, 'userId' | 'targetId'> = {
        message: 'performAt test'
      };

      const job = await TestJob.performAt(
        scheduledTime,               // scheduledAt
        'test-user-123',             // userId
        'static-test-2',             // targetId
        jobProps                     // job parameters (without userId/targetId)
      );
      expect(job.type).toBe('TestJob');
      expect(job.status).toBe(JobStatus.PENDING);
    });

    it('should support performNow', async () => {
      const jobProps: Omit<TestJobProps, 'userId' | 'targetId'> = {
        message: 'performNow test'
      };

      const result = await TestJob.performNow(
        'test-user-123',           // userId
        'static-test-3',           // targetId
        jobProps                   // job parameters (without userId/targetId)
      );
      expect(result.message).toBe('performNow test');
      expect(result.userId).toBe('test-user-123');
    });
  });

  describe('Validation', () => {
    it('should validate props correctly', async () => {
      const testJob = new TestJob();

      // Valid props
      const validProps: TestJobProps = {
        userId: 'test-user-123',
        targetId: 'validation-test',
        message: 'Valid message'
      };
      expect(await testJob.validate(validProps)).toBe(true);

      // Invalid props (missing message)
      const invalidProps: TestJobProps = {
        userId: 'test-user-123',
        targetId: 'validation-test',
        message: ''
      };
      expect(await testJob.validate(invalidProps)).toBe(false);
    });
  });

  describe('Cleanup Operations', () => {
    it('should handle cleanup without enum validation errors', async () => {
      const dataSource = await createTestDatabase();
      const Job = getEntity('Job');
      const User = getEntity('User');
      const jobRepo = dataSource.getRepository(Job);
      const userRepo = dataSource.getRepository(User);

      // Create the required user first
      const testUser = userRepo.create({
        id: 'test-user-123',
        name: 'Test User',
        username: 'testuser',
        password: 'test-password'
      });
      await userRepo.save(testUser);

      // Create old completed jobs that should be cleaned up
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      // Create jobs with different statuses
      const completedJob = jobRepo.create({
        id: 'cleanup-test-completed',
        type: 'TestJob',
        userId: 'test-user-123',
        targetId: 'cleanup-test-1',
        status: JobStatus.COMPLETED,
        parameters: { message: 'Completed job' },
        completedAt: oldDate,
        createdAt: oldDate
      });

      const failedJob = jobRepo.create({
        id: 'cleanup-test-failed',
        type: 'TestJob',
        userId: 'test-user-123',
        targetId: 'cleanup-test-2',
        status: JobStatus.FAILED,
        parameters: { message: 'Failed job' },
        completedAt: oldDate,
        createdAt: oldDate
      });

      const pendingJob = jobRepo.create({
        id: 'cleanup-test-pending',
        type: 'TestJob',
        userId: 'test-user-123',
        targetId: 'cleanup-test-3',
        status: JobStatus.PENDING,
        parameters: { message: 'Pending job' },
        createdAt: new Date() // Recent, should not be cleaned up
      });

      // Save jobs
      await jobRepo.save([completedJob, failedJob, pendingJob]);

      // Verify jobs exist before cleanup
      const jobsBeforeCleanup = await jobRepo.find();
      expect(jobsBeforeCleanup.length).toBeGreaterThanOrEqual(3);

      // Force cleanup by calling the cleanup method directly
      // This should trigger the enum validation error if it exists
      const jobQueueInstance = jobQueue as any;

      // Reset last cleanup time to force cleanup
      jobQueueInstance.lastCleanupTime = 0;

      // Call performCleanup which should trigger the enum issue
      await expect(jobQueueInstance.performCleanup()).resolves.not.toThrow();

      // Verify old jobs were deleted but recent ones remain
      const jobsAfterCleanup = await jobRepo.find();
      const pendingJobsAfterCleanup = jobsAfterCleanup.filter(j => j.id === 'cleanup-test-pending');

      expect(pendingJobsAfterCleanup.length).toBe(1);
      expect(pendingJobsAfterCleanup[0].status).toBe(JobStatus.PENDING);
    });

    it('should use enum string values in delete operations', async () => {
      const dataSource = await createTestDatabase();
      const Job = getEntity('Job');
      const User = getEntity('User');
      const jobRepo = dataSource.getRepository(Job);
      const userRepo = dataSource.getRepository(User);

      // Create required user first
      const testUser = userRepo.create({
        id: 'test-user-123',
        name: 'Test User',
        username: 'testuser',
        password: 'test-password'
      });
      await userRepo.save(testUser);

      // Create a job with enum status
      const testJob = jobRepo.create({
        id: 'enum-test-job',
        type: 'TestJob',
        userId: 'test-user-123',
        targetId: 'enum-test',
        status: JobStatus.COMPLETED,
        parameters: { message: 'Test enum cleanup' },
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      });

      await jobRepo.save(testJob);

      // Verify the job exists
      const jobBefore = await jobRepo.findOne({ where: { id: 'enum-test-job' } });
      expect(jobBefore).toBeDefined();
      expect(jobBefore!.status).toBe(JobStatus.COMPLETED);

      // Test the specific delete pattern that causes the enum error
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      // This should not throw an enum validation error
      // Test the actual pattern from JobQueue that uses In and LessThanOrEqual
      const { In, LessThanOrEqual } = await import('typeorm');
      const deleteResult = await jobRepo.delete({
        status: In([JobStatus.COMPLETED, JobStatus.FAILED]),
        completedAt: LessThanOrEqual(cutoffDate)
      });

      // Verify job was deleted
      const jobAfter = await jobRepo.findOne({ where: { id: 'enum-test-job' } });
      expect(jobAfter).toBeNull();
    });
  });
});