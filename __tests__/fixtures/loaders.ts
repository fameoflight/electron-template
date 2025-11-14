/**
 * Fixture loaders for test documents
 *
 * Provides utilities to load test fixtures
 */

import fs from 'fs/promises';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname);

/**
 * Load a fixture file as a buffer
 */
export async function loadFixture(filename: string): Promise<Buffer> {
  const filePath = path.join(FIXTURES_DIR, filename);
  return fs.readFile(filePath);
}

/**
 * Load a fixture file as a string (for text files)
 */
export async function loadFixtureAsString(filename: string): Promise<string> {
  const buffer = await loadFixture(filename);
  return buffer.toString('utf-8');
}

/**
 * Get fixture file path
 */
export function getFixturePath(filename: string): string {
  return path.join(FIXTURES_DIR, filename);
}

/**
 * Get fixture file stats
 */
export async function getFixtureStats(filename: string) {
  const filePath = getFixturePath(filename);
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    path: filePath,
    filename,
  };
}

/**
 * Available test fixtures
 */
export const FIXTURES = {
  TEXT: 'sample.txt',
  PDF: 'sample.pdf',
  EPUB: 'sample.epub',
  MARKDOWN: 'sample.md',
} as const;

/**
 * Find fixtures matching a pattern recursively
 */
export async function findFixtures(pattern: string, maxDepth: number = 5): Promise<string[]> {
  const results: string[] = [];
  const fixturesBaseDir = __dirname;

  async function searchRecursive(currentDir: string, currentDepth: number): Promise<void> {
    if (currentDepth > maxDepth) return;

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(fixturesBaseDir, fullPath);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await searchRecursive(fullPath, currentDepth + 1);
        } else if (entry.isFile() && entry.name.match(pattern)) {
          results.push(relativePath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await searchRecursive(fixturesBaseDir, 0);
  return results;
}

/**
 * Load fixture by pattern (finds first match)
 */
export async function loadFixtureByPattern(pattern: string): Promise<string> {
  const matches = await findFixtures(pattern);
  if (matches.length === 0) {
    throw new Error(`No fixture found matching pattern: ${pattern}`);
  }

  // Return the first match
  const filePath = path.join(__dirname, matches[0]);
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Get fixture path by pattern (finds first match)
 */
export async function getFixturePathByPattern(pattern: string): Promise<string> {
  const matches = await findFixtures(pattern);
  if (matches.length === 0) {
    throw new Error(`No fixture found matching pattern: ${pattern}`);
  }

  return path.join(__dirname, matches[0]);
}

/**
 * Load all fixtures (useful for testing parser registry)
 */
export async function loadAllFixtures() {
  return {
    text: await loadFixture(FIXTURES.TEXT),
    pdf: await loadFixture(FIXTURES.PDF),
    epub: await loadFixture(FIXTURES.EPUB),
    markdown: await loadFixture(FIXTURES.MARKDOWN),
  };
}
