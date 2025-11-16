/**
 * Update messages table
 *
 * Generated on: 2025-11-15T18:34:06.469Z
 *
 * Changes:
 * + Added index on (chatId)
 * + Added index on (createdAt)
 * + Added index on (chatId, createdAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateMessages_202511151834064_005 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateMessages_202511151834064_005',
    tableName: 'messages',
    action: 'Update' as any,
    requiresTransaction: false,
    description: 'Update messages table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE INDEX "IDX_message_chatId" ON "messages" ("chatId");
            CREATE INDEX "IDX_message_createdAt" ON "messages" ("createdAt");
            CREATE INDEX "IDX_message_chatId_createdAt" ON "messages" ("chatId", "createdAt");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP INDEX "IDX_message_chatId";
            DROP INDEX "IDX_message_createdAt";
            DROP INDEX "IDX_message_chatId_createdAt";
        `);
  }
}