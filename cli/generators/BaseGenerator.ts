/**
 * BaseGenerator - Abstract base class for all Rails-like code generators
 *
 * Provides Rails generator-style APIs:
 * - Template rendering with Handlebars
 * - File creation with overwrite protection
 * - String manipulation helpers (pluralization, case conversion)
 * - Convention-based file placement
 *
 * Usage:
 * class EntityGenerator extends BaseGenerator {
 *   async generate(): Promise<void> {
 *     const className = this.toPascalCase(this.name);
 *     const template = this.loadTemplate('entity.hbs');
 *     const content = this.renderTemplate(template, { className });
 *     this.writeFile(`main/db/entities/${className}.ts`, content);
 *   }
 * }
 */
import Handlebars from 'handlebars';
import * as path from 'path';
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  pluralize,
  singularize,
} from '../utils/string-helpers.js';
import {
  writeFile,
  readFile,
  fileExists,
  FileOperationOptions,
} from '../utils/FileSystemService.js';
import { FileSystemServiceProvider } from '../utils/FileSystemService.js';

export interface GeneratorOptions {
  name: string;
  attributes?: Record<string, string | number | boolean | null>;
  force?: boolean;
  dryRun?: boolean;
  [key: string]: string | number | boolean | null | undefined | Record<string, string | number | boolean | null>;
}

export interface GeneratorResult {
  success: boolean;
  files: Array<{
    path: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    message: string;
  }>;
}

/**
 * Abstract base class for all generators
 */
export abstract class BaseGenerator {
  protected name: string;
  protected options: GeneratorOptions;
  protected results: GeneratorResult;

  constructor(options: GeneratorOptions) {
    this.name = options.name;
    this.options = options;
    this.results = {
      success: true,
      files: [],
    };

    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Main entry point - must be implemented by subclasses
   */
  abstract generate(): Promise<GeneratorResult>;

  /**
   * Load a template file from the templates directory
   */
  protected async loadTemplate(templateName: string): Promise<string> {
    const fileService = FileSystemServiceProvider.getInstance();
    const templatePath = fileService.resolveProjectPath('cli', 'templates', templateName);

    if (!fileExists(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    return await readFile(templatePath);
  }

  /**
   * Render a Handlebars template with context
   */
  protected renderTemplate(
    templateContent: string,
    context: Record<string, string | number | boolean | null | undefined>
  ): string {
    const template = Handlebars.compile(templateContent);
    return template(context);
  }

  /**
   * Write a file with convention-based error handling
   */
  protected async writeFile(
    relativePath: string,
    content: string,
    options?: Partial<FileOperationOptions>
  ): Promise<void> {
    const fileService = FileSystemServiceProvider.getInstance();
    const filePath = fileService.resolveProjectPath(relativePath);
    const fileOptions: FileOperationOptions = {
      overwrite: this.options.force || false,
      dryRun: this.options.dryRun || false,
      ...options,
    };

    const result = await writeFile(filePath, content, fileOptions);

    let action: 'created' | 'updated' | 'skipped' | 'error';
    if (!result.success) {
      action = 'error';
      this.results.success = false;
    } else if (fileOptions.dryRun) {
      action = 'skipped';
    } else if (result.message.startsWith('Updated')) {
      action = 'updated';
    } else {
      action = 'created';
    }

    this.results.files.push({
      path: result.filePath,
      action,
      message: result.message,
    });
  }

  /**
   * Check if a file exists (project-relative path)
   */
  protected fileExists(relativePath: string): boolean {
    const fileService = FileSystemServiceProvider.getInstance();
    return fileExists(fileService.resolveProjectPath(relativePath));
  }

  /**
   * Register Handlebars helpers for use in templates
   */
  protected registerHandlebarsHelpers(): void {
    // String transformation helpers
    Handlebars.registerHelper('pascalCase', (str: string) => toPascalCase(str));
    Handlebars.registerHelper('camelCase', (str: string) => toCamelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => toKebabCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => toSnakeCase(str));
    Handlebars.registerHelper('pluralize', (str: string) => pluralize(str));
    Handlebars.registerHelper('singularize', (str: string) => singularize(str));

    // Conditional helpers
    Handlebars.registerHelper('eq', (a: string | number | boolean, b: string | number | boolean) => a === b);
    Handlebars.registerHelper('neq', (a: string | number | boolean, b: string | number | boolean) => a !== b);
    Handlebars.registerHelper('or', (...args: unknown[]) => {
      // Last argument is Handlebars options object
      return args.slice(0, -1).some(Boolean);
    });
    Handlebars.registerHelper('and', (...args: unknown[]) => {
      return args.slice(0, -1).every(Boolean);
    });

    // Date helper
    Handlebars.registerHelper('timestamp', () => new Date().toISOString());
    Handlebars.registerHelper('year', () => new Date().getFullYear());
  }

  // Convenience methods exposed to subclasses
  protected toPascalCase = toPascalCase;
  protected toCamelCase = toCamelCase;
  protected toKebabCase = toKebabCase;
  protected toSnakeCase = toSnakeCase;
  protected pluralize = pluralize;
  protected singularize = singularize;

  /**
   * Print results to console (can be overridden for custom output)
   */
  protected printResults(): void {
    console.log('\nGenerator Results:');
    console.log('─'.repeat(50));

    for (const file of this.results.files) {
      const icon = {
        created: '✅',
        updated: '🔄',
        skipped: '⏭️',
        error: '❌',
      }[file.action];

      console.log(`${icon} ${file.action.toUpperCase()}: ${file.message}`);
    }

    console.log('─'.repeat(50));
    console.log(
      this.results.success
        ? '✅ Generation completed successfully!'
        : '❌ Generation completed with errors.'
    );
  }

  /**
   * Run the generator and print results
   */
  async run(): Promise<GeneratorResult> {
    try {
      const result = await this.generate();
      this.printResults();
      return result;
    } catch (error) {
      console.error('❌ Generator failed:', error);
      this.results.success = false;
      this.results.files.push({
        path: '',
        action: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
      return this.results;
    }
  }
}
