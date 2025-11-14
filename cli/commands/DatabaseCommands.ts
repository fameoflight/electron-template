/**
 * Database Commands
 *
 * Provides utilities for database inspection, backups, and management
 */

import { initializeDatabase } from '../../main/db/dataSource';

/**
 * DB Stats - Show database statistics
 */


export async function dbStatsCommand() {
  try {
    console.log('📊 Loading database statistics...\n');

    const dataSource = await initializeDatabase();

    const tables = dataSource.entityMetadatas.map((meta: any) => ({
      entity: meta.name,
      table: meta.tableName
    }));

    console.log(`Found ${tables.length} entities:\n`);

    for (const { entity, table } of tables) {
      const repo = dataSource.getRepository(entity);
      const count = await repo.count();
      console.log(`  ${entity.padEnd(20)} ${count.toString().padStart(6)} records`);
    }

    console.log('');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    process.exit(1);
  }
}

/**
 * DB Inspect - Inspect database entity schema
 */
export async function dbInspectCommand(entityName?: string) {
  try {
    const dataSource = await initializeDatabase();

    if (!entityName) {
      console.log('\n📋 Available Entities:\n');
      dataSource.entityMetadatas.forEach((meta: any) => {
        console.log(`  ${meta.name.padEnd(20)} → ${meta.tableName}`);
      });
      console.log('\n💡 Usage: yarn db:inspect User');
    } else {
      const metadata = dataSource.getMetadata(entityName);
      console.log(`\n📊 Schema for ${entityName} (table: ${metadata.tableName})\n`);

      const columns = metadata.columns.map((col: any) => ({
        column: col.propertyName,
        type: col.type,
        nullable: col.isNullable ? 'yes' : 'no',
        unique: col.isUnique ? 'yes' : 'no',
        primary: col.isPrimary ? 'yes' : 'no'
      }));

      console.table(columns);

      if (metadata.indices && metadata.indices.length > 0) {
        console.log('\nIndexes:');
        metadata.indices.forEach((idx: any) => {
          console.log(`  ${idx.name}: [${idx.columns.map((c: any) => c.propertyName).join(', ')}]`);
        });
      }
    }

    console.log('');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to inspect database:', error);
    process.exit(1);
  }
}

/**
 * DB Snapshot - Create a backup snapshot
 */
export async function dbSnapshotCommand(options: { name?: string }) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const dbPath = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  No database found at .data/');
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const snapshotName = options.name || `backup-${timestamp}`;
    const snapshotPath = path.join(process.cwd(), `.data.${snapshotName}`);

    // Copy directory recursively
    await fs.promises.cp(dbPath, snapshotPath, { recursive: true });

    const size = await getDirectorySize(dbPath);
    console.log(`✅ Database snapshot created: .data.${snapshotName}`);
    console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create snapshot:', error);
    process.exit(1);
  }
}

/**
 * DB Restore Snapshot - Restore database from snapshot
 */
export async function dbRestoreSnapshotCommand(options: { name?: string }) {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const cwd = process.cwd();
    const files = await fs.promises.readdir(cwd);

    // Find snapshot directories
    const snapshots = files
      .filter(f => f.startsWith('.data.backup-') || (options.name && f === `.data.${options.name}`))
      .sort()
      .reverse();

    if (snapshots.length === 0) {
      console.log('⚠️  No snapshots found. Create one with: yarn db:snapshot');
      process.exit(1);
    }

    const snapshotToRestore = options.name ? `.data.${options.name}` : snapshots[0];
    const snapshotPath = path.join(cwd, snapshotToRestore);
    const dbPath = path.join(cwd, '.data');

    // Remove current database
    if (fs.existsSync(dbPath)) {
      await fs.promises.rm(dbPath, { recursive: true, force: true });
    }

    // Restore snapshot
    await fs.promises.cp(snapshotPath, dbPath, { recursive: true });

    console.log(`✅ Database restored from: ${snapshotToRestore}`);
    console.log(`   Available snapshots: ${snapshots.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to restore snapshot:', error);
    process.exit(1);
  }
}

/**
 * Helper: Get directory size recursively
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  const fs = await import('fs');
  const path = await import('path');

  let size = 0;
  const files = await fs.promises.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      size += await getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}
