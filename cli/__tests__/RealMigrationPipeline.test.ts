/**
 * Real Migration Pipeline Test
 *
 * Tests the real migration generation by:
 * 1. Starting with a good database (has PRIMARY KEY)
 * 2. Manually removing PRIMARY KEY from the database
 * 3. Running migration generation to detect the fix needed
 * 4. Verifying the generated migration contains PRIMARY KEY fix
 */

import fs from 'fs/promises';
import path from 'path';
import { createDataSource } from '../../main/db/utils/index.js';
import { getEntitiesArray } from '../../main/db/entityMap.js';
import {
  getTableSchema,
  compareTableSchemas,
  generateMigrationFromDiff
} from '../../main/db/utils/migrations.js';
import { TemplateManager } from '../generators/managers/TemplateManager.js';

describe('Real Migration Pipeline Test', () => {
  const testTempDir = path.join(process.cwd(), '.test-migration-real');
  const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');
  const testDbPath = path.join(testTempDir, 'test-real.db');
  let initialMigrationFiles: string[] = [];

  // Set NODE_ENV=test to ensure test database path is used
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    // Ensure test directory exists
    await fs.mkdir(testTempDir, { recursive: true });

    // Clean up any existing test database
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }

    // Capture initial state of migrations directory
    try {
      initialMigrationFiles = await fs.readdir(migrationsDir);
    } catch {
      // Directory might not exist yet
      initialMigrationFiles = [];
    }
  });

  afterEach(async () => {
    // Clean up test database
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }

    // Clean up only the migration files that were created during this test
    try {
      const currentMigrationFiles = await fs.readdir(migrationsDir);
      const newFiles = currentMigrationFiles.filter(file => !initialMigrationFiles.includes(file));

      for (const file of newFiles) {
        const fullPath = path.join(migrationsDir, file);
        console.log(`🧹 Cleaning up test migration file: ${file}`);
        await fs.unlink(fullPath).catch(() => {});
      }
    } catch {
      // Ignore if directory doesn't exist or other errors
    }
  });

  it('should detect and fix missing PRIMARY KEY in real database', async () => {
    console.log('🧪 Testing real migration pipeline...');

    // Step 1: Create a good database with proper PRIMARY KEY using entities
    console.log('📝 Step 1: Creating good database with PRIMARY KEY...');

    const goodDataSource = await createDataSource({
      database: testDbPath,
      entities: await getEntitiesArray(),
      synchronize: true, // Create proper schema from entities
      logging: false,
      migrations: []
    });

    await goodDataSource.initialize();
    await goodDataSource.destroy();

    // Verify the good state has PRIMARY KEY
    const verifyDataSource = await createDataSource({
      database: testDbPath,
      entities: [], // We'll query manually
      synchronize: false,
      logging: false,
      migrations: []
    });

    await verifyDataSource.initialize();

    const goodTableInfo = await verifyDataSource.query(`PRAGMA table_info("embedding_models")`);
    const goodIdColumn = goodTableInfo.find((col: any) => col.name === 'id');
    console.log('🔍 Initial ID column info:', goodIdColumn);

    // If there's no embedding_models table, create it manually first
    if (!goodIdColumn) {
      console.log('📝 Creating embedding_models table manually...');

      // Create prerequisite tables first
      try {
        await verifyDataSource.query(`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" VARCHAR NOT NULL PRIMARY KEY,
            "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "deletedAt" DATETIME,
            "email" VARCHAR NOT NULL,
            "name" TEXT
          )
        `);

        await verifyDataSource.query(`
          CREATE TABLE IF NOT EXISTS "connections" (
            "id" VARCHAR NOT NULL PRIMARY KEY,
            "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "deletedAt" DATETIME,
            "userId" VARCHAR NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users" ("id")
          )
        `);

        await verifyDataSource.query(`
          CREATE TABLE "embedding_models" (
            "id" VARCHAR NOT NULL PRIMARY KEY,
            "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
            "deletedAt" DATETIME,
            "userId" VARCHAR NOT NULL,
            "connectionId" VARCHAR NOT NULL,
            "contextLength" INTEGER NOT NULL,
            "default" BOOLEAN,
            "dimension" INTEGER NOT NULL,
            "maxBatchSize" INTEGER NOT NULL,
            "modelIdentifier" TEXT NOT NULL,
            "name" TEXT,
            "systemPrompt" TEXT,
            FOREIGN KEY ("connectionId") REFERENCES "connections" ("id"),
            FOREIGN KEY ("userId") REFERENCES "users" ("id")
          )
        `);

        console.log('✅ Created embedding_models table with PRIMARY KEY');
      } catch (error) {
        console.log('ℹ️ Tables might already exist:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    await verifyDataSource.destroy();

    // Step 2: Manually break the database by removing PRIMARY KEY
    console.log('💥 Step 2: Breaking database by removing PRIMARY KEY...');

    const brokenDataSource = await createDataSource({
      database: testDbPath,
      entities: [],
      synchronize: false,
      logging: false,
      migrations: []
    });

    await brokenDataSource.initialize();

    // Disable foreign key constraints temporarily to allow breaking the schema
    await brokenDataSource.query('PRAGMA foreign_keys = OFF');

    // Check current state before breaking
    const beforeBreakInfo = await brokenDataSource.query(`PRAGMA table_info("embedding_models")`);
    console.log('📊 Before breaking - ID column:', beforeBreakInfo.find((col: any) => col.name === 'id'));

    // Remove PRIMARY KEY constraint by recreating table without it
    await brokenDataSource.query(`
      CREATE TABLE "embedding_models_temp_no_pk" AS SELECT * FROM "embedding_models"
    `);

    await brokenDataSource.query(`DROP TABLE "embedding_models"`);

    await brokenDataSource.query(`
      CREATE TABLE "embedding_models" (
        "id" VARCHAR NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "deletedAt" DATETIME,
        "userId" VARCHAR NOT NULL,
        "connectionId" VARCHAR NOT NULL,
        "contextLength" INTEGER NOT NULL,
        "default" BOOLEAN,
        "dimension" INTEGER NOT NULL,
        "maxBatchSize" INTEGER NOT NULL,
        "modelIdentifier" TEXT NOT NULL,
        "name" TEXT,
        "systemPrompt" TEXT,
        FOREIGN KEY ("connectionId") REFERENCES "connections" ("id"),
        FOREIGN KEY ("userId") REFERENCES "users" ("id")
      )
    `);

    await brokenDataSource.query(`
      INSERT INTO "embedding_models" SELECT * FROM "embedding_models_temp_no_pk"
    `);

    await brokenDataSource.query(`DROP TABLE "embedding_models_temp_no_pk"`);

    // Re-enable foreign key constraints
    await brokenDataSource.query('PRAGMA foreign_keys = ON');

    // Verify the broken state
    const brokenTableInfo = await brokenDataSource.query(`PRAGMA table_info("embedding_models")`);
    const brokenIdColumn = brokenTableInfo.find((col: any) => col.name === 'id');
    expect(brokenIdColumn?.pk).toBe(0); // Should have no PRIMARY KEY

    console.log('❌ Confirmed: embedding_models table missing PRIMARY KEY');
    console.log('📊 After breaking - ID column:', brokenIdColumn);

    await brokenDataSource.destroy();

    // Step 3: Create desired state database from entities
    console.log('⚙️ Step 3: Creating desired state database from entities...');

    const desiredDbPath = path.join(testTempDir, 'desired.db');
    const desiredDataSource = await createDataSource({
      database: desiredDbPath,
      entities: await getEntitiesArray(),
      synchronize: true,
      logging: false,
      migrations: []
    });

    await desiredDataSource.initialize();
    await desiredDataSource.query('PRAGMA foreign_keys = ON');
    console.log('✅ Created desired state database from entities');

    // Step 4: Compare schemas and generate migration
    console.log('🔍 Step 4: Comparing schemas to detect changes...');

    const currentDataSource = await createDataSource({
      database: testDbPath,
      entities: [],
      synchronize: false,
      logging: false,
      migrations: []
    });

    await currentDataSource.initialize();
    await currentDataSource.query('PRAGMA foreign_keys = ON');

    // Get schemas for comparison
    const currentSchema = await getTableSchema(currentDataSource, 'embedding_models');
    const desiredSchema = await getTableSchema(desiredDataSource, 'embedding_models');

    expect(currentSchema).toBeTruthy();
    expect(desiredSchema).toBeTruthy();

    console.log('📊 Current schema (broken):', {
      idColumn: currentSchema!.columns.find(col => col.name === 'id'),
      hasPrimaryKey: currentSchema!.columns.some(col => col.primary)
    });

    console.log('📊 Desired schema (correct):', {
      idColumn: desiredSchema!.columns.find(col => col.name === 'id'),
      hasPrimaryKey: desiredSchema!.columns.some(col => col.primary)
    });

    // Compare schemas to detect differences
    const schemaDiff = compareTableSchemas(currentSchema!, desiredSchema!);
    expect(schemaDiff.hasChanges).toBe(true);
    console.log('✅ Schema differences detected:', schemaDiff);

    // Verify the specific change we expect: missing PRIMARY KEY on id column
    const currentIdColumn = currentSchema!.columns.find(col => col.name === 'id');
    const desiredIdColumn = desiredSchema!.columns.find(col => col.name === 'id');

    expect(currentIdColumn?.primary).toBe(false);
    expect(desiredIdColumn?.primary).toBe(true);
    console.log('✅ Confirmed: Current schema missing PRIMARY KEY, desired schema has it');

    // Step 5: Generate migration SQL
    console.log('📝 Step 5: Generating migration SQL...');

    const migrationSql = generateMigrationFromDiff(currentSchema!, desiredSchema!, 'embedding_models');
    console.log('Generated migration SQL:', migrationSql);

    // Verify the migration contains PRIMARY KEY fix
    expect(migrationSql.up).toContain('PRIMARY KEY');
    expect(migrationSql.up).toContain('"id" varchar NOT NULL PRIMARY KEY');
    console.log('✅ Migration SQL contains PRIMARY KEY fix');

    // Step 6: Generate actual migration file
    console.log('📄 Step 6: Generating migration file...');

    const timestamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, -3);
    const fileName = `${timestamp}_UpdateEmbedding_models.ts`;
    const migrationPath = path.join(migrationsDir, fileName);
    const className = `UpdateEmbedding_models_${timestamp}`;

    // Generate the migration file content using the same template as the command
    const templateManager = new TemplateManager();
    const tempTableName = `embedding_models_temp${Date.now()}`;

    const templateData = {
      className,
      tableName: 'embedding_models',
      action: 'Update',
      timestamp: new Date().toISOString(),
      needsTableRecreation: true,
      requiresTransaction: true,
      description: 'Update embedding_models table to add PRIMARY KEY constraint',

      // Use the generated migration SQL
      upSql: migrationSql.up,
      downSql: migrationSql.down
    };

    const migrationContent = templateManager.render('migration:migration', templateData);
    await fs.writeFile(migrationPath, migrationContent, 'utf8');
    console.log('✅ Migration file generated:', migrationPath);

    // Verify the migration file contains PRIMARY KEY fix
    expect(migrationContent).toContain('PRIMARY KEY');
    expect(migrationContent).toContain('"id" varchar NOT NULL PRIMARY KEY');
    console.log('✅ Migration file contains PRIMARY KEY fix');

    await currentDataSource.destroy();
    await desiredDataSource.destroy();

    console.log('🎉 Real migration pipeline test PASSED!');
  }, 120000); // 2 minute timeout
});