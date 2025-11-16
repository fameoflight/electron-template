/**
 * Create embedding_models table
 *
 * Generated on: 2025-11-15T18:34:02.511Z
 *
 * Changes:
 * Creating table &quot;embedding_models&quot; with:
  • 13 column(s)
  • 2 foreign key(s)
  • 2 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateEmbedding_models_202511151834025_003 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateEmbedding_models_202511151834025_003',
    tableName: 'embedding_models',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create embedding_models table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "embedding_models" (
  "id" varchar NOT NULL PRIMARY KEY,
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
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "embedding_models"
        `);
  }
}