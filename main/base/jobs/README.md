# Rails-Like Job System

This directory contains a Rails-inspired job system that provides auto-discovery and elegant enqueue APIs for background job processing.

## Features

- ✅ **Auto-discovery**: Automatically picks up job classes from the `main/jobs` folder
- ✅ **Rails-like APIs**: `performLater()`, `performAt()`, `performNow()` methods
- ✅ **Typed payloads**: Strong typing for job parameters and system properties
- ✅ **System properties**: Built-in support for `timeoutMs`, `maxRetries`, etc.
- ✅ **Direct integration**: Works directly with JobService and JobWorker

## Quick Start

### 1. Create a Job Class

```typescript
// main/jobs/MyJob.ts
import { BaseJob } from "@base/jobs/BaseJob.js";
import { BaseJobProps } from "@base/jobs/JobType.js";

interface MyJobProps extends BaseJobProps {
  message: string;
  priority: number;
}

export class MyJob extends BaseJob<MyJobProps> {
  static readonly jobName = "MyJob";

  static readonly defaultProps = {
    timeoutMs: 5000,
    maxRetries: 3,
  };

  async perform(props: MyJobProps): Promise<any> {
    console.log(
      `Processing: ${props.message} with priority: ${props.priority}`
    );
    return { success: true, processedAt: new Date() };
  }
}
```

### 2. Use Rails-like APIs

```typescript
import { MyJob } from "@main/jobs/MyJob.js";

// Enqueue for background execution
await MyJob.performLater({
  userId: "user123",
  targetId: "task456",
  message: "Hello World",
  priority: 1,
  timeoutMs: 10000, // Override default timeout
});

// Schedule for specific time
await MyJob.performAt(
  new Date(Date.now() + 3600000), // 1 hour from now
  {
    userId: "user123",
    targetId: "task456",
    message: "Scheduled task",
    priority: 2,
  }
);

// Execute immediately (synchronous)
const result = await MyJob.performNow({
  userId: "user123",
  targetId: "task456",
  message: "Immediate task",
  priority: 3,
});
```

### 3. Use Global Job Helper

```typescript
import { Job } from "@base/jobs/BaseJob.js";

// Enqueue any registered job by name
await Job.enqueue("MyJob", {
  userId: "user123",
  targetId: "task456",
  message: "Via global helper",
  priority: 1,
  timeoutMs: 15000,
});

// Schedule any registered job
await Job.schedule("MyJob", new Date(Date.now() + 7200000), {
  userId: "user123",
  targetId: "task456",
  message: "Scheduled via helper",
  priority: 2,
});
```

## Job Properties

Jobs support both **job-specific props** and **system props**:

```typescript
interface MyJobProps extends BaseJobProps {
  // Job-specific properties
  documentId: string;
  action: "process" | "delete" | "archive";

  // System properties (inherited from BaseJobProps)
  timeoutMs?: number; // Execution timeout in milliseconds
  maxRetries?: number; // Maximum retry attempts
  retryable?: boolean; // Whether job should be retried
  priority?: number; // Job priority (higher = more priority)
  queue?: string; // Queue to run job in
}

// Usage with system properties
await MyJob.performLater({
  userId: "user123",
  targetId: "doc456",
  documentId: "doc456",
  action: "process",
  timeoutMs: 30000, // Custom timeout
  maxRetries: 5, // Custom retry limit
  priority: 10, // High priority
  queue: "processing", // Run in processing queue
});
```

## Available Example Jobs

### 1. DataCleanupJob

Performs maintenance and cleanup operations.

```typescript
import { DataCleanupJob } from "@main/jobs/DataCleanupJob.js";

await DataCleanupJob.performLater({
  userId: "system",
  targetId: "cleanup_batch",
  cleanupType: "old_jobs",
  olderThanDays: 30,
  dryRun: false,
  timeoutMs: 300000, // 5 minutes for heavy cleanup
});
```

## Job Lifecycle

Jobs follow this lifecycle:

1. **PENDING** → Created and queued
2. **RUNNING** → Being executed by JobWorker
3. **COMPLETED** → Finished successfully
4. **FAILED** → Failed with error (may retry)

## Retry Logic

Jobs support automatic retry with exponential backoff:

```typescript
class MyJob extends BaseJob<MyJobProps> {
  // Custom retry logic
  shouldRetry(error: Error, retryCount: number): boolean {
    // Don't retry validation errors
    if (error.message.includes("validation")) {
      return false;
    }
    // Retry up to 3 times
    return retryCount < 3;
  }

  // Custom retry delay
  getRetryDelay(retryCount: number): number {
    // Custom delays: 30s, 2min, 5min
    const delays = [30000, 120000, 300000];
    return delays[Math.min(retryCount, delays.length - 1)];
  }
}
```

## Initialization

The job system automatically initializes itself when the JobWorker starts:

```typescript
// main/index.ts or similar startup file
import { JobWorker } from "./services/JobWorker.js";

async function startApp() {
  const jobWorker = new JobWorker();
  await jobWorker.start(); // Auto-discovers and registers jobs

  // Continue with app startup...
}
```

For manual initialization (useful for testing or standalone usage):

```typescript
import { JobDiscovery } from "@base/jobs/JobDiscovery.js";

// Auto-discover jobs manually
await JobDiscovery.getInstance().discoverJobs();
```

## Integration with Existing System

This job system is designed to work with your existing:

- **JobService**: Enhanced to validate new job types
- **JobWorker**: Automatically registers discovered handlers
- **Job Entity**: Compatible with existing database schema

## Best Practices

1. **Keep jobs focused**: Single responsibility per job
2. **Use timeouts**: Always set appropriate timeouts
3. **Make jobs idempotent**: Safe to run multiple times
4. **Validate inputs**: Implement custom validation
5. **Handle failures gracefully**: Custom retry logic where needed
6. **Use descriptive names**: Clear job names and descriptions

## Architecture Note

This job system uses an adapter pattern where:

- **Modern API**: Developers use `BaseJob<T>` classes with Rails-like methods

This gives you the best of both worlds - clean modern APIs with robust internal execution.
