#!/usr/bin/env node
/**
 * Utils CLI - Development utilities for the Electron template
 *
 * Refactored to use CommandRegistry for DRY command registration
 * Following refactor.md principles:
 * - Single source of truth for command definitions
 * - Eliminates duplicate registration patterns
 * - Consistent error handling
 *
 * Usage:
 *   yarn utils <command> [options]
 *   yarn utils list  # Show all available commands
 */
import { Command } from 'commander';
import { registerCommands } from './utils/CommandRegistry.js';

// Set CLI environment variable to disable SmartLoadingSubscriber in all CLI commands
process.env.CLI = 'true';

const program = new Command();

program
  .name('utils')
  .description('Development utilities for Electron template')
  .version('1.0.0');

// ==================== Command Registration ====================

/**
 * Register all commands using CommandRegistry
 * Following refactor.md DRY principle - single source of truth
 * This replaces 250+ lines of manual command registration
 */
registerCommands(program);

// ==================== Execution ====================

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}