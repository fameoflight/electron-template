/**
 * DbStatsCommand - Show database statistics
 *
 * Refactored from standalone function to proper command class
 * Following refactor.md principles:
 * - Command class with state encapsulation
 * - Convenience getter for DataSource
 * - Options object pattern (max 5 parameters)
 * - Clear separation of concerns
 */

import { BaseDatabaseCommand, type CommandResult } from '../../utils/BaseDatabaseCommand.js';

export interface DbStatsOptions {
  verbose?: boolean;
}

export interface DbStatsResult {
  entities: Array<{
    name: string;
    table: string;
    count: number;
  }>;
  totalRecords: number;
}

/**
 * Command for showing database statistics
 */
export class DbStatsCommand extends BaseDatabaseCommand {
  async run(options: DbStatsOptions): Promise<CommandResult<DbStatsResult>> {
    this.info('📊 Loading database statistics...\n');

    const result = await this.withDatabase(async (dataSource) => {
      const entities = await this.getAvailableEntities();
      const stats: DbStatsResult['entities'] = [];

      for (const entity of entities) {
        const repo = await this.getRepository(entity.name);
        const count = await repo.count();

        stats.push({
          name: entity.name,
          table: entity.table,
          count
        });
      }

      const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        entities: stats,
        totalRecords
      };
    });

    if (!result.success) {
      this.error('❌ Failed to get database stats', result.error!);
      return {
        success: false,
        message: `Failed to get database stats: ${result.error}`,
        data: { entities: [], totalRecords: 0 }
      };
    }

    // Display results
    this.success(`Found ${result.data!.entities.length} entities:\n`);

    for (const stat of result.data!.entities) {
      this.info(
        `  ${stat.name.padEnd(20)} ${stat.count.toString().padStart(6)} records`
      );
    }

    this.info(`\nTotal records: ${result.data!.totalRecords}`);

    return {
      success: true,
      message: `Database statistics collected for ${result.data!.entities.length} entities`,
      data: result.data
    };
  }

  /**
   * Format statistics as table (alternative display)
   */
  private formatStatsAsTable(stats: DbStatsResult): void {
    console.table(stats.entities.map(stat => ({
      Entity: stat.name,
      Table: stat.table,
      Records: stat.count
    })));

    this.info(`\nTotal Records: ${stats.totalRecords}`);
  }

  /**
   * Get entity with most records
   */
  private getLargestEntity(stats: DbStatsResult): DbStatsResult['entities'][0] | null {
    return stats.entities.reduce((largest, current) =>
      current.count > largest.count ? current : largest
    , stats.entities[0]) || null;
  }
}