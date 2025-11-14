import { DataSource } from 'typeorm';
import { AppDataSource } from '../../db/dataSource.js';
import { CustomDataSource } from '@main/base/CustomDataSource.js';

/**
 * DataSourceProvider - Centralized DataSource access with test injection support
 *
 * Purpose:
 * - In production: Always returns AppDataSource
 * - In tests: Can be overridden with test-specific DataSource
 *
 * Benefits:
 * - No constructor parameter bloat across services
 * - Single injection point for test databases
 * - Automatic cleanup after tests
 * - Type-safe DataSource access
 *
 * Usage in Production:
 * ```typescript
 * const repo = DataSourceProvider.get().getRepository(Document);
 * ```
 *
 */
class DataSourceProvider {
  private static testOverride: DataSource | null = null;

  /**
   * Get the current DataSource
   * Returns test override if set, otherwise AppDataSource
   * Throws error if no DataSource is available
   */
  static get(): CustomDataSource {
    const dataSource = this.testOverride || AppDataSource;

    if (!dataSource) {
      throw new Error('Connection with sqlite database is not established. Check connection configuration.');
    }

    if (!(dataSource instanceof CustomDataSource)) {
      console.error('DataSource is not a CustomDataSource:', dataSource);
    }

    // The dataSource should already be a CustomDataSource in tests
    return dataSource as CustomDataSource;

  }

  /**
   * Override DataSource for testing
   *
   * @param dataSource Test DataSource instance
   */
  static setTestDataSource(dataSource: DataSource): void {
    if (!(dataSource instanceof CustomDataSource)) {
      console.error('Provided test DataSource is not a CustomDataSource:', dataSource);
    }
    this.testOverride = dataSource;
  }

  /**
   * Clear test DataSource override
   */
  static clearTestDataSource(): void {
    this.testOverride = null;
  }

  /**
   * Check if currently using test DataSource
   * Useful for conditional behavior in tests
   */
  static isTestMode(): boolean {
    return this.testOverride !== null;
  }
}

export default DataSourceProvider;
