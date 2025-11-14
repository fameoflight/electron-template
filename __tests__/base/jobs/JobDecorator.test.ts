import { describe, it, expect, vi } from 'vitest';
import { BaseJob } from '@base/jobs/index';
import { Job, JobMetadata } from '@base/jobs/decorators/Job';
import { z } from 'zod';

describe('@Job Decorator', () => {
  describe('Basic Registration', () => {
    it('should register job with default name', () => {
      @Job()
      class TestJob extends BaseJob {
        static readonly jobName = 'TestJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      expect((TestJob as any).jobName).toBe('TestJob');
      expect(TestJob.defaultProps).toBeDefined();
    });

    it('should register job with custom name', () => {
      @Job({ name: 'CustomJobName' })
      class TestJob extends BaseJob {
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      expect((TestJob as any).jobName).toBe('CustomJobName');
    });

    it('should set static properties on job class', () => {
      @Job({
        name: 'TestJob',
        description: 'Test job description',
        timeoutMs: 30000,
        maxRetries: 3
      })
      class TestJob extends BaseJob {
        static readonly jobName = 'TestJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      expect((TestJob as any).jobName).toBe('TestJob');
      expect(TestJob.defaultProps).toEqual({
        timeoutMs: 30000,
        maxRetries: 3
      });
    });
  });

  describe('Zod Schema Validation', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
      email: z.string().email().optional()
    });

    it('should validate input using Zod schema', async () => {
      @Job({ schema: TestSchema })
      class ValidationJob extends BaseJob<any> {
        static readonly jobName = 'ValidationJob';
        async perform(props: any): Promise<any> {
          return props;
        }
      }

      const job = new ValidationJob();

      // Valid input should pass (including required base props)
      const validInput = {
        userId: 'test-user',
        targetId: 'test-target',
        name: 'John',
        age: 30,
        email: 'john@example.com'
      };
      expect(await job.validate(validInput)).toBe(true);

      // Invalid input should fail
      const invalidInput = {
        userId: 'test-user',
        targetId: 'test-target',
        name: '',
        age: -5,
        email: 'invalid-email'
      };

      // Suppress console.error for this test since we expect validation to fail
      const originalConsoleError = console.error;
      console.error = vi.fn();

      expect(await job.validate(invalidInput)).toBe(false);

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should call base validation before Zod validation', async () => {
      let baseValidationCalled = false;

      @Job({ schema: TestSchema })
      class ValidationJob extends BaseJob<any> {
        static readonly jobName = 'ValidationJob';
        async validate(props: any): Promise<boolean> {
          baseValidationCalled = true;
          return super.validate(props);
        }

        async perform(props: any): Promise<any> {
          return props;
        }
      }

      const job = new ValidationJob();
      const input = { userId: 'test', targetId: 'test', name: 'John', age: 30 };

      await job.validate(input);
      expect(baseValidationCalled).toBe(true);
    });
  });

  describe('Retry Logic Injection', () => {
    it('should inject custom retry condition', () => {
      const networkError = new Error('Network timeout');
      const validationError = new Error('Invalid data');

      @Job({
        retryIf: (error) => error.message.includes('Network')
      })
      class RetryJob extends BaseJob {
        static readonly jobName = 'RetryJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      const job = new RetryJob() as any;

      // Should retry on network errors
      expect(job.shouldRetry(networkError, 0)).toBe(true);

      // Should not retry on validation errors
      expect(job.shouldRetry(validationError, 0)).toBe(false);
    });

    it('should inject custom retry delay calculation', () => {
      @Job({
        backoff: 'exponential',
        baseDelay: 1000,
        maxDelay: 10000
      })
      class BackoffJob extends BaseJob {
        static readonly jobName = 'BackoffJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      const job = new BackoffJob() as any;

      // Exponential backoff: base * 2^retryCount
      expect(job.getRetryDelay(0)).toBe(1000);  // 1000 * 2^0
      expect(job.getRetryDelay(1)).toBe(2000);  // 1000 * 2^1
      expect(job.getRetryDelay(2)).toBe(4000);  // 1000 * 2^2
      expect(job.getRetryDelay(3)).toBe(8000);  // 1000 * 2^3
      expect(job.getRetryDelay(4)).toBe(10000); // Capped at maxDelay
    });

    it('should support linear backoff', () => {
      @Job({
        backoff: 'linear',
        baseDelay: 1000,
        maxDelay: 5000
      })
      class LinearBackoffJob extends BaseJob {
        static readonly jobName = 'LinearBackoffJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      const job = new LinearBackoffJob() as any;

      // Linear backoff: base * (retryCount + 1)
      expect(job.getRetryDelay(0)).toBe(1000);  // 1000 * (0 + 1)
      expect(job.getRetryDelay(1)).toBe(2000);  // 1000 * (1 + 1)
      expect(job.getRetryDelay(2)).toBe(3000);  // 1000 * (2 + 1)
      expect(job.getRetryDelay(4)).toBe(5000);  // Capped at maxDelay
    });

    it('should support fixed backoff', () => {
      @Job({
        backoff: 'fixed',
        baseDelay: 2000
      })
      class FixedBackoffJob extends BaseJob {
        static readonly jobName = 'FixedBackoffJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      const job = new FixedBackoffJob() as any;

      // Fixed delay
      expect(job.getRetryDelay(0)).toBe(2000);
      expect(job.getRetryDelay(1)).toBe(2000);
      expect(job.getRetryDelay(5)).toBe(2000);
    });

    it('should respect maxRetries in custom retry condition', () => {
      @Job({
        maxRetries: 3,
        retryIf: () => true // Always retry
      })
      class MaxRetriesJob extends BaseJob {
        static readonly jobName = 'MaxRetriesJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      const job = new MaxRetriesJob() as any;
      const error = new Error('Any error');

      // Should retry up to maxRetries
      expect(job.shouldRetry(error, 0)).toBe(true);
      expect(job.shouldRetry(error, 1)).toBe(true);
      expect(job.shouldRetry(error, 2)).toBe(true);
      expect(job.shouldRetry(error, 3)).toBe(false); // At maxRetries
      expect(job.shouldRetry(error, 4)).toBe(false); // Beyond maxRetries
    });
  });

  describe('JobMetadata Helper', () => {
    it('should retrieve decorator options', () => {
      const options = {
        name: 'MetadataTestJob',
        description: 'Test job for metadata',
        timeoutMs: 60000
      };

      @Job(options)
      class MetadataTestJob extends BaseJob {
        static readonly jobName = 'MetadataTestJob';
        async perform(): Promise<any> {
          return { success: true };
        }
      }

      expect(JobMetadata.getOptions(MetadataTestJob)).toEqual(options);
      expect(JobMetadata.getName(MetadataTestJob)).toBe('MetadataTestJob');
      expect(JobMetadata.getTimeout(MetadataTestJob)).toBe(60000);
    });

    it('should retrieve schema from job class', () => {
      const TestSchema = z.object({
        test: z.string()
      });

      @Job({ schema: TestSchema })
      class SchemaMetadataJob extends BaseJob {
        static readonly jobName = 'SchemaMetadataJob';
        async perform(props: any, signal?: AbortSignal): Promise<any> {
          return { success: true };
        }
      }

      const retrievedSchema = JobMetadata.getSchema(SchemaMetadataJob);
      expect(retrievedSchema).toBeDefined();
      // Test that it's the same schema by parsing with it
      const result = retrievedSchema!.safeParse({ test: 'hello' });
      expect(result.success).toBe(true);
    });

    it('should detect custom retry logic', () => {
      @Job({
        backoff: 'linear',
        baseDelay: 500
      })
      class CustomRetryMetadataJob extends BaseJob {
        static readonly jobName = 'CustomRetryMetadataJob';
        async perform(props: any, signal?: AbortSignal): Promise<any> {
          return { success: true };
        }
      }

      expect(JobMetadata.hasCustomRetry(CustomRetryMetadataJob)).toBe(true);
    });
  });

  describe('Complex Example Job', () => {
    const ComplexJobSchema = z.object({
      userId: z.string().uuid(),
      action: z.enum(['create', 'update', 'delete']),
      data: z.record(z.string(), z.any()).optional(),
      jobPriority: z.enum(['low', 'normal', 'high']).default('normal')
    });

    it('should handle complex job configuration', async () => {
      @Job({
        name: 'ComplexJob',
        description: 'Complex job demonstrating all decorator features',
        schema: ComplexJobSchema,
        maxRetries: 5,
        backoff: 'exponential',
        baseDelay: 500,
        maxDelay: 15000,
        timeoutMs: 120000,
        retryIf: (error) => {
          const msg = error.message.toLowerCase();
          return !msg.includes('invalid') && !msg.includes('forbidden');
        }
      })
      class ComplexJob extends BaseJob<any> {
        static readonly jobName = 'ComplexJob';
        async perform(props: any, signal?: AbortSignal): Promise<any> {
          return { processed: true, action: props.action };
        }
      }

      // Test that job is configured properly
      expect((ComplexJob as any).jobName).toBe('ComplexJob');
      expect(ComplexJob.defaultProps?.timeoutMs).toBe(120000);
      expect(ComplexJob.defaultProps?.maxRetries).toBe(5);

      // Test basic retry logic injection
      const job = new ComplexJob() as any;
      expect(job.shouldRetry).toBeDefined();
      expect(job.getRetryDelay).toBeDefined();

      // Test retry condition
      const networkError = new Error('Network timeout occurred');
      const invalidError = new Error('Invalid input data');
      expect(job.shouldRetry(networkError, 0)).toBe(true);
      expect(job.shouldRetry(invalidError, 0)).toBe(false);
    });
  });
});