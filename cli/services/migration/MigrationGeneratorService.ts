/**
 * MigrationGeneratorService - Handles migration file generation
 *
 * Responsibilities:
 * - Generate migration files for changed tables
 * - Handle create/update/drop migrations
 * - Validate migrations before writing
 * - Generate migration content from templates
 *
 * Pattern: Service with focused methods (max 5 params rule)
 */

import path from 'path';
import { DataSource } from 'typeorm';
import { writeFile } from '../../utils/FileSystemService.js';
import {
  getTableSchema,
  compareTableSchemas,
  generateMigrationFromDiff,
  TableSchema,
} from '../../../main/db/utils/migrations.js';
import { MigrationValidationService } from '../../../main/db/migrations/MigrationValidationService.js';
import { MigrationSQLGenerator } from '../../../main/db/migrations/MigrationSQLGenerator.js';
import { MigrationValidator } from '../../commands/MigrationValidator.js';
import { TemplateManager } from '../../generators/managers/TemplateManager.js';
import { output } from '../../utils/output.js';

export interface MigrationGenerationOptions {
  currentDataSource: DataSource;
  desiredDataSource: DataSource;
  migrationsDir: string;
  changedTables: string[];
  dryRun?: boolean;
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

export class MigrationGeneratorService {
  private opts: MigrationGenerationOptions;

  constructor(opts: MigrationGenerationOptions) {
    this.opts = opts;
  }

  /**
   * Main entry point - handle schema changes (dry run or actual generation)
   */
  async handleSchemaChanges(): Promise<void> {
    if (this.opts.dryRun) {
      await this.showDryRunResults();
    } else {
      await this.generateMigrationFiles();
    }
  }

  /**
   * Shows what migration files would be created in dry run mode
   */
  private async showDryRunResults(): Promise<void> {
    output.info('\n🔍 DRY RUN - Migration files that would be created:');

    for (const tableName of this.opts.changedTables) {
      const timestamp = new Date().toISOString().replace(/[:.T-]/g, '').slice(0, -3);
      const action = await this.determineTableAction(tableName);
      const fileName = `${timestamp}_${action}${this.capitalize(tableName)}.ts`;
      output.info(`   📄 ${fileName}`);
    }
  }

  /**
   * Generates migration files for all changed tables
   */
  private async generateMigrationFiles(): Promise<void> {
    const generatedFiles: string[] = [];

    for (const tableName of this.opts.changedTables) {
      const fileName = await this.generateMigrationForTable(tableName);

      if (fileName) {
        generatedFiles.push(fileName);
        output.info(`✅ Generated migration: ${fileName}`);
      }

    }

    this.showGenerationSummary(generatedFiles.length);
  }

  /**
   * Generates a migration file for a specific table
   */
  private async generateMigrationForTable(tableName: string): Promise<string | null> {
    const timestamp = MigrationSQLGenerator.generateUniqueTimestamp();
    const currentSchema = await getTableSchema(this.opts.currentDataSource, tableName);
    const desiredSchema = await getTableSchema(this.opts.desiredDataSource, tableName);

    if (currentSchema && desiredSchema) {
      return await this.generateUpdateMigration(tableName, currentSchema, desiredSchema, timestamp);
    } else if (!currentSchema && desiredSchema) {
      return await this.generateCreateMigration(tableName, desiredSchema, timestamp);
    } else if (currentSchema && !desiredSchema) {
      return await this.generateDropMigration(tableName, currentSchema, timestamp);
    }

    return null;
  }

  /**
   * Generates an update migration for existing table
   */
  private async generateUpdateMigration(
    tableName: string,
    currentSchema: TableSchema,
    desiredSchema: TableSchema,
    timestamp: string
  ): Promise<string | null> {
    const diff = compareTableSchemas(currentSchema, desiredSchema);
    const validation = await MigrationValidationService.validateMigration(
      diff,
      this.opts.currentDataSource,
      tableName
    );

    // Show validation results
    if (validation.errors.length > 0) {
      output.error(`\n❌ Validation failed for ${tableName}:`);
      validation.errors.forEach(err => output.error(`   • ${err}`));
      return null;
    }

    if (validation.warnings.length > 0) {
      output.warning(`\n⚠️  Warnings for ${tableName}:`);
      validation.warnings.forEach(warn => output.warning(`   • ${warn}`));
    }

    const migrationSql = generateMigrationFromDiff(currentSchema, desiredSchema, tableName);
    const action = 'Update';
    const description = MigrationSQLGenerator.generateChangeDescription(diff, tableName);
    const fileName = `${timestamp}_${action}${this.capitalize(tableName)}.ts`;
    const className = `${action}${this.capitalize(tableName)}_${timestamp}`;

    const migrationContent = this.generateMigrationFileContent({
      className,
      tableName,
      sql: migrationSql,
      action,
      currentSchema,
      desiredSchema,
      description
    });

    // Validate migration before writing file
    if (await this.validateMigrationBeforeWrite(fileName, migrationContent, timestamp)) {
      await writeFile(path.join(this.opts.migrationsDir, fileName), migrationContent);
      return fileName;
    } else {
      output.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
      return null;
    }
  }

