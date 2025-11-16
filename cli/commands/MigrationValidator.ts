/**
 * Migration Validator - Test generated migrations before finalizing
 *
 * Uses existing CLI patterns to validate migrations by actually executing them
 * against temporary databases to catch runtime errors.
 */

import path from 'path';
import { writeFile } from '../utils/FileSystemService.js';
import { DataSource } from 'typeorm';
import { createDataSource } from '../../main/db/utils';
import {
  cleanupTempDatabases
} from '../../main/db/utils/migrations';
import { output } from '../utils/output.js';

interface MigrationTestResult {
  success: boolean;
  error?: string;
  executionTime: number;
  tempDatabasePath?: string;
}

interface ValidationOptions {
  migrationContent: string;
  migrationFileName: string;
  migrationsDir: string;
  migrationTimestamp: string;
}

/**
 * Migration validation utilities that leverage existing CLI patterns
 */
export class MigrationValidator {
  /**
   * Test a migration by executing it on a temporary database
   */
  static async testMigrationExecution(options: ValidationOptions): Promise<MigrationTestResult> {
    const startTime = Date.now();
    const { migrationContent, migrationFileName, migrationsDir, migrationTimestamp } = options;

    // Create temporary database path using existing CLI pattern
    const tempDbPath = path.join(process.cwd(), `.data/.temp.validation.${migrationTimestamp}.db`);

    output.info(`Testing migration execution: ${migrationFileName}`);

    try {
      // Create validation database with current migration state (reusing CLI pattern)
      const validationDataSource = await createValidationDatabase(tempDbPath, migrationsDir);

      // Create temporary migration file
      const tempMigrationPath = await createTempMigrationFile(
        migrationsDir,
        migrationFileName,
        migrationContent
      );

      // Execute the migration
      await executeSingleMigration(validationDataSource, tempMigrationPath, migrationFileName);

      const executionTime = Date.now() - startTime;
      output.success(`Migration validation passed: ${migrationFileName} (${executionTime}ms)`);

      // Cleanup
      await validationDataSource.destroy();
      await cleanupTempDatabases([tempDbPath]);

      return {
        success: true,
        executionTime,
        tempDatabasePath: tempDbPath
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      output.error(`Migration validation failed: ${migrationFileName}`, errorMessage);

      // Cleanup on failure
      await cleanupTempDatabases([tempDbPath]);

      return {
        success: false,
        error: errorMessage,
        executionTime,
        tempDatabasePath: tempDbPath
      };
    }
  }

  /**
   * Validate that migration SQL is syntactically correct
   */
  static async validateSQLSyntax(sql: string, testDatabasePath: string): Promise<MigrationTestResult> {
    const startTime = Date.now();

    try {
      output.info('Validating SQL syntax...');

      // Create minimal test database
      const testDataSource = await createDataSource({
        database: testDatabasePath,
        entities: [],
        synchronize: false,
        migrations: [],
        logging: false
      });

      await testDataSource.initialize();
      await testDataSource.query('PRAGMA foreign_keys = ON');

      // Test each SQL statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        // Skip statements that don't need EXPLAIN
        const skipPatterns = [
          /^BEGIN\s+TRANSACTION/i,
          /^COMMIT/i,
          /^ROLLBACK/i,
          /^PRAGMA/i,
          /^DROP\s+TABLE/i, // EXPLAIN doesn't work with DROP in some cases
          /^CREATE\s+TEMPORARY/i
        ];

        if (skipPatterns.some(pattern => pattern.test(statement))) {
          continue;
        }

        try {
          await testDataSource.query(`EXPLAIN ${statement}`);
        } catch (explainError) {
          // Some statements can't be EXPLAINed but are still valid
          // Try a dry run by wrapping in transaction and rolling back
          try {
            await testDataSource.query('BEGIN TRANSACTION');
            await testDataSource.query(statement);
            await testDataSource.query('ROLLBACK');
          } catch (runError) {
            throw new Error(`Invalid SQL in statement: ${statement.substring(0, 100)}... - ${runError instanceof Error ? runError.message : String(runError)}`);
          }
        }
      }

      await testDataSource.destroy();

      const executionTime = Date.now() - startTime;
      output.success('SQL syntax validation passed');

      return {
        success: true,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: `SQL syntax error: ${errorMessage}`,
        executionTime
      };
    }
  }
}

/**
 * Create validation database with existing migration state (reuses CLI pattern)
 */
async function createValidationDatabase(tempDbPath: string, migrationsDir: string): Promise<DataSource> {
  const migrationPattern = path.join(migrationsDir, '[0-9]*.ts');

  const dataSource = await createDataSource({
    database: tempDbPath,
    entities: [],
    synchronize: false,
    migrations: [migrationPattern],
    logging: false
  });

  await dataSource.initialize();
  await dataSource.query('PRAGMA foreign_keys = ON');

  // Apply existing migrations to establish current state (same as CLI pattern)
  await cleanupTempTables(dataSource);

  const { getFiles } = await import('../utils/FileSystemService.js');
  const migrationFiles = await getFiles(migrationsDir);
  const hasMigrations = migrationFiles.some(f => f.endsWith('.ts') && !f.startsWith('.'));

  if (hasMigrations) {
    try {
      const executedMigrations = await dataSource.runMigrations();
      if (executedMigrations.length > 0) {
        output.info(`Applied ${executedMigrations.length} existing migrations to validation database`);
      }
    } catch (error) {
      output.warning('Could not apply existing migrations for validation', String(error));
      // Continue with empty database for new table validation
    }
  }

  return dataSource;
}

/**
 * Clean up temporary tables (reuses CLI pattern)
 */
async function cleanupTempTables(dataSource: DataSource): Promise<void> {
  const tempTables = await dataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_temp%'"
  ).then((rows: any[]) => rows.map((r: any) => r.name));

  if (tempTables.length === 0) return;

  for (const tempTable of tempTables) {
    await dataSource.query(`DROP TABLE "${tempTable}"`);
  }
}

/**
 * Create temporary migration file for testing
 */
async function createTempMigrationFile(
  migrationsDir: string,
  fileName: string,
  content: string
): Promise<string> {
  const tempFileName = `.temp.validation.${fileName}`;
  const tempPath = path.join(migrationsDir, tempFileName);

  await writeFile(tempPath, content);
  return tempPath;
}

/**
 * Execute a single migration file (dynamic import and execution)
 */
async function executeSingleMigration(
  dataSource: DataSource,
  migrationPath: string,
  migrationFileName: string
): Promise<void> {
  try {
    output.info(`Executing migration: ${migrationFileName}`);

    // Dynamic import of the migration
    const migrationModule = await import(migrationPath);
    const MigrationClass = Object.values(migrationModule)[0] as any;

    if (!MigrationClass) {
      throw new Error('No migration class found in migration file');
    }

    // Create migration instance and execute
    const migration = new MigrationClass();

    if (typeof migration.up !== 'function') {
      throw new Error('Migration must have an "up" method');
    }

    await migration.up(dataSource);

    output.success('Migration executed successfully');

  } catch (error) {
    // Clean up temp migration file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(migrationPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }

  // Clean up temp migration file on success
  try {
    const fs = await import('fs/promises');
    await fs.unlink(migrationPath);
  } catch (cleanupError) {
    // Ignore cleanup errors
  }
}