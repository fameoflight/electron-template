/**
 * Update connections table
 *
 * Generated on: 2025-11-13T11:05:14.975Z
 *
 * Changes:
 * ◎ Modified column &quot;kind&quot;: default: &#x27;&#x27;&#x27;OPENAI&#x27;&#x27;&#x27; → &#x27;OPENAI&#x27;
 * + Added index on (userId)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateConnections_202511131105149_000 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'UpdateConnections_202511131105149_000',
        tableName: 'connections',
        action: 'Update' as any,
        requiresTransaction: true,
        description: 'Update connections table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "connections_temp1763031914975" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "apiKey" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "customHeaders" json,
  "kind" TEXT DEFAULT 'OPENAI',
  "models" json,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "connections_temp1763031914975" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "apiKey", "baseUrl", "customHeaders", "kind", "models", "name", "provider") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "apiKey", "baseUrl", "customHeaders", "kind", "models", "name", "provider" FROM "connections";
            DROP TABLE "connections";
            ALTER TABLE "connections_temp1763031914975" RENAME TO "connections";
            CREATE INDEX "IDX_connection_userId" ON "connections" ("userId");
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "connections_temp1763031914975" (
  "id" varchar NOT NULL,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "apiKey" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "customHeaders" json,
  "kind" TEXT DEFAULT '''OPENAI''',
  "models" json,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "connections_temp1763031914975" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "apiKey", "baseUrl", "customHeaders", "kind", "models", "name", "provider") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "apiKey", "baseUrl", "customHeaders", "kind", "models", "name", "provider" FROM "connections";
            DROP TABLE "connections";
            ALTER TABLE "connections_temp1763031914975" RENAME TO "connections";
            DROP INDEX "IDX_connection_userId";
        `);
    }
}