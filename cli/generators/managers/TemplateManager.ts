/**
 * TemplateManager - Manages Handlebars template loading and compilation
 *
 * Centralizes template handling logic with error handling and helper registration
 */

import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { cyberOutput } from '../../utils/output.js';

export class TemplateManager {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Registers custom Handlebars helpers
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('or', (a, b) => a || b);
    Handlebars.registerHelper('and', (a, b) => a && b);
    Handlebars.registerHelper('includes', (array: string[], value: string) => {
      return Array.isArray(array) && array.includes(value);
    });

    // Helper to format SQL default values properly
    Handlebars.registerHelper('sqlDefault', (value: any) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') {
        // Handle SQLite function calls like datetime('now')
        if (value.includes('(') && value.includes(')')) {
          return `(${value})`;
        }
        // Handle string literals
        return `'${value}'`;
      }
      return value;
    });

    // Helper to format SQL default values without HTML escaping
    Handlebars.registerHelper('sqlDefaultUnescaped', (value: any) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') {
        // Handle SQLite function calls like datetime('now')
        if (value.includes('(') && value.includes(')')) {
          return `(${value})`;
        }
        // Handle string literals
        return `'${value}'`;
      }
      return value;
    });

    // Helper to add proper spacing for SQL columns
    Handlebars.registerHelper('sqlIndent', (value: string) => {
      return value.replace(/^/gm, '                ');
    });

    // Helper to determine if a column should have a comma after it
    Handlebars.registerHelper('sqlComma', (isLast: boolean, hasMore: boolean) => {
      return (!isLast || hasMore) ? ',' : '';
    });

    // Helper to build type string for JSDoc template
    Handlebars.registerHelper('buildTypeString', (type: string, array: boolean, required: boolean) => {
      let typeStr = type;
      if (array) {
        typeStr += '[]';
      }
      if (!required) {
        typeStr += ' | null';
      }
      return typeStr;
    });

    // Helper to build relationship type string for JSDoc template
    Handlebars.registerHelper('buildRelationshipTypeString', (relationType: string, targetEntity: string, required: boolean, eager: boolean) => {
      const nullability = required ? '' : ' | null';

      if (relationType === 'OneToMany' || relationType === 'ManyToMany') {
        if (eager) {
          return `${targetEntity}${nullability}[]`;
        } else {
          return `Promise<${targetEntity}${nullability}[]>`;
        }
      } else {
        if (eager) {
          return `${targetEntity}${nullability}`;
        } else {
          return `Promise<${targetEntity}${nullability}>`;
        }
      }
    });

    // Helper to join array elements
    Handlebars.registerHelper('join', (array: string[], separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Helper to format CREATE TABLE statements with proper indentation
    Handlebars.registerHelper('formatCreateTable', (sql: string) => {
      if (!sql) return '';

      // Match CREATE TABLE statements and format them properly
      return sql.replace(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\);/g, (match, tableName, content) => {
        // Split content by lines and format with proper indentation
        const lines = content.split(',\n').map((line: string, index: number, array: string[]) => {
          const trimmed = line.trim();
          if (!trimmed) return '';

          // Add proper indentation
          const indented = `  ${trimmed}`;

          // Add comma if not the last non-empty line
          const isLastNonEmpty = array.slice(index + 1).every((l: string) => !l.trim());
          return isLastNonEmpty ? indented : `${indented},`;
        }).filter((line: string) => line).join('\n');

        return `CREATE TABLE "${tableName}" (\n${lines}\n)`;
      });
    });
  }

  /**
   * Loads all entity generation templates
   */
  private loadTemplates(): void {
    // Load entity templates
    const entityTemplateDir = path.join(this.projectRoot, 'cli/templates/entity');
    const entityTemplateFiles = [
      'base.hbs',
      'extension.hbs',
      'inputs.hbs',
      'inputs-extension.hbs',
      'resolver.hbs',
      'resolver-extension.hbs',
      'paths.hbs',
      'paths-resolver.hbs',
      'simplified-schema.hbs',
    ];

    this.loadTemplateFiles(entityTemplateDir, entityTemplateFiles);

    // Load migration templates
    const migrationTemplateDir = path.join(this.projectRoot, 'cli/templates/migration');
    const migrationTemplateFiles = [
      'migration.hbs',
    ];

    this.loadTemplateFiles(migrationTemplateDir, migrationTemplateFiles, 'migration:');
  }

  /**
   * Load template files from a directory
   */
  private loadTemplateFiles(templateDir: string, templateFiles: string[], prefix: string = ''): void {
    for (const file of templateFiles) {
      const templatePath = path.join(templateDir, file);

      if (!fs.existsSync(templatePath)) {
        cyberOutput.warning(`Template file not found: ${templatePath}`);
        continue;
      }

      try {
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const templateName = prefix + file.replace('.hbs', '');
        this.templates.set(templateName, Handlebars.compile(templateContent));

              } catch (error) {
        cyberOutput.error(`Error loading template ${file}:`, error instanceof Error ? error.message : String(error));
        throw new Error(`Failed to load template: ${file}`);
      }
    }
  }

  /**
   * Gets a compiled template by name
   */
  getTemplate(name: string): HandlebarsTemplateDelegate | undefined {
    return this.templates.get(name);
  }

  /**
   * Checks if a template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Renders a template with the given data
   */
  render(name: string, data: any): string {
    const template = this.getTemplate(name);

    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }

    try {
      return template(data);
    } catch (error) {
      cyberOutput.error(`Error rendering template ${name}:`, error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to render template: ${name}`);
    }
  }

  /**
   * Force reload all templates (useful for development)
   */
  reloadTemplates(): void {
    this.templates.clear();
    this.loadTemplates();
  }

  /**
   * Lists all available template names
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}