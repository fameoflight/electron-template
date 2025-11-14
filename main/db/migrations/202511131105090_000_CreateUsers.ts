/**
 * Create users table
 *
 * Generated on: 2025-11-13T11:05:09.093Z
 *
 * Changes:
 * Creating table &quot;users&quot; with:
  • 9 column(s)
  • 2 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateUsers_202511131105090_000 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'CreateUsers_202511131105090_000',
        tableName: 'users',
        action: 'Create' as any,
        requiresTransaction: false,
        description: 'Create users table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "users" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "name" varchar(255) NOT NULL,
  "username" varchar(100) NOT NULL,
  "password" varchar NOT NULL,
  "sessionKey" varchar,
  "metadata" json
)
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            DROP TABLE "users"
        `);
    }
}