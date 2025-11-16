/**
 * Update embedding_contents table
 *
 * Generated on: 2025-11-15T18:34:06.557Z
 *
 * Changes:
 * ◎ Modified column &quot;name&quot;: default: &#x27;&#x27;&#x27;Untitled Content&#x27;&#x27;&#x27; → &#x27;Untitled Content&#x27;
 * + Added index on (userId)
 * + Added index on (contentId)
 * + Added index on (contentType)
 * + Added index on (status)
 * + Added index on (contentId, contentType)
 * + Added index on (userId, status)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateEmbedding_contents_202511151834065_009 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateEmbedding_contents_202511151834065_009',
    tableName: 'embedding_contents',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update embedding_contents table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_contents_temp1763231646557" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "contentHash" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "embeddingModelId" varchar NOT NULL,
  "error" TEXT,
  "metadata" json,
  "name" TEXT DEFAULT 'Untitled Content',
  "status" TEXT NOT NULL,
  "fileId" varchar,
  FOREIGN KEY ("fileId") REFERENCES "file_entities" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "embedding_contents_temp1763231646557" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId" FROM "embedding_contents";
            DROP TABLE "embedding_contents";
            ALTER TABLE "embedding_contents_temp1763231646557" RENAME TO "embedding_contents";
            CREATE INDEX "IDX_embeddingcontent_userId" ON "embedding_contents" ("userId");
            CREATE INDEX "IDX_embeddingcontent_contentId" ON "embedding_contents" ("contentId");
            CREATE INDEX "IDX_embeddingcontent_contentType" ON "embedding_contents" ("contentType");
            CREATE INDEX "IDX_embeddingcontent_status" ON "embedding_contents" ("status");
            CREATE INDEX "IDX_embeddingcontent_contentId_contentType" ON "embedding_contents" ("contentId", "contentType");
            CREATE INDEX "IDX_embeddingcontent_userId_status" ON "embedding_contents" ("userId", "status");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_contents_temp1763231646557" (
  "id" varchar NOT NULL,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "contentHash" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "embeddingModelId" varchar NOT NULL,
  "error" TEXT,
  "metadata" json,
  "name" TEXT DEFAULT '''Untitled Content''',
  "status" TEXT NOT NULL,
  "fileId" varchar,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("fileId") REFERENCES "file_entities" ("id")
);
            INSERT INTO "embedding_contents_temp1763231646557" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId" FROM "embedding_contents";
            DROP TABLE "embedding_contents";
            ALTER TABLE "embedding_contents_temp1763231646557" RENAME TO "embedding_contents";
            DROP INDEX "IDX_embeddingcontent_userId";
            DROP INDEX "IDX_embeddingcontent_contentId";
            DROP INDEX "IDX_embeddingcontent_contentType";
            DROP INDEX "IDX_embeddingcontent_status";
            DROP INDEX "IDX_embeddingcontent_contentId_contentType";
            DROP INDEX "IDX_embeddingcontent_userId_status";
        `);
  }
}