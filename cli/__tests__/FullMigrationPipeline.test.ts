/**
 * Full Migration Pipeline Test
 *
 * Tests the complete end-to-end migration generation pipeline:
 * 1. Creates a broken database (missing PRIMARY KEY)
 * 2. Runs actual `yarn g migration` command
 * 3. Verifies generated migration contains PRIMARY KEY fix
 * 4. Applies the migration and verifies the result
 */

import fs from 'fs/promises';
import path from 'path';
import { createDataSource } from '../../main/db/utils/index.js';
import { getEntitiesArray } from '../../main/db/entityMap.js';
import { execSync } from 'child_process';

describe('Full Migration Pipeline Test', () => {
  const tempDatabases: string[] = [];
  const testTempDir = path.join(process.cwd(), '.test-migration-full');
  const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');
  const testPrefix = '.test-full-pipeline';

  // Set NODE_ENV=test to ensure test database path is used
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    // Ensure test directory exists
    await fs.mkdir(testTempDir, { recursive: true });

    // Clean up any existing test databases
    const files = await fs.readdir(testTempDir).catch(() => []);
    for (const file of files) {
      if (file.startsWith(testPrefix) && file.endsWith('.db')) {
        await fs.unlink(path.join(testTempDir, file)).catch(() => { });
        tempDatabases.push(file);
      }
    }
  });

  afterEach(async () => {
    // Clean up test databases
    for (const dbFile of tempDatabases) {
      try {
        await fs.unlink(path.join(testTempDir, dbFile));
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Also clean up the test production database
    try {
      await fs.unlink(path.join(testTempDir, 'test-production.db'));
    } catch {
      // Ignore if file doesn't exist
    }

    // Clean up test migrations (remove any test migration files we created)
    try {
      const migrationFiles = await fs.readdir(migrationsDir);
      for (const file of migrationFiles) {
        if (file.includes('UpdateEmbedding_models_')) {
          const fullPath = path.join(migrationsDir, file);
          await fs.unlink(fullPath).catch(() => { });
        }
      }
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  it.skip('should complete full migration pipeline for missing PRIMARY KEY', async () => {
    console.log('🧪 Testing full migration pipeline...');

    // Step 1: Create broken database without PRIMARY KEY
    console.log('📝 Step 1: Creating broken database without PRIMARY KEY...');

    const brokenDbPath = path.join(testTempDir, `${testPrefix}-broken.db`);
    tempDatabases.push(path.basename(brokenDbPath));

    const brokenDataSource = await createDataSource({
      database: brokenDbPath,
      entities: [], // Start empty
      synchronize: false,
      logging: false,
      migrations: []
    });

    await brokenDataSource.initialize();

    // Create prerequisite tables
    await brokenDataSource.query(`
      CREATE TABLE "users" (
        "id" VARCHAR NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "deletedAt" DATETIME,
        "email" VARCHAR NOT NULL,
        "name" TEXT
      )
    `);

    await brokenDataSource.query(`
      CREATE TABLE "connections" (
        "id" VARCHAR NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "deletedAt" DATETIME,
        "userId" VARCHAR NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "users" ("id")
      )
    `);

    // Create embedding_models table WITHOUT PRIMARY KEY (the bug we're fixing)
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

    // Verify the broken state
    const brokenTableInfo = await brokenDataSource.query(`PRAGMA table_info("embedding_models")`);
    const brokenIdColumn = brokenTableInfo.find((col: any) => col.name === 'id');
    expect(brokenIdColumn?.pk).toBe(0); // No PRIMARY KEY
    console.log('✅ Confirmed: embedding_models table missing PRIMARY KEY');

    await brokenDataSource.destroy();

    // Step 2: Set up proper test environment for migration generation
    console.log('🔄 Step 2: Setting up isolated test environment for migration generation...');

    // Create a temporary database location for migration generation test
    const testProdDbPath = path.join(testTempDir, 'test-production.db');

    // Copy broken database to simulate "current state" for migration generation
    await fs.copyFile(brokenDbPath, testProdDbPath);
    console.log('✅ Created test database with broken schema');

    try {
      // Step 3: Run migration generation with custom database path
      console.log('⚙️ Step 3: Running migration generation in test environment...');

      // Set environment variable to use our test database
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Override database path for this test
      process.env.TEST_DB_PATH = testProdDbPath;

      const migrationOutput = execSync('yarn g migration', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
        env: {
          ...process.env,
          NODE_ENV: 'test',
          TEST_DB_PATH: testProdDbPath
        }
      });

      console.log('Migration generation output:', migrationOutput);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
      delete process.env.TEST_DB_PATH;

      // Step 4: Verify migration file was created
      console.log('📄 Step 4: Verifying generated migration file...');

      const migrationFiles = await fs.readdir(migrationsDir);
      const embeddingModelMigrations = migrationFiles.filter(file =>
        file.includes('UpdateEmbedding_models_') && file.endsWith('.ts')
      );

      expect(embeddingModelMigrations.length).toBeGreaterThan(0);
      console.log(`✅ Found ${embeddingModelMigrations.length} migration file(s):`, embeddingModelMigrations);

      // Step 5: Check the latest migration file contains PRIMARY KEY fix
      const latestMigration = embeddingModelMigrations.sort().pop(); // Get the latest one
      const migrationPath = path.join(migrationsDir, latestMigration!);
      const migrationContent = await fs.readFile(migrationPath, 'utf8');

      // Verify it contains the PRIMARY KEY fix
      expect(migrationContent).toContain('PRIMARY KEY');
      expect(migrationContent).toContain('"id" VARCHAR PRIMARY KEY NOT NULL');

      console.log('✅ Migration file contains PRIMARY KEY fix');
      console.log('📝 Migration file path:', migrationPath);

      // Step 6: Apply the migration to test database
      console.log('🚀 Step 6: Applying migration to test database...');

      // Apply migration to our test database
      const applyOutput = execSync('yarn migration:run', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          TEST_DB_PATH: testProdDbPath
        }
      });

      console.log('Migration application output:', applyOutput);

      // Step 7: Verify the fix worked
      console.log('🔍 Step 7: Verifying migration result...');

      const fixedDataSource = await createDataSource({
        database: testProdDbPath,
        entities: await getEntitiesArray(),
        synchronize: false,
        logging: false,
        migrations: []
      });

      await fixedDataSource.initialize();

      const fixedTableInfo = await fixedDataSource.query(`PRAGMA table_info("embedding_models")`);
      const fixedIdColumn = fixedTableInfo.find((col: any) => col.name === 'id');

      expect(fixedIdColumn?.pk).toBe(1); // Should now have PRIMARY KEY
      console.log('✅ PRIMARY KEY constraint successfully applied!');

      await fixedDataSource.destroy();

      console.log('🎉 Full migration pipeline test PASSED!');

    } finally {
      // Clean up test production database
      try {
        await fs.unlink(testProdDbPath);
        console.log('🧹 Cleaned up test production database');
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }, 120000); // 2 minute timeout for this comprehensive test
});