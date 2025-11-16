import { BaseCommand, type CommandResult } from '../utils/BaseCommand.js';
import { generateSchema } from '../utils/generateSchema.js';
import { confirmForce } from '../utils/Prompt.js';
import { watch } from 'fs';
import { FileSystemServiceProvider } from '../utils/FileSystemService.js';
import * as fs from 'fs';
import * as path from 'path';

interface SchemaOptions {
  watch: boolean;
  force: boolean;
}

/**
 * Schema Command - Generate GraphQL schema from entities and resolvers
 */
export class SchemaCommand extends BaseCommand {
  private isWatching = false;
  private watchers: Array<ReturnType<typeof watch>> = [];

  async run(options: Record<string, unknown>): Promise<CommandResult> {
    const schemaOptions = options as unknown as SchemaOptions;

    // Display command header
    this.output.header('Schema Generation', 'Generate GraphQL schema from entities and resolvers');

    if (schemaOptions.watch) {
      return this.runWatchMode(schemaOptions.force);
    } else {
      return this.runOnce(schemaOptions.force);
    }
  }

  /**
   * Generate schema once
   */
  private async runOnce(force: boolean = false): Promise<CommandResult> {
    // Step 1: Generate entities from JSON schemas
    const spinner = this.output.spinner('Scanning entity schemas...');
    await this.generateEntitiesFromSchemas(force);
    spinner.stop();

    // Step 2: Generate GraphQL schema
    const schemaSpinner = this.output.spinner('Generating GraphQL schema...');

    await generateSchema();
    schemaSpinner.stop();

    const fileService = FileSystemServiceProvider.getInstance();
    const schemaPath = fileService.resolveProjectPath('schema.graphql');

    // Show generated files in a tree
    this.output.fileTree([
      { name: 'schema.graphql', type: 'file', status: 'created' }
    ], 'Generated Files');

    this.success('GraphQL schema generated successfully!');

    return {
      success: true,
      message: `Schema generated at ${schemaPath}`
    };

  }

  /**
   * Generate TypeScript entities from JSON schemas
   */
  private async generateEntitiesFromSchemas(force: boolean = false): Promise<void> {
    const schemasDir = path.join(process.cwd(), 'schemas');

    // Check if schemas directory exists
    if (!fs.existsSync(schemasDir)) {
      return; // No schemas to generate
    }

    // Find all .json files (excluding entity-schema.json)
    const entityFiles = this.findEntityFiles(schemasDir);

    if (entityFiles.length === 0) {
      return; // No entity schemas found
    }

    // Extract entity names for force confirmation
    const entityNames = entityFiles.map(file => {
      const fileName = path.basename(file, '.json');
      return fileName.charAt(0).toUpperCase() + fileName.slice(1);
    });

    // Handle force confirmation
    if (force) {
      const confirmed = await confirmForce(entityNames);
      if (!confirmed) {
        this.info('Entity generation cancelled by user.');
        return;
      }
    }

    this.info(`Generating CRUD code from ${entityFiles.length} schema file(s)...`);

    // Import and use the entity generation functions
    const { generateAllEntities } = await import('../commands/EntityJsonCommand.js');
    await generateAllEntities(force);
  }

  /**
   * Find all entity JSON files in schemas directory
   */
  private findEntityFiles(dir: string): string[] {
    const files: string[] = [];

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (
          entry.isFile() &&
          entry.name.endsWith('.json') &&
          entry.name !== 'entity-schema.json'
        ) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Run in watch mode, regenerating schema when files change
   */
  private async runWatchMode(force: boolean = false): Promise<CommandResult> {
    this.info('Starting GraphQL schema watch mode...');
    this.info('Press Ctrl+C to stop watching');

    // Initial generation (force only applies to initial run, not subsequent watch changes)
    const initialResult = await this.runOnce(force);
    if (!initialResult.success) {
      return initialResult;
    }

    this.separator();
    this.info('👀 Watching for schema, entity and resolver changes...');

    this.isWatching = true;

    // Watch for changes in schemas directory (JSON schemas)
    const fileService = FileSystemServiceProvider.getInstance();
    const schemasDir = fileService.resolveProjectPath('schemas');
    if (fs.existsSync(schemasDir)) {
      const schemasWatcher = watch(
        schemasDir,
        { recursive: true },
        (eventType, filename) => {
          if (
            filename &&
            filename.endsWith('.json') &&
            filename !== 'entity-schema.json' &&
            this.isWatching
          ) {
            this.onFileChanged('schema', filename);
          }
        }
      );
      this.watchers.push(schemasWatcher);
    }

    // Watch for changes in entities directory
    const entitiesWatcher = watch(
      fileService.resolveProjectPath('main', 'db', 'entities'),
      { recursive: true },
      (eventType, filename) => {
        if (filename && filename.endsWith('.ts') && this.isWatching) {
          this.onFileChanged('entity', filename);
        }
      }
    );

    // Watch for changes in resolvers directory
    const resolversWatcher = watch(
      fileService.resolveProjectPath('main', 'graphql', 'resolvers'),
      { recursive: true },
      (eventType, filename) => {
        if (
          filename &&
          filename.endsWith('.ts') &&
          !filename.includes('CrudResolverFactory') &&
          this.isWatching
        ) {
          this.onFileChanged('resolver', filename);
        }
      }
    );

    this.watchers.push(entitiesWatcher, resolversWatcher);

    // Setup cleanup on exit
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });

    return {
      success: true,
      message: 'Watch mode started. Regenerating schema on file changes...'
    };
  }

  /**
   * Handle file change events
   */
  private onFileChanged(type: 'schema' | 'entity' | 'resolver', filename: string): void {
    this.progress(`🔄 ${type.charAt(0).toUpperCase() + type.slice(1)} changed: ${filename}`);

    // Debounce rapid changes
    setTimeout(async () => {
      if (!this.isWatching) return;

      // If schema JSON changed, regenerate entities first (no force in watch mode)
      if (type === 'schema') {
        await this.generateEntitiesFromSchemas(false);
      }

      await generateSchema();
      this.success('✅ Schema regenerated!');

    }, 500);
  }

  /**
   * Cleanup watchers and exit gracefully
   */
  private cleanup(): void {
    this.info('\n🛑 Shutting down schema watcher...');
    this.isWatching = false;

    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    this.watchers = [];
    this.success('Schema watcher stopped.');
  }
}