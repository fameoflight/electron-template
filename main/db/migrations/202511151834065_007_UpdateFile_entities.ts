/**
 * Update file_entities table
 *
 * Generated on: 2025-11-15T18:34:06.510Z
 *
 * Changes:
 * ◎ Modified column &quot;fileHash&quot;: default: &#x27;&#x27;&#x27;&lt;empty&gt;&#x27;&#x27;&#x27; → &#x27;&lt;empty&gt;&#x27;
 * ◎ Modified column &quot;fileSize&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;fileType&quot;: default: &#x27;&#x27;&#x27;other&#x27;&#x27;&#x27; → &#x27;other&#x27;
 * ◎ Modified column &quot;mimeType&quot;: default: &#x27;&#x27;&#x27;application/octet-stream&#x27;&#x27;&#x27; → &#x27;application/octet-stream&#x27;
 * ◎ Modified column &quot;mkTime&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;status&quot;: default: &#x27;&#x27;&#x27;pending&#x27;&#x27;&#x27; → &#x27;pending&#x27;
 * + Added index on (fileHash)
 * + Added index on (fileType)
 * + Added index on (fileType, createdAt)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateFile_entities_202511151834065_007 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateFile_entities_202511151834065_007',
    tableName: 'file_entities',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update file_entities table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "file_entities_temp1763231646510" (
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
  "mkTime" INTEGER DEFAULT 0,
  "ownerId" TEXT,
  "ownerType" TEXT,
  "status" TEXT DEFAULT 'pending',
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "file_entities_temp1763231646510" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "mkTime", "ownerId", "ownerType", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "mkTime", "ownerId", "ownerType", "status" FROM "file_entities";
            DROP TABLE "file_entities";
            ALTER TABLE "file_entities_temp1763231646510" RENAME TO "file_entities";
            CREATE INDEX "IDX_fileentity_fileHash" ON "file_entities" ("fileHash");
            CREATE INDEX "IDX_fileentity_fileType" ON "file_entities" ("fileType");
            CREATE INDEX "IDX_fileentity_fileType_createdAt" ON "file_entities" ("fileType", "createdAt");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "file_entities_temp1763231646510" (
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
  "mkTime" INTEGER DEFAULT '0',
  "ownerId" TEXT,
  "ownerType" TEXT,
  "status" TEXT DEFAULT '''pending''',
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "file_entities_temp1763231646510" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "mkTime", "ownerId", "ownerType", "status") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "extension", "fileHash", "filename", "fileSize", "fileType", "fullPath", "metadata", "mimeType", "mkTime", "ownerId", "ownerType", "status" FROM "file_entities";
            DROP TABLE "file_entities";
            ALTER TABLE "file_entities_temp1763231646510" RENAME TO "file_entities";
            DROP INDEX "IDX_fileentity_fileHash";
            DROP INDEX "IDX_fileentity_fileType";
            DROP INDEX "IDX_fileentity_fileType_createdAt";
        `);
  }
}