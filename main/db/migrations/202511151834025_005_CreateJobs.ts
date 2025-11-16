/**
 * Create jobs table
 *
 * Generated on: 2025-11-15T18:34:02.536Z
 *
 * Changes:
 * Creating table &quot;jobs&quot; with:
  • 20 column(s)
  • 1 foreign key(s)
  • 5 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateJobs_202511151834025_005 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateJobs_202511151834025_005',
    tableName: 'jobs',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create jobs table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "jobs" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "completedAt" datetime,
  "dedupeKey" TEXT,
  "error" TEXT,
  "nextRetryAt" datetime,
  "parameters" json NOT NULL,
  "priority" INTEGER DEFAULT '0',
  "queuedAt" datetime,
  "result" json,
  "retryCount" INTEGER DEFAULT '0',
  "scheduledAt" datetime,
  "startedAt" datetime,
  "status" TEXT DEFAULT '''PENDING''',
  "targetId" TEXT NOT NULL,
  "timeoutMS" INTEGER DEFAULT '300000',
  "type" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "jobs"
        `);
  }
}