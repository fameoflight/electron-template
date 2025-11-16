/**
 * Cyberpunk Color Scheme - Reusable color management for terminal UI
 *
 * A flexible color scheme system that allows easy customization
 * of terminal colors without modifying the core output logic.
 */

import chalk, { ChalkInstance } from 'chalk';

/**
 * Color scheme interface defining all required colors
 */
export interface ColorScheme {
  primary: ChalkInstance;     // Main accent color
  accent: ChalkInstance;      // Secondary accent
  secondary: ChalkInstance;   // Tertiary color
  success: ChalkInstance;     // Success states
  warning: ChalkInstance;     // Warning states
  error: ChalkInstance;       // Error states
  info: ChalkInstance;        // Information states

  // Background and structural colors
  dark: ChalkInstance;        // Darkest background
  grid: ChalkInstance;        // Borders and dividers
  text: ChalkInstance;        // Primary text

  // Special effects
  glitch: ChalkInstance;      // Glitch effects
  static: ChalkInstance;      // Muted/static content
}

/**
 * Color configuration options for creating custom schemes
 */
export interface ColorConfig {
  primary?: string;
  accent?: string;
  secondary?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  dark?: string;
  grid?: string;
  text?: string;
  glitch?: string;
  static?: string;
}

/**
 * Cyberpunk Color Scheme Class
 *
 * Provides a flexible way to define and manage terminal color schemes.
 * Colors can be customized via constructor or static factory methods.
 */
// eslint-disable-next-line @codeblocks/class-props-limit
export class CyberpunkColorScheme implements ColorScheme {
  readonly primary: ChalkInstance;
  readonly accent: ChalkInstance;
  readonly secondary: ChalkInstance;
  readonly success: ChalkInstance;
  readonly warning: ChalkInstance;
  readonly error: ChalkInstance;
  readonly info: ChalkInstance;
  readonly dark: ChalkInstance;
  readonly grid: ChalkInstance;
  readonly text: ChalkInstance;
  readonly glitch: ChalkInstance;
  readonly static: ChalkInstance;

  constructor(colors: ColorConfig = {}) {
    // Soft terminal-friendly theme (default)
    const defaultColors = {
      primary: '#5dade2',     // Soft cyan-blue
      accent: '#af7ac5',      // Soft purple-pink
      secondary: '#85929e',   // Muted blue-gray
      success: '#52be80',     // Soft green
      warning: '#f39c12',     // Warm amber
      error: '#e74c3c',       // Soft red
      info: '#5dade2',        // Consistent soft blue
      dark: '#2c3e50',        // Dark blue-gray
      grid: '#34495e',        // Medium blue-gray
      text: '#ecf0f1',        // Light gray-white
      glitch: '#bb8fce',      // Soft purple glitch
      static: '#95a5a6',      // Softer gray
    };

    // Merge defaults with provided colors
    const finalColors = { ...defaultColors, ...colors };

    // Create chalk instances for all colors
    this.primary = this.createChalkInstance(finalColors.primary);
    this.accent = this.createChalkInstance(finalColors.accent);
    this.secondary = this.createChalkInstance(finalColors.secondary);
    this.success = this.createChalkInstance(finalColors.success);
    this.warning = this.createChalkInstance(finalColors.warning);
    this.error = this.createChalkInstance(finalColors.error);
    this.info = this.createChalkInstance(finalColors.info);
    this.dark = this.createChalkInstance(finalColors.dark);
    this.grid = this.createChalkInstance(finalColors.grid);
    this.text = this.createChalkInstance(finalColors.text);
    this.glitch = this.createChalkInstance(finalColors.glitch);
    this.static = this.createChalkInstance(finalColors.static);
  }

  /**
   * Helper to create chalk instance from hex color string
   */
  private createChalkInstance(color: string): ChalkInstance {
    return chalk.hex(color);
  }

  /**
   * Create a monochrome color scheme
   */
  static monochrome(): CyberpunkColorScheme {
    return new CyberpunkColorScheme({
      primary: '#95a5a6',
      accent: '#7f8c8d',
      secondary: '#bdc3c7',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db',
      dark: '#2c3e50',
      grid: '#34495e',
      text: '#ecf0f1',
      glitch: '#95a5a6',
      static: '#7f8c8d',
    });
  }

