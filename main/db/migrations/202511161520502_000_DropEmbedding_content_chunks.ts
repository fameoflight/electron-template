/**
 * Drop embedding_content_chunks table
 *
 * Generated on: 2025-11-16T15:20:50.234Z
 *
 * Changes:
 * Dropping table &quot;embedding_content_chunks&quot; and all its data
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class DropEmbedding_content_chunks_202511161520502_000 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'DropEmbedding_content_chunks_202511161520502_000',
    tableName: 'embedding_content_chunks',
    action: 'Drop' as any,
    requiresTransaction: false,
    description: 'Drop embedding_content_chunks table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "embedding_content_chunks"
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
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
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingContentId") REFERENCES "embedding_contents" ("id")
)
        `);
  }
}