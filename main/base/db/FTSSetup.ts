import { DataSource } from 'typeorm';
import { getSearchableMetadata } from '../graphql/decorators/Searchable.js';
import Handlebars from 'handlebars';
import { pluralize } from '@shared/utils.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FTS Setup - Creates FTS tables for searchable entities
 *
 * Uses the existing search-migration.hbs template to generate and execute FTS setup
 * for entities marked with @Searchable decorator. This ensures search functionality
 * works in environments where migrations might be skipped (like tests).
 */
export class FTSSetup {
  /**
   * Initialize FTS tables for all searchable entities using the migration template
   */
  static async initializeSearchableEntities(dataSource: DataSource): Promise<void> {
    console.log('🔍 Initializing FTS tables for searchable entities...');

    // Get all entities from the data source
    const entities = dataSource.entityMetadatas.map(meta => meta.target);
    const searchableEntities = entities.filter(entity => this.isSearchableEntity(entity));

    if (searchableEntities.length === 0) {
      console.log('ℹ️  No searchable entities found');
      return;
    }

    let ftsTablesCreated = 0;

    for (const entityClass of searchableEntities) {
      try {
        await this.createFTSTableFromTemplate(dataSource, entityClass);
        ftsTablesCreated++;
      } catch (error) {
        const entityName = typeof entityClass === 'function' ? entityClass.name : entityClass.constructor.name;
        console.error(`❌ Failed to create FTS for ${entityName}:`, error);
        throw error;
      }
    }

    console.log(`✅ Created ${ftsTablesCreated} FTS tables`);
  }

  /**
   * Check if an entity is marked as searchable
   */
  private static isSearchableEntity(entityClass: any): boolean {
    try {
      const metadata = getSearchableMetadata(entityClass);
      return metadata !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Create FTS table using the fts-setup.hbs template
   */
  private static async createFTSTableFromTemplate(dataSource: DataSource, entityClass: any): Promise<void> {
    const searchableMetadata = getSearchableMetadata(entityClass);
    if (!searchableMetadata) return;

    const className = typeof entityClass === 'function' ? entityClass.name : entityClass.constructor.name;
    const tableName = this.getTableName(entityClass);
    const ftsTableName = `${tableName}_fts`;
    const searchFields = searchableMetadata.fields;

    console.log(`  Creating FTS table: ${ftsTableName} for ${className}`);

    // Load the FTS setup template (located in same directory)
    const templatePath = path.join(__dirname, 'fts-setup.hbs');
    const templateContent = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    // Prepare template context
    const context = {
      className,
      tableName,
      ftsTableName,
      searchFields,
      searchFieldsList: searchFields.join(', '),
      searchFieldsInsert: searchFields.map(f => `new.${f}`).join(', '),
      searchFieldsUpdate: searchFields.map(f => `${f} = new.${f}`).join(', '),
      timestamp: new Date().toISOString(),
      hasSoftDelete: await this.hasSoftDelete(dataSource, tableName),
    };

    // Generate and execute SQL
    const sql = template(context);
    await this.executeSQL(dataSource, sql);

    console.log(`    ✅ ${ftsTableName} created successfully`);
  }

  /**
   * Execute SQL statements from rendered template
   * Handles BEGIN...END blocks properly (like triggers)
   */
  private static async executeSQL(dataSource: DataSource, sql: string): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const statements: string[] = [];
      let current = '';
      let inBeginEnd = 0;

      // Split by semicolons, but respect BEGIN...END blocks
      const lines = sql.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip comment-only lines
        if (trimmedLine.startsWith('--')) continue;

        current += line + '\n';

        // Track BEGIN...END nesting (for triggers)
        if (/\bBEGIN\b/i.test(trimmedLine)) {
          inBeginEnd++;
        }
        if (/\bEND\b/i.test(trimmedLine)) {
          inBeginEnd--;
        }

        // Split on semicolon only when not inside BEGIN...END
        if (trimmedLine.endsWith(';') && inBeginEnd === 0) {
          const stmt = current.trim();
          if (stmt) {
            statements.push(stmt);
          }
          current = '';
        }
      }

      // Add any remaining statement
      if (current.trim()) {
        statements.push(current.trim());
      }

      // Execute each statement using QueryRunner for proper transaction handling
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await queryRunner.query(statement);
        } catch (error) {
          console.error(`❌ Failed to execute SQL statement ${i + 1}:`, error);
          console.error('Full statement:', statement);
          throw error;
        }
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get the table name for an entity class
   */
  private static getTableName(entityClass: any): string {
    // Try to get table name from TypeORM metadata first
    const entityMetadata = entityClass.prototype?.constructor?.name;
    if (entityMetadata) {
      // Convert class name to table name (e.g., Post -> posts) using shared pluralize
      return pluralize(entityMetadata.toLowerCase());
    }

    throw new Error(`Could not determine table name for entity: ${entityClass.name}`);
  }

  /**
   * Check if a table has soft delete support (deletedAt column)
   */
  private static async hasSoftDelete(dataSource: DataSource, tableName: string): Promise<boolean> {
    try {
      const result = await dataSource.query(`
        SELECT COUNT(*) as count FROM pragma_table_info('${tableName}')
        WHERE name = 'deletedAt'
      `);

      return result[0]?.count > 0;
    } catch {
      try {
        // Fallback method
        const tableInfo = await dataSource.query(`PRAGMA table_info(${tableName});`);
        return tableInfo.some((row: any) => row.name === 'deletedAt');
      } catch {
        return false;
      }
    }
  }

  /**
   * Verify that FTS tables exist for searchable entities
   */
  static async verifyFTSTables(dataSource: DataSource): Promise<{
    existing: string[];
    missing: string[];
  }> {
    const entities = dataSource.entityMetadatas.map(meta => meta.target);
    const searchableEntities = entities.filter(entity => this.isSearchableEntity(entity));

    const existing: string[] = [];
    const missing: string[] = [];

    for (const entityClass of searchableEntities) {
      const tableName = this.getTableName(entityClass);
      const ftsTableName = `${tableName}_fts`;

      try {
        const result = await dataSource.query(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name='${ftsTableName}'
        `);

        if (result.length > 0) {
          existing.push(ftsTableName);
        } else {
          missing.push(ftsTableName);
        }
      } catch {
        missing.push(ftsTableName);
      }
    }

    return { existing, missing };
  }

  /**
   * Get information about searchable entities
   */
  static async getSearchableEntitiesInfo(dataSource: DataSource): Promise<Array<{
    className: string;
    tableName: string;
    ftsTableName: string;
    searchFields: string[];
    hasSoftDelete: boolean;
  }>> {
    const entities = dataSource.entityMetadatas.map(meta => meta.target);
    const searchableEntities = entities.filter(entity => this.isSearchableEntity(entity));

    return await Promise.all(searchableEntities.map(async (entityClass) => {
      const searchableMetadata = getSearchableMetadata(entityClass)!;
      const tableName = this.getTableName(entityClass);

      return {
        className: typeof entityClass === 'function' ? entityClass.name : entityClass.constructor.name,
        tableName,
        ftsTableName: `${tableName}_fts`,
        searchFields: searchableMetadata.fields,
        hasSoftDelete: await this.hasSoftDelete(dataSource, tableName),
      };
    }));
  }
}