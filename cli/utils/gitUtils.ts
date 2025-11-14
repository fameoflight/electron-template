/**
 * Git utility functions for CLI commands
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface GitStatusResult {
  modified: string[];
  added: string[];
  untracked: string[];
  staged: string[];
}

export class GitUtils {
  private readonly cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Add files/directories to Git staging area
   */
  async add(paths: string | string[]): Promise<void> {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const pathsStr = pathArray.join(' ');

    try {
      await execAsync(`git add ${pathsStr}`, { cwd: this.cwd });
    } catch (error) {
      throw new Error(`Failed to add files to Git: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Check if files have changes in Git working directory
   */
  async getStatus(path?: string): Promise<GitStatusResult> {
    try {
      const pathArg = path ? ` ${path}` : '';
      const { stdout } = await execAsync(`git status --porcelain${pathArg}`, { cwd: this.cwd });

      const result: GitStatusResult = {
        modified: [],
        added: [],
        untracked: [],
        staged: []
      };

      const lines = stdout.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        const status = line.substring(0, 2);
        const filePath = line.substring(3);

        if (status[0] === 'M' || status[1] === 'M') {
          result.modified.push(filePath);
        }
        if (status[0] === 'A' || status[1] === 'A') {
          result.added.push(filePath);
        }
        if (status[0] === '?' || status[1] === '?') {
          result.untracked.push(filePath);
        }
        if (status[0] !== ' ' && status[0] !== '?') {
          result.staged.push(filePath);
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get Git status: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Check if a path exists in Git repository
   */
  async pathExists(path: string): Promise<boolean> {
    try {
      await execAsync(`git ls-files ${path}`, { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the root directory of the Git repository
   */
  async getRepoRoot(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: this.cwd });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Not in a Git repository: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Check if we're in a Git repository
   */
  async isInGitRepo(): Promise<boolean> {
    try {
      await this.getRepoRoot();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add files and return summary of what was staged
   */
  async addWithSummary(paths: string | string[]): Promise<string[]> {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const changes: string[] = [];

    // Get status before adding
    const beforeStatus = await this.getStatus();

    try {
      await this.add(pathArray);

      // Get status after adding
      const afterStatus = await this.getStatus();

      // Compare to see what was actually added
      const allBefore = new Set([...beforeStatus.modified, ...beforeStatus.untracked]);
      const allAfter = new Set([...afterStatus.modified, ...afterStatus.untracked, ...afterStatus.added]);

      for (const file of allAfter) {
        if (!allBefore.has(file)) {
          changes.push(`Added ${file} to Git staging area`);
        }
      }

      return changes;
    } catch (error) {
      throw new Error(`Failed to add files to Git: ${error instanceof Error ? error.message : error}`);
    }
  }
}