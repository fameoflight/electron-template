/**
 * MigrationValidationService - Pre-migration safety checks
 *
 * Validates migrations BEFORE generation to catch destructive operations:
 * - Type changes that could lose data
 * - NOT NULL additions without defaults
 * - Foreign key cycles
 * - Index name conflicts
 * - Dropping columns with data
 */

import { DataSource } from 'typeorm';
import { TableSchema, ColumnSchema, SchemaDiff } from '../utils/migrations.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TypeChangeRisk {
  safe: boolean;
  warning?: string;
  migrationHint?: string;
}

/**
 * Static validation service - no state needed
 */
export class MigrationValidationService {
  /**
   * Validate entire migration before generation
   *
   * @param diff - Schema differences to validate
   * @param dataSource - Database connection for data checks
   * @param tableName - Table being modified
   * @returns Validation result with errors and warnings
   */
  static async validateMigration(
    diff: SchemaDiff,
    dataSource: DataSource,
    tableName: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if table has data
    const hasData = await this.tableHasData(dataSource, tableName);

    // Validate column additions
    for (const column of diff.addedColumns) {
      const result = this.validateColumnAddition(column, hasData);
      if (!result.valid) {
        errors.push(...result.errors);
      }
      warnings.push(...result.warnings);
    }

    // Validate column removals
    for (const column of diff.removedColumns) {
      const result = await this.validateColumnRemoval(column, tableName, dataSource);
      warnings.push(...result.warnings);
    }

    // Validate column modifications
    for (const modification of diff.modifiedColumns) {
      if (modification.current && modification.desired) {
        const result = await this.validateTypeChange(
          modification.current as ColumnSchema,
          modification.desired as ColumnSchema,
          tableName,
          dataSource
        );
        if (!result.safe) {
          errors.push(result.warning || 'Unsafe type change detected');
          if (result.migrationHint) {
            warnings.push(`💡 Hint: ${result.migrationHint}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate adding a column to existing table
   */
  static validateColumnAddition(column: ColumnSchema, tableHasData: boolean): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // NOT NULL without default on non-empty table
    if (!column.nullable && column.default === null && tableHasData) {
      errors.push(
        `Cannot add NOT NULL column "${column.name}" without DEFAULT to non-empty table. ` +
        `Either add a DEFAULT value or make the column nullable.`
      );
    }

    // NOT NULL with default on non-empty table (acceptable but warn)
    if (!column.nullable && column.default !== null && tableHasData) {
      warnings.push(
        `Adding NOT NULL column "${column.name}" with DEFAULT value. ` +
        `Existing rows will use default: ${column.default}`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate removing a column
   */
  static async validateColumnRemoval(
    column: ColumnSchema,
    tableName: string,
    dataSource: DataSource
  ): Promise<ValidationResult> {
    const warnings: string[] = [];

    // Check if column has non-null data
    try {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${column.name}" IS NOT NULL`
      );

      const nonNullCount = result[0]?.count || 0;

      if (nonNullCount > 0) {
        warnings.push(
          `⚠️  Dropping column "${column.name}" which has ${nonNullCount} non-null value(s). ` +
          `Consider archiving this data before dropping.`
        );
      }
    } catch (error) {
      // Table might not exist yet, ignore
    }

    return { valid: true, errors: [], warnings };
  }

  /**
   * Analyze type change safety
   *
   * @param oldColumn - Current column schema
   * @param newColumn - Desired column schema
   * @param tableName - Table name for data checking
   * @param dataSource - Database connection
   * @returns Type change risk assessment
   */
  static async validateTypeChange(
    oldColumn: ColumnSchema,
    newColumn: ColumnSchema,
    tableName: string,
    dataSource: DataSource
  ): Promise<TypeChangeRisk> {
    const oldType = this.normalizeType(oldColumn.type);
    const newType = this.normalizeType(newColumn.type);

    // Same type (case-insensitive)
    if (oldType === newType) {
      // Check nullability change
      if (oldColumn.nullable && !newColumn.nullable) {
        const hasNulls = await this.columnHasNulls(dataSource, tableName, oldColumn.name);
        if (hasNulls) {
          return {
            safe: false,
            warning: `Cannot change column "${oldColumn.name}" to NOT NULL - table contains NULL values`,
            migrationHint: `Update NULL values first: UPDATE "${tableName}" SET "${oldColumn.name}" = <default_value> WHERE "${oldColumn.name}" IS NULL`
          };
        }
      }
      return { safe: true };
    }

    // Type compatibility matrix
    const compatibility = this.getTypeCompatibility(oldType, newType);

    if (!compatibility.safe) {
      const hasData = await this.columnHasData(dataSource, tableName, oldColumn.name);
      if (hasData) {
        return {
          safe: false,
          warning: `Unsafe type change: ${oldType} → ${newType} for column "${oldColumn.name}". Data may be lost or corrupted.`,
          migrationHint: compatibility.migrationHint
        };
      }
    }

    return compatibility;
  }

  /**
   * Get type compatibility information
   */
  private static getTypeCompatibility(oldType: string, newType: string): TypeChangeRisk {
    // Safe conversions (no data loss)
    const safeConversions: Record<string, string[]> = {
      'varchar': ['text', 'blob'],
      'int': ['bigint', 'real', 'text'],
      'integer': ['bigint', 'real', 'text'],
      'real': ['text'],
      'date': ['datetime', 'text'],
      'datetime': ['text'],
      'boolean': ['int', 'integer', 'text']
    };

    if (safeConversions[oldType]?.includes(newType)) {
      return { safe: true };
    }

    // Potentially unsafe conversions (data loss possible)
    const unsafeConversions: Record<string, Record<string, string>> = {
      'text': {
        'int': 'Convert text to integers. Non-numeric values will fail.',
        'integer': 'Convert text to integers. Non-numeric values will fail.',
        'real': 'Convert text to real numbers. Non-numeric values will fail.',
        'date': 'Convert text to dates. Invalid date strings will fail.',
        'datetime': 'Convert text to datetimes. Invalid datetime strings will fail.'
      },
      'varchar': {
        'int': 'Convert varchar to integers. Non-numeric values will fail.',
        'integer': 'Convert varchar to integers. Non-numeric values will fail.',
        'real': 'Convert varchar to real numbers. Non-numeric values will fail.'
      },
      'real': {
        'int': 'Convert real to integer. Decimal places will be truncated.',
        'integer': 'Convert real to integer. Decimal places will be truncated.'
      },
      'bigint': {
        'int': 'Convert bigint to int. Large values may overflow.',
        'integer': 'Convert bigint to integer. Large values may overflow.'
      }
    };

    const hint = unsafeConversions[oldType]?.[newType];

    return {
      safe: false,
      warning: hint || `Unsafe conversion: ${oldType} → ${newType}`,
      migrationHint: hint
    };
  }

  /**
   * Detect foreign key cycles
   *
   * @param schemas - Map of table name to schema
   * @returns Array of cycle descriptions
   */
  static detectForeignKeyCycles(schemas: Map<string, TableSchema>): string[] {
    const cycles: string[] = [];
    const graph = this.buildDependencyGraph(schemas);

    // DFS-based cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (table: string, path: string[] = []): void => {
      visited.add(table);
      recursionStack.add(table);
      path.push(table);

      const dependencies = graph.get(table) || [];

      for (const dependency of dependencies) {
        if (!visited.has(dependency)) {
          detectCycle(dependency, [...path]);
        } else if (recursionStack.has(dependency)) {
          // Cycle detected
          const cycleStart = path.indexOf(dependency);
          const cycle = [...path.slice(cycleStart), dependency].join(' → ');
          cycles.push(`Foreign key cycle detected: ${cycle}`);
        }
      }

      recursionStack.delete(table);
    };

    for (const table of schemas.keys()) {
      if (!visited.has(table)) {
        detectCycle(table);
      }
    }

    return cycles;
  }

  /**
   * Build dependency graph from foreign keys
   */
  private static buildDependencyGraph(
    schemas: Map<string, TableSchema>
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const [tableName, schema] of schemas) {
      const dependencies = schema.foreignKeys.map(fk => fk.referencedTable);
      graph.set(tableName, dependencies);
    }

    return graph;
  }

  /**
   * Check if table has any data
   */
  private static async tableHasData(dataSource: DataSource, tableName: string): Promise<boolean> {
    try {
      const result = await dataSource.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return (result[0]?.count || 0) > 0;
    } catch (error) {
      // Table doesn't exist yet
      return false;
    }
  }

  /**
   * Check if column has any non-null data
   */
  private static async columnHasData(
    dataSource: DataSource,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    try {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${columnName}" IS NOT NULL`
      );
      return (result[0]?.count || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if column has NULL values
   */
  private static async columnHasNulls(
    dataSource: DataSource,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    try {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${columnName}" IS NULL`
      );
      return (result[0]?.count || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Normalize type for comparison (lowercase, strip size)
   */
  private static normalizeType(type: string): string {
    return type
      .toLowerCase()
      .replace(/\(.*?\)/, '') // Remove size specifications like VARCHAR(255)
      .replace(/\s+/g, '') // Remove spaces
      .trim();
  }

  /**
   * Validate index name uniqueness
   *
   * SQLite has global index namespace - indexes must be unique across ALL tables
   */
  static async validateIndexNames(
    schemas: Map<string, TableSchema>,
    dataSource: DataSource
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const indexNames = new Set<string>();

    // Check all indexes in schemas
    for (const [tableName, schema] of schemas) {
      for (const index of schema.indexes) {
        if (indexNames.has(index.name)) {
          errors.push(
            `Duplicate index name "${index.name}" found. SQLite requires globally unique index names.`
          );
        }
        indexNames.add(index.name);
      }
    }

    // Check existing indexes in database
    try {
      const existingIndexes = await dataSource.query(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );

      for (const row of existingIndexes) {
        if (indexNames.has(row.name)) {
          errors.push(
            `Index name "${row.name}" already exists in database. Choose a different name.`
          );
        }
      }
    } catch (error) {
      // Database might not be initialized yet, ignore
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate SQL syntax using EXPLAIN
   */
  static async validateSQL(sql: string, dataSource: DataSource): Promise<ValidationResult> {
    const errors: string[] = [];
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      // Skip validation for statements that can't be explained
      const skipPatterns = [
        /^BEGIN\s+TRANSACTION/i,
        /^COMMIT/i,
        /^ROLLBACK/i,
        /^PRAGMA/i
      ];

      if (skipPatterns.some(pattern => pattern.test(statement))) {
        continue;
      }

      try {
        await dataSource.query(`EXPLAIN ${statement}`);
      } catch (error) {
        errors.push(
          `Invalid SQL syntax:\n${statement}\n\nError: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}
