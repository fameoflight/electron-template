/**
 * Update embedding_content_chunks table
 *
 * Generated on: 2025-11-15T18:34:06.428Z
 *
 * Changes:
 * + Added index on (userId)
 * + Added index on (chunkId)
 * + Added index on (embeddingContentId)
 * + Added index on (status)
 * + Added index on (chunkIndex)
 * + Added index on (embeddingContentId, chunkIndex)
 * + Added index on (embeddingContentId, status)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateEmbedding_content_chunks_202511151834064_003 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateEmbedding_content_chunks_202511151834064_003',
    tableName: 'embedding_content_chunks',
    action: 'Update' as any,
    requiresTransaction: false,
    description: 'Update embedding_content_chunks table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE INDEX "IDX_embeddingcontentchunk_userId" ON "embedding_content_chunks" ("userId");
            CREATE INDEX "IDX_embeddingcontentchunk_chunkId" ON "embedding_content_chunks" ("chunkId");
            CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId" ON "embedding_content_chunks" ("embeddingContentId");
            CREATE INDEX "IDX_embeddingcontentchunk_status" ON "embedding_content_chunks" ("status");
            CREATE INDEX "IDX_embeddingcontentchunk_chunkIndex" ON "embedding_content_chunks" ("chunkIndex");
            CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId_chunkIndex" ON "embedding_content_chunks" ("embeddingContentId", "chunkIndex");
            CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId_status" ON "embedding_content_chunks" ("embeddingContentId", "status");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP INDEX "IDX_embeddingcontentchunk_userId";
            DROP INDEX "IDX_embeddingcontentchunk_chunkId";
            DROP INDEX "IDX_embeddingcontentchunk_embeddingContentId";
            DROP INDEX "IDX_embeddingcontentchunk_status";
            DROP INDEX "IDX_embeddingcontentchunk_chunkIndex";
            DROP INDEX "IDX_embeddingcontentchunk_embeddingContentId_chunkIndex";
            DROP INDEX "IDX_embeddingcontentchunk_embeddingContentId_status";
        `);
  }
}