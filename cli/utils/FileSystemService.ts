/**
 * Unified FileSystemService - Consolidates all file system operations
 *
 * Replaces the duplication across file-helpers.ts, fileUtils.ts, and fileSystemUtils.ts
 * Follows refactor principles: options pattern, helper methods, DRY, encapsulation
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { Stats, FSWatcher } from 'fs';
import * as path from 'path';
import { formatTypeScriptCode } from '../generators/utils/format.js';

// Core interfaces for type safety
export interface FileOperationOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

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

export interface FileSystemServiceOptions {
  cwd?: string;
  verbose?: boolean;
}

/**
 * Unified file system service that consolidates all file operations
 * Uses options pattern and helper methods to remove friction
 */
export class FileSystemService {
  private readonly cwd: string;
  private readonly verbose: boolean;

  constructor(options: FileSystemServiceOptions = {}) {
    const { cwd = process.cwd(), verbose = false } = options;
    this.cwd = cwd;
    this.verbose = verbose;
  }

  // ===== Convenience Getters =====

  /**
   * Get project root directory (removes friction for common operation)
   */
  getProjectRoot(): string {
    let currentDir = this.cwd;

    while (currentDir !== path.parse(currentDir).root) {
      if (fsSync.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    return this.cwd;
  }

  // ===== Helper Methods =====

  /**
   * Resolve path relative to working directory (removes path.join repetition)
   */
  private resolvePath(...pathSegments: string[]): string {
    return path.resolve(this.cwd, ...pathSegments);
  }

  /**
   * Resolve path relative to project root (removes friction for project files)
   */
  resolveProjectPath(...pathSegments: string[]): string {
    return path.resolve(this.getProjectRoot(), ...pathSegments);
  }

  /**
   * Log operation if verbose mode is enabled (centralizes logging logic)
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Format file size for display (helper that removes duplication)
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // ===== Core File Operations =====

  /**
   * Check if file exists (unified synchronous version)
   */
  fileExists(filePath: string): boolean {
    return fsSync.existsSync(this.resolvePath(filePath));
  }

  /**
   * Check if file exists (async version)
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory if it doesn't exist (unified implementation)
   */
  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  /**
   * Read file contents (simplified API)
   */
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(this.resolvePath(filePath), 'utf-8');
  }

  format(filePath: string, content: string): string {
    if (filePath.endsWith('.ts')) {
      try {
        return formatTypeScriptCode(content);
      } catch (formatError) {
        this.log(`Warning: Could not format ${filePath}, using original content`);
        return content;
      }
    }

    if (filePath.endsWith('.json')) {
      try {
        const jsonData = JSON.parse(content);
        return JSON.stringify(jsonData, null, 2);
      } catch (formatError) {
        this.log(`Warning: Could not format ${filePath} as JSON, using original content`);
        return content;
      }


    }

    return content;
  }

  /**
   * Write file with TypeScript formatting and overwrite protection
   */
  async writeFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<{ success: boolean; message: string; filePath: string }> {
    const { overwrite = true, dryRun = false } = options;
    const fullPath = this.resolvePath(filePath);

    if (this.fileExists(filePath) && !overwrite) {
      return {
        success: false,
        message: `File already exists: ${filePath}. Use --force to overwrite.`,
        filePath
      };
    }

    if (dryRun) {
      return {
        success: true,
        message: `[DRY RUN] Would write: ${filePath}`,
        filePath
      };
    }

    try {
      await this.ensureDir(path.dirname(fullPath));

      const finalContent = this.format(filePath, content);

      await fs.writeFile(fullPath, finalContent, 'utf-8');

      return {
        success: true,
        message: this.fileExists(filePath) && overwrite ?
          `Updated: ${filePath}` :
          `Created: ${filePath}`,
        filePath
      };
    } catch (error) {
      console.error(`Failed to write ${filePath}: ${error}`);
      return {
        success: false,
        message: `Failed to write ${filePath}: ${error}`,
        filePath
      };
    }
  }

  /**
   * Delete file with error handling
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (await this.exists(filePath)) {
        await fs.unlink(this.resolvePath(filePath));
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Failed to delete ${filePath}: ${error}`);
      return false;
    }
  }

  /**
   * Copy file with directory creation (consolidated from multiple implementations)
   */
  async copyFile(source: string, destination: string): Promise<void> {
    const sourcePath = this.resolvePath(source);
    const destPath = this.resolvePath(destination);

    await this.ensureDir(path.dirname(destPath));
    await fs.copyFile(sourcePath, destPath);
  }

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

  /**
   * JSON operations (consolidated from multiple implementations)
   */
  async readJson<T = unknown>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  }


  /**
   * Replace content in file (consolidated implementation)
   */
  async replaceInFile(
    filePath: string,
    searchPattern: string | RegExp,
    replacement: string
  ): Promise<boolean> {
    const content = await this.readFile(filePath);
    const newContent = content.replace(searchPattern, replacement);

    if (content !== newContent) {
      await this.writeFile(filePath, newContent);
      return true;
    }

    return false;
  }

  // ===== Utility Methods =====

  /**
   * Get files in directory (simplified API)
   */
  async getFiles(dirPath: string, pattern?: RegExp): Promise<string[]> {
    if (!await this.exists(dirPath)) {
      return [];
    }

    const files = await fs.readdir(this.resolvePath(dirPath));

    if (pattern) {
      return files.filter(file => pattern.test(file));
    }

    return files;
  }

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

// ===== Static Convenience Methods =====

/**
 * Static convenience getter for default instance
 */
export class FileSystemServiceProvider {
  private static defaultInstance: FileSystemService | null = null;

  static getInstance(): FileSystemService {
    if (!this.defaultInstance) {
      this.defaultInstance = new FileSystemService();
    }
    return this.defaultInstance;
  }

  static setInstance(instance: FileSystemService): void {
    this.defaultInstance = instance;
  }
}

/**
 * Convenience functions for direct usage (maintains backward compatibility)
 * Now uses the FileService internally with automatic formatting
 */
export const ensureDir = (dirPath: string): Promise<void> =>
  FileSystemServiceProvider.getInstance().ensureDir(dirPath);

export const fileExists = (filePath: string): boolean =>
  FileSystemServiceProvider.getInstance().fileExists(filePath);

export const readFile = (filePath: string): Promise<string> =>
  FileSystemServiceProvider.getInstance().readFile(filePath);


/**
 * Main writeFile export - same signature as Node's fs.writeFile
 * Uses FileService internally for automatic TypeScript formatting
 */
export const writeFile = (
  filePath: string,
  content: string,
  options?: FileOperationOptions
) => FileSystemServiceProvider.getInstance().writeFile(filePath, content, options);

export const deleteFile = (filePath: string): Promise<boolean> =>
  FileSystemServiceProvider.getInstance().deleteFile(filePath);

export const copyFile = (source: string, destination: string): Promise<void> =>
  FileSystemServiceProvider.getInstance().copyFile(source, destination);

export const getFiles = (dirPath: string, pattern?: RegExp): Promise<string[]> =>
  FileSystemServiceProvider.getInstance().getFiles(dirPath, pattern);