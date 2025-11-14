#!/usr/bin/env node
/**
 * CLI Entry Point
 * Rails-like code generator for the Electron template
 *
 * Usage:
 *   yarn generate entity Post title:string content:text
 *   yarn g resolver Post
 *   yarn g job ProcessVideo
 */
import { Command } from 'commander';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('generate')
  .alias('g')
  .description('Rails-like code generator for Electron framework')
  .version('0.0.1');

/**
 * Job Generator Command
 * yarn g job ProcessVideo
 */
program
  .command('job <name>')
  .description('Generate a background job class')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--dry-run', 'Show what would be generated without creating files', false)
  .action(async (name: string, options) => {
    console.log('🏗️  Generating job...');
    console.log(`Name: ${name}`);
    console.log(`Options:`, options);

    // TODO: Implement JobGenerator
    console.log('\n⚠️  Job generator coming soon!');
  });

/**
 * Search Generator Command
 * yarn g search Post title content
 */
program
  .command('search <name> [attributes...]')
  .description('Generate FTS5 (Full-Text Search) migration for entity')
  .option('-f, --force', 'Overwrite existing migration', false)
  .option('--dry-run', 'Show what would be generated without creating files', false)
  .action(async (name: string, attributes: string[], options) => {
    const { SearchGenerator } = await import('./generators/SearchGenerator.js');

    const generator = new SearchGenerator({
      name,
      attributes,
      force: options.force,
      dryRun: options.dryRun,
    });

    await generator.run();
  });

/**
 * Icon Generator Command
 * yarn g icons ./assets/app-icon.svg ./build/icons
 */
program.addCommand((await import('./commands/iconCommand.js')).iconCommand);

/**
 * Entity JSON Generator Command
 * yarn entity:generate [name] [--force]
 * yarn g entity Post [--force]
 * yarn g entities [--force]
 */
const { registerEntityJsonCommand } = await import('./commands/EntityJsonCommand.js');
registerEntityJsonCommand(program);

/**
 * Schema Generator Command
 * yarn g schema [--force] [--watch]
 */
program
  .command('schema')
  .description('Generate GraphQL schema from entities')
  .option('-f, --force', 'Force regeneration of existing entities (with confirmation)', false)
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .action(async (options) => {
    const { SchemaCommand } = await import('./commands/SchemaCommand.js');
    const schemaCommand = new SchemaCommand();
    await schemaCommand.execute(options);
  });

/**
 * GraphQL Generator Command
 * yarn g graphql [--force] [--watch]
 */
program
  .command('graphql')
  .description('Generate GraphQL schema, entities, and compile Relay')
  .option('-f, --force', 'Force regeneration of existing entities (with confirmation)', false)
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .option('--no-relay', 'Skip Relay compilation', false)
  .action(async (options) => {
    const { runGraphQLCommand } = await import('./utils/GraphQLRunner.js');
    await runGraphQLCommand(options);
  });

/**
 * Migration Generator Command
 * yarn g migration
 */
program
  .command('migration')
  .description('Generate migrations from schema changes')
  .option('--dry-run', 'Show what migrations would be generated without creating files', false)
  .action(async (options) => {
    const { migrationGenerateCommand } = await import('./commands/MigrationGenerateCommand.js');
    await migrationGenerateCommand({ name: undefined, dryRun: options.dryRun });
  });

/**
 * SQL Schema Dump Command
 * yarn g sql
 */
program
  .command('sql')
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
 * List available generators
 */
program
  .command('list')
  .description('List all available generators')
  .action(() => {
    console.log('\n📋 Available Generators:\n');
    console.log('  schema [--force] [--watch]        Generate GraphQL schema from entities');
    console.log('  graphql [--force] [--watch]       Generate schema + entities + compile Relay');
    console.log('  migration [--dry-run]              Generate migrations from schema changes');
    console.log('  sql [-o <path>]                    Generate schema.sql file with database structure');
    console.log('  search <name> [attributes...]     Generate FTS5 search migration');
    console.log('  job <name>                         Generate background job');
    console.log('  icons <input-svg> [output-dir]     Convert SVG to app icons');
    console.log('\n💡 Entity Generation:');
    console.log('  yarn g schema [--force]            # Generate entities from JSON schemas');
    console.log('  yarn g schema --watch              # Watch for changes and regenerate schema');
    console.log('  yarn g graphql [--force]           # Generate schema + entities + compile Relay');
    console.log('  yarn g graphql --watch             # Watch mode: regenerate schema + Relay on changes');
    console.log('\n💡 Database & Schema:');
    console.log('  yarn g sql                         # Generate schema.sql file');
    console.log('  yarn g sql -o custom.sql           # Generate schema.sql to custom path');
    console.log('  yarn g migration                   # Generate migrations from schema changes');
    console.log('\n💡 Other Generators:');
    console.log('  yarn g search Post title content   # FTS5 search migration');
    console.log('  yarn g job ProcessVideo --force    # Generate background job');
    console.log('  yarn g icons ./assets/icon.svg     # Convert SVG to app icons');
    console.log('  yarn utils console                 # Start interactive console');
    console.log('');
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
