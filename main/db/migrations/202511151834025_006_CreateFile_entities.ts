/**
 * Create file_entities table
 *
 * Generated on: 2025-11-15T18:34:02.547Z
 *
 * Changes:
 * Creating table &quot;file_entities&quot; with:
  • 17 column(s)
  • 1 foreign key(s)
  • 3 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateFile_entities_202511151834025_006 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateFile_entities_202511151834025_006',
    tableName: 'file_entities',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create file_entities table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "file_entities" (
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
  "mkTime" INTEGER DEFAULT '0',
  "ownerId" TEXT,
  "ownerType" TEXT,
  "status" TEXT DEFAULT '''pending''',
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "file_entities"
        `);
  }
}