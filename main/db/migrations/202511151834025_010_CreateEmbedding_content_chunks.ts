/**
 * Create embedding_content_chunks table
 *
 * Generated on: 2025-11-15T18:34:02.599Z
 *
 * Changes:
 * Creating table &quot;embedding_content_chunks&quot; with:
  • 13 column(s)
  • 2 foreign key(s)
  • 7 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateEmbedding_content_chunks_202511151834025_010 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateEmbedding_content_chunks_202511151834025_010',
    tableName: 'embedding_content_chunks',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create embedding_content_chunks table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_content_chunks" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "chunkHash" TEXT NOT NULL,
  "chunkId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "embeddedAt" datetime,
  "embeddingContentId" varchar NOT NULL,
  "error" TEXT,
  "lanceDbId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  FOREIGN KEY ("embeddingContentId") REFERENCES "embedding_contents" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "embedding_content_chunks"
        `);
  }
}