#!/usr/bin/env node
/**
 * Utils CLI - Development utilities for the Electron template
 *
 * This is the main entry point for all CLI utilities.
 * Commands are organized into separate modules for better maintainability.
 *
 * Usage:
 *   yarn utils <command> [options]
 *   yarn utils list  # Show all available commands
 */
import { Command } from 'commander';

// Set CLI environment variable to disable SmartLoadingSubscriber in all CLI commands
process.env.CLI = 'true';

const program = new Command();

program
  .name('utils')
  .description('Development utilities for Electron template')
  .version('1.0.0');

// ==================== Development Commands ====================

/**
 * Clean Command - Clean build artifacts and generated files
 */
program
  .command('clean')
  .description('Clean build artifacts, data files, and generated files')
  .option('-d, --data', 'Remove .data directory', true)
  .option('--no-data', 'Do not remove .data directory')
  .option('-n, --node-modules', 'Remove .node_modules directory', false)
  .option('--no-node-modules', 'Do not remove .node_modules directory')
  .option('-j, --js', 'Remove compiled .js files in main and ui', true)
  .option('--no-js', 'Do not remove compiled .js files')
  .option('-c, --cache', 'Remove cache directories', true)
  .option('--no-cache', 'Do not remove cache directories')
  .option('-b, --build', 'Remove build artifacts', true)
  .option('--no-build', 'Do not remove build artifacts')
  .option('-m, --maps', 'Remove source map files', true)
  .option('--no-maps', 'Do not remove source map files')
  .option('-l, --logs', 'Remove log files', true)
  .option('--no-logs', 'Do not remove log files')
  .option('-g, --generated', 'Remove generated files and __generated__ directories', true)
  .option('--no-generated', 'Do not remove generated files')
  .option('--dry-run', 'Show what would be removed without deleting', false)
  .action(async (options) => {
    const { CleanCommand } = await import('./commands/CleanCommand.js');
    const command = new CleanCommand();
    await command.execute(options);
  });

/**
 * Schema Command - Generate GraphQL schema
 */
program
  .command('schema')
  .description('Generate GraphQL schema from entities and resolvers')
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .option('-f, --force', 'Force regeneration of existing entities', false)
  .action(async (options) => {
    const { SchemaCommand } = await import('./commands/SchemaCommand.js');
    const command = new SchemaCommand();
    await command.execute(options);
  });

/**
 * Build Command - Production build
 */
program
  .command('build')
  .description('Build production application with notarization support')
  .option('--platform <platform>', 'Target platform: mac, win, linux, all', 'mac')
  .option('--target <targets...>', 'Build targets (e.g., dmg, zip, exe)')
  .option('--no-hardened', 'Skip hardened runtime for macOS')
  .option('--no-notarize', 'Skip notarization even if configured')
  .option('--skip-code-gen', 'Skip GraphQL and Relay code generation')
  .option('--config <path>', 'Path to build configuration file')
  .action(async (options) => {
    const { BuildCommand } = await import('./commands/BuildCommand.js');
    const command = new BuildCommand();
    await command.execute(options);
  });


/**
 * Console Command - Interactive REPL
 */
program
  .command('console')
  .description('Start interactive REPL with full application context')
  .option('--no-history', 'Disable command history persistence', false)
  .option('--no-services', 'Skip loading application services', false)
  .action(async (options) => {
    const { ConsoleManager } = await import('./commands/console/ConsoleManager.js');
    const consoleManager = new ConsoleManager();
    await consoleManager.start();
  });

// ==================== Database Commands ====================

/**
 * Seed Command - Seed database with test data
 */
program
  .command('seed')
  .description('Seed database with test data')
  .option('--synchronize', 'Drop and recreate tables before seeding (bypasses migrations)', false)
  .option('--no-synchronize', 'Do not synchronize database schema')
  .action(async (options) => {
    const { SeedCommand } = await import('./commands/SeedCommand.js');
    const command = new SeedCommand();
    await command.execute(options);
  });

/**
 * DB Stats Command - Show database statistics
 */
program
  .command('db:stats')
  .description('Show database statistics (table counts, sizes)')
  .action(async () => {
    const { dbStatsCommand } = await import('./commands/DatabaseCommands.js');
    await dbStatsCommand();
  });

/**
 * DB Inspect Command - Inspect entity schema
 */
