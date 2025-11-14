/**
 * Migration Generate Command
 *
 * Generates per-table migration files by comparing two temporary databases.
 * This process is COMPLETELY INDEPENDENT of the actual database state.
 *
 * ## How It Works:
 *
 * 1. **Create Temp DB A (Migration State)**
 *    - Start with empty SQLite database
 *    - Run ALL existing migration files against it
 *    - Result: Schema as defined by migrations (source of truth)
 *
 * 2. **Create Temp DB B (Entity State)**
 *    - Start with empty SQLite database
 *    - Use TypeORM `synchronize: true` to generate schema from entity decorators
 *    - Result: Schema as defined by current entity code
 *
 * 3. **Compare Schemas**
 *    - Compare Temp DB A vs Temp DB B table-by-table
 *    - Detect: added columns, removed columns, type changes, indexes, foreign keys
 *
 * 4. **Generate Migrations**
 *    - For each changed table, generate a migration file
 *    - Validate changes before generation (prevent data loss)
 *    - Add human-readable descriptions of changes
 *
 * 5. **Cleanup**
 *    - Delete both temporary databases
 *
 * ## Why This Approach?
 *
 * - **Idempotent**: Running `yarn g migration` multiple times with no entity changes
 *   generates no new migrations
 * - **Database-agnostic**: Doesn't matter what state your actual DB is in
 * - **Git-friendly**: Migrations are generated from code, not database inspection
 * - **Safe**: Validation catches destructive operations before generation
 *
 * ## Example:
 *
 * If you add `email: string` to User entity:
 * - Temp DB A: Has `users` table without `email` column (from migrations)
 * - Temp DB B: Has `users` table with `email` column (from entity)
 * - Result: Generates migration to add `email` column
 */

import path from 'path';
import { writeFile, ensureDir, getFiles } from '../utils/FileSystemService.js';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { getEntitiesArray } from '../../main/db/entityMap.js';
import { createDataSource } from '../../main/db/utils';
import {
  generateMigrationFromDiff,
  backupDatabase,
  cleanupTempDatabases,
  getTableSchema,
  compareTableSchemas,
  TableSchema,
  SchemaDiff
} from '../../main/db/utils/migrations.js';
import { TemplateManager } from '../generators/managers/TemplateManager.js';
import { MigrationValidationService } from '../../main/db/migrations/MigrationValidationService.js';
import { MigrationSQLGenerator } from '../../main/db/migrations/MigrationSQLGenerator.js';
import { MigrationValidator } from './MigrationValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GenerateOptions {
  name?: string;
  dryRun?: boolean;
}

interface DatabaseSetupOptions {
  entities: any[];
  migrationsDir: string;
  timestamp: string;
}

interface DatabasePair {
  currentDataSource: DataSource;
  desiredDataSource: DataSource;
  tempDatabases: string[];
}

interface MigrationGenerationOptions {
  currentDataSource: DataSource;
  desiredDataSource: DataSource;
  migrationsDir: string;
  changedTables: string[];
  dryRun?: boolean;
}

export async function migrationGenerateCommand(options: GenerateOptions = {}) {
  console.log('🔍 Analyzing database schema for changes...\n');

  const setup = await setupMigrationEnvironment();
  const { currentDataSource, desiredDataSource, tempDatabases } = await setupComparisonDatabases(setup);

  try {
    const changedTables = await detectSchemaChanges(currentDataSource, desiredDataSource);

    if (changedTables.length === 0) {
      console.log('✅ No schema changes detected');
    } else {
      console.log(`📝 Detected changes in ${changedTables.length} table(s): ${changedTables.join(', ')}`);
      await handleSchemaChanges({
        currentDataSource,
        desiredDataSource,
        migrationsDir: setup.migrationsDir,
        changedTables,
        dryRun: options.dryRun
      });
    }

    await cleanupDesiredDatabase(desiredDataSource);

  } catch (error) {
    console.error('❌ Migration generation failed:', error);
    process.exit(1);
  } finally {
    await cleanupTempDatabases(tempDatabases);
    console.log('🧹 Cleaned up temporary databases');
  }
}

// ============================================================================
// HELPER FUNCTIONS - Clean, focused, single responsibility
// ============================================================================

/**
 * Sets up the migration environment and prepares basic configuration
 */
