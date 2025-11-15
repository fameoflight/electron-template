#!/usr/bin/env node
/**
 * Unified CLI Entry Point - Single entry for all CLI commands
 *
 * Following refactor.md principles:
 * - Single source of truth for command definitions
 * - Eliminates duplicate entry points (cli/index.ts + cli/utils-cli.ts)
 * - Consistent error handling and option parsing
 * - DRY command registration using CommandRegistry
 *
 * This replaces both cli/index.ts and cli/utils-cli.ts
 *
 * Usage:
 *   yarn cli <command> [options]     # Generator commands
 *   yarn utils <command> [options]   # Utility commands (backward compatibility)
 *   yarn g <command> [options]       # Generator alias (backward compatibility)
 */

import { Command } from 'commander';
import { registerCommands } from './utils/CommandRegistry.js';

// Set CLI environment variable to disable SmartLoadingSubscriber in all CLI commands
process.env.CLI = 'true';

// Main program for unified CLI
const program = new Command();

program
  .name('cli')
  .description('Unified CLI for Electron template - code generation and utilities')
  .version('1.0.0');

// Register all commands using CommandRegistry
// This provides single source of truth for all commands
registerCommands(program);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export program for use in other entry points
export { program };