/**
 * Create message_versions table
 *
 * Generated on: 2025-11-15T18:34:02.560Z
 *
 * Changes:
 * Creating table &quot;message_versions&quot; with:
  • 14 column(s)
  • 4 foreign key(s)
  • 5 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateMessage_versions_202511151834025_007 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateMessage_versions_202511151834025_007',
    tableName: 'message_versions',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create message_versions table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "message_versions" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "content" TEXT NOT NULL,
  "contextMetadata" json,
  "contextTokens" INTEGER,
  "generationTime" INTEGER,
  "isRegenerated" boolean DEFAULT '0',
  "llmModelId" varchar NOT NULL,
  "messageId" varchar,
  "parentVersionId" varchar,
  "status" TEXT DEFAULT '''pending''',
  FOREIGN KEY ("parentVersionId") REFERENCES "message_versions" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "messages" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "message_versions"
        `);
  }
}