  /**
   * Generates a create migration for new table
   */
  private async generateCreateMigration(
    tableName: string,
    desiredSchema: TableSchema,
    timestamp: string
  ): Promise<string> {
    const action = 'Create';
    const description = MigrationSQLGenerator.generateCreateDescription(desiredSchema);
    const fileName = `${timestamp}_${action}${this.capitalize(tableName)}.ts`;
    const className = `${action}${this.capitalize(tableName)}_${timestamp}`;

    const createTableSql = MigrationSQLGenerator.generateCreateTableSQL(desiredSchema);
    const migrationContent = this.generateMigrationFileContent({
      className,
      tableName,
      sql: { up: createTableSql, down: `DROP TABLE "${tableName}"` },
      action,
      desiredSchema,
      description
    });

    // Validate migration before writing file
    if (await this.validateMigrationBeforeWrite(fileName, migrationContent, timestamp)) {
      await writeFile(path.join(this.opts.migrationsDir, fileName), migrationContent);
      return fileName;
    } else {
      output.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
      return '';
    }
  }

  /**
   * Generates a drop migration for removed table
   */
  private async generateDropMigration(
    tableName: string,
    currentSchema: TableSchema,
    timestamp: string
  ): Promise<string> {
    const action = 'Drop';
    const description = MigrationSQLGenerator.generateDropDescription(currentSchema);
    const fileName = `${timestamp}_${action}${this.capitalize(tableName)}.ts`;
    const className = `${action}${this.capitalize(tableName)}_${timestamp}`;

    const dropTableSql = MigrationSQLGenerator.generateCreateTableSQL(currentSchema);
    const migrationContent = this.generateMigrationFileContent({
      className,
      tableName,
      sql: { up: `DROP TABLE "${tableName}"`, down: dropTableSql },
      action,
      currentSchema,
      description
    });

    // Validate migration before writing file
    if (await this.validateMigrationBeforeWrite(fileName, migrationContent, timestamp)) {
      await writeFile(path.join(this.opts.migrationsDir, fileName), migrationContent);
      return fileName;
    } else {
      output.error(`❌ Migration validation failed for ${tableName}. Migration not created.`);
      return '';
    }
  }

  /**
   * Generates migration file content from template
   */
  private generateMigrationFileContent(opts: MigrationFileOptions): string {
    const { className, tableName, sql, action, currentSchema, desiredSchema, description } = opts;
    const timestamp = new Date().toISOString();
    const templateManager = new TemplateManager();

    // Determine if transaction is required
    let requiresTransaction = false;
    if (currentSchema && desiredSchema) {
      const diff = compareTableSchemas(currentSchema, desiredSchema);
      requiresTransaction = MigrationSQLGenerator.needsTableRecreation(diff);
    }

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
   * Validates a migration before writing it to disk
   */
  private async validateMigrationBeforeWrite(
    fileName: string,
    migrationContent: string,
    timestamp: string
  ): Promise<boolean> {
    output.info(`🧪 Validating migration: ${fileName}`);

    // 1. SQL Syntax Validation
    output.info('   📝 Testing SQL syntax...');
    const tempSqlTestDb = path.join(process.cwd(), `.data/.temp.sqltest.${timestamp}.db`);
    const sqlValidation = await MigrationValidator.validateSQLSyntax(
      this.extractSQLFromMigrationContent(migrationContent),
      tempSqlTestDb
    );

    if (!sqlValidation.success) {
      output.error(`   ❌ SQL syntax validation failed: ${sqlValidation.error}`);
      return false;
    }

    // 2. Migration Execution Validation
    output.info('   🏗️  Testing migration execution...');
    const executionValidation = await MigrationValidator.testMigrationExecution({
      migrationContent,
      migrationFileName: fileName,
      migrationsDir: this.opts.migrationsDir,
      migrationTimestamp: timestamp
    });

    if (!executionValidation.success) {
      output.error(`   ❌ Migration execution validation failed: ${executionValidation.error}`);
      return false;
    }

    output.info(`   ✅ Migration validation passed for ${fileName}`);
    return true;


  }

  /**
   * Extract SQL statements from migration file content
   */
  private extractSQLFromMigrationContent(content: string): string {
    const sqlMatch = content.match(/await this\.query\(`([^`]+)`\);/s);
    if (sqlMatch) {
      return sqlMatch[1];
    }

    const upSqlMatch = content.match(/sql:\s*\{\s*up:\s*`([^`]+)`/s);
    if (upSqlMatch) {
      return upSqlMatch[1];
    }

    return '';
  }

  /**
   * Determines the action (Create/Update/Drop) for a table
   */
  private async determineTableAction(tableName: string): Promise<string> {
    const currentTables = await this.opts.currentDataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    ).then((rows: any[]) => rows.length > 0);

    const desiredTables = await this.opts.desiredDataSource.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    ).then((rows: any[]) => rows.length > 0);

    if (!currentTables && desiredTables) return 'Create';
    if (currentTables && !desiredTables) return 'Drop';
    return 'Update';
  }

  /**
   * Shows generation summary
   */
  private showGenerationSummary(count: number): void {
    output.info(`\n🎉 Successfully generated ${count} migration file(s)`);
    output.info('💡 Next steps:');
    output.info('   1. Review the generated migration files');
    output.info('   2. Run: yarn migration:show (to preview SQL)');
    output.info('   3. Run: yarn migration:run (to apply migrations)');
  }

  /**
   * Capitalize first letter of string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
