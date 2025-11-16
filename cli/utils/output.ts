/**
 * Cyberpunk Terminal UI - Distinctive CLI Experience
 *
 * A futuristic CLI interface with cyberpunk aesthetics:
 * - Neon colors and electric effects
 * - Animated loading sequences and glitch effects
 * - Terminal art and branded visual elements
 * - Immersive developer experience
 */

// eslint-disable-next-line @codeblocks/file-size-limit
import chalk, { ChalkInstance } from 'chalk';
import { CyberpunkColorScheme, defaultColorScheme } from './ColorScheme';

/**
 * Cyberpunk configuration options
 */
export interface CyberpunkOptions {
  verbose?: boolean;
  colors?: boolean;
  timestamps?: boolean;
  silent?: boolean;
  glitch?: boolean;          // Enable glitch effects
  neon?: boolean;           // Enhanced neon glow effects
  animations?: boolean;     // Animated sequences
  colorScheme?: CyberpunkColorScheme; // Custom color scheme
}

/**
 * Cyberpunk spinner handle with animation states
 */
export interface CyberpunkSpinner {
  update(text: string): void;
  stop(): void;
  success(message?: string): void;
  error(message?: string): void;
}

/**
 * Cyberpunk progress bar with energy effects
 */
export interface CyberpunkProgress {
  update(current: number): void;
  complete(): void;
  error(): void;
}


/**
 * Cyberpunk Terminal UI - Distinctive CLI Experience
 */
export class CyberpunkOutput {
  private opts: CyberpunkOptions;
  private colors: CyberpunkColorScheme;
  private activeSpinners: Map<NodeJS.Timeout, CyberpunkSpinner> = new Map();
  private animationFrames: number = 0;

  constructor(opts: CyberpunkOptions = {}) {
    this.opts = {
      verbose: opts.verbose ?? false,
      colors: opts.colors ?? true,
      timestamps: opts.timestamps ?? false,
      silent: opts.silent ?? false,
      glitch: opts.glitch ?? true,
      neon: opts.neon ?? true,
      animations: opts.animations ?? true,
      colorScheme: opts.colorScheme ?? defaultColorScheme,
    };

    this.colors = this.opts.colorScheme || defaultColorScheme;

    // Configure chalk level and custom colors
    if (!this.opts.colors) {
      chalk.level = 0;
    }
  }

  /**
   * Get current timestamp in cyberpunk format
   */
  private timestamp(): string {
    if (!this.opts.timestamps) return '';
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    return this.colors.grid(`[${time}] `);
  }

  /**
   * Custom logger that returns messages for console output
   */
  private formatMessage(message: string, type: 'log' | 'error' = 'log'): string {
    if (this.opts.silent) return '';

    if (this.opts.glitch && Math.random() < 0.05) {
      // Occasional glitch effect
      message = this.addGlitch(message);
    }

    return message;
  }

