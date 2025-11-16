/**
 * Update message_versions table
 *
 * Generated on: 2025-11-15T18:34:06.488Z
 *
 * Changes:
 * ◎ Modified column &quot;isRegenerated&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;status&quot;: default: &#x27;&#x27;&#x27;pending&#x27;&#x27;&#x27; → &#x27;pending&#x27;
 * + Added index on (messageId)
 * + Added index on (llmModelId)
 * + Added index on (createdAt)
 * + Added index on (messageId, createdAt)
 * + Added index on (llmModelId, createdAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateMessage_versions_202511151834064_006 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateMessage_versions_202511151834064_006',
    tableName: 'message_versions',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update message_versions table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "message_versions_temp1763231646488" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "content" TEXT NOT NULL,
  "contextMetadata" json,
  "contextTokens" INTEGER,
  "generationTime" INTEGER,
  "isRegenerated" boolean DEFAULT 0,
  "llmModelId" varchar NOT NULL,
  "messageId" varchar,
  "parentVersionId" varchar,
  "status" TEXT DEFAULT 'pending',
  FOREIGN KEY ("parentVersionId") REFERENCES "message_versions" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "messages" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "message_versions_temp1763231646488" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "content", "contextMetadata", "contextTokens", "generationTime", "isRegenerated", "llmModelId", "messageId", "parentVersionId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "content", "contextMetadata", "contextTokens", "generationTime", "isRegenerated", "llmModelId", "messageId", "parentVersionId", "status" FROM "message_versions";
            DROP TABLE "message_versions";
            ALTER TABLE "message_versions_temp1763231646488" RENAME TO "message_versions";
            CREATE INDEX "IDX_messageversion_messageId" ON "message_versions" ("messageId");
            CREATE INDEX "IDX_messageversion_llmModelId" ON "message_versions" ("llmModelId");
            CREATE INDEX "IDX_messageversion_createdAt" ON "message_versions" ("createdAt");
            CREATE INDEX "IDX_messageversion_messageId_createdAt" ON "message_versions" ("messageId", "createdAt");
            CREATE INDEX "IDX_messageversion_llmModelId_createdAt" ON "message_versions" ("llmModelId", "createdAt");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "message_versions_temp1763231646488" (
  "id" varchar NOT NULL,
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
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "messages" ("id"),
  FOREIGN KEY ("parentVersionId") REFERENCES "message_versions" ("id")
);
            INSERT INTO "message_versions_temp1763231646488" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "content", "contextMetadata", "contextTokens", "generationTime", "isRegenerated", "llmModelId", "messageId", "parentVersionId", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "content", "contextMetadata", "contextTokens", "generationTime", "isRegenerated", "llmModelId", "messageId", "parentVersionId", "status" FROM "message_versions";
            DROP TABLE "message_versions";
            ALTER TABLE "message_versions_temp1763231646488" RENAME TO "message_versions";
            DROP INDEX "IDX_messageversion_messageId";
            DROP INDEX "IDX_messageversion_llmModelId";
            DROP INDEX "IDX_messageversion_createdAt";
            DROP INDEX "IDX_messageversion_messageId_createdAt";
            DROP INDEX "IDX_messageversion_llmModelId_createdAt";
        `);
  }
}