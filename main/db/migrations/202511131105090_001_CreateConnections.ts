/**
 * Create connections table
 *
 * Generated on: 2025-11-13T11:05:09.099Z
 *
 * Changes:
 * Creating table &quot;connections&quot; with:
  • 12 column(s)
  • 1 foreign key(s)
  • 1 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateConnections_202511131105090_001 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'CreateConnections_202511131105090_001',
        tableName: 'connections',
        action: 'Create' as any,
        requiresTransaction: false,
        description: 'Create connections table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "connections" (
  "id" varchar NOT NULL PRIMARY KEY,
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
)
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            DROP TABLE "connections"
        `);
    }
}