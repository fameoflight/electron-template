import path from 'node:path';
import os from 'node:os';
import electron from 'electron';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Get the user data directory (persistent storage)
export function getUserDataPath(): string {
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), '.data/test');
  }
  if (process.env.PRODUCTION) {
    if (electron && electron.app) {
      return electron.app.getPath('userData');
    }

    // User home directory fallback
    return path.join(os.homedir(), '.codeblocks');
  }

  return path.join(process.cwd(), '.data');
};

export function getDatabasePath(): string {
  // Allow test database path override for testing
  if (process.env.TEST_DB_PATH) {
    return process.env.TEST_DB_PATH;
  }
  const userDataPath = getUserDataPath();
  return path.join(userDataPath, 'codeblocks.db');
}

export function getVectorDbPath(): string {
  const userDataPath = getUserDataPath();
  return path.join(userDataPath, 'vectors');
}