async function setupMigrationEnvironment(): Promise<DatabaseSetupOptions> {
  const entities = await getEntitiesArray();
  const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');

  // Ensure migrations directory exists
  await ensureDir(migrationsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return { entities, migrationsDir, timestamp };
}

/**
 * Creates and configures the two databases used for comparison
 */
async function setupComparisonDatabases(setup: DatabaseSetupOptions): Promise<DatabasePair> {
  const { entities, migrationsDir, timestamp } = setup;
  const tempDatabases: string[] = [];

  console.log('📦 Creating temporary databases for comparison...');

  // Database paths
  const currentDbPath = path.join(process.cwd(), `.data/.temp.migrations.${timestamp}.db`);
  const desiredDbPath = path.join(process.cwd(), `.data/.temp.entities.${timestamp}.db`);
  tempDatabases.push(currentDbPath, desiredDbPath);

  // Database A: Current state from existing migrations
  const currentDataSource = await createMigrationDatabase(currentDbPath, migrationsDir);

  // Database B: Desired state from entities
  const desiredDataSource = await createEntityDatabase(desiredDbPath, entities);

  return { currentDataSource, desiredDataSource, tempDatabases };
}

/**
 * Creates and initializes the migration database (current state)
 */
async function createMigrationDatabase(dbPath: string, migrationsDir: string): Promise<DataSource> {
  const migrationPattern = path.join(migrationsDir, '[0-9]*.ts');

  const dataSource = await createDataSource({
    database: dbPath,
    entities: [],
    synchronize: false,
    migrations: [migrationPattern],
    logging: false
  });

  await initializeDatabase(dataSource);
  await applyExistingMigrations(dataSource, migrationsDir);

  return dataSource;
}

/**
 * Creates and initializes the entity database (desired state)
 */
async function createEntityDatabase(dbPath: string, entities: any[]): Promise<DataSource> {
  const dataSource = await createDataSource({
    database: dbPath,
    entities,
    migrations: [],
    synchronize: true,
    logging: false
  });

  await initializeDatabase(dataSource);
  console.log('✅ Created entities database from all entity definitions');

  return dataSource;
}

/**
 * Common database initialization logic
 */
async function initializeDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.initialize();
  await dataSource.query('PRAGMA foreign_keys = ON');
}

/**
 * Applies existing migrations to the migration database
 */
async function applyExistingMigrations(dataSource: DataSource, migrationsDir: string): Promise<void> {
  await cleanupTempTables(dataSource);

  const migrationFiles = await getFiles(migrationsDir);
  const hasMigrations = migrationFiles.some(f => f.endsWith('.ts') && !f.startsWith('.'));

  if (!hasMigrations) {
    console.log('✅ Created empty migrations database (no existing migrations)');
    return;
  }

  try {
    console.log(`📋 Found ${migrationFiles.length} migration file(s), loading...`);
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`📋 Pending migrations to run: ${pendingMigrations}`);

    const executedMigrations = await dataSource.runMigrations();
    console.log(`✅ Applied ${executedMigrations.length} migration(s) to temp database`);

    await verifyTablesCreated(dataSource);
  } catch (error) {
    console.error('❌ Failed to apply existing migrations:', error);
    console.log('ℹ️  Continuing with empty migration database (fresh install)');
  }
}

/**
 * Cleans up temporary tables from database
 */
async function cleanupTempTables(dataSource: DataSource): Promise<void> {
  const tempTables = await dataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_temp%'"
  ).then((rows: any[]) => rows.map((r: any) => r.name));

  if (tempTables.length === 0) return;

  console.log(`Found ${tempTables.length} temporary table(s) to clean up: ${tempTables.join(', ')}`);
  for (const tempTable of tempTables) {
    await dataSource.query(`DROP TABLE "${tempTable}"`);
  }
  console.log('✅ Cleaned up temporary tables');
}

/**
 * Verifies tables were created after migration
 */
async function verifyTablesCreated(dataSource: DataSource): Promise<void> {
  const tables = await dataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migrations%'"
  ).then((rows: any[]) => rows.map((r: any) => r.name));
  console.log(`✅ Temp DB has ${tables.length} table(s): ${tables.join(', ')}`);
}

/**
 * Detects schema changes between current and desired databases
 */
async function detectSchemaChanges(
  currentDataSource: DataSource,
  desiredDataSource: DataSource
): Promise<string[]> {
  console.log('\n🔍 Comparing schemas to identify changes...');

  const currentTables = await getTableNames(currentDataSource);
  const desiredTables = await getTableNames(desiredDataSource);
  const allTables = new Set([...currentTables, ...desiredTables]);
  const changedTables: string[] = [];

  for (const tableName of allTables) {
    if (await hasTableStructureChanged(currentDataSource, desiredDataSource, tableName, currentTables, desiredTables)) {
      changedTables.push(tableName);
    }
  }

  return changedTables;
}

/**
 * Gets table names from database (excluding system tables)
 */
