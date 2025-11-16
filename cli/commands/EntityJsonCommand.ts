/**
 * EntityJsonCommand - Generate entities from JSON schema files
 *
 * Usage:
 *   yarn entity:generate           # Generate all entities from schemas/
 *   yarn entity:generate Post      # Generate specific entity
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { EntityJsonParser } from '../parsers/EntityJsonParser.js';
import { GeneratorFactory } from '../generators/GeneratorFactory.js';
import { output } from '../utils/output.js';

// Export individual functions for direct use
export async function generateAllEntities(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateAllEntitiesInternal(schemasDir, force, 'all');

}

export async function generateAllEntitiesInputs(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateAllEntitiesInternal(schemasDir, force, 'inputs');

}

export async function generateAllEntitiesResolvers(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateAllEntitiesInternal(schemasDir, force, 'resolvers');
}

export async function generateSingleEntity(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateEntityInternal(schemasDir, name, force, 'all');
}

export async function generateSingleEntityInputs(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateEntityInternal(schemasDir, name, force, 'inputs');
}

export async function generateSingleEntityResolver(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    output.error('schemas/ directory not found');
    output.info('Create schemas/ directory and add .json files');
    process.exit(1);
  }

  await generateEntityInternal(schemasDir, name, force, 'resolvers');
}

export function registerEntityJsonCommand(program: Command) {
  // Note: Individual entity generation commands have been removed.
  // Use `yarn utils schema` or `yarn graphql` instead for entity generation.
}

async function generateAllEntitiesInternal(schemasDir: string, force: boolean = false, type: 'all' | 'entities' | 'inputs' | 'resolvers' = 'all'): Promise<void> {
  const typeLabel = type === 'all' ? 'entities, inputs, and resolvers' : type;
  output.info(`Generating ${typeLabel} from JSON schemas...`);

  // Find all .json files recursively (excluding entity-schema.json)
  const entityFiles = findEntityFiles(schemasDir);

  if (entityFiles.length === 0) {
    output.warning('No entity JSON files found in schemas/');
    output.info('Create files like: schemas/Post.json');
    return;
  }

  output.info(`Found ${entityFiles.length} entity file(s)`);

  let generatedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const factory = new GeneratorFactory({ force });

  for (const filePath of entityFiles) {
    const relativePath = path.relative(schemasDir, filePath);
    output.info(`Processing: ${relativePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = EntityJsonParser.parseFile(content);

    let result;
    switch (type) {
      case 'entities':
        result = await factory.generateEntity(parsed);
        break;
      case 'inputs':
        result = factory.generateInputs(parsed);
        break;
      case 'resolvers':
        result = factory.generateResolver(parsed);
        break;
      case 'all':
      default:
        result = await factory.generateAll(parsed);
        break;
    }

    if (result.success) {
      if (result.entity?.extensionCreated) {
        generatedCount++;
        output.success(`Generated new ${type}`);
      } else {
        updatedCount++;
        output.info(`Updated existing ${type}`);
      }

      // Log generated files
      if (result.entity) {
        output.info(`Entity Base: ${path.relative(process.cwd(), result.entity.basePath)}`);
        output.info(`Entity Ext:  ${path.relative(process.cwd(), result.entity.extensionPath)}`);
      }
      if (result.inputs) {
        output.info(`Inputs:      ${path.relative(process.cwd(), result.inputs.inputsPath)}`);
      }
      if (result.resolver) {
        output.info(`Resolver:    ${path.relative(process.cwd(), result.resolver.resolverPath)}`);
      }
    } else {
      errorCount++;
      output.error(`Failed: ${result.errors?.join(', ')}`);
    }

  }

  // Summary
  if (generatedCount > 0) output.success(`Generated: ${generatedCount} new ${type}`);
  if (updatedCount > 0) output.info(`Updated: ${updatedCount} existing ${type}`);
  if (errorCount > 0) output.error(`Errors: ${errorCount} failed`);

  // Next steps
  output.info('Next steps:');
  if (type === 'all' || type === 'entities') {
    output.info('1. Review generated files in main/db/entities/');
    output.info('2. Customize in main/db/entities/*.ts (not in generated/)');
  }
  if (type === 'all' || type === 'inputs' || type === 'resolvers') {
    output.info('3. Run: yarn graphql (to update GraphQL schema)');
  }
  output.info('4. Run: yarn type-check (to verify types)');
}

async function generateEntityInternal(schemasDir: string, name: string, force: boolean = false, type: 'all' | 'entities' | 'inputs' | 'resolvers' = 'all'): Promise<void> {
  const typeLabel = type === 'all' ? 'entity, inputs, and resolver' : type;
  output.info(`Generating ${typeLabel} for: ${name}`);

  const entityFile = findEntityFile(schemasDir, name);

  if (!entityFile) {
    output.error(`Entity file not found: ${name}.json`);
    output.info(`Searched in: ${schemasDir}`);
    process.exit(1);
  }

  const content = fs.readFileSync(entityFile, 'utf-8');
  const parsed = EntityJsonParser.parseFile(content);
  const factory = new GeneratorFactory({ force });

  let result;
  switch (type) {
    case 'entities':
      result = await factory.generateEntity(parsed);
      break;
    case 'inputs':
      result = factory.generateInputs(parsed);
      break;
    case 'resolvers':
      result = factory.generateResolver(parsed);
      break;
    case 'all':
    default:
      result = await factory.generateAll(parsed);
      break;
  }

  if (result.success) {
    output.success(`Generated ${typeLabel} for: ${name}`);

    // Log generated files
    if (result.entity) {
      output.info(`Entity Base: ${path.relative(process.cwd(), result.entity.basePath)}`);
      output.info(`Entity Ext:  ${path.relative(process.cwd(), result.entity.extensionPath)}`);
    }
    if (result.inputs) {
      output.info(`Inputs:      ${path.relative(process.cwd(), result.inputs.inputsPath)}`);
    }
    if (result.resolver) {
      output.info(`Resolver:    ${path.relative(process.cwd(), result.resolver.resolverPath)}`);
    }
  } else {
    output.error(`Generation failed: ${result.errors?.join(', ')}`);
    process.exit(1);
  }

  output.info('Next steps:');
  if (type === 'all' || type === 'entities') {
    output.info(`1. Customize in main/db/entities/${name}.ts`);
  }
  if (type === 'all' || type === 'inputs' || type === 'resolvers') {
    output.info('2. Run: yarn graphql');
  }
  output.info('3. Run: yarn type-check');
}

function findEntityFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        entry.name !== 'entity-schema.json' // Skip the JSON schema definition file
      ) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function findEntityFile(dir: string, name: string): string | null {
  const fileName = `${name}.json`;

  function search(currentDir: string): string | null {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        const found = search(fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name === fileName) {
        return fullPath;
      }
    }

    return null;
  }

  return search(dir);
}
