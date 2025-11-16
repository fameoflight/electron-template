/**
 * Create messages table
 *
 * Generated on: 2025-11-15T18:34:02.572Z
 *
 * Changes:
 * Creating table &quot;messages&quot; with:
  • 9 column(s)
  • 4 foreign key(s)
  • 3 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateMessages_202511151834025_008 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateMessages_202511151834025_008',
    tableName: 'messages',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create messages table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "messages" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "chatId" varchar NOT NULL,
  "currentVersionId" varchar NOT NULL,
  "llmModelId" varchar,
  "role" TEXT NOT NULL,
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("currentVersionId") REFERENCES "message_versions" ("id"),
  FOREIGN KEY ("chatId") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "messages"
        `);
  }
}