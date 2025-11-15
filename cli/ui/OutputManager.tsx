/**
 * OutputManager - Centralized CLI output management with Ink
 *
 * Provides a clean, consistent API for CLI output following refactor patterns:
 * - Options object for configuration (max 5 params rule)
 * - Helper methods for common operations (DRY)
 * - Simple interface hiding Ink complexity (encapsulation)
 * - No god class - focused on output management only
 *
 * Usage:
 *   const output = new OutputManager({ verbose: true, colors: true });
 *   output.success('Operation completed');
 *   const spinner = output.spinner('Processing...');
 *   spinner.stop();
 */

import React from 'react';
import { render, RenderOptions, Instance } from 'ink';
import {
  StatusMessage,
  type StatusMessageOptions,
  CommandSpinner,
  type CommandSpinnerOptions,
  ProgressBar,
  type ProgressBarOptions,
  CommandHeader,
  type CommandHeaderOptions,
  FileTree,
  type FileTreeOptions,
} from './Components/index.js';

/**
 * OutputManager configuration options
 */
export interface OutputManagerOptions {
  verbose?: boolean;
  colors?: boolean;
  timestamps?: boolean;
  silent?: boolean;
}

/**
 * Spinner handle for controlling running spinners
 */
export interface SpinnerHandle {
  update(text: string): void;
  stop(): void;
}

/**
 * Progress handle for controlling progress bars
 */
export interface ProgressHandle {
  update(current: number): void;
  complete(): void;
  stop(): void;
}

/**
 * OutputManager - Main service for CLI output
 */
export class OutputManager {
  private opts: OutputManagerOptions;
  private activeRenders: Instance[] = [];
  private isTestEnv: boolean;

  constructor(opts: OutputManagerOptions = {}) {
    this.opts = {
      verbose: opts.verbose ?? false,
      colors: opts.colors ?? true,
      timestamps: opts.timestamps ?? false,
      silent: opts.silent ?? false,
    };

    // Detect test environment (Vitest, Jest, etc.)
    this.isTestEnv = process.env.NODE_ENV === 'test' ||
                      process.env.VITEST === 'true' ||
                      typeof (global as any).it === 'function';
  }

  // ==================== Simple Messages ====================

  /**
   * Display success message
   */
  success(message: string, details?: string): void {
    if (this.opts.silent) return;

    this.renderMessage({
      type: 'success',
      message,
      details,
      timestamp: this.opts.timestamps,
    });
  }

  /**
   * Display error message
   */
  error(message: string, errorOrDetails?: Error | string): void {
    const details = errorOrDetails instanceof Error
      ? errorOrDetails.message
      : errorOrDetails;

    this.renderMessage({
      type: 'error',
      message,
      details,
      timestamp: this.opts.timestamps,
    });
  }

  /**
   * Display warning message
   */
  warning(message: string, details?: string): void {
    if (this.opts.silent) return;

    this.renderMessage({
      type: 'warning',
      message,
      details,
      timestamp: this.opts.timestamps,
    });
  }

  /**
   * Display info message
   */
  info(message: string, details?: string): void {
    if (this.opts.silent) return;

    this.renderMessage({
      type: 'info',
      message,
      details,
      timestamp: this.opts.timestamps,
    });
  }

  /**
   * Display progress message
   */
  progress(message: string, details?: string): void {
    if (this.opts.silent) return;
    if (!this.opts.verbose) return; // Progress only in verbose mode

    this.renderMessage({
      type: 'progress',
      message,
      details,
      timestamp: this.opts.timestamps,
    });
  }

  // ==================== Spinners ====================

  /**
   * Create and display a spinner
   */
  spinner(text: string, opts: Partial<CommandSpinnerOptions> = {}): SpinnerHandle {
    if (this.opts.silent || this.isTestEnv) {
      return this.createNoOpSpinner();
    }

    let currentText = text;
    const spinnerOpts: CommandSpinnerOptions = {
      text: currentText,
      color: opts.color ?? 'cyan',
      indent: opts.indent ?? 0,
    };

    const instance = render(<CommandSpinner {...spinnerOpts} />);
    this.activeRenders.push(instance);

    return {
      update: (newText: string) => {
        currentText = newText;
        instance.rerender(<CommandSpinner {...spinnerOpts} text={currentText} />);
      },
      stop: () => {
        instance.unmount();
        this.removeRender(instance);
      },
    };
  }

