#!/usr/bin/env node
/**
 * Cyberpunk Utils CLI - Enhanced Development Utilities
 *
 * A futuristic CLI experience with cyberpunk aesthetics for development utilities:
 * - Neon colors and electric effects
 * - Terminal art and splash screen
 * - Branded visual elements
 * - Immersive developer experience
 *
 * Usage:
 *   yarn utils <command> [options]
 *   yarn utils list  # Show all available commands
 */
import { Command } from 'commander';
import { registerCommands } from './utils/CommandRegistry.js';
import { cyberOutput } from './utils/output.js';

// Set CLI environment variable to disable SmartLoadingSubscriber in all CLI commands
process.env.CLI = 'true';

const program = new Command();

program
  .name('utils')
  .description('Cyberpunk Development Utilities for CodeBlocks AI')
  .version('1.0.0');

// ==================== Cyberpunk Enhancement ====================

// Override help output with cyberpunk styling
const originalHelp = program.outputHelp.bind(program);
program.outputHelp = function() {
  cyberOutput.splash();

  cyberOutput.header('CYBERPUNK UTILITIES', 'Development tools for the future');

  cyberOutput.logger.log(cyberOutput.accent('⚡ AVAILABLE UTILITIES:'));
  cyberOutput.newLine();

  cyberOutput.logger.log(cyberOutput.successText('  dev         ') + cyberOutput.text('Start full development environment'));
  cyberOutput.logger.log(cyberOutput.successText('  clean       ') + cyberOutput.text('Clean build artifacts and cache'));
  cyberOutput.logger.log(cyberOutput.successText('  seed        ') + cyberOutput.text('Seed database with test data'));
  cyberOutput.logger.log(cyberOutput.successText('  schema      ') + cyberOutput.text('Generate GraphQL schema'));
  cyberOutput.logger.log(cyberOutput.successText('  build       ') + cyberOutput.text('Build production assets'));
  cyberOutput.logger.log(cyberOutput.successText('  test        ') + cyberOutput.text('Run test suite'));
  cyberOutput.newLine();

  cyberOutput.logger.log(cyberOutput.infoText('🔧 OPTIONS:'));
  cyberOutput.logger.log(cyberOutput.text('  --help      Show command help'));
  cyberOutput.logger.log(cyberOutput.text('  --version   Show version'));
  cyberOutput.newLine();

  cyberOutput.separator('═', 50);
  cyberOutput.logger.log(cyberOutput.grid('  Example: yarn utils dev --no-relay'));
  cyberOutput.logger.log(cyberOutput.grid('  Example: yarn utils clean --dry-run'));
  cyberOutput.newLine();
};

// ==================== Command Registration ====================

/**
 * Register all commands using CommandRegistry
 * Enhanced with cyberpunk branding and styling
 */
registerCommands(program);

// ==================== Enhanced Execution ====================

const startTime = Date.now();

// Parse command line arguments
program.parse(process.argv);

// Show cyberpunk help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Track command completion for timing
const originalArgs = process.argv.slice();
if (originalArgs.length > 2) {
  process.on('exit', () => {
    const duration = Date.now() - startTime;
    const command = `utils:${originalArgs[2]}` || 'utils:unknown';
    cyberOutput.commandComplete(command, duration);
  });
}