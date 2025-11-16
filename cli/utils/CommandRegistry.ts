/**
 * CommandRegistry - Single source of truth for command registration
 *
 * Following refactor.md principles:
 * - DRY - eliminates duplicate command registration patterns
 * - Single responsibility - centralizes command definitions
 * - Options object pattern - consistent parameter handling
 * - Small files with clear boundaries
 *
 * Usage:
 * import { registerCommands } from './utils/CommandRegistry.js';
 * await registerCommands(program);
 */

import { Command } from 'commander';

export interface CommandDefinition {
  name: string;
  description: string;
  options: Array<{
    flag: string;
    description: string;
    defaultValue?: any;
  }>;
  commandClass: string;
  action?: string; // Method name if not 'execute'
  category?: 'development' | 'database' | 'build' | 'utility' | 'generator';
}

/**
 * Command registry with single source of truth
 * Eliminates duplication between cli/index.ts and cli/utils-cli.ts
 */
export const commands: CommandDefinition[] = [
  // ==================== Development Commands ====================
  {
    name: 'clean',
    description: 'Clean build artifacts, data files, and generated files',
    options: [
      { flag: '-d, --data', description: 'Remove .data directory', defaultValue: true },
      { flag: '--no-data', description: 'Do not remove .data directory' },
      { flag: '-n, --node-modules', description: 'Remove .node_modules directory', defaultValue: false },
      { flag: '--no-node-modules', description: 'Do not remove .node_modules directory' },
      { flag: '-j, --js', description: 'Remove compiled .js files', defaultValue: true },
      { flag: '--no-js', description: 'Do not remove compiled .js files' },
      { flag: '-c, --cache', description: 'Remove cache directories', defaultValue: true },
      { flag: '--no-cache', description: 'Do not remove cache directories' },
      { flag: '-b, --build', description: 'Remove build artifacts', defaultValue: true },
      { flag: '--no-build', description: 'Do not remove build artifacts' },
      { flag: '-m, --maps', description: 'Remove source map files', defaultValue: true },
      { flag: '--no-maps', description: 'Do not remove source map files' },
      { flag: '-l, --logs', description: 'Remove log files', defaultValue: true },
      { flag: '--no-logs', description: 'Do not remove log files' },
      { flag: '-g, --generated', description: 'Remove generated files', defaultValue: true },
      { flag: '--no-generated', description: 'Do not remove generated files' },
      { flag: '--dry-run', description: 'Show what would be removed without deleting', defaultValue: false }
    ],
    commandClass: '../commands/CleanCommand.js',
    category: 'development'
  },

  {
    name: 'schema',
    description: 'Generate GraphQL schema from entities and resolvers',
    options: [
      { flag: '-w, --watch', description: 'Watch for changes and regenerate automatically', defaultValue: false },
      { flag: '-f, --force', description: 'Force regeneration of existing entities', defaultValue: false }
    ],
    commandClass: '../commands/SchemaCommand.js',
    category: 'development'
  },

  {
    name: 'build',
    description: 'Build production application with notarization support',
    options: [
      { flag: '--platform <platform>', description: 'Target platform: mac, win, linux, all', defaultValue: 'mac' },
      { flag: '--target <targets...>', description: 'Build targets (e.g., dmg, zip, exe)' },
      { flag: '--no-hardened', description: 'Skip hardened runtime for macOS', defaultValue: false },
      { flag: '--no-notarize', description: 'Skip notarization even if configured', defaultValue: false },
      { flag: '--skip-code-gen', description: 'Skip GraphQL and Relay code generation', defaultValue: false },
      { flag: '--config <path>', description: 'Path to build configuration file' }
    ],
    commandClass: '../commands/BuildCommand.js',
    category: 'build'
  },

  {
    name: 'console',
    description: 'Start interactive REPL with full application context',
    options: [
      { flag: '--no-history', description: 'Disable command history persistence', defaultValue: false },
      { flag: '--no-services', description: 'Skip loading application services', defaultValue: false }
    ],
    commandClass: '../commands/console/ConsoleManager.js',
    action: 'start',
    category: 'development'
  },

  // ==================== Database Commands ====================
  {
    name: 'seed',
    description: 'Seed database with test data',
    options: [
      { flag: '--synchronize', description: 'Drop and recreate tables before seeding', defaultValue: false },
      { flag: '--no-synchronize', description: 'Do not synchronize database schema' }
    ],
    commandClass: '../commands/SeedCommand.js',
    category: 'database'
  },

  {
    name: 'db:stats',
    description: 'Show database statistics (table counts, sizes)',
    options: [
      { flag: '-v, --verbose', description: 'Show detailed statistics', defaultValue: false }
    ],
    commandClass: '../commands/db/DbStatsCommand.js',
    category: 'database'
  },

  {
    name: 'db:inspect [entity]',
    description: 'Inspect database entity schema',
    options: [
      { flag: '-v, --verbose', description: 'Show detailed schema information', defaultValue: false }
    ],
    commandClass: '../commands/db/DbInspectCommand.js',
    category: 'database'
  },

  {
    name: 'db:snapshot',
    description: 'Create a backup snapshot of the current database',
    options: [
      { flag: '-n, --name <name>', description: 'Custom snapshot name' },
      { flag: '--compress', description: 'Compress snapshot', defaultValue: false },
      { flag: '--include-logs', description: 'Include log files in snapshot', defaultValue: false }
    ],
    commandClass: '../commands/db/DbSnapshotCommand.js',
    category: 'database'
  },

  {
    name: 'db:restore-snapshot',
    description: 'Restore database from most recent snapshot',
    options: [
      { flag: '-n, --name <name>', description: 'Specific snapshot name to restore' }
    ],
    commandClass: '../commands/DatabaseCommands.js',
    action: 'dbRestoreSnapshotCommand',
    category: 'database'
  },

  {
    name: 'migration:generate [name]',
    description: 'Generate migration files from schema changes',
    options: [
      { flag: '--dry-run', description: 'Show what migrations would be generated', defaultValue: false }
    ],
    commandClass: '../commands/MigrationGenerateCommand.js',
    action: 'migrationGenerateCommand',
    category: 'database'
  },

  {
    name: 'migration:show',
    description: 'Show pending migrations without running them',
    options: [],
    commandClass: '../../main/db/dataSource.js',
    action: 'showPendingMigrations',
    category: 'database'
  },

  {
    name: 'migration:run',
    description: 'Run pending migrations with automatic backup',
    options: [],
    commandClass: '../../main/db/dataSource.js',
    action: 'runMigrationsSafe',
    category: 'database'
  },

  {
    name: 'migration:revert',
    description: 'Revert the last applied migration with backup',
    options: [],
    commandClass: '../commands/MigrationGenerateCommand.js',
    action: 'revertMigrationSafe',
    category: 'database'
  },

  {
    name: 'schema:dump',
    description: 'Generate schema.sql file with current database structure',
    options: [
      { flag: '-o, --output <path>', description: 'Output file path', defaultValue: 'schema.sql' }
    ],
    commandClass: '../commands/DatabaseCommands.js',
    action: 'generateSchemaSql',
    category: 'database'
  },

  {
    name: 'db:status',
    description: 'Show current database settings and performance information',
    options: [],
    commandClass: '../commands/DatabaseCommands.js',
    action: 'getDatabaseSettings',
    category: 'database'
  },

  // ==================== Information Commands ====================
  {
    name: 'info',
    description: 'Show project health and statistics',
    options: [],
    commandClass: '../commands/InfoCommands.js',
    action: 'projectInfoCommand',
    category: 'utility'
  },

  {
    name: 'routes',
    description: 'List all GraphQL resolvers and IPC handlers',
    options: [],
    commandClass: '../commands/InfoCommands.js',
    action: 'routesCommand',
    category: 'utility'
  },

  {
    name: 'list',
    description: 'List all available utilities',
    options: [],
    commandClass: '../commands/InfoCommands.js',
    action: 'listCommand',
    category: 'utility'
  },

  // ==================== Generator Commands ====================
  {
    name: 'job <name>',
    description: 'Generate a background job class',
    options: [
      { flag: '-f, --force', description: 'Overwrite existing files', defaultValue: false },
      { flag: '--dry-run', description: 'Show what would be generated without creating files', defaultValue: false }
    ],
    commandClass: './generators/BaseGenerator.js',
    action: 'generateJob',
    category: 'generator'
  },

  {
    name: 'search <name> [attributes...]',
    description: 'Generate FTS5 (Full-Text Search) migration for entity',
    options: [
      { flag: '-f, --force', description: 'Overwrite existing migration', defaultValue: false },
      { flag: '--dry-run', description: 'Show what would be generated without creating files', defaultValue: false }
    ],
    commandClass: './generators/SearchGenerator.js',
    action: 'generateSearchCommand',
    category: 'generator'
  },

  {
    name: 'icons <input-svg> [output-dir]',
    description: 'Convert SVG to app icons',
    options: [],
    commandClass: '../commands/iconCommand.js',
    action: 'iconCommand',
    category: 'generator'
  },


  {
    name: 'graphql',
    description: 'Generate GraphQL schema, entities, and compile Relay',
    options: [
      { flag: '-f, --force', description: 'Force regeneration of existing entities (with confirmation)', defaultValue: false },
      { flag: '-w, --watch', description: 'Watch for changes and regenerate automatically', defaultValue: false },
      { flag: '--no-relay', description: 'Skip Relay compilation', defaultValue: false }
    ],
    commandClass: './GraphQLRunner.js',
    action: 'runGraphQLCommand',
    category: 'generator'
  },


  {
    name: 'sql',
    description: 'Generate schema.sql file with current database structure',
    options: [
      { flag: '-o, --output <path>', description: 'Output file path', defaultValue: 'schema.sql' }
    ],
    commandClass: '../commands/DatabaseCommands.js',
    action: 'generateSchemaSql',
    category: 'generator'
  },

  {
    name: 'entity [name]',
    description: 'Generate entity from JSON schema',
    options: [
      { flag: '-f, --force', description: 'Force regeneration of existing entities', defaultValue: false }
    ],
    commandClass: '../commands/EntityJsonCommand.js',
    action: 'registerEntityJsonCommand',
    category: 'generator'
  },

  {
    name: 'entities',
    description: 'Generate all entities from JSON schemas',
    options: [
      { flag: '-f, --force', description: 'Force regeneration of existing entities', defaultValue: false }
    ],
    commandClass: '../commands/EntityJsonCommand.js',
    action: 'registerEntityJsonCommand',
    category: 'generator'
  },

  // ==================== Code Quality Commands ====================
  {
    name: 'lint:custom',
    description: 'Run custom CodeBlocks ESLint rules for code quality',
    options: [
      { flag: '--fix', description: 'Auto-fix fixable issues', defaultValue: false },
      { flag: '-f, --format <format>', description: 'Output format: stylish, json, compact, codeframe', defaultValue: 'stylish' },
      { flag: '--max-warnings <number>', description: 'Maximum number of warnings allowed', defaultValue: 0 },
      { flag: '-q, --quiet', description: 'Only report errors, no warnings', defaultValue: false },
      { flag: '--ignore-pattern <pattern...>', description: 'Pattern of files to ignore' },
      { flag: '--patterns <pattern...>', description: 'File patterns to lint', defaultValue: ['.'] }
    ],
    commandClass: '../commands/LintCustomCommand.js',
    category: 'development'
  }

];

