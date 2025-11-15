/**
 * DbSnapshotCommand - Create and manage database snapshots
 *
 * Refactored from standalone function to proper command class
 * Following refactor.md principles:
 * - Command class with state encapsulation
 * - Single responsibility (database snapshots)
 * - Options object pattern (max 5 parameters)
 * - Helper method extraction (formatTimestamp)
 */

import { BaseDatabaseCommand, type CommandResult } from '../../utils/BaseDatabaseCommand.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DbSnapshotOptions {
  name?: string;
  compress?: boolean;
  includeLogs?: boolean;
}

export interface SnapshotResult {
  name: string;
  path: string;
  size: number;
  timestamp: string;
  compressed: boolean;
}

/**
 * Command for creating database snapshots
 */
export class DbSnapshotCommand extends BaseDatabaseCommand {
  private readonly dbPath = path.join(process.cwd(), '.data');

  async run(options: DbSnapshotOptions): Promise<CommandResult<SnapshotResult>> {
    this.info('📸 Creating database snapshot...\n');

    // Validate database exists
    if (!(await this.databaseExists())) {
      this.error('❌ No database found at .data/');
      return {
        success: false,
        message: 'Database not found at .data/',
        data: {} as SnapshotResult
      };
    }

    const snapshotName = options.name || this.generateSnapshotName();
    const snapshotPath = path.join(process.cwd(), `.data.${snapshotName}`);

    try {
      // Create snapshot
      await this.createSnapshot(snapshotPath, options);

      // Get snapshot size
      const size = await this.getDirectorySize(this.dbPath);

      const result: SnapshotResult = {
        name: snapshotName,
        path: snapshotPath,
        size,
        timestamp: new Date().toISOString(),
        compressed: options.compress || false
      };

      this.success(`✅ Database snapshot created: .data.${snapshotName}`);
      this.info(`   Size: ${this.formatFileSize(size)}`);
      this.info(`   Path: ${snapshotPath}`);

      if (options.compress) {
        this.info(`   Compressed: Yes`);
      }

      return {
        success: true,
        message: `Snapshot created: ${snapshotName}`,
        data: result
      };

    } catch (error) {
      const errorMessage = this.extractError(error);
      this.error('❌ Failed to create snapshot', errorMessage);

      // Cleanup on failure
      await this.cleanupSnapshot(snapshotPath);

      return {
        success: false,
        message: `Snapshot creation failed: ${errorMessage}`,
        data: {} as SnapshotResult
      };
    }
  }

  /**
   * Check if database exists
   */
  private async databaseExists(): Promise<boolean> {
    try {
      await fs.access(this.dbPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate snapshot name with timestamp
   * Following refactor.md DRY principle
   */
  private generateSnapshotName(): string {
    return `backup-${this.formatTimestampForFilename()}`;
  }

  /**
   * Format timestamp for filename (YYYY-MM-DD-HHMMSS)
   * Helper method extracted to reduce duplication
   */
  private formatTimestampForFilename(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19) // Remove milliseconds and Z
      .replace('T', '-');
  }

  /**
   * Create snapshot by copying database directory
   */
  private async createSnapshot(snapshotPath: string, options: DbSnapshotOptions): Promise<void> {
    // Remove existing snapshot if it exists
    await this.cleanupSnapshot(snapshotPath);

    // Copy database directory
    await fs.cp(this.dbPath, snapshotPath, { recursive: true });

    // Include logs if requested
    if (options.includeLogs) {
      await this.includeLogs(snapshotPath);
    }

    // Compress if requested
    if (options.compress) {
      await this.compressSnapshot(snapshotPath);
    }
  }

  /**
   * Include log files in snapshot
   */
  private async includeLogs(snapshotPath: string): Promise<void> {
    const logsPath = path.join(process.cwd(), 'logs');
    const snapshotLogsPath = path.join(snapshotPath, 'logs');

    try {
      await fs.access(logsPath);
      await fs.cp(logsPath, snapshotLogsPath, { recursive: true });
      this.info('   Logs included in snapshot');
    } catch {
      // Logs directory doesn't exist, skip
    }
  }

  /**
   * Compress snapshot using tar
   */
  private async compressSnapshot(snapshotPath: string): Promise<void> {
    const { spawn } = await import('child_process');
    const archivePath = `${snapshotPath}.tar.gz`;

    return new Promise((resolve, reject) => {
      const child = spawn('tar', [
        '-czf', archivePath,
        '-C', path.dirname(snapshotPath),
        path.basename(snapshotPath)
      ]);

      child.on('close', async (code) => {
        if (code === 0) {
          // Remove uncompressed directory
          await fs.rm(snapshotPath, { recursive: true });
          resolve();
        } else {
          reject(new Error(`Tar command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Get directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        totalSize += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Clean up snapshot directory if it exists
   */
  private async cleanupSnapshot(snapshotPath: string): Promise<void> {
    try {
      await fs.access(snapshotPath);
      await fs.rm(snapshotPath, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, no cleanup needed
    }
  }
}