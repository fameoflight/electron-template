/**
 * Update embedding_contents table
 *
 * Generated on: 2025-11-15T18:33:07.602Z
 *
 * Changes:
 * ⇒ Added foreign key: fileId → file_entities.id
 * ⇍ Removed foreign key: fileId → files.id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateEmbedding_contents_202511151833076_000 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateEmbedding_contents_202511151833076_000',
    tableName: 'embedding_contents',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update embedding_contents table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_contents_temp1763231587602" (
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
            INSERT INTO "embedding_contents_temp1763231587602" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId" FROM "embedding_contents";
            DROP TABLE "embedding_contents";
            ALTER TABLE "embedding_contents_temp1763231587602" RENAME TO "embedding_contents";
            -- Note: Foreign key removal handled via table recreation above
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_contents_temp1763231587602" (
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
  "name" TEXT DEFAULT 'Untitled Content',
  "status" TEXT NOT NULL,
  "fileId" varchar,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("fileId") REFERENCES "files" ("id")
);
            INSERT INTO "embedding_contents_temp1763231587602" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "contentHash", "contentId", "contentType", "embeddingModelId", "error", "metadata", "name", "status", "fileId" FROM "embedding_contents";
            DROP TABLE "embedding_contents";
            ALTER TABLE "embedding_contents_temp1763231587602" RENAME TO "embedding_contents";
            ALTER TABLE "embedding_contents" ADD CONSTRAINT "fk_embedding_contents_fileId" FOREIGN KEY ("fileId") REFERENCES "files" ("id");
        `);
  }
}