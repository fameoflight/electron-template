/**
 * FileSystemCore - Core file CRUD operations
 *
 * Handles basic file system operations: read, write, delete, copy, format
 * Follows refactor principles: options pattern, helper methods, DRY, encapsulation
 *
 * Split from FileSystemService (579 lines) to focus on core operations (~290 lines)
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { formatTypeScriptCode } from '../generators/utils/format.js';
import { cyberOutput } from './output.js';

// Core interfaces for type safety
export interface FileOperationOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface FileSystemCoreOptions {
  cwd?: string;
  verbose?: boolean;
}

/**
 * Core file system service for basic CRUD operations
 * Uses options pattern and helper methods to remove friction
 */
export class FileSystemCore {
  protected readonly cwd: string;
  protected readonly verbose: boolean;

  constructor(options: FileSystemCoreOptions = {}) {
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
  public resolvePath(...pathSegments: string[]): string {
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
  protected log(message: string): void {
    if (this.verbose) {
      cyberOutput.progress(message);
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

  /**
   * Format file content based on file type
   */
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
      cyberOutput.error(`Failed to write ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
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
}
