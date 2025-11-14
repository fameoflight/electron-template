/**
 * ResolverGenerator - Generate GraphQL resolvers for entities
 *
 * Focused generator that creates only GraphQL resolvers with:
 * - Standard CRUD queries (single, list, array)
 * - Standard mutations (create, update, createUpdate, destroy, delete, restore)
 * - Relay connection support
 * - Ownership-aware repository integration
 *
 * Uses existing templates and follows the BaseResolver pattern.
 * Handles exclude configurations to skip specific operations.
 */

import { ParsedEntity } from '../parsers/EntityJsonParser.js';
import { TemplateManager } from './managers/TemplateManager.js';
import { EntityFileGenerator } from './generators/EntityFileGenerator.js';
import { TypeMapper } from './utils/TypeMapper.js';

export interface ResolverGeneratorOptions {
  projectRoot?: string;
  outputDir?: string;
  force?: boolean;
  dryRun?: boolean;
}

export class ResolverGenerator {
  private entity: ParsedEntity;
  private projectRoot: string;
  private templateManager: TemplateManager;
  private fileGenerator: EntityFileGenerator;
  private options: ResolverGeneratorOptions;

  constructor(entity: ParsedEntity, options: ResolverGeneratorOptions = {}) {
    this.entity = entity;
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      outputDir: options.outputDir,
      force: options.force || false,
      dryRun: options.dryRun || false,
    };

    this.projectRoot = this.options.projectRoot!;
    this.templateManager = new TemplateManager(this.projectRoot);
    this.fileGenerator = new EntityFileGenerator(this.projectRoot, this.options.outputDir);
  }

  /**
   * Generate complete resolver with all operations
   */
  generate(): {
    resolverPath: string;
    extensionPath?: string;
    extensionCreated: boolean;
  } {
    // Check if resolvers should be generated based on graphql property
    if (!this.shouldGenerateResolvers()) {
      throw new Error(`Resolver generation skipped for entity "${this.entity.name}" because graphql: false or no operations included in graphql array`);
    }

    const className = this.entity.name;
    const data = this.prepareResolverTemplateData();
    const code = this.templateManager.render('resolver', data);

    // Generate base resolver file
    const resolverPath = this.fileGenerator.generateResolverBase(className, code);

    // Generate extension stub (only if doesn't exist, unless force=true)
    const extensionResult = this.generateResolverExtension();

    return {
      resolverPath,
      extensionPath: extensionResult.path,
      extensionCreated: extensionResult.created,
    };
  }

  /**
   * Generate only queries (single, list, array)
   */
  generateQueries(): string {
    const className = this.entity.name;
    const data = this.prepareQueryOnlyData();
    const code = this.templateManager.render('resolver-queries', data);

    return this.fileGenerator.generateResolverBase(`${className}Queries`, code);
  }

  /**
   * Generate only mutations (create, update, delete, etc.)
   */
  generateMutations(): string {
    const className = this.entity.name;
    const data = this.prepareMutationOnlyData();
    const code = this.templateManager.render('resolver-mutations', data);

    return this.fileGenerator.generateResolverBase(`${className}Mutations`, code);
  }

  /**
   * Generate specific operations only
   */
  generateCustomOperations(operations: string[]): string {
    const className = this.entity.name;
    const data = this.prepareCustomOperationsData(operations);
    const code = this.templateManager.render('resolver-custom', data);

    return this.fileGenerator.generateResolverBase(`${className}Custom`, code);
  }

  /**
   * Generate resolver extension stub for custom business logic
   */
  private generateResolverExtension(): { path: string; created: boolean } {
    const className = this.entity.name;

    // Check if resolver extension template exists
    if (!this.templateManager.hasTemplate('resolver-extension')) {
      if (!this.options.dryRun) {
        console.log(`  ⚠️  Template 'resolver-extension.hbs' not found, skipping resolver extension`);
      }
      const extensionPath = `${this.projectRoot}/main/graphql/resolvers/${className}Resolver.ts`;
      return { path: extensionPath, created: false };
    }

    const data = this.prepareResolverTemplateData();
    const code = this.templateManager.render('resolver-extension', data);

    return this.fileGenerator.generateResolverExtension(className, code, this.options.force);
  }

  /**
   * Prepare template data for complete resolver
   */
  private prepareResolverTemplateData() {
    const className = this.entity.name;
    const camelName = TypeMapper.toCamelCase(className);
    const pluralCamelName = TypeMapper.pluralize(camelName);

    return {
      className,
      camelName,
      pluralCamelName,
      exclude: this.getExcludedOperations(),
    };
  }

  /**
   * Get list of excluded operations based on graphql property
   */
  private getExcludedOperations(): string[] {
    const { graphql } = this.entity;

    // If graphql is explicitly false, exclude all operations
    if (graphql === false) {
      return ['create', 'createUpdate', 'update', 'delete', 'destroy', 'list', 'array', 'single'];
    }

    // If graphql is an array, exclude operations not in the array
    if (Array.isArray(graphql)) {
      const allOperations: ('create' | 'createUpdate' | 'update' | 'delete' | 'destroy' | 'list' | 'array' | 'single')[] = ['create', 'createUpdate', 'update', 'delete', 'destroy', 'list', 'array', 'single'];
      return allOperations.filter(op => !graphql.includes(op));
    }

    // Default: include all operations ( graphql is true or undefined )
    return [];
  }

  /**
   * Prepare data for queries-only resolver
   */
  private prepareQueryOnlyData() {
    const baseData = this.prepareResolverTemplateData();

    return {
      ...baseData,
      includeQueries: true,
      includeMutations: false,
    };
  }

  /**
   * Prepare data for mutations-only resolver
   */
  private prepareMutationOnlyData() {
    const baseData = this.prepareResolverTemplateData();

    return {
      ...baseData,
      includeQueries: false,
      includeMutations: true,
    };
  }

  /**
   * Prepare data for custom operations resolver
   */
  private prepareCustomOperationsData(operations: string[]) {
    const baseData = this.prepareResolverTemplateData();

    // Filter operations based on exclude list and requested operations
    const availableOperations = ['single', 'list', 'array', 'create', 'update', 'createUpdate', 'destroy', 'delete', 'restore'];
    const requestedOps = operations.filter(op => availableOperations.includes(op));
    const excludedOps = this.getExcludedOperations();
    const includeOps = requestedOps.filter(op => !excludedOps.includes(op));

    return {
      ...baseData,
      customOperations: includeOps,
      includeQueries: includeOps.some(op => ['single', 'list', 'array'].includes(op)),
      includeMutations: includeOps.some(op => ['create', 'update', 'createUpdate', 'destroy', 'delete', 'restore'].includes(op)),
    };
  }

  /**
   * Check if resolvers should be generated based on graphql property
   */
  private shouldGenerateResolvers(): boolean {
    const { graphql } = this.entity;

    // If graphql is explicitly false, don't generate any resolvers
    if (graphql === false) {
      return false;
    }

    // If graphql is an array, check if it contains any operations
    if (Array.isArray(graphql)) {
      return graphql.length > 0;
    }

    // Default: include all resolvers (graphql is true or undefined)
    return true;
  }
}