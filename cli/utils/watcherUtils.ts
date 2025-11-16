/**
 * File watching utilities for CLI commands
 */
import { watch, FSWatcher } from 'fs';
import * as path from 'path';
import { FileSystemService } from './FileSystemService.js';
import { cyberOutput } from './output.js';

export interface WatcherOptions {
  debounce?: number;
  include?: string[];
  exclude?: string[];
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private isWatching = false;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private fileSystemService: FileSystemService;

  constructor(fileSystemService: FileSystemService = new FileSystemService()) {
    this.fileSystemService = fileSystemService;
  }

  /**
   * Watch directories for file changes
   */
  watchDirectories(
    directories: string[],
    onChange: (filePath: string, type: 'entity' | 'resolver' | 'general') => void,
    options: WatcherOptions = {}
  ): void {
    const { debounce = 1000, include = ['.ts'], exclude = [], onReady, onError } = options;

    this.isWatching = true;

    for (const dir of directories) {
      const fullPath = this.fileSystemService.resolveProjectPath(dir);

      const watcher = watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (!this.isWatching) return;

        if (!filename) return;

        const filePath = path.join(fullPath, filename);
        const relativePath = path.relative(this.fileSystemService.resolveProjectPath('.'), filePath);

        // Check include/exclude patterns
        const isIncluded = include.length === 0 || include.some(ext => filename.endsWith(ext));
        const isExcluded = exclude.some(pattern => relativePath.includes(pattern));

        if (!isIncluded || isExcluded) return;

        // Determine file type based on path
        let type: 'entity' | 'resolver' | 'general' = 'general';
        if (relativePath.includes('entities')) {
          type = 'entity';
        } else if (relativePath.includes('resolvers')) {
          type = 'resolver';
        }

        // Debounce rapid changes
        this.debounceFile(relativePath, () => {
          onChange(relativePath, type);
        }, debounce);
      });

      this.watchers.push(watcher);
    }

    if (onReady) {
      setTimeout(onReady, 100); // Give watchers time to initialize
    }

    if (onError) {
      this.watchers.forEach(watcher => {
        watcher.on('error', onError);
      });
    }
  }

  /**
   * Watch for schema-related changes (entities and resolvers)
   */
  watchForSchemaChanges(
    onChange: (filePath: string, type: 'entity' | 'resolver') => void,
    options: WatcherOptions = {}
  ): void {
    const directories = [
      'main/db/entities',
      'main/graphql/resolvers'
    ];

    const exclude = ['CrudResolverFactory', 'BaseResolver', '__generated__'];

    this.watchDirectories(directories, (filePath, type) => {
      if (type === 'general') return; // Only care about entity/resolver changes
      onChange(filePath, type as 'entity' | 'resolver');
    }, {
      ...options,
      exclude: [...(options.exclude || []), ...exclude]
    });
  }

  /**
   * Watch for build-related changes
   */
  watchForBuildChanges(
    onChange: (filePath: string) => void,
    options: WatcherOptions = {}
  ): void {
    const directories = [
      'ui',
      'main',
      'shared'
    ];

    const include = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less', '.vue'];
    const exclude = ['node_modules', 'dist', 'build', '__generated__'];

    this.watchDirectories(directories, onChange, {
      ...options,
      include,
      exclude: [...(options.exclude || []), ...exclude]
    });
  }

  /**
   * Watch a single file for changes
   */
  watchFile(
    filePath: string,
    onChange: () => void,
    options: WatcherOptions = {}
  ): void {
    const fullPath = this.fileSystemService.resolveProjectPath(filePath);
    const { debounce = 100 } = options;

    const watcher = watch(fullPath, { persistent: true }, (eventType) => {
      if (!this.isWatching) return;

      if (eventType === 'change' || eventType === 'rename') {
        this.debounceFile(filePath, onChange, debounce);
      }
    });

    this.watchers.push(watcher);
  }

  /**
   * Debounce file changes to prevent multiple rapid calls
   */
  private debounceFile(filePath: string, callback: () => void, delay: number): void {
    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(filePath);
    }, delay);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Stop watching all files
   */
  stop(): void {
    this.isWatching = false;

    // Clear all pending debounced calls
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close all watchers
    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    this.watchers = [];
  }

  /**
   * Get current watching status
   */
  isActive(): boolean {
    return this.isWatching;
  }

  /**
   * Get number of active watchers
   */
  getWatcherCount(): number {
    return this.watchers.length;
  }

  /**
   * Setup cleanup on process exit
   */
  setupCleanup(): void {
    const cleanup = () => {
      cyberOutput.info('Stopping file watchers...');
      this.stop();
      cyberOutput.success('File watchers stopped.');
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }
}

/**
 * Create a simple file watcher that can be used directly
 */
export function createSimpleWatcher(
  directories: string[],
  callback: (eventType: string, filename: string | null) => void,
  options: { recursive?: boolean; debounce?: number } = {}
): FileWatcher {
  const watcher = new FileWatcher();

  const { debounce = 500 } = options;
  const debounceMap = new Map<string, NodeJS.Timeout>();

  for (const dir of directories) {
    const fsService = new FileSystemService();
    const fullPath = fsService.resolveProjectPath(dir);

    const fsWatcher = watch(fullPath, { recursive: options.recursive }, (eventType, filename) => {
      if (!filename) return;

      const key = `${dir}:${filename}`;

      // Clear existing timer
      const existingTimer = debounceMap.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        callback(eventType, filename);
        debounceMap.delete(key);
      }, debounce);

      debounceMap.set(key, timer);
    });

    watcher['watchers'].push(fsWatcher); // Access private property for cleanup
  }

  return watcher;
}