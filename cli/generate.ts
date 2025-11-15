#!/usr/bin/env node
/**
 * Generate CLI - Backward compatible entry point for code generation
 *
 * Refactored to use unified CLI system
 * Maintains backward compatibility with existing scripts
 *
 * Usage:
 *   yarn generate <command> [options]
 *   yarn g <command> [options]
 */

import { program } from './cli.ts';

// Configure for generator commands
program
  .name('generate')
  .alias('g')
  .description('Rails-like code generator for Electron framework');

// Parse and execute
program.parse(process.argv);