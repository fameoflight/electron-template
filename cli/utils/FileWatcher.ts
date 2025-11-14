#!/usr/bin/env node
/**
 * Declarative File Watching Utility
 *
 * Provides a clean, declarative API for watching files with precise control
 * over what triggers actions. Solves the cascading refresh problem by allowing
 * fine-grained filtering and debouncing.
 *
 * Features:
 * - Declarative configuration with includes/excludes patterns
 * - Intelligent debouncing to prevent rapid successive triggers
 * - Whitespace filtering to ignore formatting-only changes
 * - Per-rule configurable timeouts and behaviors
 */
import { watch, FSWatcher, readFileSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { createHash } from 'crypto';

export interface FilePattern {
  /** Glob patterns or file paths to include */
  includes: string[];
  /** Patterns to exclude (applied after includes) */
  excludes?: string[];
  /** Debounce delay in milliseconds to prevent rapid successive triggers */
  debounceMs?: number;
  /** Whether to trigger on whitespace-only changes (default: false) */
  whitespace?: boolean;
  /** Callback when files change */
  onChange: (files: string[], eventType: 'change' | 'rename') => Promise<void> | void;
  /** Optional name for debugging/logging */
  name?: string;
}

export interface FileWatcherOptions {
  /** Array of file watching rules */
  rules: FilePattern[];
  /** Global debounce delay for all rules (can be overridden per rule) */
  globalDebounceMs?: number;
  /** Whether to watch recursively */
  recursive?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Custom logger */
  logger?: (message: string) => void;
}

interface PendingChange {
  files: Set<string>;
  eventType: 'change' | 'rename';
  timeout: NodeJS.Timeout;
  contentHashes: Map<string, string>; // Track file content to detect whitespace-only changes
}

/**
 * Declarative file watcher with smart filtering and debouncing
 */
export class FileWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private pendingChanges: Map<string, PendingChange> = new Map();
  private options: FileWatcherOptions;
  private isWatching = false;
  private logger: (message: string) => void;

  constructor(options: FileWatcherOptions) {
    this.options = {
      globalDebounceMs: 1000,
      recursive: true,
      verbose: false,
      ...options
    };

    this.logger = this.options.logger || console.log;

    if (this.options.verbose) {
      this.logger(`📁 FileWatcher initialized with ${options.rules.length} rules`);
    }
  }

  /**
   * Start watching all configured patterns
   */
  start(): void {
    if (this.isWatching) {
      this.logger('⚠️  FileWatcher is already running');
      return;
    }

    this.isWatching = true;
    this.logger('👀 Starting file watchers...');

    // Group rules by their root directories to minimize watchers
    const directoryRules = this.groupRulesByDirectory();

    for (const [directory, rules] of directoryRules) {
      this.watchDirectory(directory, rules);
    }

    this.logger(`✅ FileWatcher started (watching ${directoryRules.size} directories)`);
  }

  /**
   * Stop all file watchers
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;

    // Clear all pending timeouts
    for (const pending of this.pendingChanges.values()) {
      clearTimeout(pending.timeout);
    }
    this.pendingChanges.clear();

    // Close all watchers
    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        if (this.options.verbose) {
          this.logger(`🛑 Stopped watching: ${path}`);
        }
      } catch (error) {
        this.logger(`❌ Error stopping watcher for ${path}: ${error}`);
      }
    }
    this.watchers.clear();

    this.logger('🛑 FileWatcher stopped');
  }

  /**
   * Group rules by their root directories to minimize number of watchers
   */
  private groupRulesByDirectory(): Map<string, FilePattern[]> {
    const directoryMap = new Map<string, FilePattern[]>();

    for (const rule of this.options.rules) {
      for (const pattern of rule.includes) {
        const directory = this.getPatternDirectory(pattern);

        if (!directoryMap.has(directory)) {
          directoryMap.set(directory, []);
        }

        directoryMap.get(directory)!.push(rule);
      }
    }

    return directoryMap;
  }

  /**
   * Extract directory from a file pattern
   */
  private getPatternDirectory(pattern: string): string {
    // If it's a glob with directory structure, extract the directory
    const dirMatch = pattern.match(/^(.*?)[\*\[]/);
    if (dirMatch) {
      return path.resolve(dirMatch[1]);
    }

    // If it's a specific file path, get its directory
    if (pattern.includes('/')) {
      return path.resolve(path.dirname(pattern));
    }

    // Default to current directory
    return process.cwd();
  }

  /**
   * Watch a directory with multiple rules
   */
  private watchDirectory(directory: string, rules: FilePattern[]): void {
    const watcher = watch(directory, { recursive: this.options.recursive },
      (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(directory, filename);

        for (const rule of rules) {
          if (this.matchesRule(fullPath, rule)) {
            this.handleFileChange(rule.name || 'unnamed', fullPath, eventType as 'change' | 'rename');
            break; // Stop at first matching rule
          }
        }
      }
    );

    watcher.on('error', (error) => {
      this.logger(`❌ Watcher error for ${directory}: ${error}`);
    });

    this.watchers.set(directory, watcher);

    if (this.options.verbose) {
      this.logger(`📁 Watching: ${directory} (${rules.length} rules)`);
    }
  }

  /**
   * Check if a file path matches a rule
   */
  private matchesRule(filePath: string, rule: FilePattern): boolean {
    const absolutePath = path.resolve(filePath);

    // Check includes
    const isIncluded = rule.includes.some(pattern =>
      this.matchesPattern(absolutePath, pattern)
    );

    if (!isIncluded) {
      return false;
    }

    // Check excludes
    if (rule.excludes) {
      const isExcluded = rule.excludes.some(pattern =>
        this.matchesPattern(absolutePath, pattern)
      );

      if (isExcluded) {
        return false;
      }
    }

    return true;
  }

  /**
   * Simple pattern matching (supports basic globs)
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    const absolutePattern = path.resolve(pattern);
    const absolutePath = path.resolve(filePath);

    // Simple glob patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(absolutePath);
    }

    // Exact match
    return absolutePath === absolutePattern || absolutePath.startsWith(absolutePattern);
  }

  /**
   * Generate content hash for a file, ignoring whitespace if configured
   */
  private getFileContentHash(filePath: string, ignoreWhitespace: boolean): string {
    try {
      let content = readFileSync(filePath, 'utf8');

      if (ignoreWhitespace) {
        // Remove all whitespace characters for comparison
        content = content.replace(/\s+/g, '').trim();
      }

      return createHash('md5').update(content).digest('hex');
    } catch (error) {
      // If we can't read the file, return the file path as hash
      // This ensures the change is still processed
      return filePath;
    }
  }

  /**
   * Handle file changes with debouncing and whitespace filtering
   */
  private handleFileChange(ruleName: string, filePath: string, eventType: 'change' | 'rename'): void {
    const rule = this.options.rules.find(r => r.name === ruleName) ||
                 this.options.rules.find(r => this.matchesRule(filePath, r));

    if (!rule) return;

    const debounceMs = rule.debounceMs || this.options.globalDebounceMs || 1000;
    const ignoreWhitespace = !rule.whitespace; // Default is to ignore whitespace

    // Clear existing timeout for this rule
    if (this.pendingChanges.has(ruleName)) {
      const pending = this.pendingChanges.get(ruleName)!;
      clearTimeout(pending.timeout);
    }

    // Check for whitespace-only changes
    const currentHash = this.getFileContentHash(filePath, ignoreWhitespace);
    const existingHash = this.pendingChanges.get(ruleName)?.contentHashes.get(filePath);

    if (existingHash && existingHash === currentHash) {
      if (this.options.verbose) {
        this.logger(`⏭️  ${ruleName}: Skipping whitespace-only change in ${filePath}`);
      }
      return; // Skip this change as it's whitespace-only
    }

    // Add file to pending changes
    const pending = this.pendingChanges.get(ruleName) || {
      files: new Set(),
      eventType: 'change',
      timeout: null as any,
      contentHashes: new Map<string, string>()
    };

    pending.files.add(filePath);
    pending.eventType = eventType;
    pending.contentHashes.set(filePath, currentHash);

    // Set new timeout
    pending.timeout = setTimeout(async () => {
      const changedFiles = Array.from(pending.files);
      this.pendingChanges.delete(ruleName);

      if (this.options.verbose) {
        this.logger(`🔄 ${ruleName}: ${changedFiles.length} file(s) changed`);
        changedFiles.forEach(file => this.logger(`   • ${file}`));
      }

      try {
        await rule.onChange(changedFiles, eventType);
      } catch (error) {
        this.logger(`❌ Error in ${ruleName} onChange handler: ${error}`);
      }
    }, debounceMs);

    this.pendingChanges.set(ruleName, pending);
  }

  /**
   * Get current status
   */
  getStatus(): {
    isWatching: boolean;
    watchersCount: number;
    pendingChanges: number;
    rules: Array<{ name?: string; includes: string[]; excludes?: string[] }>;
  } {
    return {
      isWatching: this.isWatching,
      watchersCount: this.watchers.size,
      pendingChanges: this.pendingChanges.size,
      rules: this.options.rules.map(rule => ({
        name: rule.name,
        includes: rule.includes,
        excludes: rule.excludes
      }))
    };
  }
}

/**
 * Convenience function to create and start a file watcher
 */
export function createFileWatcher(options: FileWatcherOptions): FileWatcher {
  const watcher = new FileWatcher(options);
  watcher.start();
  return watcher;
}

/**
 * Predefined watch rules for common development scenarios
 */
export const CommonWatchRules = {
  /** Watch schema files and regenerate entities + GraphQL + Relay */
  schemas: {
    includes: ['schemas/*.json'],
    excludes: ['**/node_modules/**'],
    debounceMs: 2000,
    whitespace: false, // Ignore whitespace-only changes in JSON schemas
    name: 'schemas',
    onChange: async (files: string[]) => {
      console.log(`📝 Schema files changed: ${files.join(', ')}`);
      const { spawn } = await import('child_process');

      await new Promise<void>((resolve) => {
        const proc = spawn('yarn', ['graphql'], {
          stdio: 'inherit',
          shell: true
        });

        proc.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Schema regeneration complete');
          } else {
            console.error('❌ Schema regeneration failed');
          }
          resolve();
        });
      });
    }
  },

  /** Watch entity files (excluding generated ones) and regenerate GraphQL schema only */
  entities: {
    includes: ['main/db/entities/*.ts'],
    excludes: ['**/generated/**', '**/__tests__/**', '**/*.test.ts'],
    debounceMs: 3000,
    whitespace: false, // Ignore whitespace-only changes in entity files
    name: 'entities',
    onChange: async (files: string[]) => {
      console.log(`📝 Entity files changed: ${files.join(', ')}`);

      // Only regenerate schema, don't run full entity generation
      const { generateSchema } = await import('./generateSchema.js');
      await generateSchema();
      console.log('✅ GraphQL schema regenerated');
    }
  },

  /** Watch resolver files and regenerate GraphQL schema */
  resolvers: {
    includes: ['main/graphql/resolvers/*.ts'],
    excludes: ['**/__generated__/**', '**/CrudResolverFactory.ts', '**/*.test.ts'],
    debounceMs: 3000,
    whitespace: false, // Ignore whitespace-only changes in resolver files
    name: 'resolvers',
    onChange: async (files: string[]) => {
      console.log(`📝 Resolver files changed: ${files.join(', ')}`);

      const { generateSchema } = await import('./generateSchema.js');
      await generateSchema();
      console.log('✅ GraphQL schema regenerated');
    }
  },

  /** Watch critical main process files and restart Electron */
  mainProcess: {
    includes: [
      'main/index.ts',
      'main/preload.ts',
      'main/handlers/**/*.ts',
      'main/services/**/*.ts'
    ],
    excludes: [
      '**/entities/**',
      '**/graphql/resolvers/**',
      '**/__tests__/**',
      '**/*.test.ts'
    ],
    debounceMs: 2000,
    whitespace: false, // Ignore whitespace-only changes in main process files
    name: 'main-process',
    onChange: async (files: string[]) => {
      console.log(`🔧 Main process files changed: ${files.join(', ')}`);
      console.log('🔄 Restarting Electron main process...');

      // Note: In a real implementation, you'd want to communicate
      // with the running Electron process to restart it gracefully
      // This is just for demonstration
    }
  },

  /** Watch UI component files for hot reload (with whitespace filtering) */
  uiComponents: {
    includes: ['ui/**/*.tsx', 'ui/**/*.ts'],
    excludes: [
      'ui/__generated__/**',
      'ui/**/*.test.ts',
      'ui/**/*.test.tsx',
      'ui/node_modules/**'
    ],
    debounceMs: 500,
    whitespace: false, // Ignore whitespace-only changes in UI files
    name: 'ui-components',
    onChange: async (files: string[]) => {
      console.log(`🎨 UI files changed: ${files.join(', ')}`);
      // Vite handles hot reload automatically, so we just log
      console.log('🔄 Hot reload handled by Vite');
    }
  },

  /** Watch test files for auto-running tests */
  tests: {
    includes: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts'],
    excludes: ['**/node_modules/**', '**/dist/**', '**/.vite/**'],
    debounceMs: 1000,
    whitespace: true, // Allow whitespace changes in test files (might be formatting)
    name: 'tests',
    onChange: async (files: string[]) => {
      console.log(`🧪 Test files changed: ${files.join(', ')}`);
      // Could trigger test runs here if desired
      console.log('💡 Test files changed - consider running tests');
    }
  }
};