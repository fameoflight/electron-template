/**
 * Update files table
 *
 * Generated on: 2025-11-13T11:05:14.992Z
 *
 * Changes:
 * ◎ Modified column &quot;fileHash&quot;: default: &#x27;&#x27;&#x27;&lt;empty&gt;&#x27;&#x27;&#x27; → &#x27;&lt;empty&gt;&#x27;
 * ◎ Modified column &quot;fileSize&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;fileType&quot;: default: &#x27;&#x27;&#x27;other&#x27;&#x27;&#x27; → &#x27;other&#x27;
 * ◎ Modified column &quot;mimeType&quot;: default: &#x27;&#x27;&#x27;application/octet-stream&#x27;&#x27;&#x27; → &#x27;application/octet-stream&#x27;
 * ◎ Modified column &quot;status&quot;: default: &#x27;&#x27;&#x27;pending&#x27;&#x27;&#x27; → &#x27;pending&#x27;
 * + Added index on (fileHash)
 * + Added index on (fileType)
 * + Added index on (fileType, createdAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateFiles_202511131105149_006 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'UpdateFiles_202511131105149_006',
        tableName: 'files',
        action: 'Update' as any,
        requiresTransaction: true,
        description: 'Update files table'
    };

    async up(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "files_temp1763031914992" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "extension" TEXT NOT NULL,
  "fileHash" TEXT DEFAULT '<empty>',
  "filename" TEXT NOT NULL,
  "fileSize" INTEGER DEFAULT 0,
  "fileType" TEXT DEFAULT 'other',
  "fullPath" TEXT NOT NULL,
  "metadata" json,
  "mimeType" TEXT DEFAULT 'application/octet-stream',
  "status" TEXT DEFAULT 'pending',
  "ownerId" TEXT,
  "ownerType" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "files_temp1763031914992" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "status", "ownerId", "ownerType") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "status", "ownerId", "ownerType" FROM "files";
            DROP TABLE "files";
            ALTER TABLE "files_temp1763031914992" RENAME TO "files";
            CREATE INDEX "IDX_file_fileHash" ON "files" ("fileHash");
            CREATE INDEX "IDX_file_fileType" ON "files" ("fileType");
            CREATE INDEX "IDX_file_fileType_createdAt" ON "files" ("fileType", "createdAt");
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await this.executeSQL(queryRunner, `
            CREATE TABLE "files_temp1763031914992" (
  "id" varchar NOT NULL,
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
);
            INSERT INTO "files_temp1763031914992" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "status", "ownerId", "ownerType") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "status", "ownerId", "ownerType" FROM "files";
            DROP TABLE "files";
            ALTER TABLE "files_temp1763031914992" RENAME TO "files";
            DROP INDEX "IDX_file_fileHash";
            DROP INDEX "IDX_file_fileType";
            DROP INDEX "IDX_file_fileType_createdAt";
        `);
    }
}