/* eslint-disable @codeblocks/file-size-limit */
/**
 * Migration Utilities
 *
 * Core utilities for database migration operations including:
 * - Schema comparison and diff generation
 * - Database backup and restore
 * - Migration SQL generation
 * - Cleanup utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { DataSource } from 'typeorm';
import { getDatabasePath } from '@base/utils/index.js';

export interface TableSchema {
  table: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  foreignKeys: ForeignKeySchema[];
}

/**
 * Comparison result for a specific type of schema object
 */
interface ComparisonResult<T> {
  /** Items that exist in desired but not in current */
  added: T[];
  /** Items that exist in current but not in desired */
  removed: T[];
  /** Whether any changes were detected */
  hasChanges: boolean;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  unique: boolean;
  default: any;
  autoIncrement?: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ForeignKeySchema {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface SchemaDiff {
  hasChanges: boolean;
  addedColumns: ColumnSchema[];
  removedColumns: ColumnSchema[];
  modifiedColumns: {
    column: string;
    oldType: string;
    newType: string;
    oldNullable: boolean;
    newNullable: boolean;
    current?: Partial<ColumnSchema>;
    desired?: Partial<ColumnSchema>;
  }[];
  addedIndexes: IndexSchema[];
  removedIndexes: IndexSchema[];
  addedForeignKeys: ForeignKeySchema[];
  removedForeignKeys: ForeignKeySchema[];
}

/**
 * Get table schema from database
 */
export async function getTableSchema(dataSource: DataSource, tableName: string): Promise<TableSchema | null> {
  try {
    // Check if table exists
    const tableExists = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    ).then((rows: any[]) => rows.length > 0);

    if (!tableExists) return null;

    // Get columns
    const columns = await dataSource.query(`PRAGMA table_info("${tableName}")`);

    const columnSchemas: ColumnSchema[] = columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      nullable: !col.notnull,
      primary: col.pk > 0,
      unique: false, // SQLite doesn't track this in PRAGMA
      default: col.dflt_value,
      autoIncrement: col.pk > 0 && col.type.toUpperCase().includes('INTEGER')
    }));

    // Get indexes
    const indexes = await dataSource.query(`PRAGMA index_list("${tableName}")`);

    const indexSchemas: IndexSchema[] = [];
    for (const index of indexes) {
      if (!index.name.startsWith('sqlite_')) { // Skip auto-generated indexes
        const indexInfo = await dataSource.query(`PRAGMA index_info("${index.name}")`);
        indexSchemas.push({
          name: index.name,
          columns: indexInfo.sort((a: any, b: any) => a.seqno - b.seqno).map((info: any) => info.name),
          unique: index.unique === 1
        });
      }
    }

    // Get foreign keys
    const foreignKeys = await dataSource.query(`PRAGMA foreign_key_list("${tableName}")`);

    const foreignKeySchemas: ForeignKeySchema[] = [];
    for (const fk of foreignKeys) {
      // Use a consistent naming pattern: fk_{table}_{column}
      const constraintName = `fk_${tableName}_${fk.from}`;
      foreignKeySchemas.push({
        name: constraintName,
        column: fk.from,
        referencedTable: fk.table,
        referencedColumn: fk.to || 'id',
        onDelete: fk.on_delete && fk.on_delete !== 'NO ACTION' ? fk.on_delete : undefined,
        onUpdate: fk.on_update && fk.on_update !== 'NO ACTION' ? fk.on_update : undefined
      });
    }

    return {
      table: tableName,
      columns: columnSchemas,
      indexes: indexSchemas,
      foreignKeys: foreignKeySchemas
    };
  } catch (error) {
    console.error(`Failed to get schema for table ${tableName}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Helper function to compare two foreign keys for equality
 */
function isForeignKeyEqual(fk1: ForeignKeySchema, fk2: ForeignKeySchema): boolean {
  return (
    fk1.column === fk2.column &&
    fk1.referencedTable === fk2.referencedTable &&
    fk1.referencedColumn === fk2.referencedColumn &&
    fk1.onDelete === fk2.onDelete &&
    fk1.onUpdate === fk2.onUpdate
  );
}

/**
 * Schema Comparison Strategies
 *
 * These functions define how we compare database objects to detect actual changes
 * vs. cosmetic differences (like auto-generated names)
 */

// ===== INDEX COMPARISON =====

/**
 * Create a logical key for index comparison.
 * Indexes are considered the same if they have the same columns and uniqueness, regardless of name.
 * This prevents false positives when SQLite auto-generates different index names.
 *
 * Example: Index on (user_id, status) -> "user_id,status:false"
 */
function createIndexKey(index: IndexSchema): string {
  return `${index.columns.join(',')}:${index.unique}`;
}

/**
 * Compare two indexes for logical equality.
 * Two indexes are the same if they have identical column order and uniqueness.
 *
 * @param idx1 - First index to compare
 * @param idx2 - Second index to compare
 * @returns true if indexes are logically equivalent
 */
function isIndexEqual(idx1: IndexSchema, idx2: IndexSchema): boolean {
  return (
    idx1.columns.length === idx2.columns.length &&
    idx1.columns.every((col, i) => col === idx2.columns[i]) &&
    idx1.unique === idx2.unique
  );
}

// ===== FOREIGN KEY COMPARISON =====

/**
 * Create a logical key for foreign key comparison.
 * Foreign keys are considered the same if they reference the same column/table/column combo.
 * This ignores differences in constraint names (like FK_xxx vs table_column_fkey).
 *
 * Example: FK from user_id to users.id -> "user_id->users.id"
 */
function createForeignKeyKey(fk: ForeignKeySchema): string {
  return `${fk.column}->${fk.referencedTable}.${fk.referencedColumn}`;
}

// ===== COLUMN COMPARISON =====

/**
 * Compare column schemas between current and desired states
 *
 * @param current - Current column definitions
 * @param desired - Desired column definitions
 * @returns Comparison result showing added/removed/modified columns
 */
function compareColumns(current: ColumnSchema[], desired: ColumnSchema[]): ComparisonResult<ColumnSchema> & {
  modified: SchemaDiff['modifiedColumns'];
} {
  const currentColumns = new Map(current.map(col => [col.name, col]));
  const desiredColumns = new Map(desired.map(col => [col.name, col]));

  const added: ColumnSchema[] = [];
  const removed: ColumnSchema[] = [];
  const modified: SchemaDiff['modifiedColumns'] = [];
  let hasChanges = false;

  // Find added columns
  for (const [name, column] of desiredColumns) {
    if (!currentColumns.has(name)) {
      added.push(column);
      hasChanges = true;
    }
  }

  // Find removed columns
  for (const [name, column] of currentColumns) {
    if (!desiredColumns.has(name)) {
      removed.push(column);
      hasChanges = true;
    }
  }

  // Find modified columns
  for (const [name, desiredColumn] of desiredColumns) {
    const currentColumn = currentColumns.get(name);
    if (currentColumn) {
      // Normalize types to lowercase for case-insensitive comparison (SQLite is case-insensitive)
      const currentType = currentColumn.type.toLowerCase();
      const desiredType = desiredColumn.type.toLowerCase();

      if (
        currentType !== desiredType ||
        currentColumn.nullable !== desiredColumn.nullable ||
        currentColumn.primary !== desiredColumn.primary ||
        currentColumn.default !== desiredColumn.default
      ) {
        modified.push({
          column: name,
          oldType: currentColumn.type,
          newType: desiredColumn.type,
          oldNullable: currentColumn.nullable,
          newNullable: desiredColumn.nullable,
          current: currentColumn,
          desired: desiredColumn
        });
        hasChanges = true;
      }
    }
  }

  return { added, removed, modified, hasChanges };
}

// ===== INDEX COMPARISON =====

/**
 * Compare indexes between current and desired states using logical equality
 *
 * Uses logical comparison instead of name-based comparison to handle SQLite's
 * auto-generated index names. Two indexes are considered the same if they have:
 * - Same columns in the same order
 * - Same uniqueness setting
 *
 * @param current - Current index definitions
 * @param desired - Desired index definitions
 * @returns Comparison result showing added/removed indexes
 */
function compareIndexes(current: IndexSchema[], desired: IndexSchema[]): ComparisonResult<IndexSchema> {
  const currentIndexesByKey = new Map(current.map(idx => [createIndexKey(idx), idx]));
  const desiredIndexesByKey = new Map(desired.map(idx => [createIndexKey(idx), idx]));

  const added: IndexSchema[] = [];
  const removed: IndexSchema[] = [];
  let hasChanges = false;

  // Find added indexes (logical indexes that don't exist in current)
  for (const [key, desiredIndex] of desiredIndexesByKey) {
    const currentMatchingIndex = currentIndexesByKey.get(key);
    if (!currentMatchingIndex) {
      // Use the desired index name for consistency with entity definitions
      added.push(desiredIndex);
      hasChanges = true;
    }
  }

  // Find removed indexes (logical indexes that exist in current but not in desired)
  for (const [key, currentIndex] of currentIndexesByKey) {
    const desiredMatchingIndex = desiredIndexesByKey.get(key);
    if (!desiredMatchingIndex) {
      removed.push(currentIndex);
      hasChanges = true;
    }
  }

  return { added, removed, hasChanges };
}

// ===== FOREIGN KEY COMPARISON =====

/**
 * Compare foreign keys between current and desired states using logical equality
 *
 * Uses logical comparison instead of name-based comparison to handle different
 * constraint naming conventions (FK_xxx vs table_column_fkey). Two foreign keys are
 * considered the same if they reference the same column/table/column relationship.
 *
 * @param current - Current foreign key definitions
 * @param desired - Desired foreign key definitions
 * @returns Comparison result showing added/removed foreign keys
 */
function compareForeignKeys(current: ForeignKeySchema[], desired: ForeignKeySchema[]): ComparisonResult<ForeignKeySchema> {
  const currentForeignKeysByKey = new Map(current.map(fk => [createForeignKeyKey(fk), fk]));
  const desiredForeignKeysByKey = new Map(desired.map(fk => [createForeignKeyKey(fk), fk]));

  const added: ForeignKeySchema[] = [];
  const removed: ForeignKeySchema[] = [];
  let hasChanges = false;

  // Find added foreign keys (logical FKs that don't exist in current)
  for (const [key, desiredFk] of desiredForeignKeysByKey) {
    const currentMatchingFk = currentForeignKeysByKey.get(key);
    if (!currentMatchingFk || !isForeignKeyEqual(currentMatchingFk, desiredFk)) {
      // Use the desired foreign key name for consistency with entity definitions
      added.push(desiredFk);
      hasChanges = true;
    }
  }

  // Find removed foreign keys (logical FKs that exist in current but not in desired)
  for (const [key, currentFk] of currentForeignKeysByKey) {
    const desiredMatchingFk = desiredForeignKeysByKey.get(key);
    if (!desiredMatchingFk || !isForeignKeyEqual(currentFk, desiredMatchingFk)) {
      removed.push(currentFk);
      hasChanges = true;
    }
  }

  return { added, removed, hasChanges };
}

/**
 * Compare two table schemas and identify differences
 *
 * This function orchestrates the comparison of all schema elements:
 * - Columns (added, removed, modified)
 * - Indexes (added, removed) - compared by logical structure
 * - Foreign keys (added, removed) - compared by logical reference
 */
export function compareTableSchemas(current: TableSchema, desired: TableSchema): SchemaDiff {
  const columnsResult = compareColumns(current.columns, desired.columns);
  const indexesResult = compareIndexes(current.indexes, desired.indexes);
  const foreignKeysResult = compareForeignKeys(current.foreignKeys, desired.foreignKeys);

  const hasChanges = columnsResult.hasChanges || indexesResult.hasChanges || foreignKeysResult.hasChanges;

  return {
    hasChanges,
    addedColumns: columnsResult.added,
    removedColumns: columnsResult.removed,
    modifiedColumns: columnsResult.modified,
    addedIndexes: indexesResult.added,
    removedIndexes: indexesResult.removed,
    addedForeignKeys: foreignKeysResult.added,
    removedForeignKeys: foreignKeysResult.removed
  };
}

/**
 * Generate safe DROP COLUMN SQL with existence check for SQLite
 */
function generateSafeDropColumn(tableName: string, columnName: string): string[] {
  return [
    `-- SQLite: Check if column exists before dropping (through table recreation)`,
    `-- Column "${columnName}" will be removed through table recreation if it exists`
  ];
}

/**
 * Generate migration SQL from schema diff
 */
export function generateMigrationFromDiff(current: TableSchema, desired: TableSchema, tableName: string): { up: string; down: string } {
  const diff = compareTableSchemas(current, desired);

  const upStatements: string[] = [];
  const downStatements: string[] = [];

  // Handle column removals (first in up)
  for (const column of diff.removedColumns) {
    // SQLite doesn't support IF EXISTS with DROP COLUMN, so we need to check first
    // We'll handle column removals through table recreation for safety
    console.log(`Column "${column.name}" will be removed through table recreation`);
  }

  // Handle column additions
  for (const column of diff.addedColumns) {
    let defaultValue = '';
    if (column.default !== null) {
      if (typeof column.default === 'string' && column.default.includes('(')) {
        defaultValue = ` DEFAULT (${column.default})`;
      } else {
        defaultValue = ` DEFAULT ${column.default}`;
      }
    } else if (!column.nullable) {
      // WARNING: NOT NULL column without default value (compact format)
      console.warn(`⚠️  Adding NOT NULL column "${column.name}" without DEFAULT to table "${tableName}"`);
      console.warn(`   💡 May fail if table has existing data. Add default value or make nullable.`);
    }
    upStatements.push(`ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}${column.nullable ? '' : ' NOT NULL'}${defaultValue};`);
    downStatements.push(`ALTER TABLE "${tableName}" DROP COLUMN "${column.name}";`);
  }

  // Handle column modifications, foreign key additions, and column removals (SQLite requires table recreation)
  if (diff.modifiedColumns.length > 0 || diff.addedForeignKeys.length > 0 || diff.removedColumns.length > 0) {
    const tempTableName = `${tableName}_temp${Date.now()}`;

    // Create new table with desired schema
    const desiredColumns = desired.columns.map(col => {
      let definition = `"${col.name}" ${col.type}`;
      if (!col.nullable) definition += ' NOT NULL';
      if (col.primary) definition += ' PRIMARY KEY';
      if (col.default !== null) {
        // Handle SQLite function defaults properly
        if (typeof col.default === 'string' && col.default.includes('(')) {
          definition += ` DEFAULT (${col.default})`;
        } else {
          definition += ` DEFAULT ${col.default}`;
        }
      }
      return definition;
    });

    // Add desired foreign keys
    const desiredForeignKeys = desired.foreignKeys.map(fk =>
      `FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")${fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ''}${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ''}`
    );

    const allConstraints = [...desiredColumns, ...desiredForeignKeys].join(',\n  ');
    upStatements.push(`CREATE TABLE "${tempTableName}" (\n  ${allConstraints}\n);`);
    // CRITICAL FIX: Only insert columns that exist in the new table schema
    const commonColumns = desired.columns.filter(col =>
      current.columns.some(currentCol => currentCol.name === col.name)
    );

    if (commonColumns.length > 0) {
      const columnNames = commonColumns.map(col => `"${col.name}"`).join(', ');
      upStatements.push(`INSERT INTO "${tempTableName}" (${columnNames}) SELECT ${columnNames} FROM "${tableName}";`);
    }
    upStatements.push(`DROP TABLE "${tableName}";`);
    upStatements.push(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}";`);

    // Down statements: recreate old schema
    const oldColumns = current.columns.map(col => {
      let definition = `"${col.name}" ${col.type}`;
      if (!col.nullable) definition += ' NOT NULL';
      if (col.default !== null) {
        // Handle SQLite function defaults properly
        if (typeof col.default === 'string' && col.default.includes('(')) {
          definition += ` DEFAULT (${col.default})`;
        } else {
          definition += ` DEFAULT ${col.default}`;
        }
      }
      return definition;
    });

    const oldForeignKeys = current.foreignKeys.map(fk =>
      `FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")${fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ''}${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ''}`
    );

    const oldConstraints = [...oldColumns, ...oldForeignKeys].join(',\n  ');
    downStatements.push(`CREATE TABLE "${tempTableName}" (\n  ${oldConstraints}\n);`);
    // Fix down migration: Only insert columns that exist in current schema
    const downCommonColumns = current.columns.filter(col =>
      desired.columns.some(desiredCol => desiredCol.name === col.name)
    );

    if (downCommonColumns.length > 0) {
      const downColumnNames = downCommonColumns.map(col => `"${col.name}"`).join(', ');
      downStatements.push(`INSERT INTO "${tempTableName}" (${downColumnNames}) SELECT ${downColumnNames} FROM "${tableName}";`);
    }
    downStatements.push(`DROP TABLE "${tableName}";`);
    downStatements.push(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}";`);
  }

  // Handle index changes
  for (const index of diff.removedIndexes) {
    upStatements.push(`DROP INDEX "${index.name}";`);
    downStatements.push(`CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX "${index.name}" ON "${tableName}" (${index.columns.map(col => `"${col}"`).join(', ')});`);
  }

  for (const index of diff.addedIndexes) {
    upStatements.push(`CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX "${index.name}" ON "${tableName}" (${index.columns.map(col => `"${col}"`).join(', ')});`);
    downStatements.push(`DROP INDEX "${index.name}";`);
  }

  // Handle foreign key changes
  for (const fk of diff.removedForeignKeys) {
    upStatements.push(`-- Note: Foreign key removal handled via table recreation above`);
    downStatements.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")${fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ''}${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ''};`);
  }

  // Note: Foreign key additions are handled in table recreation logic above

  return {
    up: upStatements.join('\n            '),
    down: downStatements.join('\n            ')
  };
}

