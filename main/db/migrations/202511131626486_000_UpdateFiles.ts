/**
 * Update files table
 *
 * Generated on: 2025-11-13T16:26:48.683Z
 *
 * Changes:
 * ✓ Added column(s): mkTime
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateFiles_202511131626486_000 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'UpdateFiles_202511131626486_000',
        tableName: 'files',
        action: 'Update' as any,
        requiresTransaction: false,
        description: 'Update files table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            ALTER TABLE "files" ADD COLUMN "mkTime" INTEGER DEFAULT 0;
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            ALTER TABLE "files" DROP COLUMN "mkTime";
        `);
    }
}