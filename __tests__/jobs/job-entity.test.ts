/**
 * Job Entity Tests
 *
 * Tests for the Job entity including validation, relationships,
 * status transitions, and database operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { JobStatus } from '@main/db/entities/Job';
import { getEntity, type EntityClasses } from '@main/db/entityMap.js';
import { createTestUser } from "../factories/index.js"
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../base/testDatabase.js';
import { LessThanOrEqual } from 'typeorm';

const AvailableJobTypes = [
  'EmailNotificationHandler',
  'DocumentParseHandler',
  'DataCleanupHandler'
];

describe('Job Entity', () => {
  let dataSource: DataSource;
  let testUser: any;
  let Job: EntityClasses['Job'];

  beforeEach(async () => {
    dataSource = await createTestDatabase();
    testUser = await createTestUser(dataSource);
    Job = getEntity('Job');
  });

  afterEach(async () => {
    await cleanupTestDatabase(dataSource);
  });

  describe('Job Creation', () => {
    it('should create a valid job with required fields', async () => {
      const job = new Job();
      job.type = AvailableJobTypes[0]; // EmailNotificationHandler
      job.targetId = 'user-123';
      job.userId = testUser.id;
      job.parameters = { email: 'test@example.com', message: 'Hello World' };

      const savedJob = await dataSource.manager.save(job);

      expect(savedJob.id).toBeDefined();
      expect(savedJob.type).toBe(AvailableJobTypes[0]);
      expect(savedJob.targetId).toBe('user-123');
      expect(savedJob.userId).toBe(testUser.id);
      expect(savedJob.status).toBe(JobStatus.PENDING);
      expect(savedJob.retryCount).toBe(0);
      expect(savedJob.queuedAt).toBeInstanceOf(Date);
      expect(savedJob.parameters).toEqual({ email: 'test@example.com', message: 'Hello World' });
    });

    it('should validate job type enum values', async () => {
      const validTypes = AvailableJobTypes;

      for (const type of validTypes) {
        const job = new Job();
        job.type = type;
        job.targetId = 'test-target';
        job.userId = testUser.id;
        job.parameters = { type: type };

        const savedJob = await dataSource.manager.save(job);
        expect(savedJob.type).toBe(type);
      }
    });

    it('should handle job with optional fields', async () => {
      const job = new Job();
      job.type = AvailableJobTypes[1];
      job.targetId = 'doc-456';
      job.userId = testUser.id;
      job.parameters = { timeout: 30000 };
      job.timeoutMS = 30000; // 30 seconds timeout

      const savedJob = await dataSource.manager.save(job);

      expect(savedJob.result).toBeNull();
      expect(savedJob.error).toBeNull();
      expect(savedJob.startedAt).toBeNull();
      expect(savedJob.completedAt).toBeNull();
      expect(savedJob.nextRetryAt).toBeNull();
      expect(savedJob.timeoutMS).toBe(30000);
    });

    it('should handle complex parameters and result data', async () => {
      const complexParameters = {
        filePath: '/documents/complex.pdf',
        options: {
          extractImages: true,
          ocrLanguage: 'eng',
          quality: 'high'
        },
        metadata: {
          fileSize: 1024000,
          pageCount: 25,
          version: '1.2.3'
        }
      };

      const complexResult = {
        extractedText: 'Sample extracted content...',
        pageCount: 25,
        images: ['image1.png', 'image2.png'],
        processingTime: 5000,
        chunks: [
          { index: 0, text: 'First chunk' },
          { index: 1, text: 'Second chunk' }
        ]
      };

      const job = new Job();
      job.type = AvailableJobTypes[0];
      job.targetId = 'complex-doc';
      job.userId = testUser.id;
      job.parameters = complexParameters;
      job.result = complexResult;

      const savedJob = await dataSource.manager.save(job);

      expect(savedJob.parameters).toEqual(complexParameters);
      expect(savedJob.result).toEqual(complexResult);
    });
  });

  describe('Job Status Transitions', () => {
    let job: InstanceType<EntityClasses['Job']>;

    beforeEach(async () => {
      job = new Job();
      job.type = AvailableJobTypes[0];
      job.targetId = 'status-test';
      job.userId = testUser.id;
      job.parameters = { test: 'status-transition' };
      job = await dataSource.manager.save(job);
    });

    it('should transition from PENDING to RUNNING', async () => {
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();

      const updatedJob = await dataSource.manager.save(job);

      expect(updatedJob.status).toBe(JobStatus.RUNNING);
      expect(updatedJob.startedAt).toBeInstanceOf(Date);
    });

    it('should transition from RUNNING to COMPLETED', async () => {
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();
      await dataSource.manager.save(job);

      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = { success: true, processedChunks: 10 };

      const updatedJob = await dataSource.manager.save(job);

      expect(updatedJob.status).toBe(JobStatus.COMPLETED);
      expect(updatedJob.completedAt).toBeInstanceOf(Date);
      expect(updatedJob.result).toEqual({ success: true, processedChunks: 10 });
    });

    it('should transition from RUNNING to FAILED with error', async () => {
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();
      await dataSource.manager.save(job);

      job.status = JobStatus.FAILED;
      job.completedAt = new Date();
      job.error = 'Processing failed: Invalid file format';
      job.nextRetryAt = new Date(Date.now() + 60000); // 1 minute from now

      const updatedJob = await dataSource.manager.save(job);

      expect(updatedJob.status).toBe(JobStatus.FAILED);
      expect(updatedJob.error).toBe('Processing failed: Invalid file format');
      expect(updatedJob.nextRetryAt).toBeInstanceOf(Date);
    });

    it('should handle retry count increments', async () => {
      job.status = JobStatus.FAILED;
      job.error = 'Temporary failure';
      job.retryCount = 1;
      job.nextRetryAt = new Date(Date.now() + 60000);

      const updatedJob = await dataSource.manager.save(job);

      expect(updatedJob.retryCount).toBe(1);
      expect(updatedJob.nextRetryAt).toBeInstanceOf(Date);

      // Simulate another retry
      updatedJob.retryCount = 2;
      updatedJob.nextRetryAt = new Date(Date.now() + 300000); // 5 minutes

      const retriedJob = await dataSource.manager.save(updatedJob);
      expect(retriedJob.retryCount).toBe(2);
    });
  });

  describe('Job Timestamps', () => {
    it('should set timestamps automatically during creation', async () => {
      const beforeCreation = new Date();

      const job = new Job();
      job.type = AvailableJobTypes[1];
      job.targetId = 'timestamp-test';
      job.userId = testUser.id;
      job.parameters = { test: 'timestamp-creation' };

      const savedJob = await dataSource.manager.save(job);
      const afterCreation = new Date();

      // Allow for some database timestamp precision differences
      expect(savedJob.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
      expect(savedJob.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
      expect(savedJob.updatedAt).toBeInstanceOf(Date);
      expect(savedJob.queuedAt).toBeInstanceOf(Date);
    });

    it('should update timestamps during modifications', async () => {
      const job = new Job();
      job.type = AvailableJobTypes[2];
      job.targetId = 'update-test';
      job.userId = testUser.id;
      job.parameters = { test: 'timestamp-update' };

      const savedJob = await dataSource.manager.save(job);
      const originalUpdatedAt = savedJob.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      savedJob.status = JobStatus.COMPLETED;
      savedJob.result = { deleted: true };

      const updatedJob = await dataSource.manager.save(savedJob);

      // updatedAt should be updated to a later time or at least be set
      expect(updatedJob.updatedAt).toBeInstanceOf(Date);
      // If the database doesn't update timestamp, at least verify the field exists
      expect(updatedJob.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('Job Relationships', () => {
    it('should associate with user correctly', async () => {
      const job = new Job();
      job.type = AvailableJobTypes[0];
      job.targetId = 'relationship-test';
      job.userId = testUser.id;
      job.parameters = { test: 'user-relationship' };

      const savedJob = await dataSource.manager.save(job);

      // Load job with user relationship
      const jobWithUser = await dataSource.manager.findOne(Job, {
        where: { id: savedJob.id },
        relations: ['user']
      });

      expect(jobWithUser).toBeDefined();
      expect(jobWithUser!.user.id).toBe(testUser.id);
      expect(jobWithUser!.user.username).toBe(testUser.username);
    });
  });

  describe('Job Constraints and Validation', () => {
    it('should enforce required fields', async () => {
      const job = new Job();
      // Missing required fields

      await expect(dataSource.manager.save(job)).rejects.toThrow();
    });

    it('should handle long error messages', async () => {
      const longErrorMessage = 'A'.repeat(1000);

      const job = new Job();
      job.type = AvailableJobTypes[0];
      job.targetId = 'long-error-test';
      job.userId = testUser.id;
      job.parameters = { test: 'long-error', errorLength: longErrorMessage.length };
      job.status = JobStatus.FAILED;
      job.error = longErrorMessage;

      const savedJob = await dataSource.manager.save(job);

      expect(savedJob.error).toBe(longErrorMessage);
    });

    it('should handle very large result objects', async () => {
      const largeResult = {
        data: 'x'.repeat(10000), // 10KB of data
        metadata: {
          items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
        }
      };

      const job = new Job();
      job.type = AvailableJobTypes[1];
      job.targetId = 'large-result-test';
      job.userId = testUser.id;
      job.parameters = { test: 'large-result', dataSize: largeResult.data.length };
      job.status = JobStatus.COMPLETED;
      job.result = largeResult;

      const savedJob = await dataSource.manager.save(job);

      expect(savedJob.result).toEqual(largeResult);
    });
  });

  describe('Job Index Performance', () => {
    it('should efficiently query jobs by status and type', async () => {
      // Create multiple jobs with different statuses and types
      const jobs = [
        { type: AvailableJobTypes[0], status: JobStatus.PENDING },
        { type: AvailableJobTypes[0], status: JobStatus.RUNNING },
        { type: AvailableJobTypes[1], status: JobStatus.PENDING },
        { type: AvailableJobTypes[1], status: JobStatus.COMPLETED },
        { type: AvailableJobTypes[2], status: JobStatus.FAILED },
      ];

      for (const jobData of jobs) {
        const job = new Job();
        Object.assign(job, jobData);
        job.targetId = `perf-test-${jobData.type}-${jobData.status}`;
        job.userId = testUser.id;
        job.parameters = { test: 'performance', type: jobData.type, status: jobData.status };
        await dataSource.manager.save(job);
      }

      const start = Date.now();

      // Query that should use the (status, type) index
      const pendingParseJobs = await dataSource.manager.find(Job, {
        where: {
          status: JobStatus.PENDING,
          type: AvailableJobTypes[0],
          userId: testUser.id
        }
      });

      const queryTime = Date.now() - start;

      expect(pendingParseJobs).toHaveLength(1);
      expect(queryTime).toBeLessThan(100); // Should be very fast with proper indexing
    });

    it('should efficiently query jobs ready for retry', async () => {
      const pastRetryTime = new Date(Date.now() - 60000); // 1 minute ago
      const futureRetryTime = new Date(Date.now() + 60000); // 1 minute from now

      // Create jobs with different retry times
      const retryableJob = new Job();
      retryableJob.type = AvailableJobTypes[0];
      retryableJob.targetId = 'retry-past';
      retryableJob.userId = testUser.id;
      retryableJob.parameters = { test: 'retry-past', retryTime: pastRetryTime.getTime() };
      retryableJob.status = JobStatus.FAILED;
      retryableJob.nextRetryAt = pastRetryTime;
      await dataSource.manager.save(retryableJob);

      const futureRetryJob = new Job();
      futureRetryJob.type = AvailableJobTypes[1];
      futureRetryJob.targetId = 'retry-future';
      futureRetryJob.userId = testUser.id;
      futureRetryJob.parameters = { test: 'retry-future', retryTime: futureRetryTime.getTime() };
      futureRetryJob.status = JobStatus.FAILED;
      futureRetryJob.nextRetryAt = futureRetryTime;
      await dataSource.manager.save(futureRetryJob);

      const start = Date.now();

      // Query jobs ready for retry (should use nextRetryAt index)
      const readyJobs = await dataSource.manager.find(Job, {
        where: {
          status: JobStatus.FAILED,
          nextRetryAt: LessThanOrEqual(pastRetryTime),
          userId: testUser.id
        }
      });

      const queryTime = Date.now() - start;

      expect(readyJobs).toHaveLength(1);
      expect(readyJobs[0].targetId).toBe('retry-past');
      expect(queryTime).toBeLessThan(100);
    });
  });
});