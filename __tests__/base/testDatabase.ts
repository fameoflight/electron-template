/**
 * Test database utilities
 *
 * Provides utilities for creating isolated test databases
 * Each test gets a fresh database instance
 */

import { DataSource } from 'typeorm';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { getEntitiesArray, getEntitiesMap } from '../../main/db/dataSource';
import { createDataSource } from '@main/db/utils';
import { DataSourceProvider } from '@main/base/index';

/**
 * Create and initialize a test database with a unique file
 * Each test gets its own isolated database file
 */
export async function createTestDatabase(additionalEntities: any[] = []): Promise<DataSource> {
  // Create a unique temporary database file for this test
  const testId = randomUUID();
  const tempDir = path.join(process.cwd(), '.data');
  const dbPath = path.join(tempDir, `test_${testId}.db`);

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Get default entities and add any additional ones
  const defaultEntities = await getEntitiesArray();
  const allEntities = [...defaultEntities, ...additionalEntities];

  const dataSource = await createDataSource({
    database: dbPath,
    entities: allEntities,
    synchronize: true,
    migrations: [],
  });

  await dataSource.initialize();

  DataSourceProvider.setTestDataSource(dataSource);
  return dataSource;
}


/**
 * Cleanup and destroy test database
 */
export async function cleanupTestDatabase(dataSource: DataSource): Promise<void> {
  DataSourceProvider.clearTestDataSource();
  if (dataSource?.isInitialized) {
    // Get the database file path before destroying
    const dbPath = dataSource.options.database as string;

    // Destroy the connection
    await dataSource.destroy();

    // Delete the database file
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (error) {
        console.warn('Failed to delete test database file:', dbPath, error);
      }
    }
  }
}


/**
 * Clear all data from the database
 * Useful for cleanup between tests
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    try {
      await repository.clear();
    } catch (error) {
      console.error(`Failed to clear data for entity ${entity.name}:`, error, repository);
    }
  }
}
