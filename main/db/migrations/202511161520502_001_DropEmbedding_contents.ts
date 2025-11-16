/**
 * Drop embedding_contents table
 *
 * Generated on: 2025-11-16T15:20:50.280Z
 *
 * Changes:
 * Dropping table &quot;embedding_contents&quot; and all its data
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class DropEmbedding_contents_202511161520502_001 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'DropEmbedding_contents_202511161520502_001',
    tableName: 'embedding_contents',
    action: 'Drop' as any,
    requiresTransaction: false,
    description: 'Drop embedding_contents table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "embedding_contents"
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_contents" (
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
  "name" TEXT DEFAULT '''Untitled Content''',
  "status" TEXT NOT NULL,
  "fileId" varchar,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("fileId") REFERENCES "file_entities" ("id")
)
        `);
  }
}