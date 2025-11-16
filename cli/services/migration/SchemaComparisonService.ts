/**
 * SchemaComparisonService - Handles schema comparison between two databases
 *
 * Responsibilities:
 * - Compare schemas between migration database and entity database
 * - Detect added, removed, and changed tables
 * - Identify structural differences in existing tables
 *
 * Pattern: Service with options object (max 5 params rule)
 */

import { DataSource } from 'typeorm';
import { getTableSchema, compareTableSchemas } from '../../../main/db/utils/migrations.js';
import { cyberOutput } from '../../utils/output';

export interface ComparisonOptions {
  currentDataSource: DataSource;
  desiredDataSource: DataSource;
}

export class SchemaComparisonService {
  private opts: ComparisonOptions;

  constructor(opts: ComparisonOptions) {
    this.opts = opts;
  }

  /**
   * Detects schema changes between current and desired databases
   */
  async detectSchemaChanges(): Promise<string[]> {
    cyberOutput.info('Comparing schemas to identify changes...');

    const currentTables = await this.getTableNames(this.opts.currentDataSource);
    const desiredTables = await this.getTableNames(this.opts.desiredDataSource);
    const allTables = new Set([...currentTables, ...desiredTables]);
    const changedTables: string[] = [];

    for (const tableName of allTables) {
      if (await this.hasTableStructureChanged(tableName, currentTables, desiredTables)) {
        changedTables.push(tableName);
      }
    }

    return changedTables;
  }

  /**
   * Gets table names from database (excluding system tables)
   */
  private async getTableNames(dataSource: DataSource): Promise<string[]> {
    return await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migrations%' AND name NOT LIKE '%_temp%'"
    ).then((rows: any[]) => rows.map((r: any) => r.name));
  }

  /**
   * Checks if a table's structure has changed
   */
  private async hasTableStructureChanged(
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
      const currentSchema = await getTableSchema(this.opts.currentDataSource, tableName);
      const desiredSchema = await getTableSchema(this.opts.desiredDataSource, tableName);

      if (currentSchema && desiredSchema) {
        const diff = compareTableSchemas(currentSchema, desiredSchema);
        return diff.hasChanges;
      }
    }

    return false;
  }
}
