/**
 * MigrationSQLGenerator - Consistent SQL generation utilities
 *
 * Provides:
 * - Consistent default value formatting
 * - Unique index name generation
 * - Transaction wrapping
 * - Column drop with archiving
 * - Human-readable change descriptions
 */

import { ColumnSchema, IndexSchema, ForeignKeySchema, SchemaDiff, TableSchema } from '../utils/migrations.js';

export interface SQLGenerationOptions {
  wrapInTransaction?: boolean;
  archiveDroppedColumns?: boolean;
  includeComments?: boolean;
}

export interface GeneratedSQL {
  up: string;
  down: string;
  description: string;  // Human-readable description of changes
  requiresTransaction: boolean;
}

/**
 * Static SQL generation service - no state needed
 */
export class MigrationSQLGenerator {
  private static migrationSequence = 0;

  /**
   * Generate unique timestamp for migration
   *
   * Prevents collisions when generating multiple migrations quickly
   */
  static generateUniqueTimestamp(): string {
    const timestamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, -3);
    const sequence = String(this.migrationSequence++).padStart(3, '0');
    return `${timestamp}_${sequence}`;
  }

  /**
   * Format default value for SQL
   *
   * Handles SQLite-specific keywords, functions, strings, numbers
   */
  static formatDefaultValue(value: any, columnType?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle string values
    if (typeof value === 'string') {
      const upper = value.toUpperCase();

      // SQLite keywords (don't quote)
      const keywords = [
        'NULL',
        'TRUE',
        'FALSE',
        'CURRENT_TIMESTAMP',
        'CURRENT_DATE',
        'CURRENT_TIME'
      ];

      if (keywords.includes(upper)) {
        return ` DEFAULT ${upper}`;
      }

      // Functions (detect by parentheses)
      if (value.includes('(') && value.includes(')')) {
        return ` DEFAULT (${value})`;
      }

      // Regular strings (escape single quotes and wrap)
      const escaped = value.replace(/'/g, "''");
      return ` DEFAULT '${escaped}'`;
    }

    // Numbers and booleans
    return ` DEFAULT ${value}`;
  }

  /**
   * Generate globally unique index name
   *
   * SQLite requires index names to be unique across ALL tables
   */
  static generateIndexName(tableName: string, columns: string[], unique: boolean): string {
    const columnPart = columns.join('_');
    const prefix = unique ? 'idx_unique' : 'idx';
    return `${prefix}_${tableName}_${columnPart}`;
  }

  /**
   * Wrap SQL in transaction
   */
  static wrapInTransaction(sql: string): string {
    return `BEGIN TRANSACTION;\n${sql}\nCOMMIT;`;
  }

  /**
   * Generate column drop SQL with optional archiving
   */
  static generateColumnDropSQL(
    tableName: string,
    column: ColumnSchema,
    opts: { archiveData?: boolean } = {}
  ): { up: string; down: string } {
    const upStatements: string[] = [];
    const downStatements: string[] = [];

    if (opts.archiveData) {
      // Create archive table if not exists
      upStatements.push(`
-- Archive column data before dropping
CREATE TABLE IF NOT EXISTS "archived_columns" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  data TEXT,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

      // Archive data (if column has data)
      upStatements.push(`
INSERT INTO "archived_columns" (table_name, column_name, row_id, data)
SELECT '${tableName}', '${column.name}', id, "${column.name}"
FROM "${tableName}"
WHERE "${column.name}" IS NOT NULL;`);
    }

    // Drop column
    upStatements.push(`ALTER TABLE "${tableName}" DROP COLUMN "${column.name}";`);

    // Reconstruct column for down migration
    const columnDef = this.generateColumnDefinition(column);
    downStatements.push(`ALTER TABLE "${tableName}" ADD COLUMN ${columnDef};`);

    return {
      up: upStatements.join('\n'),
      down: downStatements.join('\n')
    };
  }

  /**
   * Generate column definition SQL
   */
  static generateColumnDefinition(column: ColumnSchema): string {
    let definition = `"${column.name}" ${column.type}`;

    if (!column.nullable) {
      definition += ' NOT NULL';
    }

    if (column.primary) {
      definition += ' PRIMARY KEY';
    }

    if (column.autoIncrement) {
      definition += ' AUTOINCREMENT';
    }

    if (column.unique) {
      definition += ' UNIQUE';
    }

    definition += this.formatDefaultValue(column.default, column.type);

    return definition;
  }

  /**
   * Generate CREATE TABLE SQL from schema
   */
  static generateCreateTableSQL(schema: TableSchema): string {
    const columns = schema.columns.map(col => this.generateColumnDefinition(col));

    // Add foreign key constraints
    const foreignKeys = schema.foreignKeys.map(fk => {
      let fkDef = `FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")`;
      if (fk.onDelete) fkDef += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate) fkDef += ` ON UPDATE ${fk.onUpdate}`;
      return fkDef;
    });

    const allConstraints = [...columns, ...foreignKeys];

    return `CREATE TABLE "${schema.table}" (\n  ${allConstraints.join(',\n  ')}\n)`;
  }

  /**
   * Generate human-readable description of schema changes
   *
   * Creates a summary for migration file comments
   */
  static generateChangeDescription(diff: SchemaDiff, tableName: string): string {
    const changes: string[] = [];

    // Columns
    if (diff.addedColumns.length > 0) {
      const columnNames = diff.addedColumns.map(c => c.name).join(', ');
      changes.push(`✓ Added column(s): ${columnNames}`);
    }

    if (diff.removedColumns.length > 0) {
      const columnNames = diff.removedColumns.map(c => c.name).join(', ');
      changes.push(`✗ Removed column(s): ${columnNames}`);
    }

    if (diff.modifiedColumns.length > 0) {
      for (const mod of diff.modifiedColumns) {
        const changes_list: string[] = [];

        if (mod.oldType !== mod.newType) {
          changes_list.push(`type: ${mod.oldType} → ${mod.newType}`);
        }

        if (mod.oldNullable !== mod.newNullable) {
          changes_list.push(`nullable: ${mod.oldNullable} → ${mod.newNullable}`);
        }

        if (mod.current?.default !== mod.desired?.default) {
          changes_list.push(`default: ${mod.current?.default} → ${mod.desired?.default}`);
        }

        changes.push(`◎ Modified column "${mod.column}": ${changes_list.join(', ')}`);
      }
    }

    // Indexes
    if (diff.addedIndexes.length > 0) {
      for (const index of diff.addedIndexes) {
        const indexType = index.unique ? 'unique index' : 'index';
        changes.push(`+ Added ${indexType} on (${index.columns.join(', ')})`);
      }
    }

    if (diff.removedIndexes.length > 0) {
      for (const index of diff.removedIndexes) {
        changes.push(`- Removed index: ${index.name}`);
      }
    }

    // Foreign keys
    if (diff.addedForeignKeys.length > 0) {
      for (const fk of diff.addedForeignKeys) {
        changes.push(`⇒ Added foreign key: ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}`);
      }
    }

    if (diff.removedForeignKeys.length > 0) {
      for (const fk of diff.removedForeignKeys) {
        changes.push(`⇍ Removed foreign key: ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}`);
      }
    }

    if (changes.length === 0) {
      return `No changes detected for table "${tableName}"`;
    }

    return changes.join('\n * ');
  }

  /**
   * Generate description for table creation
   */
  static generateCreateDescription(schema: TableSchema): string {
    const parts: string[] = [];

    parts.push(`Creating table "${schema.table}" with:`);
    parts.push(`  • ${schema.columns.length} column(s)`);

    if (schema.foreignKeys.length > 0) {
      parts.push(`  • ${schema.foreignKeys.length} foreign key(s)`);
    }

    if (schema.indexes.length > 0) {
      parts.push(`  • ${schema.indexes.length} index(es)`);
    }

    const primaryKeys = schema.columns.filter(c => c.primary);
    if (primaryKeys.length > 0) {
      const pkNames = primaryKeys.map(c => c.name).join(', ');
      parts.push(`  • Primary key: ${pkNames}`);
    }

    return parts.join('\n');
  }

  /**
   * Generate description for table drop
   */
  static generateDropDescription(schema: TableSchema): string {
    return `Dropping table "${schema.table}" and all its data`;
  }

  /**
   * Determine if operation needs table recreation (SQLite limitation)
   */
  static needsTableRecreation(diff: SchemaDiff): boolean {
    // SQLite requires table recreation for:
    // - Column modifications (type, nullable, default changes)
    // - Adding/removing foreign keys
    // - Primary key changes

    return (
      diff.modifiedColumns.length > 0 ||
      diff.addedForeignKeys.length > 0 ||
      diff.removedForeignKeys.length > 0
    );
  }

  /**
   * Generate table recreation SQL for SQLite
   *
   * SQLite doesn't support ALTER COLUMN, so we need to:
   * 1. Create temp table with new schema
   * 2. Copy data from old table
   * 3. Drop old table
   * 4. Rename temp table
   */
  static generateTableRecreationSQL(
    currentSchema: TableSchema,
    desiredSchema: TableSchema,
    tableName: string
  ): GeneratedSQL {
    const tempTableName = `${tableName}_temp_${Date.now()}`;

    const upStatements: string[] = [];
    const downStatements: string[] = [];

    // UP: Create temp table with desired schema
    const desiredTableSQL = this.generateCreateTableSQL({
      ...desiredSchema,
      table: tempTableName
    });
    upStatements.push(desiredTableSQL + ';');

    // Copy data (handle column mapping)
    const commonColumns = desiredSchema.columns
      .filter(col => currentSchema.columns.some(curr => curr.name === col.name))
      .map(col => `"${col.name}"`);

    if (commonColumns.length > 0) {
      upStatements.push(
        `INSERT INTO "${tempTableName}" (${commonColumns.join(', ')}) ` +
        `SELECT ${commonColumns.join(', ')} FROM "${tableName}";`
      );
    }

    // Drop old table and rename temp
    upStatements.push(`DROP TABLE "${tableName}";`);
    upStatements.push(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}";`);

    // DOWN: Same process but with current schema
    const currentTableSQL = this.generateCreateTableSQL({
      ...currentSchema,
      table: tempTableName
    });
    downStatements.push(currentTableSQL + ';');

    const downCommonColumns = currentSchema.columns
      .filter(col => desiredSchema.columns.some(desired => desired.name === col.name))
      .map(col => `"${col.name}"`);

    if (downCommonColumns.length > 0) {
      downStatements.push(
        `INSERT INTO "${tempTableName}" (${downCommonColumns.join(', ')}) ` +
        `SELECT ${downCommonColumns.join(', ')} FROM "${tableName}";`
      );
    }

    downStatements.push(`DROP TABLE "${tableName}";`);
    downStatements.push(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}";`);

    const description = this.generateChangeDescription(
      {
        hasChanges: true,
        addedColumns: desiredSchema.columns.filter(
          col => !currentSchema.columns.some(curr => curr.name === col.name)
        ),
        removedColumns: currentSchema.columns.filter(
          col => !desiredSchema.columns.some(desired => desired.name === col.name)
        ),
        modifiedColumns: [],
        addedIndexes: [],
        removedIndexes: [],
        addedForeignKeys: desiredSchema.foreignKeys.filter(
          fk => !currentSchema.foreignKeys.some(curr => curr.column === fk.column)
        ),
        removedForeignKeys: currentSchema.foreignKeys.filter(
          fk => !desiredSchema.foreignKeys.some(desired => desired.column === fk.column)
        )
      },
      tableName
    );

    return {
      up: upStatements.join('\n'),
      down: downStatements.join('\n'),
      description: `${description}\n\n⚠️  Requires table recreation (SQLite limitation)`,
      requiresTransaction: true
    };
  }
}
