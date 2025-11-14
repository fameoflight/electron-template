/**
 * Update llm_models table
 *
 * Generated on: 2025-11-13T11:05:14.995Z
 *
 * Changes:
 * + Added index on (connectionId)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateLlm_models_202511131105149_008 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'UpdateLlm_models_202511131105149_008',
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