async function getTableNames(dataSource: DataSource): Promise<string[]> {
  return await dataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migrations%' AND name NOT LIKE '%_temp%'"
  ).then((rows: any[]) => rows.map((r: any) => r.name));
}

/**
 * Checks if a table's structure has changed
 */
async function hasTableStructureChanged(
  currentDataSource: DataSource,
  desiredDataSource: DataSource,
  tableName: string,
  currentTables: string[],
  desiredTables: string[]
): Promise<boolean> {
  const existsInCurrent = currentTables.includes(tableName);
  const existsInDesired = desiredTables.includes(tableName);

  // Table added or removed
  if (existsInCurrent !== existsInDesired) {
    return true;
  }

  // Table exists in both, check for schema differences
  if (existsInCurrent && existsInDesired) {
    const currentSchema = await getTableSchema(currentDataSource, tableName);
    const desiredSchema = await getTableSchema(desiredDataSource, tableName);

    if (currentSchema && desiredSchema) {
      const diff = compareTableSchemas(currentSchema, desiredSchema);
      return diff.hasChanges;
    }
  }

  return false;
}

/**
 * Handles schema changes by either showing dry run or generating migrations
 */
async function handleSchemaChanges(options: MigrationGenerationOptions): Promise<void> {
  const { currentDataSource, desiredDataSource, migrationsDir, changedTables, dryRun } = options;

  if (dryRun) {
    await showDryRunResults(currentDataSource, desiredDataSource, changedTables);
  } else {
    await generateMigrationFiles(currentDataSource, desiredDataSource, migrationsDir, changedTables);
  }
}

/**
 * Shows what migration files would be created in dry run mode
 */
async function showDryRunResults(
  currentDataSource: DataSource,
  desiredDataSource: DataSource,
  changedTables: string[]
): Promise<void> {
  console.log('\n🔍 DRY RUN - Migration files that would be created:');

  for (const tableName of changedTables) {
    const timestamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, -3);
    const action = await determineTableAction(currentDataSource, desiredDataSource, tableName);
    const fileName = `${timestamp}_${action}${capitalize(tableName)}.ts`;
    console.log(`   📄 ${fileName}`);
  }
}

/**
 * Generates migration files for all changed tables
 */