/**
 * Backup database with timestamp
 */
export async function backupDatabase(dbPath?: string): Promise<string> {
  const sourcePath = dbPath || getDatabasePath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(path.dirname(sourcePath), 'backups');

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  const backupPath = path.join(backupDir, `codeblocks-${timestamp}.db`);

  try {
    await fs.copyFile(sourcePath, backupPath);
    console.log(`💾 Database backed up to: ${backupPath}`);
    return backupPath;
  } catch (err) {
    // If source doesn't exist, create empty backup
    const error = err as Error & { code?: string };
    if (error.code === 'ENOENT') {
      await fs.writeFile(backupPath, '');
      console.log(`💾 Created empty backup: ${backupPath}`);
      return backupPath;
    }
    throw error;
  }
}

/**
 * Restore database from backup
 */
export async function restoreFromBackup(backupPath: string, targetPath?: string): Promise<void> {
  const target = targetPath || getDatabasePath();
  await fs.copyFile(backupPath, target);
  console.log(`🔄 Database restored from: ${backupPath}`);
}

/**
 * Clean up old backup files (keep last N)
 */
export async function cleanupOldBackups(backupsDir: string, keep: number = 5): Promise<void> {
  try {
    const files = await fs.readdir(backupsDir);
    const backupFiles = files
      .filter(f => f.startsWith('codeblocks-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(backupsDir, f),
        timestamp: f.replace('codeblocks-', '').replace('.db', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (backupFiles.length > keep) {
      const filesToDelete = backupFiles.slice(keep);
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      }
    }
  } catch (err) {
    // Backup directory might not exist, which is fine
    const error = err as Error & { code?: string };
    if (error.code !== 'ENOENT') {
      console.warn('Warning: Could not cleanup old backups:', error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Clean up temporary databases
 */
export async function cleanupTempDatabases(tempDbPaths: string[]): Promise<void> {
  for (const dbPath of tempDbPaths) {
    try {
      await fs.unlink(dbPath);
    } catch (err) {
      // File might not exist, which is fine
      const error = err as Error & { code?: string };
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not delete temp database ${dbPath}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }
}

/**
 * Show pending migrations without running them
 */
export async function showPendingMigrations(dataSource: DataSource): Promise<string[]> {
  try {
    const migrations = await dataSource.showMigrations();
    // showMigrations returns boolean, not array, so we need a different approach
    const executedMigrations = await dataSource.query(
      "SELECT name FROM migrations ORDER BY timestamp"
    );
    return executedMigrations.map((row: any) => row.name) || [];
  } catch (err) {
    console.warn('Warning: Could not check pending migrations:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Get list of backup files
 */
export async function getBackupFiles(backupsDir?: string): Promise<Array<{ name: string; path: string; timestamp: string; size: number }>> {
  const backupDirectory = backupsDir || path.join(path.dirname(getDatabasePath()), 'backups');

  try {
    const files = await fs.readdir(backupDirectory);
    const backupFiles = await Promise.all(
      files
        .filter(f => f.startsWith('codeblocks-') && f.endsWith('.db'))
        .map(async (f) => {
          const filePath = path.join(backupDirectory, f);
          const stats = await fs.stat(filePath);
          return {
            name: f,
            path: filePath,
            timestamp: f.replace('codeblocks-', '').replace('.db', ''),
            size: stats.size
          };
        })
    );

    return backupFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (err) {
    const error = err as Error & { code?: string };
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Generate schema.sql file (similar to Rails db/schema.rb)
 */
export async function generateSchemaSql(dataSource: DataSource, outputPath?: string): Promise<string> {
  try {
    // Get all tables
    const tables = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migrations%' ORDER BY name"
    ).then((rows: any[]) => rows.map((r: any) => r.name));

    const schemaLines: string[] = [];

    // Header
    schemaLines.push('--');
    schemaLines.push('-- Database Schema');
    schemaLines.push('-- Database: SQLite');
    schemaLines.push('--');
    schemaLines.push('');

    // Foreign key constraints must be enabled
    schemaLines.push('PRAGMA foreign_keys = ON;');
    schemaLines.push('');

    // Process each table
    for (const tableName of tables) {
      const tableSchema = await getTableSchema(dataSource, tableName);
      if (!tableSchema) continue;

      schemaLines.push(`-- Table: ${tableName}`);
      schemaLines.push(`CREATE TABLE "${tableName}" (`);

      const tableDefinitions: string[] = [];

      // Add column definitions
      for (const column of tableSchema.columns) {
        let columnDef = `  "${column.name}" ${column.type.toUpperCase()}`;

        if (!column.nullable) columnDef += ' NOT NULL';
        if (column.primary) columnDef += ' PRIMARY KEY';
        if (column.autoIncrement) columnDef += ' AUTOINCREMENT';
        if (column.default !== null) {
          if (typeof column.default === 'string' && column.default.includes('(')) {
            columnDef += ` DEFAULT (${column.default})`;
          } else {
            columnDef += ` DEFAULT ${column.default}`;
          }
        }

        tableDefinitions.push(columnDef);
      }

      // Add foreign key constraints
      for (const fk of tableSchema.foreignKeys) {
        let fkDef = `  FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")`;
        if (fk.onDelete) fkDef += ` ON DELETE ${fk.onDelete}`;
        if (fk.onUpdate) fkDef += ` ON UPDATE ${fk.onUpdate}`;
        tableDefinitions.push(fkDef);
      }

      schemaLines.push(tableDefinitions.join(',\n'));
      schemaLines.push(');');
      schemaLines.push('');

      // Add indexes for this table
      if (tableSchema.indexes.length > 0) {
        for (const index of tableSchema.indexes) {
          schemaLines.push(`-- Index: ${index.name}`);
          schemaLines.push(`CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX "${index.name}" ON "${tableName}" (${index.columns.map(col => `"${col}"`).join(', ')});`);
          schemaLines.push('');
        }
      }

      schemaLines.push('');
    }

    const schemaContent = schemaLines.join('\n');

    // Write to file
    const filePath = outputPath || path.join(process.cwd(), 'schema.sql');
    await fs.writeFile(filePath, schemaContent, 'utf-8');
    console.log(`✅ Schema dumped to: ${filePath}`);

    return schemaContent;
  } catch (error) {
    console.error('❌ Failed to generate schema.sql:', error);
    throw error;
  }
}