import { DataSourceProvider } from '@base/db/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * BaseAgent - Common patterns for all AI agents
 *
 * Provides:
 * - Consistent data source access
 * - Standardized logging methods
 * - Template rendering with Handlebars
 * - Common agent functionality
 */
export abstract class BaseAgent {
  protected dataSource = DataSourceProvider.get();
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Get service name for logging (to be implemented by subclasses)
   */
  protected abstract getServiceName(): string;

  /**
   * Log operation with consistent formatting using agent name
   */
  log(message: string, ...args: any[]): void {
    const serviceName = this.getServiceName();
    console.log(`[${serviceName}] ${message}`, ...args);
  }

  /**
   * Log error with consistent formatting using agent name
   */
  logError(message: string, error?: any): void {
    const serviceName = this.getServiceName();
    console.error(`[${serviceName}] ${message}`, error);
  }

  /**
   * Load and compile a Handlebars template
   *
   * @param templateName - Name of the template file (without .hbs extension)
   * @returns Compiled Handlebars template
   */
  protected loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Templates are always copied to dist-electron/templates during build
      // In both development and production, __dirname points to dist-electron
      const templatePath = join(__dirname, 'templates', `${templateName}.hbs`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // Cache the compiled template
      this.templateCache.set(templateName, template);

      this.log(`Loaded template: ${templateName}`);
      return template;
    } catch (error) {
      this.logError(`Failed to load template ${templateName}:`, error);
      throw new Error(`Could not load template: ${templateName}`);
    }
  }

  /**
   * Render a template with provided data
   *
   * @param templateName - Name of the template file
   * @param data - Data to pass to the template
   * @returns Rendered template string
   */
  protected renderTemplate(templateName: string, data: any): string {
    const template = this.loadTemplate(templateName);
    return template(data);
  }

  /**
   * Clear template cache (useful for development)
   */
  protected clearTemplateCache(): void {
    this.templateCache.clear();
    this.log('Template cache cleared');
  }
}