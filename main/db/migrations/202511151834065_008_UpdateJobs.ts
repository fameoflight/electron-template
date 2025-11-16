/**
 * Update jobs table
 *
 * Generated on: 2025-11-15T18:34:06.532Z
 *
 * Changes:
 * ◎ Modified column &quot;priority&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;retryCount&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;status&quot;: default: &#x27;&#x27;&#x27;PENDING&#x27;&#x27;&#x27; → &#x27;PENDING&#x27;
 * ◎ Modified column &quot;timeoutMS&quot;: default: &#x27;300000&#x27; → 300000
 * + Added index on (userId)
 * + Added index on (status, type)
 * + Added index on (targetId, type)
 * + Added index on (nextRetryAt)
 * + Added index on (status, queuedAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateJobs_202511151834065_008 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateJobs_202511151834065_008',
    tableName: 'jobs',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update jobs table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "jobs_temp1763231646532" (
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
  "priority" INTEGER DEFAULT 0,
  "queuedAt" datetime,
  "result" json,
  "retryCount" INTEGER DEFAULT 0,
  "scheduledAt" datetime,
  "startedAt" datetime,
  "status" TEXT DEFAULT 'PENDING',
  "targetId" TEXT NOT NULL,
  "timeoutMS" INTEGER DEFAULT 300000,
  "type" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "jobs_temp1763231646532" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "completedAt", "dedupeKey", "error", "nextRetryAt", "parameters", "priority", "queuedAt", "result", "retryCount", "scheduledAt", "startedAt", "status", "targetId", "timeoutMS", "type") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "completedAt", "dedupeKey", "error", "nextRetryAt", "parameters", "priority", "queuedAt", "result", "retryCount", "scheduledAt", "startedAt", "status", "targetId", "timeoutMS", "type" FROM "jobs";
            DROP TABLE "jobs";
            ALTER TABLE "jobs_temp1763231646532" RENAME TO "jobs";
            CREATE INDEX "IDX_79ae682707059d5f7655db4212" ON "jobs" ("userId");
            CREATE INDEX "IDX_dc6f555dc06b89ce79ca00685b" ON "jobs" ("status", "type");
            CREATE INDEX "IDX_20ae324fe515977851739a96fe" ON "jobs" ("targetId", "type");
            CREATE INDEX "IDX_dd4d18f81c0a9ba900a9502ecf" ON "jobs" ("nextRetryAt");
            CREATE INDEX "IDX_76d494a3c5009428606a4dea04" ON "jobs" ("status", "queuedAt");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "jobs_temp1763231646532" (
  "id" varchar NOT NULL,
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
);
            INSERT INTO "jobs_temp1763231646532" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "completedAt", "dedupeKey", "error", "nextRetryAt", "parameters", "priority", "queuedAt", "result", "retryCount", "scheduledAt", "startedAt", "status", "targetId", "timeoutMS", "type") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "completedAt", "dedupeKey", "error", "nextRetryAt", "parameters", "priority", "queuedAt", "result", "retryCount", "scheduledAt", "startedAt", "status", "targetId", "timeoutMS", "type" FROM "jobs";
            DROP TABLE "jobs";
            ALTER TABLE "jobs_temp1763231646532" RENAME TO "jobs";
            DROP INDEX "IDX_79ae682707059d5f7655db4212";
            DROP INDEX "IDX_dc6f555dc06b89ce79ca00685b";
            DROP INDEX "IDX_20ae324fe515977851739a96fe";
            DROP INDEX "IDX_dd4d18f81c0a9ba900a9502ecf";
            DROP INDEX "IDX_76d494a3c5009428606a4dea04";
        `);
  }
}