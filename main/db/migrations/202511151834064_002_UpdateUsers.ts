/**
 * Update users table
 *
 * Generated on: 2025-11-15T18:34:06.410Z
 *
 * Changes:
 * + Added index on (username)
 * + Added index on (sessionKey)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateUsers_202511151834064_002 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateUsers_202511151834064_002',
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