  /**
   * Enhanced console output with cyberpunk styling
   */
  private log(message: string, type: 'log' | 'error' = 'log'): void {
    const formattedMessage = this.formatMessage(message, type);
    if (!formattedMessage) return;

    if (type === 'error') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Add glitch effect to text
   */
  private addGlitch(text: string): string {
    const glitchChars = ['█', '▓', '▒', '░', '■', '□'];
    const positions = Math.floor(Math.random() * 3);
    let glitched = text;

    for (let i = 0; i < positions; i++) {
      const pos = Math.floor(Math.random() * text.length);
      const char = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      glitched = glitched.slice(0, pos) + this.colors.glitch(char) + glitched.slice(pos + 1);
    }

    return glitched;
  }

  /**
   * Create cyberpunk border effect
   */
  private cyberpunkBorder(width: number, style: 'single' | 'double' | 'dashed' = 'single'): string {
    const chars = {
      single: { corner: '┌', horiz: '─', vert: '│', corner2: '┐', corner3: '└', corner4: '┘' },
      double: { corner: '╔', horiz: '═', vert: '║', corner2: '╗', corner3: '╚', corner4: '╝' },
      dashed: { corner: '┌', horiz: '┄', vert: '│', corner2: '┐', corner3: '└', corner4: '┘' }
    };

    const c = chars[style];
    const border = c.corner + c.horiz.repeat(width - 2) + c.corner2;
    return this.colors.primary(border);
  }

  /**
   * Display success with cyberpunk style
   */
  success(message: string, details?: string): void {
    const icon = this.opts.animations ? '◆' : '✓';
    const iconColored = this.colors.success.bold(icon);
    const messageColored = this.colors.success.bold(message);
    const detailsStr = details ? this.colors.static(` ─ ${details}`) : '';

    this.log(`${this.timestamp()}${iconColored} ${messageColored}${detailsStr}`);
  }

  /**
   * Return success formatted text (for console.log usage)
   */
  successText(message: string): string {
    const icon = this.opts.animations ? '◆' : '✓';
    return `${this.colors.success.bold(icon)}   ${message}`;
  }

  /**
   * Return info formatted text (for console.log usage)
   */
  infoText(message: string): string {
    return this.colors.info(message);
  }

  /**
   * Display error with cyberpunk alert
   */
  error(message: string, errorOrDetails?: Error | string): void {
    const icon = this.opts.animations ? '⚠' : '✗';
    let details = '';

    if (errorOrDetails instanceof Error) {
      details = this.colors.static(` ─ ${errorOrDetails.message}`);
    } else if (errorOrDetails) {
      details = this.colors.static(` ─ ${errorOrDetails}`);
    }

    const iconColored = this.colors.error.bold(icon);
    const messageColored = this.colors.error.bold(message);

    this.log(`${this.timestamp()}${iconColored} ${messageColored}${details}`, 'error');
  }

  /**
   * Display warning with cyberpunk alert
   */
  warning(message: string, details?: string): void {
    const icon = '▲';
    const iconColored = this.colors.warning.bold(icon);
    const messageColored = this.colors.warning.bold(message);
    const detailsStr = details ? this.colors.static(` ─ ${details}`) : '';

    this.log(`${this.timestamp()}${iconColored} ${messageColored}${detailsStr}`);
  }

  /**
   * Display info with cyberpunk styling
   */
  info(message: string, details?: string): void {
    const icon = '◉';
    const iconColored = this.colors.info.bold(icon);
    const messageColored = this.colors.info.bold(message);
    const detailsStr = details ? this.colors.static(` ─ ${details}`) : '';

    this.log(`${this.timestamp()}${iconColored} ${messageColored}${detailsStr}`);
  }

  /**
   * Display progress with streaming effect
   */
  progress(message: string, details?: string): void {
    if (!this.opts.verbose) return;

    const icon = this.opts.animations ? '⚡' : '◇';
    const iconColored = this.colors.primary.bold(icon);
    const messageColored = this.colors.primary(message);
    const detailsStr = details ? this.colors.static(` ─ ${details}`) : '';

    this.log(`${this.timestamp()}${iconColored} ${messageColored}${detailsStr}`);
  }

  /**
   * Create animated cyberpunk spinner
   */
  spinner(text: string): CyberpunkSpinner {
    if (this.opts.silent) {
      return {
        update: () => { },
        stop: () => { },
        success: () => { },
        error: () => { }
      };
    }

    const frames = this.opts.animations
      ? ['⚡', '◆', '◇', '⚙', '▶', '●', '◉', '▲']
      : ['/', '-', '\\', '|'];

    let frame = 0;
    let currentText = text;

    const clearLine = () => process.stdout.write('\r' + ' '.repeat(100) + '\r');

    const interval = setInterval(() => {
      clearLine();
      const frameChar = frames[frame % frames.length];
      const iconColored = this.colors.primary.bold(frameChar);
      const textColored = this.colors.text(currentText);

      // Add occasional glitch
      const glitched = this.opts.glitch && Math.random() < 0.1
        ? this.addGlitch(`${iconColored} ${textColored}`)
        : `${iconColored} ${textColored}`;

      process.stdout.write(glitched);
      frame++;
    }, this.opts.animations ? 120 : 200);

    const spinnerHandle: CyberpunkSpinner = {
      update: (newText: string) => {
        currentText = newText;
      },
      stop: () => {
        clearInterval(interval);
        clearLine();
      },
      success: (message = currentText) => {
        clearInterval(interval);
        clearLine();
        this.success(message);
      },
      error: (message = currentText) => {
        clearInterval(interval);
        clearLine();
        this.error(message);
      }
    };

    this.activeSpinners.set(interval, spinnerHandle);
    return spinnerHandle;
  }

  /**
   * Create cyberpunk progress bar with energy effects
   */
  progressBar(total: number): CyberpunkProgress {
    if (this.opts.silent) {
      return { update: () => { }, complete: () => { }, error: () => { } };
    }

    let current = 0;
    const width = 40;

    const updateDisplay = (value: number, isError = false) => {
      const percentage = Math.min(100, Math.round((value / total) * 100));
      const filled = Math.round((value / total) * width);
      const empty = width - filled;

      // Create energy bar effect
      const energyBar = this.opts.animations
        ? '█'.repeat(filled)
        : '='.repeat(filled);

      const emptyBar = this.opts.animations
        ? '░'.repeat(empty)
        : ' '.repeat(empty);

      const barFilled = isError
        ? this.colors.error(energyBar)
        : this.colors.success(energyBar);

      const barEmpty = this.colors.static(emptyBar);
      const percentageText = isError
        ? this.colors.error(`${percentage.toString().padStart(3)}%`)
        : this.colors.primary(`${percentage.toString().padStart(3)}%`);

      const border = this.colors.grid(`[${barFilled}${barEmpty}]`);
      process.stdout.write(`\r${border} ${percentageText}`);
    };

    return {
      update: (value: number) => {
        current = Math.min(value, total);
        updateDisplay(current);
      },
      complete: () => {
        updateDisplay(total);
        process.stdout.write('\n');
      },
      error: () => {
        updateDisplay(current, true);
        process.stdout.write('\n');
      }
    };
  }

  /**
   * Display branded cyberpunk header
   */
  header(title: string, subtitle?: string): void {
    if (this.opts.silent) return;

    const padding = 4;
    const totalWidth = title.length + (padding * 2);

    console.log();
    console.log(this.cyberpunkBorder(totalWidth + 6, 'double'));

    // Top section with empty corners
    console.log(this.colors.primary(`║${' '.repeat(totalWidth + 4)}║`));

    // Title line
    const titleLine = `║  ${this.colors.accent.bold(title)}${' '.repeat(totalWidth - title.length)}  ║`;
    console.log(titleLine);

    if (subtitle) {
      const subtitlePadding = Math.max(0, totalWidth - subtitle.length);
      console.log(this.colors.primary(`║  ${this.colors.static(subtitle)}${' '.repeat(subtitlePadding)}  ║`));
      console.log(this.colors.primary(`║${' '.repeat(totalWidth + 4)}║`));
    }

    // Bottom with cyberpunk tag
    const tag = subtitle ? 'CODEBLOCKS AI' : 'CYBERPUNK CLI';
    console.log(this.colors.primary(`║${' '.repeat(totalWidth + 4 - tag.length)}${this.colors.info(tag)}  ║`));
    console.log(this.cyberpunkBorder(totalWidth + 6, 'double'));
    console.log();
  }

  /**
   * Display cyberpunk separator with pattern
   */
  separator(pattern: string = '═', length: number = 60): void {
    if (this.opts.silent) return;

    let line = pattern.repeat(Math.ceil(length / pattern.length)).slice(0, length);

    // Add cyberpunk coloring
    if (pattern === '═' || pattern === '-') {
      line = this.colors.primary(line);
    } else if (pattern === '─') {
      line = this.colors.grid(line);
    }

    console.log(line);
  }

  /**
   * Display blank line
   */
  newLine(): void {
    if (this.opts.silent) return;
    console.log();
  }

  /**
   * Custom cyberpunk logger
   */
  logger: {
    log: (message: string) => void;
    error: (message: string) => void;
  } = {
      log: (message: string) => this.log(message, 'log'),
      error: (message: string) => this.log(message, 'error'),
    };

  /**
   * Get colored text (for console.log usage)
   */
  primary(text: string): string {
    return this.colors.primary(text);
  }

  accent(text: string): string {
    return this.colors.accent(text);
  }

  text(text: string): string {
    return this.colors.text(text);
  }

  grid(text: string): string {
    return this.colors.grid(text);
  }

  /**
   * Display file tree with cyberpunk icons
   */
  fileTree(items: Array<{
    name: string;
    type: 'file' | 'directory';
    status?: 'created' | 'updated' | 'deleted';
    size?: string;
  }>, title?: string): void {
    if (this.opts.silent) return;

    if (title) {
      console.log(this.colors.secondary.bold(`◈ ${title}`));
      this.separator('─', title.length + 4);
    }

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = isLast ? '└─' : '├─';

      let icon = '';
      let color = this.colors.text;

      if (item.type === 'directory') {
        icon = '📁';
        color = this.colors.primary;
      } else {
        icon = '📄';
        color = this.colors.text;
      }

      let statusIcon = '';
      if (item.status === 'created') {
        statusIcon = this.colors.success(' +');
      } else if (item.status === 'updated') {
        statusIcon = this.colors.warning(' ●');
      } else if (item.status === 'deleted') {
        statusIcon = this.colors.error(' -');
      }

      const size = item.size ? this.colors.static(` (${item.size})`) : '';
      const name = color(item.name);
      const prefixColored = this.colors.grid(prefix);

      console.log(`${prefixColored} ${icon} ${name}${statusIcon}${size}`);
    });
    console.log();
  }

  /**
   * Display terminal art splash screen
   */
  splash(): void {
    if (this.opts.silent) return;

    const art = `
           ${this.colors.accent('╦═╗╔═╗╔╦╗╔═╗╦  ╔╗╔╔═╗╔╦╗╔═╗╦═╗╔═╗')}
          ${this.colors.primary('╠╦╝║╣  ║ ║╣ ║  ║║║║╣  ║ ║╣ ╠╦╝╚═╗')}
          ${this.colors.success('╩╚═╚═╝ ╩ ╚═╝╩═╝╝╚╝╚═╝ ╩ ╚═╝╩╚═╚═╝')}

          ${this.colors.info.bold('    ⚡ CODEBLOCKS AI ⚡    ')}

          ${this.colors.grid('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
          ${this.colors.text('    MODERN CLI FOR AI-POWERED')}
          ${this.colors.text('    CODEBLOCKS AI - CODE GENERATION & AUTOMATION')}
          ${this.colors.grid('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
          `;

    console.log(art);
    console.log();
  }

  /**
   * Display command completion with effects
   */
  commandComplete(command: string, duration: number): void {
    if (this.opts.silent) return;

    const seconds = (duration / 1000).toFixed(2);
    const cmdColored = this.colors.info.bold(command);
    const timeColored = this.info(`${seconds}s`);

    console.log();
    console.log(this.success(`◆ COMMAND COMPLETE: ${cmdColored} [${timeColored}]`));

    if (this.opts.animations) {
      // Add completion effect
      setTimeout(() => {
        console.log(this.grid('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      }, 100);
    }

    console.log();
  }

  /**
   * Clean up all active animations
   */
  cleanup(): void {
    this.activeSpinners.forEach((spinner, interval) => {
      clearInterval(interval);
      spinner.stop();
    });
    this.activeSpinners.clear();
  }
}

/**
 * Global cyberpunk output instance with default color scheme
 */
export const cyberOutput = new CyberpunkOutput({
  colors: true,
  verbose: false,
  timestamps: false,
  silent: false,
  glitch: true,
  neon: true,
  animations: true,
});

/**
 * Create custom cyberpunk output instance
 */
export function createCyberOutput(options: CyberpunkOptions = {}): CyberpunkOutput {
  return new CyberpunkOutput(options);
}

/**
 * Create cyberpunk output with specific color scheme
 */
export function createCyberOutputWithColors(colorScheme: CyberpunkColorScheme, options: Omit<CyberpunkOptions, 'colorScheme'> = {}): CyberpunkOutput {
  return new CyberpunkOutput({
    ...options,
    colorScheme,
  });
}

/**
 * Legacy compatibility exports
 */
export const output = cyberOutput;
export type OutputOptions = CyberpunkOptions;
export type SpinnerHandle = CyberpunkSpinner;
export type ProgressHandle = CyberpunkProgress;

// Legacy export for backwards compatibility
export const ChalkOutput = CyberpunkOutput;
export type { CyberpunkOptions as ChalkOutputOptions };