/**
 * ProcessRunner - Handles command execution with timeout and retry logic
 *
 * Responsibilities:
 * - Execute commands with configurable timeouts
 * - Retry failed commands automatically
 * - Fallback command execution
 * - Real-time output logging
 * - Intelligent error messages
 *
 * Pattern: Service with focused methods (max 5 params rule)
 */

import { spawn, ChildProcess } from 'child_process';
import { cyberOutput } from '../../utils/output.js';

export interface ProcessOptions {
  timeout?: number;
  retries?: number;
  fallbackCommand?: { command: string; args: string[] };
  onTimeout?: () => void;
  logOutput?: boolean;
}

export class ProcessRunner {
  /**
   * Run a command with timeout and retry logic
   */
  async run(command: string, args: string[], name: string, opts: ProcessOptions = {}): Promise<void> {
    const { timeout = 120000, retries = 1, fallbackCommand, onTimeout } = opts;

    let attempt = 0;

    while (attempt <= retries) {
      attempt++;

      if (attempt > 1) {
        cyberOutput.info(`Retrying ${name} (attempt ${attempt}/${retries + 1})`);
      }

      try {
        await this.runWithTimeout(command, args, name, timeout, onTimeout, opts.logOutput);
        return; // Success
      } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timeout');

        if (isTimeout && fallbackCommand) {
          cyberOutput.warning(`${name} timed out after ${timeout}ms`);
          cyberOutput.info('Trying fallback command...');

          try {
            await this.runWithTimeout(
              fallbackCommand.command,
              fallbackCommand.args,
              `${name} (fallback)`,
              timeout,
              undefined,
              opts.logOutput
            );
            return; // Fallback succeeded
          } catch (fallbackError) {
            const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            cyberOutput.error(`Fallback command also failed: ${errorMessage}`);
          }
        }

        if (attempt <= retries) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          cyberOutput.warning(`${name} failed (attempt ${attempt}/${retries + 1}): ${errorMessage}`);
          continue;
        }

        // All attempts failed
        const errorMessage = error instanceof Error ? error.message : String(error);
        cyberOutput.error(`${name} failed after ${attempt} attempts: ${errorMessage}`);
        throw error;
      }
    }
  }

  /**
   * Run a command with timeout
   */
  private async runWithTimeout(
    command: string,
    args: string[],
    name: string,
    timeout: number,
    onTimeout?: () => void,
    logOutput: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout;

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          proc.kill('SIGTERM');

          // Force kill if SIGTERM doesn't work
          setTimeout(() => {
            if (!proc.killed) {
              proc.kill('SIGKILL');
            }
          }, 5000);

          if (onTimeout) {
            onTimeout();
          }

          reject(new Error(`${name} timed out after ${timeout}ms`));
        }, timeout);
      }

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();

        // Log important output in real-time for debugging
        if (logOutput) {
          const output = data.toString().trim();
          if (output && (output.includes('signing') || output.includes('error') || output.includes('failed'))) {
            cyberOutput.logger.log(`   ${name}: ${output}`);
          }
        }
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();

        // Log errors in real-time
        if (logOutput) {
          const output = data.toString().trim();
          if (output) {
            cyberOutput.warning(`   ${name} error: ${output}`);
          }
        }
      });

      proc.on('error', (error) => {
        if (timeout) clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : String(error);
        cyberOutput.error(`${name} process error: ${errorMessage}`);
        reject(error);
      });

      proc.on('close', (code) => {
        if (timeout) clearTimeout(timeoutId);

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(this.buildErrorMessage(name, code, stderr)));
        }
      });
    });
  }

  /**
   * Build intelligent error message based on common patterns
   */
  private buildErrorMessage(name: string, code: number | null, stderr: string): string {
    let errorMsg = `${name} failed with exit code ${code}`;

    if (stderr.includes('no such file or directory')) {
      errorMsg += '\n💡 Tip: Missing files - check build paths and required assets';
    } else if (stderr.includes('code signing') || stderr.includes('identity')) {
      errorMsg += '\n💡 Tip: Code signing issue - try setting "identity": null in package.json build config';
    } else if (stderr.includes('certificate')) {
      errorMsg += '\n💡 Tip: Certificate issue - check keychain access and certificate validity';
    }

    if (stderr) {
      errorMsg += '\nError output:\n' + stderr;
    }

    return errorMsg;
  }
}
