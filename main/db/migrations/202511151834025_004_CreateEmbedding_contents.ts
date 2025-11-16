/**
 * Create embedding_contents table
 *
 * Generated on: 2025-11-15T18:34:02.523Z
 *
 * Changes:
 * Creating table &quot;embedding_contents&quot; with:
  • 14 column(s)
  • 3 foreign key(s)
  • 6 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateEmbedding_contents_202511151834025_004 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateEmbedding_contents_202511151834025_004',
    tableName: 'embedding_contents',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create embedding_contents table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
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
  FOREIGN KEY ("fileId") REFERENCES "file_entities" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "embedding_contents"
        `);
  }
}