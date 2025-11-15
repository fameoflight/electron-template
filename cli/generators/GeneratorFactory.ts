/**
 * GeneratorFactory - Factory for creating and managing code generators
 *
 * Provides a unified interface for creating different types of generators:
 * - EntityGenerator: Generate entity files only
 * - EntityInputGenerator: Generate GraphQL input types only
 * - ResolverGenerator: Generate GraphQL resolvers only
 * - Combined generation: Generate all components together
 *
 * Centralizes generator configuration and provides convenience methods
 * for common generation workflows.
 */

import { ParsedEntity } from '../parsers/EntityJsonParser.js';
import { EntityGenerator } from './EntityGenerator.js';
import { EntityInputGenerator } from './EntityInputGenerator.js';
import { ResolverGenerator } from './ResolverGenerator.js';

export interface GeneratorFactoryOptions {
  projectRoot?: string;
  outputDir?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface GenerationResult {
  entity?: { basePath: string; extensionPath: string; extensionCreated: boolean };
  inputs?: { inputsPath: string; extensionPath?: string; extensionCreated: boolean };
  resolver?: { resolverPath: string; extensionPath?: string; extensionCreated: boolean };
  success: boolean;
  errors?: string[];
}

export class GeneratorFactory {
  private options: GeneratorFactoryOptions;

  constructor(options: GeneratorFactoryOptions = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      outputDir: options.outputDir,
      force: options.force || false,
      dryRun: options.dryRun || false,
    };

  }

  /**
   * Generate entity files only
   */
  async generateEntity(entity: ParsedEntity): Promise<GenerationResult> {
    const generator = new EntityGenerator(entity, this.options.projectRoot, this.options.outputDir);
    const result = await generator.generate(this.options.force);


    return {
      entity: result,
      success: true,
    };
  }

  /**
   * Generate input types only
   */
  generateInputs(entity: ParsedEntity): GenerationResult {
    const generator = new EntityInputGenerator(entity, this.options);
    const result = generator.generate();

    return {
      inputs: result,
      success: true,
    };
  }

  /**
   * Generate resolvers only
   */
  generateResolver(entity: ParsedEntity): GenerationResult {
    const generator = new ResolverGenerator(entity, this.options);
    const result = generator.generate();

    return {
      resolver: result,
      success: true,
    };
  }

  /**
   * Generate all components (entity, inputs, resolver)
   * Equivalent to the original EntityGenerator.generate() method
   */
  async generateAll(entity: ParsedEntity): Promise<GenerationResult> {
    const result: GenerationResult = { success: true, errors: [] };
    const entityResult = await this.generateEntity(entity);
    if (entityResult.entity) {
      result.entity = entityResult.entity;
    }
    if (!entityResult.success) {
      result.success = false;
      result.errors!.push(...(entityResult.errors || []));
    }

    // Generate inputs
    const inputsResult = this.generateInputs(entity);
    if (inputsResult.inputs) {
      result.inputs = inputsResult.inputs;
    }
    if (!inputsResult.success) {
      result.success = false;
      result.errors!.push(...(inputsResult.errors || []));
    }

    // Generate resolver
    const resolverResult = this.generateResolver(entity);
    if (resolverResult.resolver) {
      result.resolver = resolverResult.resolver;
    }
    if (!resolverResult.success) {
      result.success = false;
      result.errors!.push(...(resolverResult.errors || []));
    }
    return result;
  }

  /**
   * Generate custom operations only
   */
  generateCustomOperations(entity: ParsedEntity, operations: string[]): GenerationResult {
    const generator = new ResolverGenerator(entity, this.options);
    const result = generator.generateCustomOperations(operations);

    return {
      resolver: { resolverPath: result, extensionCreated: false },
      success: true,
    };
  }

  /**
   * Create individual generators for advanced usage
   */
  createEntityGenerator(entity: ParsedEntity): EntityGenerator {
    return new EntityGenerator(entity, this.options.projectRoot, this.options.outputDir);
  }

  createInputGenerator(entity: ParsedEntity): EntityInputGenerator {
    return new EntityInputGenerator(entity, this.options);
  }

  createResolverGenerator(entity: ParsedEntity): ResolverGenerator {
    return new ResolverGenerator(entity, this.options);
  }
}