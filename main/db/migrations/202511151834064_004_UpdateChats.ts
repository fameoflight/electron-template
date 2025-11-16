/**
 * Update chats table
 *
 * Generated on: 2025-11-15T18:34:06.448Z
 *
 * Changes:
 * ◎ Modified column &quot;status&quot;: default: &#x27;&#x27;&#x27;active&#x27;&#x27;&#x27; → &#x27;active&#x27;
 * ◎ Modified column &quot;streamingStatus&quot;: default: &#x27;&#x27;&#x27;idle&#x27;&#x27;&#x27; → &#x27;idle&#x27;
 * + Added index on (llmModelId)
 * + Added index on (status)
 * + Added index on (updatedAt)
 * + Added index on (status, updatedAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateChats_202511151834064_004 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateChats_202511151834064_004',
    tableName: 'chats',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update chats table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "chats_temp1763231646448" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "description" TEXT,
  "llmModelId" varchar NOT NULL,
  "status" TEXT DEFAULT 'active',
  "streamingStatus" TEXT DEFAULT 'idle',
  "systemPrompt" TEXT,
  "tags" json,
  "title" TEXT NOT NULL,
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "chats_temp1763231646448" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "description", "llmModelId", "status", "streamingStatus", "systemPrompt", "tags", "title") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "description", "llmModelId", "status", "streamingStatus", "systemPrompt", "tags", "title" FROM "chats";
            DROP TABLE "chats";
            ALTER TABLE "chats_temp1763231646448" RENAME TO "chats";
            CREATE INDEX "IDX_chat_llmModelId" ON "chats" ("llmModelId");
            CREATE INDEX "IDX_chat_status" ON "chats" ("status");
            CREATE INDEX "IDX_chat_updatedAt" ON "chats" ("updatedAt");
            CREATE INDEX "IDX_chat_status_updatedAt" ON "chats" ("status", "updatedAt");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "chats_temp1763231646448" (
  "id" varchar NOT NULL,
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
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id")
);
            INSERT INTO "chats_temp1763231646448" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "description", "llmModelId", "status", "streamingStatus", "systemPrompt", "tags", "title") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "description", "llmModelId", "status", "streamingStatus", "systemPrompt", "tags", "title" FROM "chats";
            DROP TABLE "chats";
            ALTER TABLE "chats_temp1763231646448" RENAME TO "chats";
            DROP INDEX "IDX_chat_llmModelId";
            DROP INDEX "IDX_chat_status";
            DROP INDEX "IDX_chat_updatedAt";
            DROP INDEX "IDX_chat_status_updatedAt";
        `);
  }
}