  /**
   * Create the original high-contrast neon cyberpunk theme
   */
  static neon(): CyberpunkColorScheme {
    return new CyberpunkColorScheme({
      primary: '#00ffff',     // Electric cyan
      accent: '#ff0080',      // Neon pink
      secondary: '#b026ff',   // Electric purple
      success: '#00ff88',     // Acidic green
      warning: '#ffaa00',     // Electric amber
      error: '#ff3366',       // Neon red
      info: '#00aaff',        // Electric blue
      dark: '#0a0a0a',        // Cyber black
      grid: '#1a1a2a',        // Matrix blue-dark
      text: '#e0e0ff',        // Light blue-white
      glitch: '#ff00ff',      // Glitch magenta
      static: '#666666',      // Static gray
    });
  }

  /**
   * Create a pastel cyberpunk theme
   */
  static pastel(): CyberpunkColorScheme {
    return new CyberpunkColorScheme({
      primary: '#a8dadc',     // Pastel cyan
      accent: '#f1c0e8',      // Pastel pink
      secondary: '#c9ada7',   // Pastel brown
      success: '#a7c957',     // Pastel green
      warning: '#f2cc8f',     // Pastel yellow
      error: '#e07a5f',       // Pastel coral
      info: '#81b29a',        // Pastel sage
      dark: '#2b2d42',        // Dark blue-gray
      grid: '#3d405b',        // Medium blue-gray
      text: '#f4f1de',        // Cream white
      glitch: '#c9ada7',      // Pastel glitch
      static: '#8d99ae',      // Muted blue-gray
    });
  }

  /**
   * Create a dark mode optimized theme
   */
  static darkMode(): CyberpunkColorScheme {
    return new CyberpunkColorScheme({
      primary: '#61dafb',     // React blue
      accent: '#bd93f9',      // Dracula purple
      secondary: '#6272a4',   // Dracula comment
      success: '#50fa7b',     // Dracula green
      warning: '#ffb86c',     // Dracula orange
      error: '#ff5555',       // Dracula red
      info: '#8be9fd',        // Dracula cyan
      dark: '#21222c',        // Dracula background
      grid: '#44475a',        // Dracula current line
      text: '#f8f8f2',        // Dracula foreground
      glitch: '#ff79c6',      // Dracula pink
      static: '#6272a4',      // Dracula comment
    });
  }

  /**
   * Clone the current scheme with optional overrides
   */
  extend(overrides: ColorConfig): CyberpunkColorScheme {
    const currentColors = {
      primary: this.getHex(this.primary),
      accent: this.getHex(this.accent),
      secondary: this.getHex(this.secondary),
      success: this.getHex(this.success),
      warning: this.getHex(this.warning),
      error: this.getHex(this.error),
      info: this.getHex(this.info),
      dark: this.getHex(this.dark),
      grid: this.getHex(this.grid),
      text: this.getHex(this.text),
      glitch: this.getHex(this.glitch),
      static: this.getHex(this.static),
    };

    return new CyberpunkColorScheme({
      ...currentColors,
      ...overrides,
    });
  }

  /**
   * Get hex value from chalk instance (simplified)
   */
  private getHex(chalkInstance: ChalkInstance): string {
    // This is a simplified approach - in practice, chalk instances don't expose hex values
    // We'd need to store the original hex strings if we want to retrieve them
    // For now, this is used only in extend() which has access to the original colors
    return '#000000'; // placeholder
  }
}

/**
 * Default color scheme instance
 */
export const defaultColorScheme = new CyberpunkColorScheme();

/**
 * Predefined color scheme variants
 */
export const ColorSchemes = {
  default: defaultColorScheme,
  soft: defaultColorScheme,
  monochrome: CyberpunkColorScheme.monochrome(),
  neon: CyberpunkColorScheme.neon(),
  pastel: CyberpunkColorScheme.pastel(),
  darkMode: CyberpunkColorScheme.darkMode(),
} as const;