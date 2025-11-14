import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { vi } from 'vitest';

const aliases = {
  '@ui': path.resolve(__dirname, 'ui'),
  '@shared': path.resolve(__dirname, 'shared'),
  '@main': path.resolve(__dirname, 'main'),
  '@base': path.resolve(__dirname, 'main/base'),
  '@db': path.resolve(__dirname, 'main/db'),
  '@cli': path.resolve(__dirname, 'cli'),
  '@help': path.resolve(__dirname, 'public/help'),
  '@tests': path.resolve(__dirname, '__tests__'),
  '@factories': path.resolve(__dirname, '__tests__/factories'),
};

export default defineConfig({
  test: {
    // Use jsdom for DOM-related tests (React components)
    environment: 'jsdom',

    // Setup files - run before each test file
    setupFiles: ['__tests__/setup.ts'],

    // Test timeout (30s for integration tests with embeddings)
    testTimeout: 30000,
    // Hide console logs unless test fails
    onConsoleLog: (log, type) => {
      if (process.env.SILENT == 'true') {
        return true; // Suppress all console output
      }
      // Show other logs only if the test failed
      const currentTest = (vi as any).currentTest;
      if (currentTest && currentTest.state === 'failed') {
        return false; // Show log
      }
      return true; // Suppress log
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['main/**/*.ts', 'shared/**/*.ts'],
      exclude: [
        'main/db/migrations/**',
        'main/db/entities/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts',
      ],
    },

    // Isolation
    isolate: true,

    // Run tests sequentially by default (safer for DB tests)
    // Can override with VITEST_MAX_THREADS env var
    maxConcurrency: 1,

    // Globals (describe, it, expect)
    globals: true,

    // Suppress verbose output
    silent: false,
  },

  resolve: {
    alias: aliases,
  },
});
