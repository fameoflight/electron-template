/**
 * Update embedding_models table
 *
 * Generated on: 2025-11-14T04:17:33.682Z
 *
 * Changes:
 * + Added index on (userId)
 * + Added index on (connectionId)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateEmbedding_models_202511140417336_000 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateEmbedding_models_202511140417336_000',
    tableName: 'embedding_models',
    action: 'Update' as any,
    requiresTransaction: false,
    description: 'Update embedding_models table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE INDEX "IDX_embeddingmodel_userId" ON "embedding_models" ("userId");
            CREATE INDEX "IDX_embeddingmodel_connectionId" ON "embedding_models" ("connectionId");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP INDEX "IDX_embeddingmodel_userId";
            DROP INDEX "IDX_embeddingmodel_connectionId";
        `);
  }
}