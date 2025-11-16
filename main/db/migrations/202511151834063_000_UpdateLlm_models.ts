/**
 * Update llm_models table
 *
 * Generated on: 2025-11-15T18:34:06.350Z
 *
 * Changes:
 * + Added index on (connectionId)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateLlm_models_202511151834063_000 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateLlm_models_202511151834063_000',
    tableName: 'llm_models',
    action: 'Update' as any,
    requiresTransaction: false,
    description: 'Update llm_models table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE INDEX "IDX_llmmodel_connectionId" ON "llm_models" ("connectionId");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP INDEX "IDX_llmmodel_connectionId";
        `);
  }
}