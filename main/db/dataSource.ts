import { DataSource } from 'typeorm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePath } from '@base/utils/index.js';
import { getEntitiesArray as getEntitiesArrayFromMap } from './entityMap.js';
import { CustomDataSource } from '@main/base/CustomDataSource.js';

// Re-export CustomDataSource for convenience
export { CustomDataSource } from '@main/base/CustomDataSource.js';

import { createDataSource } from './utils/index.js';
import { backupDatabase, restoreFromBackup, cleanupOldBackups } from './utils/migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const getMigrations = () => {
  const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');
  return [path.join(migrationsDir, '[0-9]*.ts')];
};

// Re-export centralized entity utilities
export { loadEntities, getEntities, getEntity, getEntitiesArray, areEntitiesLoaded } from './entityMap.js';

/**
 * Apply SQLite performance optimizations for chat applications
 * Optimized for high-frequency updates like streaming AI responses
 */
export const applySQLiteOptimizations = async (dataSource: DataSource): Promise<void> => {
  console.log('🚀 Applying SQLite performance optimizations for chat application...');

  const optimizations = [
    // Enable foreign keys (essential for our FK constraints)
    { sql: 'PRAGMA foreign_keys = ON', description: 'Foreign key constraints' },

    // ⚡ Performance optimizations for frequent writes
    { sql: 'PRAGMA journal_mode = WAL', description: 'Write-Ahead Logging (concurrent reads/writes)' },
    // Use 'PRAGMA synchronous = OFF' for max speed, but risk of data loss on crash.
    // 'NORMAL' is a safer compromise, but can still cause locking under heavy write load.
    // Try 'OFF' if you can tolerate some risk, or keep 'NORMAL' for more safety.
    { sql: `PRAGMA synchronous = OFF`, description: 'Max performance (riskier, but reduces locking)' },

    // Reduce cache size if you have many concurrent connections (prevents locking)
    { sql: 'PRAGMA cache_size = -16384', description: '16MB cache (smaller to reduce lock contention)' },

    { sql: 'PRAGMA temp_store = MEMORY', description: 'Keep temp tables in memory' },
    { sql: 'PRAGMA mmap_size = 134217728', description: '128MB memory-mapped I/O' },

    // Lower busy_timeout to avoid long waits on lock (tune as needed)
    { sql: 'PRAGMA busy_timeout = 5000', description: 'Wait 5s for locks (shorter to fail fast)' },

    // 🧹 Memory management
    { sql: 'PRAGMA shrink_memory', description: 'Clean up memory' },

    // WAL checkpointing: lower value = more frequent, less lock buildup
    { sql: 'PRAGMA wal_autocheckpoint = 500', description: 'Checkpoint every 500 pages (more frequent)' }
  ];

  for (const { sql, description } of optimizations) {
    try {
      await dataSource.query(sql);
      console.log(`  ✅ ${description}`);
    } catch (error) {
      console.warn(`  ⚠️  Warning: Could not apply ${description}:`, error);
    }
  }

  console.log('🎉 SQLite optimizations applied successfully');
};


/**
 * Get current database performance settings for debugging
 */
export const getDatabaseSettings = async (dataSource: DataSource): Promise<void> => {
  console.log('📊 Current database settings:');

  const settings = [
    { sql: 'PRAGMA foreign_keys', name: 'Foreign keys' },
    { sql: 'PRAGMA journal_mode', name: 'Journal mode' },
    { sql: 'PRAGMA synchronous', name: 'Synchronous mode' },
    { sql: 'PRAGMA cache_size', name: 'Cache size (KB)' },
    { sql: 'PRAGMA temp_store', name: 'Temp store' },
    { sql: 'PRAGMA mmap_size', name: 'Memory-mapped I/O (bytes)' },
    { sql: 'PRAGMA busy_timeout', name: 'Busy timeout (ms)' },
    { sql: 'PRAGMA wal_autocheckpoint', name: 'WAL autocheckpoint (pages)' },
    { sql: 'PRAGMA locking_mode', name: 'Locking mode' },
    { sql: 'PRAGMA page_size', name: 'Page size (bytes)' },
    { sql: 'PRAGMA max_page_count', name: 'Max page count' },
  ];

  for (const { sql, name } of settings) {
    try {
      const result = await dataSource.query(sql);
      const value = Array.isArray(result) && result[0] ? Object.values(result[0])[0] : 'Unknown';
      console.log(`  ${name}: ${value}`);
    } catch (error) {
      console.log(`  ${name}: Error retrieving value`);
    }
  }
};

// Backward compatibility: Keep getEntitiesMap for now
export const getEntitiesMap = async () => {
  const { loadEntities } = await import('./entityMap.js');
  return loadEntities();
};

// Create DataSource without entities first
let dataSourceInstance: CustomDataSource;

type CreateDataSourceOpts = {
  entities?: any[];
  synchronize?: boolean;
  migrations?: string[];
};

