/**
 * Update users table
 *
 * Generated on: 2025-11-13T11:05:14.982Z
 *
 * Changes:
 * + Added index on (username)
 * + Added index on (sessionKey)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateUsers_202511131105149_001 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'UpdateUsers_202511131105149_001',
        tableName: 'users',
        action: 'Update' as any,
        requiresTransaction: false,
        description: 'Update users table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE INDEX "IDX_user_username" ON "users" ("username");
            CREATE INDEX "IDX_user_sessionKey" ON "users" ("sessionKey");
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            DROP INDEX "IDX_user_username";
            DROP INDEX "IDX_user_sessionKey";
        `);
    }
}