async function generateMigrationFiles(
  currentDataSource: DataSource,
  desiredDataSource: DataSource,
  migrationsDir: string,
  changedTables: string[]
): Promise<void> {
  const generatedFiles: string[] = [];

  for (const tableName of changedTables) {
    try {
      const fileName = await generateMigrationForTable(
        currentDataSource,
        desiredDataSource,
        migrationsDir,
        tableName
      );

      if (fileName) {
        generatedFiles.push(fileName);
        console.log(`✅ Generated migration: ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate migration for table ${tableName}:`, error);
    }
  }

  console.log(`\n🎉 Successfully generated ${generatedFiles.length} migration file(s)`);
  console.log('💡 Next steps:');
  console.log('   1. Review the generated migration files');
  console.log('   2. Run: yarn migration:show (to preview SQL)');
  console.log('   3. Run: yarn migration:run (to apply migrations)');
}

/**
 * Generates a migration file for a specific table
 */
async function generateMigrationForTable(
  currentDataSource: DataSource,
  desiredDataSource: DataSource,
  migrationsDir: string,
  tableName: string
): Promise<string | null> {
  const timestamp = MigrationSQLGenerator.generateUniqueTimestamp();
  const currentSchema = await getTableSchema(currentDataSource, tableName);
  const desiredSchema = await getTableSchema(desiredDataSource, tableName);

  if (currentSchema && desiredSchema) {
    return await generateUpdateMigration(
      currentDataSource,
      migrationsDir,
      tableName,
      currentSchema,
      desiredSchema,
      timestamp
    );
  } else if (!currentSchema && desiredSchema) {
    return await generateCreateMigration(migrationsDir, tableName, desiredSchema, timestamp);
  } else if (currentSchema && !desiredSchema) {
    return await generateDropMigration(migrationsDir, tableName, currentSchema, timestamp);
  }

  return null;
}

/**
 * Generates an update migration for existing table
 */
async function generateUpdateMigration(
  currentDataSource: DataSource,
  migrationsDir: string,
  tableName: string,
  currentSchema: TableSchema,
  desiredSchema: TableSchema,
  timestamp: string
): Promise<string | null> {
  const diff = compareTableSchemas(currentSchema, desiredSchema);
  const validation = await MigrationValidationService.validateMigration(
    diff,
    currentDataSource,
    tableName
  );

  // Show validation results
  if (validation.errors.length > 0) {
    console.error(`\n❌ Validation failed for ${tableName}:`);
    validation.errors.forEach(err => console.error(`   • ${err}`));
    return null;
  }

  if (validation.warnings.length > 0) {
    console.warn(`\n⚠️  Warnings for ${tableName}:`);
    validation.warnings.forEach(warn => console.warn(`   • ${warn}`));
  }

  const migrationSql = generateMigrationFromDiff(currentSchema, desiredSchema, tableName);
  const action = 'Update';
  const description = MigrationSQLGenerator.generateChangeDescription(diff, tableName);
  const fileName = `${timestamp}_${action}${capitalize(tableName)}.ts`;
  const className = `${action}${capitalize(tableName)}_${timestamp}`;

  const migrationContent = generateMigrationFileContent({
    className,
    tableName,
    sql: migrationSql,
    action,
    currentSchema,
    desiredSchema,
    description
  });

  // Validate migration before writing file
  if (await validateMigrationBeforeWrite(fileName, migrationContent, migrationsDir, timestamp)) {
    await writeFile(path.join(migrationsDir, fileName), migrationContent);
    return fileName;
  } else {
    console.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
    return null;
  }
}

/**
 * Generates a create migration for new table
 */
async function generateCreateMigration(
  migrationsDir: string,
  tableName: string,
  desiredSchema: TableSchema,
  timestamp: string
): Promise<string> {
  const action = 'Create';
  const description = MigrationSQLGenerator.generateCreateDescription(desiredSchema);
  const fileName = `${timestamp}_${action}${capitalize(tableName)}.ts`;
  const className = `${action}${capitalize(tableName)}_${timestamp}`;

  const createTableSql = MigrationSQLGenerator.generateCreateTableSQL(desiredSchema);
  const migrationContent = generateMigrationFileContent({
    className,
    tableName,
    sql: { up: createTableSql, down: `DROP TABLE "${tableName}"` },
    action,
    desiredSchema,
    description
  });

  // Validate migration before writing file
  if (await validateMigrationBeforeWrite(fileName, migrationContent, migrationsDir, timestamp)) {
    await writeFile(path.join(migrationsDir, fileName), migrationContent);
    return fileName;
  } else {
    console.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
    return '';
  }
}

/**
 * Generates a drop migration for removed table
 */
async function generateDropMigration(
  migrationsDir: string,
  tableName: string,
  currentSchema: TableSchema,
  timestamp: string
): Promise<string> {
  const action = 'Drop';
  const description = MigrationSQLGenerator.generateDropDescription(currentSchema);
  const fileName = `${timestamp}_${action}${capitalize(tableName)}.ts`;
  const className = `${action}${capitalize(tableName)}_${timestamp}`;

  const dropTableSql = MigrationSQLGenerator.generateCreateTableSQL(currentSchema);
  const migrationContent = generateMigrationFileContent({
    className,
    tableName,
    sql: { up: `DROP TABLE "${tableName}"`, down: dropTableSql },
    action,
    currentSchema,
    description
  });

  // Validate migration before writing file
  if (await validateMigrationBeforeWrite(fileName, migrationContent, migrationsDir, timestamp)) {
    await writeFile(path.join(migrationsDir, fileName), migrationContent);
    return fileName;
  } else {
    console.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
    return '';
  }
}

/**
 * Cleans up the desired database before finishing
 */
async function cleanupDesiredDatabase(desiredDataSource: DataSource): Promise<void> {
  const desiredTempTables = await desiredDataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_temp%'"
  ).then((rows: any[]) => rows.map((r: any) => r.name));

  if (desiredTempTables.length > 0) {
    console.log(`Cleaning up ${desiredTempTables.length} temporary table(s) from desired database`);
    for (const tempTable of desiredTempTables) {
      await desiredDataSource.query(`DROP TABLE "${tempTable}"`);
    }
  }
}

/**
 * Validates a migration before writing it to disk
 */
