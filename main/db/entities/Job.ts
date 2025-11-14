/**
 * Job - Custom entity extension
 *
 * This file extends the generated JobBase class.
 * Add custom methods, computed fields, and business logic here.
 *
 * The base class is regenerated from schemas/Job.json
 */
import { Entity, BeforeInsert, Index } from 'typeorm';
import { ObjectType, } from 'type-graphql';
import { JobBase } from './__generated__/JobBase.js';

export { JobStatus } from './__generated__/JobBase.js';

// Job types will use class names as strings, following Rails convention
// Examples: 'EmailNotificationHandler', 'DataSyncHandler', 'CleanupHandler'
export type JobType = string;


@Index(['userId'])
@Index(['status', 'type'])
@Index(['targetId', 'type'])
@Index(['nextRetryAt'])
@Index(['status', 'queuedAt'])
@ObjectType({ description: 'Background job for async task execution' })
@Entity('jobs')
export class Job extends JobBase {
  // Add any custom methods or computed fields here

  @BeforeInsert()
  setQueuedAt() {
    if (!this.queuedAt) {
      this.queuedAt = new Date();
    }
  }
}