  // ==================== Progress Bars ====================

  /**
   * Create and display a progress bar
   */
  progressBar(total: number, opts: Partial<ProgressBarOptions> = {}): ProgressHandle {
    if (this.opts.silent || this.isTestEnv) {
      return this.createNoOpProgress();
    }

    let current = 0;
    const progressOpts: ProgressBarOptions = {
      current,
      total,
      label: opts.label,
      width: opts.width ?? 40,
      showPercentage: opts.showPercentage ?? true,
      color: opts.color ?? 'cyan',
    };

    const instance = render(<ProgressBar {...progressOpts} />);
    this.activeRenders.push(instance);

    return {
      update: (newCurrent: number) => {
        current = newCurrent;
        instance.rerender(<ProgressBar {...progressOpts} current={current} />);
      },
      complete: () => {
        current = total;
        instance.rerender(<ProgressBar {...progressOpts} current={current} />);
        setTimeout(() => {
          instance.unmount();
          this.removeRender(instance);
        }, 500);
      },
      stop: () => {
        instance.unmount();
        this.removeRender(instance);
      },
    };
  }

  // ==================== Headers ====================

  /**
   * Display command header
   */
  header(title: string, opts: Partial<CommandHeaderOptions> = {}): void {
    if (this.opts.silent) return;

    const headerOpts: CommandHeaderOptions = {
      title,
      subtitle: opts.subtitle,
      showBorder: opts.showBorder ?? true,
      borderColor: opts.borderColor ?? 'cyan',
    };

    this.renderAndWait(<CommandHeader {...headerOpts} />);
  }

  // ==================== File Trees ====================

  /**
   * Display file tree
   */
  fileTree(items: FileTreeOptions['items'], opts: Partial<FileTreeOptions> = {}): void {
    if (this.opts.silent) return;

    const treeOpts: FileTreeOptions = {
      items,
      title: opts.title,
      showStatus: opts.showStatus ?? true,
      indent: opts.indent ?? 0,
    };

    this.renderAndWait(<FileTree {...treeOpts} />);
  }

  // ==================== Separators ====================

  /**
   * Display separator line
   */
  separator(char: string = '─', length: number = 50): void {
    if (this.opts.silent) return;
    console.log(char.repeat(length));
  }

  /**
   * Display blank line
   */
  newLine(): void {
    if (this.opts.silent) return;
    console.log();
  }

  // ==================== Cleanup ====================

  /**
   * Stop all active renders (spinners, progress bars, etc.)
   */
  cleanup(): void {
    this.activeRenders.forEach(instance => {
      try {
        instance.unmount();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    this.activeRenders = [];
  }

  // ==================== Private Helpers ====================

  /**
   * Render a status message
   */
  private renderMessage(opts: StatusMessageOptions): void {
    // In test environment, use simple console output
    if (this.isTestEnv) {
      this.renderMessageSimple(opts);
      return;
    }

    this.renderAndWait(<StatusMessage {...opts} />);
  }

  /**
   * Simple console output for test environments
   */
  private renderMessageSimple(opts: StatusMessageOptions): void {
    const icons = {
      success: '✔',
      error: '✖',
      warning: '⚠',
      info: 'ℹ',
      progress: '⋯',
    };

    const icon = icons[opts.type] || '';
    const timestamp = opts.timestamp ? `[${new Date().toISOString()}] ` : '';
    const details = opts.details ? ` ${opts.details}` : '';

    const message = `${timestamp}${icon} ${opts.message}${details}`;

    if (opts.type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Render component and wait for it to complete
   */
  private renderAndWait(component: React.ReactElement): void {
    const instance = render(component);
    instance.waitUntilExit().then(() => {
      this.removeRender(instance);
    });
    this.activeRenders.push(instance);
  }

  /**
   * Remove render instance from tracking
   */
  private removeRender(instance: Instance): void {
    const index = this.activeRenders.indexOf(instance);
    if (index !== -1) {
      this.activeRenders.splice(index, 1);
    }
  }

  /**
   * Create no-op spinner (for silent mode)
   */
  private createNoOpSpinner(): SpinnerHandle {
    return {
      update: () => {},
      stop: () => {},
    };
  }

  /**
   * Create no-op progress (for silent mode)
   */
  private createNoOpProgress(): ProgressHandle {
    return {
      update: () => {},
      complete: () => {},
      stop: () => {},
    };
  }
}
