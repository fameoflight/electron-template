/**
 * CommonWatchRules - Predefined file watching rules for common development scenarios
 *
 * Extracted from FileWatcher.ts to separate concerns:
 * - FileWatcher.ts: Core watching mechanism
 * - CommonWatchRules.ts: Common use cases and configurations
 *
 * Pattern: Configuration as Code
 */

import { FilePattern } from './FileWatcher.js';
import { output } from './output.js';

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
      output.info(`Schema files changed: ${files.join(', ')}`);
      const { spawn } = await import('child_process');

      await new Promise<void>((resolve) => {
        const proc = spawn('yarn', ['graphql'], {
          stdio: 'inherit',
          shell: true
        });

        proc.on('close', (code) => {
          if (code === 0) {
            output.success('Schema regeneration complete');
          } else {
            output.error('Schema regeneration failed');
          }
          resolve();
        });
      });
    }
  } as FilePattern,

  /** Watch entity files (excluding generated ones) and regenerate GraphQL schema only */
  entities: {
    includes: ['main/db/entities/*.ts'],
    excludes: ['**/generated/**', '**/__tests__/**', '**/*.test.ts'],
    debounceMs: 3000,
    whitespace: false, // Ignore whitespace-only changes in entity files
    name: 'entities',
    onChange: async (files: string[]) => {
      output.info(`Entity files changed: ${files.join(', ')}`);

      // Only regenerate schema, don't run full entity generation
      const { generateSchema } = await import('./generateSchema.js');
      await generateSchema();
      output.success('GraphQL schema regenerated');
    }
  } as FilePattern,

  /** Watch resolver files and regenerate GraphQL schema */
  resolvers: {
    includes: ['main/graphql/resolvers/*.ts'],
    excludes: ['**/__generated__/**', '**/CrudResolverFactory.ts', '**/*.test.ts'],
    debounceMs: 3000,
    whitespace: false, // Ignore whitespace-only changes in resolver files
    name: 'resolvers',
    onChange: async (files: string[]) => {
      output.info(`Resolver files changed: ${files.join(', ')}`);

      const { generateSchema } = await import('./generateSchema.js');
      await generateSchema();
      output.success('GraphQL schema regenerated');
    }
  } as FilePattern,

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
      output.info(`Main process files changed: ${files.join(', ')}`);
      output.info('Restarting Electron main process...');

      // Note: In a real implementation, you'd want to communicate
      // with the running Electron process to restart it gracefully
      // This is just for demonstration
    }
  } as FilePattern,

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
      output.info(`UI files changed: ${files.join(', ')}`);
      // Vite handles hot reload automatically, so we just log
      output.info('Hot reload handled by Vite');
    }
  } as FilePattern,

  /** Watch test files for auto-running tests */
  tests: {
    includes: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts'],
    excludes: ['**/node_modules/**', '**/dist/**', '**/.vite/**'],
    debounceMs: 1000,
    whitespace: true, // Allow whitespace changes in test files (might be formatting)
    name: 'tests',
    onChange: async (files: string[]) => {
      output.info(`Test files changed: ${files.join(', ')}`);
      // Could trigger test runs here if desired
      output.info('Test files changed - consider running tests');
    }
  } as FilePattern
};
