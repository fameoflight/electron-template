/**
 * Create llm_models table
 *
 * Generated on: 2025-11-15T18:34:02.499Z
 *
 * Changes:
 * Creating table &quot;llm_models&quot; with:
  • 13 column(s)
  • 2 foreign key(s)
  • 1 index(es)
  • Primary key: id
 */

import { BaseMigration } from './BaseMigration.ts';
import type { MigrationMetadata } from './BaseMigration.ts';
import type { QueryRunner } from 'typeorm';

export class CreateLlm_models_202511151834024_002 extends BaseMigration {
  metadata: MigrationMetadata = {
    name: 'CreateLlm_models_202511151834024_002',
    tableName: 'llm_models',
    action: 'Create' as any,
    requiresTransaction: false,
    description: 'Create llm_models table'
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            CREATE TABLE "llm_models" (
  "id" varchar NOT NULL PRIMARY KEY,
  "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
  "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
  "deletedAt" datetime,
  "userId" varchar NOT NULL,
  "capabilities" TEXT NOT NULL,
  "connectionId" varchar NOT NULL,
  "contextLength" INTEGER NOT NULL,
  "default" boolean,
  "modelIdentifier" TEXT NOT NULL,
  "name" TEXT,
  "systemPrompt" TEXT,
  "temperature" INTEGER NOT NULL,
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id"),
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
)
        `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.executeSQL(queryRunner, `
            DROP TABLE "llm_models"
        `);
  }
}