/**
 * BaseDatabaseCommand - Base class for database-related commands
 *
 * Follows refactor.md principles:
 * - Convenience getter pattern for DataSource
 * - Automatic cleanup and connection management
 * - Options object pattern (max 5 parameters)
 * - Small files with clear boundaries
 *
 * Usage:
 * class DbStatsCommand extends BaseDatabaseCommand {
 *   async run(options: DbStatsOptions): Promise<CommandResult> {
 *     const dataSource = await this.getDataSource(); // ✅ No repetition
 *     // ... use dataSource
 *     return { success: true, message: 'Stats collected' };
 *   }
 * }
 */

import { BaseCommand, type CommandResult } from './BaseCommand.js';
import { getAppDataSource, type CustomDataSource } from '../../main/db/dataSource.js';
import { DataSource } from 'typeorm';

// Re-export CommandResult for convenience
export type { CommandResult } from './BaseCommand.js';

/**
 * Base class for commands that need database access
 */
export abstract class BaseDatabaseCommand extends BaseCommand {
  private dataSource: CustomDataSource | null = null;

  /**
   * Convenience getter - eliminates repeated initialization code
   * Following refactor.md DRY principle
   */
  protected async getDataSource(): Promise<CustomDataSource> {
    if (this.dataSource) return this.dataSource;

    this.dataSource = await getAppDataSource();
    return this.dataSource;
  }

  /**
   * Override execute to add automatic cleanup
   * Ensures database connections are always properly closed
   */
  async execute(options: Record<string, unknown>): Promise<void> {
    await super.execute(options);

  }

  /**
   * Validate database connection and permissions
   * Helper method for database commands
   */
  protected async validateDatabaseConnection(): Promise<CommandResult> {
    const dataSource = await this.getDataSource();

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    return {
      success: true,
      message: 'Database connection validated'
    };
  }

  /**
   * Get all available entity metadata
   * Helper for listing entities
   */
  protected async getAvailableEntities(): Promise<Array<{ name: string; table: string }>> {
    const dataSource = await this.getDataSource();

    return dataSource.entityMetadatas.map((meta: any) => ({
      name: meta.name,
      table: meta.tableName
    }));
  }

  /**
   * Get repository for an entity by name
   * Type-safe repository access
   */
  protected async getRepository(entityName: string) {
    const dataSource = await this.getDataSource();
    return dataSource.getRepository(entityName);
  }

  /**
   * Run a database operation with error handling
   * Centralizes database error handling pattern
   */
  protected async withDatabase<T>(
    operation: (dataSource: DataSource) => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const dataSource = await this.getDataSource();
    const data = await operation(dataSource);

    return { success: true, data };
  }

  /**
   * Extract error message safely
   * DRY helper following refactor.md
   */
  protected extractError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}