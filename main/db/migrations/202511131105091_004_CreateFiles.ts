/**
 * Create files table
 *
 * Generated on: 2025-11-13T11:05:09.105Z
 *
 * Changes:
 * Creating table &quot;files&quot; with:
  • 16 column(s)
  • 1 foreign key(s)
  • 3 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateFiles_202511131105091_004 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'CreateFiles_202511131105091_004',
        tableName: 'files',
        action: 'Create' as any,
        requiresTransaction: false,
        description: 'Create files table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "files" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "extension" TEXT NOT NULL,
  "fileHash" TEXT DEFAULT '''<empty>''',
  "filename" TEXT NOT NULL,
  "fileSize" INTEGER DEFAULT '0',
  "fileType" TEXT DEFAULT '''other''',
  "fullPath" TEXT NOT NULL,
  "metadata" json,
  "mimeType" TEXT DEFAULT '''application/octet-stream''',
  "status" TEXT DEFAULT '''pending''',
  "ownerId" TEXT,
  "ownerType" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            DROP TABLE "files"
        `);
    }
}