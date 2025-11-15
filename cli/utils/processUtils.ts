/**
 * Process management utilities for CLI commands
 */
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { output } from './output.js';

export interface ProcessOptions {
  timeout?: number;
  retries?: number;
  fallbackCommand?: { command: string; args: string[] };
  onTimeout?: () => void;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
}

export interface ProcessResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
}

export class ProcessManager {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Execute a command and return the result with timeout and retry logic
   */
  async runCommand(
    command: string,
    args: string[],
    name: string,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    const { timeout = 120000, retries = 1, fallbackCommand, onTimeout, cwd = this.cwd } = options;

    let attempt = 0;
    const startTime = Date.now();

    while (attempt <= retries) {
      attempt++;

      if (attempt > 1) {
        output.info(`Retrying ${name} (attempt ${attempt}/${retries + 1})`);
      }

      try {
        const result = await this.runCommandWithTimeout(command, args, name, timeout, {
          onTimeout,
          cwd: cwd || this.cwd,
          env: options.env,
          shell: options.shell
        });

        return {
          ...result,
          duration: Date.now() - startTime,
          timedOut: false
        };
      } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timeout');

        if (isTimeout && fallbackCommand) {
          output.warning(`${name} timed out after ${timeout}ms`);
          output.info('Trying fallback command...');

          try {
            const fallbackResult = await this.runCommandWithTimeout(
              fallbackCommand.command,
              fallbackCommand.args,
              `${name} (fallback)`,
              timeout,
              { cwd: cwd || this.cwd }
            );

            return {
              ...fallbackResult,
              duration: Date.now() - startTime,
              timedOut: true,
              exitCode: fallbackResult.exitCode
            };
          } catch (fallbackError) {
            output.error('Fallback command also failed', String(fallbackError));
          }
        }

        if (attempt <= retries) {
          output.warning(`${name} failed (attempt ${attempt}/${retries + 1})`, String(error));
          continue;
        }

        // All attempts failed
        output.error(`${name} failed after ${attempt} attempts`, String(error));
        throw error;
      }
    }

    // This should never be reached
    throw new Error('Unexpected error in ProcessManager.runCommand');
  }

  /**
   * Run a command with timeout
   */
  private async runCommandWithTimeout(
    command: string,
    args: string[],
    name: string,
    timeout: number,
    options: {
      onTimeout?: () => void;
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      shell?: boolean;
    } = {}
  ): Promise<Omit<ProcessResult, 'duration' | 'timedOut'>> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        cwd: options.cwd || this.cwd,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

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

          if (options.onTimeout) {
            options.onTimeout();
          }

          reject(new Error(`${name} timed out after ${timeout}ms`));
        }, timeout);
      }

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        // Log important output in real-time for debugging
        const stdoutLine = data.toString().trim();
        if (stdoutLine && (stdoutLine.includes('signing') || stdoutLine.includes('error') || stdoutLine.includes('failed'))) {
          output.info(`${name}: ${stdoutLine}`);
        }
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        // Log errors in real-time
        const stderrLine = data.toString().trim();
        if (stderrLine) {
          output.warning(`${name} error: ${stderrLine}`);
        }
      });

      proc.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        output.error(`${name} process error`, String(error));
        reject(error);
      });

      proc.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (code === 0) {
          resolve({
            success: true,
            exitCode: code,
            stdout,
            stderr
          });
        } else {
          // Check for common error patterns and provide helpful messages
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

          resolve({
            success: false,
            exitCode: code,
            stdout,
            stderr
          });
        }
      });
    });
  }

  /**
   * Spawn a process and track it (for long-running processes like dev servers)
   */
  spawnProcess(
    command: string,
    args: string[],
    name: string,
    options: {
      color?: string;
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      shell?: boolean;
    } = {}
  ): ChildProcess {
    const { cwd = this.cwd } = options;

    output.info(`Starting ${name}...`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: cwd || this.cwd,
      env: { ...process.env, ...options.env }
    });

    proc.on('error', (error) => {
      output.error(`${name} error`, String(error));
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        output.warning(`${name} exited with code ${code}`);
      }
    });

    return proc;
  }

  /**
   * Kill a process gracefully
   */
  killProcess(proc: ChildProcess, signal: 'SIGTERM' | 'SIGKILL' = 'SIGTERM'): boolean {
    try {
      proc.kill(signal);
      return true;
    } catch (error) {
      output.warning('Failed to kill process', String(error));
      return false;
    }
  }

  /**
   * Execute a command and return stdout
   */
  async execAsync(command: string, args: string[], options: { cwd?: string } = {}): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'pipe', cwd: options.cwd || this.cwd });
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => stdout += data);
      proc.stderr?.on('data', (data) => stderr += data);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
        }
      });

      proc.on('error', reject);
    });
  }
}