/**
 * Register all commands with a Commander program instance
 * Single source of truth for command registration
 */
export async function registerCommands(program: Command): Promise<void> {
  for (const def of commands) {
    const cmd = program.command(def.name).description(def.description);

    // Add options
    for (const opt of def.options) {
      if (opt.defaultValue !== undefined) {
        cmd.option(opt.flag, opt.description, opt.defaultValue);
      } else {
        cmd.option(opt.flag, opt.description);
      }
    }

    // Set action handler
    cmd.action(async (options) => {
      // Dynamically import and execute command
      const module = await import(def.commandClass);

      if (def.action) {
        // Use specific action method
        const actionFn = module[def.action];
        if (typeof actionFn === 'function') {
          await actionFn(options);
        } else {
          // Check if it's a class with the action method
          const ExportedClass = module[Object.keys(module)[0]] || module.default;
          if (ExportedClass && typeof ExportedClass === 'function') {
            const instance = new ExportedClass();
            if (typeof instance[def.action] === 'function') {
              await instance[def.action](options);
            } else {
              throw new Error(`Action ${def.action} not found in instance of ${def.commandClass}`);
            }
          } else {
            throw new Error(`Action ${def.action} not found in ${def.commandClass}`);
          }
        }
      } else {
        // Use command class with execute method
        const CommandClass = module[def.name.charAt(0).toUpperCase() + def.name.slice(1).replace(':', '') + 'Command'] ||
          module[Object.keys(module)[0]]; // Fallback to first export

        if (CommandClass && typeof CommandClass === 'function') {
          const command = new CommandClass();
          await command.execute(options);
        } else if (typeof module === 'function') {
          // Direct function export (backward compatibility)
          await module(options);
        } else {
          throw new Error(`No command class found in ${def.commandClass}`);
        }
      }

    });
  }
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandDefinition['category']): CommandDefinition[] {
  return commands.filter(cmd => cmd.category === category);
}

/**
 * Get command by name
 */
export function getCommand(name: string): CommandDefinition | undefined {
  return commands.find(cmd => cmd.name === name);
}

/**
 * Get all command categories
 */
export function getCategories(): CommandDefinition['category'][] {
  return [...new Set(commands.map(cmd => cmd.category).filter(Boolean))];
}