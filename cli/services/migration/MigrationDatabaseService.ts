/**
 * MigrationDatabaseService - Handles database setup and cleanup for migration generation
 *
 * Responsibilities:
 * - Create temporary comparison databases (migration state + entity state)
 * - Initialize databases with proper configuration
 * - Apply existing migrations to migration database
 * - Cleanup temporary resources
 *
 * Pattern: Service with options object (max 5 params rule)
 */

import path from 'path';
import { DataSource } from 'typeorm';
import { createDataSource } from '../../../main/db/utils/index.js';
import { ensureDir, getFiles } from '../../utils/FileSystemService.js';
import { cleanupTempDatabases } from '../../../main/db/utils/migrations.js';
import { cyberOutput } from '../../utils/output';

export interface DatabaseSetupOptions {
  entities: any[];
  migrationsDir: string;
  timestamp: string;
}

export interface DatabasePair {
  currentDataSource: DataSource;
  desiredDataSource: DataSource;
  tempDatabases: string[];
}

export class MigrationDatabaseService {
  private opts: DatabaseSetupOptions;

  constructor(opts: DatabaseSetupOptions) {
    this.opts = opts;
  }

  /**
   * Creates and initializes both comparison databases
   */
  async setupComparisonDatabases(): Promise<DatabasePair> {
    const { entities, migrationsDir, timestamp } = this.opts;
    const tempDatabases: string[] = [];

    cyberOutput.info('Creating temporary databases for comparison...');

    // Database paths
    const currentDbPath = path.join(process.cwd(), `.data/.temp.migrations.${timestamp}.db`);
    const desiredDbPath = path.join(process.cwd(), `.data/.temp.entities.${timestamp}.db`);
    tempDatabases.push(currentDbPath, desiredDbPath);

    // Database A: Current state from existing migrations
    const currentDataSource = await this.createMigrationDatabase(currentDbPath, migrationsDir);

    // Database B: Desired state from entities
    const desiredDataSource = await this.createEntityDatabase(desiredDbPath, entities);

    return { currentDataSource, desiredDataSource, tempDatabases };
  }

  /**
   * Creates and initializes the migration database (current state)
   */
  private async createMigrationDatabase(dbPath: string, migrationsDir: string): Promise<DataSource> {
    const migrationPattern = path.join(migrationsDir, '[0-9]*.ts');

    const dataSource = await createDataSource({
      database: dbPath,
      entities: [],
      synchronize: false,
      migrations: [migrationPattern],
      logging: false
    });

    await this.initializeDatabase(dataSource);
    await this.applyExistingMigrations(dataSource, migrationsDir);

    return dataSource;
  }

  /**
   * Creates and initializes the entity database (desired state)
   */
  private async createEntityDatabase(dbPath: string, entities: any[]): Promise<DataSource> {
    const dataSource = await createDataSource({
      database: dbPath,
      entities,
      migrations: [],
      synchronize: true,
      logging: false
    });

    await this.initializeDatabase(dataSource);
    cyberOutput.success('Created entities database from all entity definitions');

    return dataSource;
  }

  /**
   * Common database initialization logic
   */
  private async initializeDatabase(dataSource: DataSource): Promise<void> {
    await dataSource.initialize();
    await dataSource.query('PRAGMA foreign_keys = ON');
  }

  /**
   * Applies existing migrations to the migration database
   */
  private async applyExistingMigrations(dataSource: DataSource, migrationsDir: string): Promise<void> {
    await this.cleanupTempTables(dataSource);

    const migrationFiles = await getFiles(migrationsDir);
    const hasMigrations = migrationFiles.some(f => f.endsWith('.ts') && !f.startsWith('.'));

    if (!hasMigrations) {
      cyberOutput.success('Created empty migrations database (no existing migrations)');
      return;
    }

    cyberOutput.info(`Found ${migrationFiles.length} migration file(s), loading...`);
    const pendingMigrations = await dataSource.showMigrations();
    cyberOutput.info(`Pending migrations to run: ${pendingMigrations}`);

    const executedMigrations = await dataSource.runMigrations();
    cyberOutput.success(`Applied ${executedMigrations.length} migration(s) to temp database`);

    await this.verifyTablesCreated(dataSource);

  }

  /**
   * Cleans up temporary tables from database
   */
  private async cleanupTempTables(dataSource: DataSource): Promise<void> {
    const tempTables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_temp%'"
    ).then((rows: any[]) => rows.map((r: any) => r.name));

    if (tempTables.length === 0) return;

    cyberOutput.info(`Found ${tempTables.length} temporary table(s) to clean up: ${tempTables.join(', ')}`);
    for (const tempTable of tempTables) {
      await dataSource.query(`DROP TABLE "${tempTable}"`);
    }
    cyberOutput.success('Cleaned up temporary tables');
  }

  /**
   * Verifies tables were created after migration
   */
  private async verifyTablesCreated(dataSource: DataSource): Promise<void> {
    const tables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migrations%'"
    ).then((rows: any[]) => rows.map((r: any) => r.name));
    cyberOutput.success(`Temp DB has ${tables.length} table(s): ${tables.join(', ')}`);
  }

  /**
   * Cleans up the desired database before finishing
   */
  async cleanupDesiredDatabase(desiredDataSource: DataSource): Promise<void> {
    const desiredTempTables = await desiredDataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_temp%'"
    ).then((rows: any[]) => rows.map((r: any) => r.name));

    if (desiredTempTables.length > 0) {
      cyberOutput.info(`Cleaning up ${desiredTempTables.length} temporary table(s) from desired database`);
      for (const tempTable of desiredTempTables) {
        await desiredDataSource.query(`DROP TABLE "${tempTable}"`);
      }
    }
  }

  /**
   * Cleanup all temporary databases
   */
  async cleanup(tempDatabases: string[]): Promise<void> {
    await cleanupTempDatabases(tempDatabases);
    cyberOutput.success('Cleaned up temporary databases');
  }

  /**
   * Setup migration environment and prepare basic configuration
   */
  static async setupEnvironment(entities: any[]): Promise<DatabaseSetupOptions> {
    const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');
    await ensureDir(migrationsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return { entities, migrationsDir, timestamp };
  }
}
