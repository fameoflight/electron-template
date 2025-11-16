#!/usr/bin/env node
/**
 * CLI Index - Backward compatible entry point
 *
 * Refactored to use unified CLI system while maintaining compatibility
 * This maintains the original cli/index.ts behavior
 */

import { program } from './cli.ts';

// Configure for original CLI behavior
program
  .name('generate')
  .alias('g')
  .description('Rails-like code generator for Electron framework');

// Parse and execute
program.parse(process.argv);
