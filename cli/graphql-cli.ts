#!/usr/bin/env node
/**
 * GraphQL CLI - Generate GraphQL schema, entities, and compile Relay
 *
 * This is the main entry point for GraphQL-related operations.
 * Combines entity generation, schema generation, and Relay compilation.
 *
 * Usage:
 *   yarn graphql [--force]     # Generate schema + entities + compile Relay
 *   yarn graphql --watch       # Watch mode for development
 */

import { Command } from 'commander';
import { runGraphQLCommand } from './utils/GraphQLRunner.js';

// Set CLI environment variable to disable SmartLoadingSubscriber
process.env.CLI = 'true';

const program = new Command();

program
  .name('graphql')
  .description('Generate GraphQL schema, entities, and compile Relay')
  .version('1.0.0');

/**
 * Main GraphQL command with force support
 */
program
  .command('generate')
  .description('Generate GraphQL schema, entities, and compile Relay')
  .option('-f, --force', 'Force regeneration of existing entities (with confirmation)', false)
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .option('--no-relay', 'Skip Relay compilation', false)
  .action(async (options) => {
    await runGraphQLCommand(options);
  });

/**
 * Default action - treat as generate command
 */
program
  .option('-f, --force', 'Force regeneration of existing entities (with confirmation)', false)
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .option('--no-relay', 'Skip Relay compilation', false)
  .action(async (options) => {
    await runGraphQLCommand(options);
  });

// Parse command line arguments
program.parse(process.argv);