// Initialize the DataSource instance lazily
export const getAppDataSource = async (opts?: CreateDataSourceOpts): Promise<CustomDataSource> => {
  if (!dataSourceInstance) {

    dataSourceInstance = await createDataSource({
      database: getDatabasePath(),
      entities: opts?.entities || await getEntitiesArrayFromMap(),
      migrations: opts?.migrations || getMigrations(),
      synchronize: process.env.NODE_ENV === 'test' || opts?.synchronize === true,
    });
  }
  return dataSourceInstance;
};

// Export AppDataSource for DataSourceProvider (internal use)
export let AppDataSource: CustomDataSource | null = null;

// DO NOT use this in tests directly
// Use import { createTestDatabase, cleanupTestDatabase } from '@tests/base/index.js
export const initializeDatabase = async (): Promise<CustomDataSource> => {
  AppDataSource = await getAppDataSource();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('✅ Database initialized at:', getDatabasePath());

    // Apply performance optimizations (except in test environment)
    if (process.env.NODE_ENV !== 'test') {
      await applySQLiteOptimizations(AppDataSource);
    }

    // Run pending migrations only if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        console.log('🔄 Running pending migrations...');

        // Auto-backup before migrations
        let backupPath: string | null = null;
        try {
          backupPath = await backupDatabase();
        } catch (error) {
          console.warn('⚠️  Warning: Could not create backup before migrations:', error);
        }

        try {
          await AppDataSource.runMigrations();
          console.log('✅ Migrations completed');

          // Clean up old backups (keep last 5)
          await cleanupOldBackups(path.join(path.dirname(getDatabasePath()), 'backups'), 5);
        } catch (migrationError) {
          console.error('❌ Migration failed!');

          // Attempt rollback if we have a backup
          if (backupPath) {
            try {
              console.log('🔄 Rolling back from backup...');
              await restoreFromBackup(backupPath);
              console.log('✅ Successfully rolled back to pre-migration state');
            } catch (rollbackError) {
              console.error('❌ Failed to rollback from backup:', rollbackError);
              console.error('💡 Manual restore required from:', backupPath);
            }
          }

          throw migrationError;
        }
      }
    }
  }
  return AppDataSource;
};

/**
 * Run migrations with backup and rollback safety
 */
export const runMigrationsSafe = async (): Promise<void> => {
  const dataSource = await initializeDatabase();

  const pendingMigrations = await dataSource.showMigrations();
  if (pendingMigrations) {
    console.log('🔄 Running pending migrations...');

    // Auto-backup before migrations
    let backupPath: string | null = null;
    try {
      backupPath = await backupDatabase();
    } catch (error) {
      console.warn('⚠️  Warning: Could not create backup before migrations:', error);
    }

    try {
      await dataSource.runMigrations();
      console.log('✅ Migrations completed');

      // Clean up old backups (keep last 5)
      await cleanupOldBackups(path.join(path.dirname(getDatabasePath()), 'backups'), 5);
    } catch (migrationError) {
      console.error('❌ Migration failed!');

      // Attempt rollback if we have a backup
      if (backupPath) {
        try {
          console.log('🔄 Rolling back from backup...');
          await restoreFromBackup(backupPath);
          console.log('✅ Successfully rolled back to pre-migration state');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback from backup:', rollbackError);
          console.error('💡 Manual restore required from:', backupPath);
        }
      }

      throw migrationError;
    }
  } else {
    console.log('✅ No pending migrations');
  }

  // Auto-generate schema.sql after successful migrations
  try {
    console.log('📝 Generating updated schema.sql...');
    const { generateSchemaSql } = await import('./utils/migrations.js');
    await generateSchemaSql(dataSource, 'schema.sql');
    console.log('✅ Schema.sql updated successfully');
  } catch (schemaError) {
    console.warn('⚠️  Warning: Could not generate schema.sql:', schemaError);
  }
};

/**
 * Show pending migrations without running them
 */
export const showPendingMigrations = async (): Promise<void> => {
  const dataSource = await getAppDataSource();
  await dataSource.initialize();

  try {
    // Check if there are pending migrations
    const hasPending = await dataSource.showMigrations();

    if (hasPending) {
      console.log('📋 Pending migrations detected');

      // Get available migration files
      const migrationsDir = path.join(process.cwd(), 'main', 'db', 'migrations');
      try {
        const fs = await import('fs');
        const migrationFiles = await fs.promises.readdir(migrationsDir);
        const tsFiles = migrationFiles.filter(f => f.endsWith('.ts') && !f.startsWith('.'));

        if (tsFiles.length > 0) {
          console.log('Available migration files:');
          tsFiles.forEach(file => console.log(`  📄 ${file}`));
        }
      } catch (err) {
        console.log('No migrations directory found');
      }
    } else {
      console.log('✅ No pending migrations');
    }
  } finally {
    await dataSource.destroy();
  }
};
