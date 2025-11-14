/**
 * BaseMigration - Foundation for all database migrations
 *
 * Provides:
 * - SQL validation before execution
 * - Detailed error reporting with context
 * - Multi-statement SQL execution
 * - Query execution utilities
 * - TypeORM handles transaction wrapping automatically
 */

import TypeOrm from 'typeorm';

export type QueryRunner = TypeOrm.QueryRunner;

export interface MigrationMetadata {
  name: string;
  tableName: string;
  action: 'Create' | 'Update' | 'Drop';
  requiresTransaction?: boolean;  // @deprecated: TypeORM handles transactions automatically
  description?: string;
}

export interface MigrationExecutionOptions {
  validateOnly?: boolean;  // Dry run - validate SQL without executing
  verbose?: boolean;  // Detailed logging
}

/**
 * Base class for all migrations
 *
 * Usage:
 * export class CreateUsers_123456 extends BaseMigration {
 *   metadata = {
 *     name: 'CreateUsers_123456',
 *     tableName: 'users',
 *     action: 'Create'
 *   };
 *
 *   async up(queryRunner: QueryRunner): Promise<void> {
 *     await this.executeSQL(queryRunner, `CREATE TABLE "users" (...)`);
 *   }
 *
 *   async down(queryRunner: QueryRunner): Promise<void> {
 *     await this.executeSQL(queryRunner, `DROP TABLE "users"`);
 *   }
 * }
 */
export abstract class BaseMigration {
  /** Migration metadata (must be set by subclass) */
  abstract metadata: MigrationMetadata;

  /** Migration name (TypeORM compatibility) */
  get name(): string {
    return this.metadata.name;
  }

  /**
   * Execute migration up (apply changes)
   */
  abstract up(queryRunner: QueryRunner, options?: MigrationExecutionOptions): Promise<void>;

  /**
   * Execute migration down (revert changes)
   */
  abstract down(queryRunner: QueryRunner, options?: MigrationExecutionOptions): Promise<void>;

  /**
   * Execute SQL with transaction safety and validation
   *
   * @param queryRunner - TypeORM query runner
   * @param sql - SQL statement(s) to execute
   * @param options - Execution options
   */
  protected async executeSQL(
    queryRunner: QueryRunner,
    sql: string,
    options: MigrationExecutionOptions = {}
  ): Promise<void> {
    const { validateOnly = false, verbose = false } = options;

    // Normalize SQL: trim and remove empty lines
    const normalizedSQL = sql
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    if (verbose) {
      console.log(`\n📝 Executing SQL for ${this.metadata.name}:`);
      console.log(this.formatSQL(normalizedSQL));
    }

    // Validation phase
    if (validateOnly) {
      try {
        await this.validateSQL(queryRunner, normalizedSQL);
        console.log(`✅ SQL validation passed for ${this.metadata.name}`);
        return;
      } catch (error) {
        throw this.createMigrationError(
          'SQL validation failed',
          normalizedSQL,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }

    // Execution phase
    // Note: TypeORM automatically wraps migrations in transactions
    // We don't need explicit transaction handling as it causes nested transaction errors
    try {
      // Execute each statement separately to handle multi-statement SQL properly
      const statements = this.splitStatements(normalizedSQL);

      for (const statement of statements) {
        if (statement.trim().length > 0) {
          await queryRunner.query(statement);
        }
      }

      if (verbose) {
        console.log(`✅ Migration executed successfully: ${this.metadata.name}`);
      }
    } catch (error) {
      throw this.createMigrationError(
        'Migration execution failed',
        normalizedSQL,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Execute multiple SQL statements
   *
   * @param queryRunner - TypeORM query runner
   * @param statements - Array of SQL statements
   * @param options - Execution options
   */
  protected async executeMultipleSQL(
    queryRunner: QueryRunner,
    statements: string[],
    options: MigrationExecutionOptions = {}
  ): Promise<void> {
    for (const sql of statements) {
      await this.executeSQL(queryRunner, sql, options);
    }
  }

  /**
   * Validate SQL syntax without executing
   *
   * Uses SQLite's EXPLAIN to check syntax
   */
  private async validateSQL(queryRunner: QueryRunner, sql: string): Promise<void> {
    const statements = this.splitStatements(sql);

    for (const statement of statements) {
      if (statement.trim().length === 0) continue;

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
        // EXPLAIN checks syntax without executing
        await queryRunner.query(`EXPLAIN ${statement}`);
      } catch (error) {
        throw new Error(
          `Invalid SQL syntax in statement:\n${statement}\n\nError: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Split SQL into individual statements
   */
  private splitStatements(sql: string): string[] {
    return sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Create detailed error with context
   */
  private createMigrationError(message: string, sql: string, originalError: Error): Error {
    const formattedSQL = this.formatSQL(sql);

    const errorMessage = [
      `❌ ${message} in ${this.metadata.name}`,
      ``,
      `Table: ${this.metadata.tableName}`,
      `Action: ${this.metadata.action}`,
      ``,
      `SQL that failed:`,
      formattedSQL,
      ``,
      `Original error:`,
      originalError.message
    ].join('\n');

    const error = new Error(errorMessage);
    error.stack = originalError.stack;
    return error;
  }

  /**
   * Format SQL for display
   */
  private formatSQL(sql: string): string {
    return sql
      .split('\n')
      .map((line, i) => `  ${String(i + 1).padStart(3, ' ')} | ${line}`)
      .join('\n');
  }

  /**
   * Check if table exists
   */
  protected async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    );
    return result.length > 0;
  }

  /**
   * Check if column exists
   */
  protected async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const columns = await queryRunner.query(`PRAGMA table_info("${tableName}")`);
    return columns.some((col: any) => col.name === columnName);
  }

  /**
   * Check if index exists
   */
  protected async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
    const result = await queryRunner.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND name = ?",
      [indexName]
    );
    return result.length > 0;
  }

  /**
   * Get table row count
   */
  protected async getTableRowCount(queryRunner: QueryRunner, tableName: string): Promise<number> {
    const exists = await this.tableExists(queryRunner, tableName);
    if (!exists) return 0;

    const result = await queryRunner.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return result[0]?.count || 0;
  }

  /**
   * Safely drop table (only if exists)
   */
  protected async dropTableIfExists(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const exists = await this.tableExists(queryRunner, tableName);
    if (exists) {
      await this.executeSQL(queryRunner, `DROP TABLE "${tableName}"`);
    }
  }

  /**
   * Safely drop index (only if exists)
   */
  protected async dropIndexIfExists(queryRunner: QueryRunner, indexName: string): Promise<void> {
    const exists = await this.indexExists(queryRunner, indexName);
    if (exists) {
      await this.executeSQL(queryRunner, `DROP INDEX "${indexName}"`);
    }
  }
}
