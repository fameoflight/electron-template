#!/usr/bin/env node
/**
 * Cyberpunk CLI - Enhanced Command System
 *
 * A futuristic CLI experience with cyberpunk aesthetics:
 * - Neon colors and electric effects
 * - Terminal art and splash screen
 * - Branded visual elements
 * - Immersive developer experience
 *
 * Usage:
 *   yarn cli <command> [options]     # Generator commands
 *   yarn utils <command> [options]   # Utility commands (backward compatibility)
 *   yarn g <command> [options]       # Generator alias (backward compatibility)
 */

import { Command } from 'commander';
import { registerCommands } from './utils/CommandRegistry.js';
import { cyberOutput } from './utils/output.js';

// Set CLI environment variable to disable SmartLoadingSubscriber in all CLI commands
process.env.CLI = 'true';

// Main program for unified cyberpunk CLI
const program = new Command();

program
  .name('codeblocks')
  .description('Cyberpunk Development CLI for CodeBlocks AI')
  .version('1.0.0');

// ==================== Cyberpunk Enhancement ====================

// Override help output with cyberpunk styling
const originalHelp = program.outputHelp.bind(program);
program.outputHelp = function() {
  cyberOutput.splash();

  cyberOutput.info('🌟 CYBERPUNK DEVELOPMENT TOOLS');
  cyberOutput.separator('═', 50);

  cyberOutput.success('📦 Generators: Create code and scaffolding');
  cyberOutput.info('⚡ Utils: Development utilities and tools');
  cyberOutput.newLine();

  cyberOutput.info('Available Commands:');
  cyberOutput.newLine();

  // List generator commands
  cyberOutput.logger.log(cyberOutput.accent('  🔧 GENERATOR COMMANDS:'));
  cyberOutput.logger.log(cyberOutput.text('    yarn generate entity <name>     Create TypeORM entity'));
  cyberOutput.logger.log(cyberOutput.text('    yarn g entity <name>           Alias for entity generator'));
  cyberOutput.logger.log(cyberOutput.text('    yarn generate list             Show all generators'));
  cyberOutput.newLine();

  // List utility commands
  cyberOutput.logger.log(cyberOutput.accent('  ⚡ UTILITY COMMANDS:'));
  cyberOutput.logger.log(cyberOutput.text('    yarn utils dev                 Start development'));
  cyberOutput.logger.log(cyberOutput.text('    yarn utils clean               Clean build artifacts'));
  cyberOutput.logger.log(cyberOutput.text('    yarn utils seed                 Seed database'));
  cyberOutput.logger.log(cyberOutput.text('    yarn utils schema               Generate GraphQL schema'));
  cyberOutput.logger.log(cyberOutput.text('    yarn utils list                 Show all utilities'));
  cyberOutput.newLine();

  cyberOutput.separator('═', 50);
  cyberOutput.info('  Use "yarn generate <command> --help" for details');
  cyberOutput.info('  Use "yarn utils <command> --help" for details');
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
    const command = originalArgs[2] || 'unknown';
    cyberOutput.commandComplete(command, duration);
  });
}

// Export program for use in other entry points
export { program };