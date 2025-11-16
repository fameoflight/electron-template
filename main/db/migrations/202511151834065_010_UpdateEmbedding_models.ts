/**
 * Update embedding_models table
 *
 * Generated on: 2025-11-15T18:34:06.582Z
 *
 * Changes:
 * ◎ Modified column &quot;default&quot;: default: &#x27;0&#x27; → 0
 * ◎ Modified column &quot;maxBatchSize&quot;: default: &#x27;32&#x27; → 32
 * + Added index on (userId)
 * + Added index on (connectionId)
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class UpdateEmbedding_models_202511151834065_010 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'UpdateEmbedding_models_202511151834065_010',
    tableName: 'embedding_models',
    action: 'Update' as any,
    requiresTransaction: true,
    description: 'Update embedding_models table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_models_temp1763231646582" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "connectionId" varchar NOT NULL,
  "contextLength" INTEGER NOT NULL,
  "default" boolean DEFAULT 0,
  "dimension" INTEGER NOT NULL,
  "maxBatchSize" INTEGER DEFAULT 32,
  "modelIdentifier" TEXT NOT NULL,
  "name" TEXT,
  "systemPrompt" TEXT,
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);
            INSERT INTO "embedding_models_temp1763231646582" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "connectionId", "contextLength", "default", "dimension", "maxBatchSize", "modelIdentifier", "name", "systemPrompt") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "connectionId", "contextLength", "default", "dimension", "maxBatchSize", "modelIdentifier", "name", "systemPrompt" FROM "embedding_models";
            DROP TABLE "embedding_models";
            ALTER TABLE "embedding_models_temp1763231646582" RENAME TO "embedding_models";
            CREATE INDEX "IDX_embeddingmodel_userId" ON "embedding_models" ("userId");
            CREATE INDEX "IDX_embeddingmodel_connectionId" ON "embedding_models" ("connectionId");
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_models_temp1763231646582" (
  "id" varchar NOT NULL,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "connectionId" varchar NOT NULL,
  "contextLength" INTEGER NOT NULL,
  "default" boolean DEFAULT '0',
  "dimension" INTEGER NOT NULL,
  "maxBatchSize" INTEGER DEFAULT '32',
  "modelIdentifier" TEXT NOT NULL,
  "name" TEXT,
  "systemPrompt" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id")
);
            INSERT INTO "embedding_models_temp1763231646582" ("id", "createdAt", "updatedAt", "deletedAt", "userId", "connectionId", "contextLength", "default", "dimension", "maxBatchSize", "modelIdentifier", "name", "systemPrompt") SELECT "id", "createdAt", "updatedAt", "deletedAt", "userId", "connectionId", "contextLength", "default", "dimension", "maxBatchSize", "modelIdentifier", "name", "systemPrompt" FROM "embedding_models";
            DROP TABLE "embedding_models";
            ALTER TABLE "embedding_models_temp1763231646582" RENAME TO "embedding_models";
            DROP INDEX "IDX_embeddingmodel_userId";
            DROP INDEX "IDX_embeddingmodel_connectionId";
        `);
  }
}