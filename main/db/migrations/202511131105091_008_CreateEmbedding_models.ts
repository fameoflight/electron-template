/**
 * Create embedding_models table
 *
 * Generated on: 2025-11-13T11:05:09.111Z
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

export class CreateEmbedding_models_202511131105091_008 extends BaseMigration {
    metadata: MigrationMetadata = {
        name: 'CreateEmbedding_models_202511131105091_008',
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
  "default" boolean,
  "dimension" INTEGER NOT NULL,
  "maxBatchSize" INTEGER NOT NULL,
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