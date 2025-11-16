/**
 * FileSystemAdvanced - Advanced file system operations
 *
 * Handles advanced file operations: finding, cleaning, watching, directory operations
 * Extends FileSystemCore for composition-based architecture
 *
 * Split from FileSystemService (579 lines) to focus on advanced operations (~290 lines)
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { FSWatcher } from 'fs';
import * as path from 'path';
import { FileSystemCore, FileOperationOptions } from './FileSystemCore.js';

// Advanced operation interfaces
export interface CleanResult {
  removed: string[];
  errors: string[];
  skipped: string[];
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  relativePath: string;
}

export interface FindFilesOptions {
  pattern?: RegExp;
  excludeDirs?: string[];
  maxDepth?: number;
}

/**
 * Advanced file system service extending core functionality
 * Provides finding, cleaning, watching, and directory management
 */
export class FileSystemAdvanced extends FileSystemCore {
  // ===== Advanced File Operations =====

  /**
   * Get file information (consolidated interface)
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const fullPath = this.resolvePath(filePath);
    const stats = await fs.stat(fullPath);
    const relativePath = path.relative(this.cwd, fullPath);

    return {
      path: fullPath,
      name: path.basename(fullPath),
      size: stats.size,
      relativePath
    };
  }

  /**
   * Find files recursively with options pattern
   */
  async findFiles(
    startDir: string = this.cwd,
    options: FindFilesOptions = {}
  ): Promise<string[]> {
    const {
      pattern = /\.(svg|png|ico|icns)$/i,
      excludeDirs = ['node_modules', '.git', 'dist', 'build', '.temp', '.data'],
      maxDepth = 10
    } = options;

    const results: string[] = [];
    const startPath = this.resolvePath(startDir);

    const scanDir = async (dir: string, currentDepth: number = 0): Promise<void> => {
      if (currentDepth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.cwd, fullPath);

          if (entry.isDirectory()) {
            if (!excludeDirs.some(exclude => relativePath.includes(exclude))) {
              await scanDir(fullPath, currentDepth + 1);
            }
          } else if (entry.isFile() && pattern.test(entry.name)) {
            results.push(relativePath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    if (await this.exists(startPath)) {
      await scanDir(startPath);
    }

    return results;
  }

  /**
   * Clean directory with comprehensive result tracking
   */
  async cleanDirectory(
    dirPath: string,
    description: string,
    options: FileOperationOptions = {}
  ): Promise<CleanResult> {
    const { dryRun = false, verbose = this.verbose } = options;
    const result: CleanResult = { removed: [], errors: [], skipped: [] };

    const fullPath = this.resolvePath(dirPath);

    if (!await this.exists(fullPath)) {
      result.skipped.push(`${description} (${dirPath}) not found`);
      this.log(`  ${dirPath} not found, skipping`);
      return result;
    }

    if (dryRun) {
      result.removed.push(`${description} (${dirPath}) [DRY RUN]`);
      this.log(`  Would remove: ${dirPath}`);
      return result;
    }

    try {
      await fs.rm(fullPath, { recursive: true, force: true });
      result.removed.push(`${description} (${dirPath})`);
      this.log(`  Removed: ${dirPath}`);
    } catch (error) {
      result.errors.push(`${description} (${dirPath}): ${error}`);
      this.log(`  Failed to remove ${dirPath}: ${error}`);
    }

    return result;
  }

  // ===== Utility Methods =====

  /**
   * Watch directory for changes (consolidated interface)
   */
  watchDirectory(
    dirPath: string,
    callback: (eventType: string, filename: string | null) => void,
    options: { recursive?: boolean } = {}
  ): FSWatcher {
    const fullPath = this.resolvePath(dirPath);
    return fsSync.watch(fullPath, options, callback);
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath: string): Promise<number> {
    const fullPath = this.resolvePath(dirPath);
    let totalSize = 0;

    const calculateSize = async (currentPath: string): Promise<void> => {
      try {
        const items = await fs.readdir(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            await calculateSize(itemPath);
          } else {
            totalSize += stats.size;
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await calculateSize(fullPath);
    return totalSize;
  }

  /**
   * Create symbolic link
   */
  async createSymlink(target: string, linkPath: string): Promise<void> {
    const targetPath = this.resolvePath(target);
    const linkPathResolved = this.resolvePath(linkPath);

    await this.ensureDir(path.dirname(linkPathResolved));
    await fs.symlink(targetPath, linkPathResolved);
  }

  /**
   * Safe remove (file or directory)
   */
  async safeRemove(targetPath: string): Promise<void> {
    const fullPath = this.resolvePath(targetPath);

    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  }

  /**
   * Clean files by pattern across multiple directories
   */
  async cleanFilesByPattern(
    patterns: RegExp[],
    directories: string[],
    options: FileOperationOptions = {}
  ): Promise<CleanResult> {
    const { dryRun = false, verbose = this.verbose } = options;
    const result: CleanResult = { removed: [], errors: [], skipped: [] };

    for (const dir of directories) {
      const dirPath = this.resolveProjectPath(dir);

      if (!await this.exists(dirPath)) {
        result.skipped.push(`Directory ${dir} not found`);
        continue;
      }

      try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = await fs.stat(filePath);

          if (stat.isFile()) {
            for (const pattern of patterns) {
              if (pattern.test(file)) {
                if (dryRun) {
                  result.removed.push(`${filePath} [DRY RUN]`);
                  if (verbose) this.log(`  Would remove: ${filePath}`);
                } else {
                  await fs.unlink(filePath);
                  result.removed.push(filePath);
                  if (verbose) this.log(`  Removed: ${filePath}`);
                }
                break; // Stop checking other patterns for this file
              }
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${dir}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }
}
