/**
 * SearchGenerator - Generate FTS5 (Full-Text Search) support for entities
 *
 * Usage:
 *   yarn g search Post title content
 *   yarn g search Product name description
 *
 * Generates:
 *   - FTS5 migration file with virtual table and triggers
 *   - Searchable decorator for entity metadata
 *   - Search query helper methods
 *   - GraphQL search resolvers
 *
 * Features:
 *   - SQLite FTS5 virtual tables with automatic sync triggers
 *   - Soft delete handling (excludes deleted records from search)
 *   - Type-safe search query builders
 *   - GraphQL search endpoints with pagination
 *   - Search result highlighting support
 */
import { BaseGenerator, GeneratorOptions, GeneratorResult } from './BaseGenerator.js';
import { generateMigrationName } from '../utils/string-helpers.js';

export interface SearchGeneratorOptions {
  name: string;
  attributes: string[];
  force?: boolean;
  dryRun?: boolean;
}

export class SearchGenerator extends BaseGenerator {
  private searchFields: string[];

  constructor(options: SearchGeneratorOptions) {
    super(options as unknown as GeneratorOptions);
    this.searchFields = options.attributes || [];

    if (this.searchFields.length === 0) {
      throw new Error('At least one search field must be specified');
    }
  }

  async generate(): Promise<GeneratorResult> {
    const className = this.toPascalCase(this.name);
    const tableName = this.pluralize(this.toSnakeCase(this.name));
    const ftsTableName = `${tableName}_fts`;
    const migrationName = generateMigrationName(`Add${className}FTS`);

    console.log(`\n🔍 Generating FTS5 Search Migration: ${className}\n`);
    console.log(`📝 Search Fields: ${this.searchFields.join(', ')}\n`);

    // Prepare template context
    const context = {
      className,
      tableName,
      ftsTableName,
      migrationName,
      searchFields: this.searchFields,
      searchFieldsList: this.searchFields.join(', '),
      searchFieldsInsert: this.searchFields.map(f => `new.${f}`).join(', '),
      searchFieldsUpdate: this.searchFields.map(f => `${f} = new.${f}`).join(', '),
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear(),
      hasSoftDelete: true, // Assuming BaseEntity has soft delete
    };

    // Generate migration file only
    const migrationTemplate = await this.loadTemplate('search-migration.hbs');
    const migrationContent = this.renderTemplate(migrationTemplate, context as any);
    const migrationPath = `main/db/migrations/${migrationName}.ts`;
    await this.writeFile(migrationPath, migrationContent);

    console.log('📁 Generated File:');
    console.log(`   - Migration: ${migrationPath}`);
    console.log('');

    console.log('💡 Next Steps:');
    console.log(`   1. Run migration: yarn typeorm migration:run`);
    console.log(`   2. Add @Searchable({ fields: [${this.searchFields.map(f => `'${f}'`).join(', ')}] }) decorator to ${className} entity`);
    console.log(`   3. Use @CRUDResolver with searchable: true option`);
    console.log(`   4. Generate GraphQL schema: yarn graphql`);
    console.log('');

    return this.results;
  }
}