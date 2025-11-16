/**
 * Database Commands
 *
 * Provides utilities for database inspection, backups, and management
 */

import { initializeDatabase } from '../../main/db/dataSource';
import { output } from '../utils/output.js';

/**
 * DB Stats - Show database statistics
 */


export async function dbStatsCommand() {
  try {
    output.info('📊 Loading database statistics...\n');

    const dataSource = await initializeDatabase();

    const tables = dataSource.entityMetadatas.map((meta: any) => ({
      entity: meta.name,
      table: meta.tableName
    }));

    output.success(`Found ${tables.length} entities:\n`);

    for (const { entity, table } of tables) {
      const repo = dataSource.getRepository(entity);
      const count = await repo.count();
      output.info(`  ${entity.padEnd(20)} ${count.toString().padStart(6)} records`);
    }

    output.info('');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to get database stats', errorMsg);
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
      output.info('\n📋 Available Entities:\n');
      dataSource.entityMetadatas.forEach((meta: any) => {
        output.info(`  ${meta.name.padEnd(20)} → ${meta.tableName}`);
      });
      output.info('\n💡 Usage: yarn db:inspect User');
    } else {
      const metadata = dataSource.getMetadata(entityName);
      output.success(`\n📊 Schema for ${entityName} (table: ${metadata.tableName})\n`);

      const columns = metadata.columns.map((col: any) => ({
        column: col.propertyName,
        type: col.type,
        nullable: col.isNullable ? 'yes' : 'no',
        unique: col.isUnique ? 'yes' : 'no',
        primary: col.isPrimary ? 'yes' : 'no'
      }));

      // Display columns as formatted table since output doesn't have table support
      const maxColumnLength = Math.max(...columns.map((c: any) => c.column.length));
      const maxTypeLength = Math.max(...columns.map((c: any) => c.type.length));

      output.info(`\n${'Column'.padEnd(maxColumnLength)}  ${'Type'.padEnd(maxTypeLength)}  Nullable  Unique  Primary`);
      output.info('─'.repeat(maxColumnLength) + '  ' + '─'.repeat(maxTypeLength) + '  ' + '─'.repeat(8) + '  ' + '─'.repeat(6) + '  ' + '─'.repeat(7));

      columns.forEach((col: any) => {
        const column = col.column.padEnd(maxColumnLength);
        const type = col.type.padEnd(maxTypeLength);
        const nullable = col.nullable.padEnd(8);
        const unique = col.unique.padEnd(6);
        const primary = col.primary.padEnd(7);

        output.info(`${column}  ${type}  ${nullable}  ${unique}  ${primary}`);
      });
      output.info('');

      if (metadata.indices && metadata.indices.length > 0) {
        output.info('\nIndexes:');
        metadata.indices.forEach((idx: any) => {
          output.info(`  ${idx.name}: [${idx.columns.map((c: any) => c.propertyName).join(', ')}]`);
        });
      }
    }

    output.info('');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to inspect database', errorMsg);
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
      output.warning('⚠️  No database found at .data/');
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const snapshotName = options.name || `backup-${timestamp}`;
    const snapshotPath = path.join(process.cwd(), `.data.${snapshotName}`);

    // Copy directory recursively
    await fs.promises.cp(dbPath, snapshotPath, { recursive: true });

    const size = await getDirectorySize(dbPath);
    output.success(`✅ Database snapshot created: .data.${snapshotName}`);
    output.info(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`);

    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to create snapshot', errorMsg);
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
      output.warning('⚠️  No snapshots found. Create one with: yarn db:snapshot');
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

    output.success(`✅ Database restored from: ${snapshotToRestore}`);
    output.info(`   Available snapshots: ${snapshots.length}`);

    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.error('❌ Failed to restore snapshot', errorMsg);
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
