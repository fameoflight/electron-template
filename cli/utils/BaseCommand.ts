/**
 * BaseCommand - Shared infrastructure for utility commands
 *
 * Provides common patterns for:
 * - Consistent colored output using Ink components
 * - Error handling and exit codes
 * - Progress indication with spinners and progress bars
 * - File operations using existing file-helpers
 *
 * Refactored to use OutputManager with Ink for rich terminal UI:
 * - Options object pattern (max 5 params)
 * - Clean API hiding Ink complexity
 * - DRY helper methods
 *
 * Usage:
 * class CleanCommand extends BaseCommand {
 *   async run(options: CleanOptions): Promise<void> {
 *     this.info('Starting clean process...');
 *     // ... implementation
 *     this.success('Clean completed!');
 *   }
 * }
 */

import { CyberpunkOutput, ChalkOutput, type OutputOptions } from './output.js';

export interface CommandResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface BaseCommandOptions extends OutputOptions {
  silent?: boolean;
}

/**
 * Abstract base class for utility commands
 */
export abstract class BaseCommand {
  protected startTime: number = Date.now();
  protected output: CyberpunkOutput;
  protected opts: BaseCommandOptions;

  constructor(opts: BaseCommandOptions = {}) {
    this.opts = opts;
    this.output = new CyberpunkOutput({
      verbose: opts.verbose ?? false,
      colors: opts.colors ?? true,
      timestamps: opts.timestamps ?? false,
      silent: opts.silent ?? false,
    });
  }

  /**
   * Main entry point - must be implemented by subclasses
   */
  abstract run(options: Record<string, unknown>): Promise<CommandResult>;

  /**
   * Run the command with error handling and timing
   */
  async execute(options: Record<string, unknown>): Promise<void> {
    const result = await this.run(options);

    if (result.success) {
      this.success(result.message);
      if (result.data) {
        this.printData(result.data);
      }
    } else {
      this.error(result.message);
      process.exit(1);
    }

    this.printTiming();
    this.output.cleanup();
  }

  // ==================== Output Methods ====================

  /**
   * Display info message
   */
  protected info(message: string, details?: string): void {
    this.output.info(message, details);
  }

  /**
   * Display success message
   */
  protected success(message: string, details?: string): void {
    this.output.success(message, details);
  }

  /**
   * Display warning message
   */
  protected warning(message: string, details?: string): void {
    this.output.warning(message, details);
  }

  /**
   * Display error message
   */
  protected error(message: string, details?: string): void {
    this.output.error(message, details);
  }

  /**
   * Display progress message
   */
  protected progress(message: string, details?: string): void {
    this.output.progress(message, details);
  }

  /**
   * Display step progress
   */
  protected step(step: number, total: number, message: string): void {
    this.output.progress(`[${step}/${total}] ${message}`);
  }

  // ==================== Helper Methods ====================

  /**
   * Print data in a structured way
   */
  protected printData(data: unknown): void {
    this.output.newLine();
    this.info('Results');
    this.output.separator('─', 50);

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        data.forEach(item => this.output.logger.log(`  • ${item}`));
      } else {
        Object.entries(data).forEach(([key, value]) => {
          this.output.logger.log(`  ${key}: ${value}`);
        });
      }
    } else {
      this.output.logger.log(`  ${data}`);
    }

    this.output.separator('─', 50);
  }

  /**
   * Print execution timing
   */
  protected printTiming(): void {
    const duration = Date.now() - this.startTime;
    const seconds = (duration / 1000).toFixed(2);
    this.output.progress(`Completed in ${seconds}s`);
  }

  /**
   * Print a separator for better readability
   */
  protected separator(): void {
    this.output.newLine();
  }

  /**
   * Confirm an action with the user
   */
  protected confirm(message: string): boolean {
    // For now, always return true. Could be enhanced with readline in the future
    this.info(`${message} (y/N)`);
    return true;
  }

  /**
   * Handle a file operation result
   */
  protected handleFileResult(result: { success: boolean; message: string; filePath: string }): void {
    if (result.success) {
      this.success(result.message);
    } else {
      this.error(result.message);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}