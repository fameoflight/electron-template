/**
 * DbInspectCommand - Inspect database entity schema
 *
 * Refactored from standalone function to proper command class
 * Following refactor.md principles:
 * - Command class with state encapsulation
 * - Single responsibility (schema inspection)
 * - Options object pattern (max 5 parameters)
 * - Clean separation of listing vs inspecting
 */

import { BaseDatabaseCommand, type CommandResult } from '../../utils/BaseDatabaseCommand.js';

export interface DbInspectOptions {
  entityName?: string;
  verbose?: boolean;
}

export interface EntitySchema {
  name: string;
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
    primary: boolean;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
  }>;
}

/**
 * Command for inspecting database entity schemas
 */
export class DbInspectCommand extends BaseDatabaseCommand {
  async run(options: DbInspectOptions): Promise<CommandResult<EntitySchema | EntitySchema[]>> {
    this.info('📋 Inspecting database schema...\n');

    const result = await this.withDatabase(async (dataSource) => {
      if (!options.entityName) {
        // List all available entities
        const entities = await this.getAvailableEntities();
        return entities as EntitySchema[];
      } else {
        // Inspect specific entity
        const metadata = dataSource.getMetadata(options.entityName);

        const columns = metadata.columns.map((col: any) => ({
          name: col.propertyName,
          type: col.type,
          nullable: col.isNullable,
          unique: col.isUnique,
          primary: col.isPrimary
        }));

        const indexes = metadata.indices?.map((idx: any) => ({
          name: idx.name,
          columns: idx.columns.map((c: any) => c.propertyName)
        })) || [];

        return {
          name: options.entityName,
          table: metadata.tableName,
          columns,
          indexes
        } as EntitySchema;
      }
    });

    if (!result.success) {
      this.error('❌ Failed to inspect database', result.error!);
      return {
        success: false,
        message: `Failed to inspect database: ${result.error}`,
        data: []
      };
    }

    // Display results
    if (Array.isArray(result.data)) {
      // List entities
      this.success('\n📋 Available Entities:\n');
      result.data.forEach(entity => {
        this.info(`  ${entity.name.padEnd(20)} → ${entity.table}`);
      });
      this.info('\n💡 Usage: yarn db:inspect User');

      return {
        success: true,
        message: `Found ${result.data.length} entities`,
        data: result.data
      };
    } else {
      // Show entity schema
      const schema = result.data;
      if (!schema) {
        this.error('❌ No schema data available');
        return {
          ...result,
          message: 'No schema data available'
        };
      }

      this.success(`\n📊 Schema for ${schema.name} (table: ${schema.table})\n`);

      // Display columns as table
      console.table(schema.columns.map(col => ({
        Column: col.name,
        Type: col.type,
        Nullable: col.nullable ? 'yes' : 'no',
        Unique: col.unique ? 'yes' : 'no',
        Primary: col.primary ? 'yes' : 'no'
      })));

      // Display indexes if any
      if (schema.indexes && schema.indexes.length > 0) {
        this.info('\nIndexes:');
        schema.indexes.forEach(idx => {
          this.info(`  ${idx.name}: [${idx.columns.join(', ')}]`);
        });
      }

      // Additional analysis
      this.info('\n📈 Entity Analysis:');
      this.info(`  • Total columns: ${schema.columns.length}`);
      this.info(`  • Primary keys: ${schema.columns.filter(c => c.primary).length}`);
      this.info(`  • Unique columns: ${schema.columns.filter(c => c.unique).length}`);
      this.info(`  • Indexes: ${schema.indexes ? schema.indexes.length : 0}`);

      return {
        success: true,
        message: `Schema inspected for entity: ${schema.name}`,
        data: schema
      };
    }
  }

  /**
   * Validate entity name exists
   */
  private async validateEntityName(entityName: string): Promise<boolean> {
    const entities = await this.getAvailableEntities();
    return entities.some(entity => entity.name === entityName);
  }

  /**
   * Get column statistics for an entity
   */
  private getColumnStats(schema: EntitySchema): {
    nullable: number;
    unique: number;
    primary: number;
    indexed: number;
  } {
    const indexedColumns = new Set(
      schema.indexes.flatMap(idx => idx.columns)
    );

    return {
      nullable: schema.columns.filter(c => c.nullable).length,
      unique: schema.columns.filter(c => c.unique).length,
      primary: schema.columns.filter(c => c.primary).length,
      indexed: schema.columns.filter(c => indexedColumns.has(c.name)).length
    };
  }
}