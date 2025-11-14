/**
 * EntityInputGenerator - Generate GraphQL input types for entities
 *
 * Focused generator that creates only GraphQL input types:
 * - CreateInput: For creating new entities
 * - UpdateInput: For updating existing entities (partial)
 * - CreateUpdateInput: Combined input for both create and update operations
 *
 * Leverages existing decorator patterns and focuses on input-specific concerns.
 * Uses the InputPreparator for field preparation logic.
 */

import { ParsedEntity } from '../parsers/EntityJsonParser.js';
import { TemplateManager } from './managers/TemplateManager.js';
import { InputPreparator } from './preparators/InputPreparator.js';
import { EntityFileGenerator } from './generators/EntityFileGenerator.js';

export interface InputGeneratorOptions {
  projectRoot?: string;
  outputDir?: string;
  force?: boolean;
  dryRun?: boolean;
}

export class EntityInputGenerator {
  private entity: ParsedEntity;
  private projectRoot: string;
  private templateManager: TemplateManager;
  private inputPreparator: InputPreparator;
  private fileGenerator: EntityFileGenerator;
  private options: InputGeneratorOptions;

  constructor(entity: ParsedEntity, options: InputGeneratorOptions = {}) {
    this.entity = entity;
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      outputDir: options.outputDir,
      force: options.force || false,
      dryRun: options.dryRun || false,
    };

    this.projectRoot = this.options.projectRoot!;
    this.templateManager = new TemplateManager(this.projectRoot);
    this.inputPreparator = new InputPreparator(entity);
    this.fileGenerator = new EntityFileGenerator(this.projectRoot, this.options.outputDir);
  }

  /**
   * Generate all input types (create, update, createUpdate)
   */
  generate(): {
    inputsPath: string;
    extensionPath?: string;
    extensionCreated: boolean;
  } {
    // Check if inputs should be generated based on graphql property
    if (!this.shouldGenerateInputs()) {
      throw new Error(`Input generation skipped for entity "${this.entity.name}" because graphql: false or inputs not included in graphql array`);
    }

    const className = this.entity.name;
    const data = this.inputPreparator.prepareAllInputsData();
    const code = this.templateManager.render('inputs', data);

    // Generate base inputs file
    const inputsPath = this.fileGenerator.generateInputsBase(className, code);

    // Generate extension stub (only if doesn't exist, unless force=true)
    const extensionResult = this.generateInputsExtension();

    return {
      inputsPath,
      extensionPath: extensionResult.path,
      extensionCreated: extensionResult.created,
    };
  }

  /**
   * Generate only create input type
   */
  generateCreateInput(): string {
    if (!this.shouldGenerateInputType('create')) {
      throw new Error(`Create input generation skipped for entity "${this.entity.name}" because create operation not included in graphql array`);
    }

    const className = this.entity.name;
    const data = this.prepareCreateInputData();
    const code = this.templateManager.render('input-create', data);

    return this.fileGenerator.generateInputsBase(`${className}Create`, code);
  }

  /**
   * Generate only update input type
   */
  generateUpdateInput(): string {
    if (!this.shouldGenerateInputType('update')) {
      throw new Error(`Update input generation skipped for entity "${this.entity.name}" because update operation not included in graphql array`);
    }

    const className = this.entity.name;
    const data = this.prepareUpdateInputData();
    const code = this.templateManager.render('input-update', data);

    return this.fileGenerator.generateInputsBase(`${className}Update`, code);
  }

  /**
   * Generate inputs extension stub for custom business logic
   */
  private generateInputsExtension(): { path: string; created: boolean } {
    const className = this.entity.name;

    // Check if inputs extension template exists
    if (!this.templateManager.hasTemplate('inputs-extension')) {
      if (!this.options.dryRun) {
        console.log(`  ⚠️  Template 'inputs-extension.hbs' not found, skipping inputs extension`);
      }
      const extensionPath = `${this.projectRoot}/main/graphql/inputs/${className}Inputs.ts`;
      return { path: extensionPath, created: false };
    }

    const data = this.inputPreparator.prepareAllInputsData();
    const code = this.templateManager.render('inputs-extension', data);

    return this.fileGenerator.generateInputsExtension(className, code, this.options.force);
  }

  /**
   * Prepare data for create input template
   */
  private prepareCreateInputData() {
    const allData = this.inputPreparator.prepareAllInputsData();

    return {
      className: this.entity.name,
      inputType: 'Create',
      fields: allData.createFields,
      hasEnums: allData.hasEnums,
      enumImports: allData.enumImports,
      hasJsonInterfaces: allData.hasJsonInterfaces,
      jsonInterfaceImports: allData.jsonInterfaceImports,
    };
  }

  /**
   * Prepare data for update input template
   */
  private prepareUpdateInputData() {
    const allData = this.inputPreparator.prepareAllInputsData();

    return {
      className: this.entity.name,
      inputType: 'Update',
      fields: allData.updateFields,
      hasEnums: allData.hasEnums,
      enumImports: allData.enumImports,
      hasJsonInterfaces: allData.hasJsonInterfaces,
      jsonInterfaceImports: allData.jsonInterfaceImports,
    };
  }

  /**
   * Check if inputs should be generated based on graphql property
   */
  private shouldGenerateInputs(): boolean {
    const { graphql } = this.entity;

    // If graphql is explicitly false, don't generate any inputs
    if (graphql === false) {
      return false;
    }

    // If graphql is an array, check if it contains any input-related operations
    if (Array.isArray(graphql)) {
      const inputOperations = ['create', 'createUpdate', 'update'];
      return graphql.some(op => inputOperations.includes(op));
    }

    // Default: include all inputs (graphql is true or undefined)
    return true;
  }

  /**
   * Check if a specific input type should be generated
   */
  private shouldGenerateInputType(inputType: 'create' | 'update' | 'createUpdate'): boolean {
    const { graphql } = this.entity;

    // If graphql is explicitly false, don't generate any inputs
    if (graphql === false) {
      return false;
    }

    // If graphql is an array, check if it contains the specific operation
    if (Array.isArray(graphql)) {
      return graphql.includes(inputType);
    }

    // Default: include all input types (graphql is true or undefined)
    return true;
  }
}