async function validateMigrationBeforeWrite(
  fileName: string,
  migrationContent: string,
  migrationsDir: string,
  timestamp: string
): Promise<boolean> {
  console.log(`🧪 Validating migration: ${fileName}`);

  try {
    // 1. SQL Syntax Validation
    console.log('   📝 Testing SQL syntax...');
    const tempSqlTestDb = path.join(process.cwd(), `.data/.temp.sqltest.${timestamp}.db`);
    const sqlValidation = await MigrationValidator.validateSQLSyntax(
      extractSQLFromMigrationContent(migrationContent),
      tempSqlTestDb
    );

    if (!sqlValidation.success) {
      console.error(`   ❌ SQL syntax validation failed: ${sqlValidation.error}`);
      return false;
    }

    // 2. Migration Execution Validation
    console.log('   🏗️  Testing migration execution...');
    const executionValidation = await MigrationValidator.testMigrationExecution({
      migrationContent,
      migrationFileName: fileName,
      migrationsDir,
      migrationTimestamp: timestamp
    });

    if (!executionValidation.success) {
      console.error(`   ❌ Migration execution validation failed: ${executionValidation.error}`);
      return false;
    }

    console.log(`   ✅ Migration validation passed for ${fileName}`);
    return true;

  } catch (error) {
    console.error(`   ❌ Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Extract SQL statements from migration file content
 */
function extractSQLFromMigrationContent(content: string): string {
  // Look for the SQL in the migration template
  // This extracts the SQL from the template structure
  const sqlMatch = content.match(/await this\.query\(`([^`]+)`\);/s);
  if (sqlMatch) {
    return sqlMatch[1];
  }

  // Alternative: Look for up SQL in template
  const upSqlMatch = content.match(/sql:\s*\{\s*up:\s*`([^`]+)`/s);
  if (upSqlMatch) {
    return upSqlMatch[1];
  }

  // Fallback: return empty string (no SQL to validate)
  return '';
}

async function determineTableAction(currentDataSource: DataSource, desiredDataSource: DataSource, tableName: string): Promise<string> {
  const currentTables = await currentDataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [tableName]
  ).then((rows: any[]) => rows.length > 0);

  const desiredTables = await desiredDataSource.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [tableName]
  ).then((rows: any[]) => rows.length > 0);

  if (!currentTables && desiredTables) return 'Create';
  if (currentTables && !desiredTables) return 'Drop';
  return 'Update';
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface MigrationFileOptions {
  className: string;
  tableName: string;
  sql: { up: string; down: string };
  action: string;
  currentSchema?: TableSchema;
  desiredSchema?: TableSchema;
  description?: string;
}

function generateMigrationFileContent(opts: MigrationFileOptions): string {
  const { className, tableName, sql, action, currentSchema, desiredSchema, description } = opts;
  const timestamp = new Date().toISOString();
  const templateManager = new TemplateManager();

  // Determine if transaction is required
  let requiresTransaction = false;
  if (currentSchema && desiredSchema) {
    const diff = compareTableSchemas(currentSchema, desiredSchema);
    requiresTransaction = MigrationSQLGenerator.needsTableRecreation(diff);
  }

  // Use simple migration template (BaseMigration handles complexity)
  const templateData = {
    className,
    tableName,
    action,
    timestamp,
    description: description || '',
    requiresTransaction,
    upSql: sql.up.trim(),
    downSql: sql.down.trim()
  };

  return templateManager.render('migration:migration', templateData);
}

/**
 * Revert last migration with backup safety
 */
export async function revertMigrationSafe(): Promise<void> {
  try {
    console.log('🔄 Reverting last migration...');

    const { initializeDatabase } = await import('../../main/db/dataSource.js');
    const { backupDatabase, restoreFromBackup, cleanupOldBackups } = await import('../../main/db/utils/migrations.js');

    // Create backup before reverting
    let backupPath: string | null = null;
    try {
      backupPath = await backupDatabase();
    } catch (error) {
      console.warn('⚠️  Warning: Could not create backup before reverting migration:', error);
    }

    const dataSource = await initializeDatabase();

    try {
      // Get migrations to see if there are any to revert
      const executedMigrations = await dataSource.query(
        "SELECT * FROM migrations ORDER BY id DESC LIMIT 1"
      );

      if (executedMigrations.length === 0) {
        console.log('✅ No migrations to revert');
        return;
      }

      const lastMigration = executedMigrations[0];
      console.log(`📋 Reverting migration: ${lastMigration.name}`);

      // Revert the last migration
      await dataSource.undoLastMigration();
      console.log('✅ Migration reverted successfully');

      // Clean up old backups
      await cleanupOldBackups(path.join(path.dirname(await import('@base/utils/index.js').then(m => m.getDatabasePath())), 'backups'), 5);

    } catch (revertError) {
      console.error('❌ Migration revert failed!');

      // Attempt rollback if we have a backup
      if (backupPath) {
        try {
          console.log('🔄 Rolling back from backup...');
          await restoreFromBackup(backupPath);
          console.log('✅ Successfully rolled back to pre-revert state');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback from backup:', rollbackError);
          console.error('💡 Manual restore required from:', backupPath);
        }
      }

      throw revertError;
    }

  } catch (error) {
    console.error('❌ Failed to revert migration:', error);
    process.exit(1);
  }
}