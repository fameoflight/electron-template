/**
 * BaseCommand - Shared infrastructure for utility commands
 *
 * Provides common patterns for:
 * - Consistent colored output and status messages
 * - Error handling and exit codes
 * - Progress indication
 * - File operations using existing file-helpers
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

export interface CommandResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Abstract base class for utility commands
 */
export abstract class BaseCommand {
  protected startTime: number = Date.now();
  protected loggingEnabled: boolean = true;

  /**
   * Main entry point - must be implemented by subclasses
   */
  abstract run(options: Record<string, unknown>): Promise<CommandResult>;

  /**
   * Run the command with error handling and timing
   */
  async execute(options: Record<string, unknown>): Promise<void> {
    this.loggingEnabled = !options.silent;
    try {
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
    } catch (error) {
      this.error('Command failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      this.printTiming();
    }
  }

  // Colored output methods
  protected info(message: string, ...args: unknown[]): void {
    if (!this.loggingEnabled) return;
    console.log(`\x1b[36mℹ️  ${message}\x1b[0m`, ...args);
  }

  protected success(message: string, ...args: unknown[]): void {
    if (!this.loggingEnabled) return;
    console.log(`\x1b[32m✅ ${message}\x1b[0m`, ...args);
  }

  protected warning(message: string, ...args: unknown[]): void {
    if (!this.loggingEnabled) return;
    console.log(`\x1b[33m⚠️  ${message}\x1b[0m`, ...args);
  }

  protected error(message: string, ...args: unknown[]): void {
    if (!this.loggingEnabled) return;
    console.error(`\x1b[31m❌ ${message}\x1b[0m`, ...args);
  }

  protected progress(message: string): void {
    if (!this.loggingEnabled) return;
    console.log(`\x1b[90m▶️  ${message}\x1b[0m`);
  }

  protected step(step: number, total: number, message: string): void {
    if (!this.loggingEnabled) return;
    console.log(`\x1b[90m[${step}/${total}] ${message}\x1b[0m`);
  }

  /**
   * Print data in a structured way
   */
  protected printData(data: unknown): void {
    if (!this.loggingEnabled) return;
    if (typeof data === 'object' && data !== null) {
      console.log('\n📊 Results:');
      console.log('─'.repeat(50));
      if (Array.isArray(data)) {
        data.forEach(item => console.log(`  • ${item}`));
      } else {
        Object.entries(data).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      console.log('─'.repeat(50));
    } else {
      console.log('\n📊 Result:', data);
    }
  }

  /**
   * Print execution timing
   */
  protected printTiming(): void {
    if (!this.loggingEnabled) return;
    const duration = Date.now() - this.startTime;
    const seconds = (duration / 1000).toFixed(2);
    console.log(`\x1b[90m⏱️  Completed in ${seconds}s\x1b[0m`);
  }

  /**
   * Print a separator for better readability
   */
  protected separator(): void {
    if (!this.loggingEnabled) return;
    console.log('');
  }

  /**
   * Confirm an action with the user
   */
  protected confirm(message: string): boolean {
    if (!this.loggingEnabled) return true;
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