program
  .command('db:inspect [entity]')
  .description('Inspect database entity schema')
  .action(async (entityName?: string) => {
    const { dbInspectCommand } = await import('./commands/DatabaseCommands.js');
    await dbInspectCommand(entityName);
  });

/**
 * DB Snapshot Command - Create database backup
 */
program
  .command('db:snapshot')
  .description('Create a backup snapshot of the current database')
  .option('-n, --name <name>', 'Custom snapshot name')
  .action(async (options) => {
    const { dbSnapshotCommand } = await import('./commands/DatabaseCommands.js');
    await dbSnapshotCommand(options);
  });

/**
 * DB Restore Snapshot Command - Restore from backup
 */
program
  .command('db:restore-snapshot')
  .description('Restore database from most recent snapshot')
  .option('-n, --name <name>', 'Specific snapshot name to restore')
  .action(async (options) => {
    const { dbRestoreSnapshotCommand } = await import('./commands/DatabaseCommands.js');
    await dbRestoreSnapshotCommand(options);
  });

/**
 * Migration Generate Command - Generate migration files from schema changes
 */
program
  .command('migration:generate [name]')
  .description('Generate migration files from schema changes (per-table migrations)')
  .option('--dry-run', 'Show what migrations would be generated without creating files', false)
  .action(async (name?: string, options?: any) => {
    const { migrationGenerateCommand } = await import('./commands/MigrationGenerateCommand.js');
    await migrationGenerateCommand({ name, dryRun: options?.dryRun });
  });

/**
 * Migration Show Command - Show pending migrations
 */
program
  .command('migration:show')
  .description('Show pending migrations without running them (dry-run preview)')
  .action(async () => {
    const { showPendingMigrations } = await import('../main/db/dataSource.js');
    await showPendingMigrations();
  });

/**
 * Migration Run Command - Apply pending migrations with backup
 */
program
  .command('migration:run')
  .description('Run pending migrations with automatic backup and rollback safety')
  .action(async () => {
    const { runMigrationsSafe } = await import('../main/db/dataSource.js');
    await runMigrationsSafe();
  });

/**
 * Migration Revert Command - Revert last migration
 */
program
  .command('migration:revert')
  .description('Revert the last applied migration with backup')
  .action(async () => {
    const { revertMigrationSafe } = await import('./commands/MigrationGenerateCommand.js');
    await revertMigrationSafe();
  });

/**
 * Schema Dump Command - Generate schema.sql file (similar to Rails db/schema.rb)
 */
program
  .command('schema:dump')
  .description('Generate schema.sql file with current database structure')
  .option('-o, --output <path>', 'Output file path', 'schema.sql')
  .action(async (options) => {
    const { generateSchemaSql } = await import('../main/db/utils/migrations.js');
    const { initializeDatabase } = await import('../main/db/dataSource.js');

    try {
      console.log('🔍 Analyzing database schema...');
      const dataSource = await initializeDatabase();
      await generateSchemaSql(dataSource, options.output);
      console.log('✅ Schema dumped successfully');
    } catch (error) {
      console.error('❌ Schema dump failed:', error);
      process.exit(1);
    }
  });

/**
 * Database Status Command - Show current database settings and performance info
 */
program
  .command('db:status')
  .description('Show current database settings and performance information')
  .action(async () => {
    const { initializeDatabase, getDatabaseSettings } = await import('../main/db/dataSource.js');

    try {
      console.log('📊 Getting database status...');
      const dataSource = await initializeDatabase();
      await getDatabaseSettings(dataSource);
    } catch (error) {
      console.error('❌ Failed to get database status:', error);
      process.exit(1);
    }
  });

// ==================== Information Commands ====================

/**
 * Info Command - Show project information
 */
program
  .command('info')
  .description('Show project health and statistics')
  .action(async () => {
    const { projectInfoCommand } = await import('./commands/InfoCommands.js');
    await projectInfoCommand();
  });

/**
 * Routes Command - List all application routes
 */
program
  .command('routes')
  .description('List all GraphQL resolvers and IPC handlers')
  .action(async () => {
    const { routesCommand } = await import('./commands/InfoCommands.js');
    await routesCommand();
  });

/**
 * List Command - Show all available utilities
 */
program
  .command('list')
  .description('List all available utilities')
  .action(async () => {
    const { listCommand } = await import('./commands/InfoCommands.js');
    listCommand();
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
