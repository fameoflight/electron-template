/**
 * Create chats table
 *
 * Generated on: 2025-11-15T18:34:02.585Z
 *
 * Changes:
 * Creating table &quot;chats&quot; with:
  • 12 column(s)
  • 2 foreign key(s)
  • 4 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateChats_202511151834025_009 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateChats_202511151834025_009',
    tableName: 'chats',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create chats table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "chats" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "description" TEXT,
  "llmModelId" varchar NOT NULL,
  "status" TEXT DEFAULT '''active''',
  "streamingStatus" TEXT DEFAULT '''idle''',
  "systemPrompt" TEXT,
  "tags" json,
  "title" TEXT NOT NULL,
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "chats"
        `);
  }
}