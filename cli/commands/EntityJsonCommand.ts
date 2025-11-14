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
import chalk from 'chalk';

// Export individual functions for direct use
export async function generateAllEntities(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateAllEntitiesInternal(schemasDir, force, 'all');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export async function generateAllEntitiesInputs(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateAllEntitiesInternal(schemasDir, force, 'inputs');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export async function generateAllEntitiesResolvers(force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateAllEntitiesInternal(schemasDir, force, 'resolvers');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export async function generateSingleEntity(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateEntityInternal(schemasDir, name, force, 'all');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export async function generateSingleEntityInputs(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateEntityInternal(schemasDir, name, force, 'inputs');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export async function generateSingleEntityResolver(name: string, force: boolean = false): Promise<void> {
  const schemasDir = path.join(process.cwd(), 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(chalk.red('❌ schemas/ directory not found'));
    console.log(chalk.yellow('💡 Create schemas/ directory and add .json files'));
    process.exit(1);
  }

  try {
    await generateEntityInternal(schemasDir, name, force, 'resolvers');
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  }
}

export function registerEntityJsonCommand(program: Command) {
  // Note: Individual entity generation commands have been removed.
  // Use `yarn utils schema` or `yarn graphql` instead for entity generation.
}

async function generateAllEntitiesInternal(schemasDir: string, force: boolean = false, type: 'all' | 'entities' | 'inputs' | 'resolvers' = 'all'): Promise<void> {
  const typeLabel = type === 'all' ? 'entities, inputs, and resolvers' : type;
  console.log(chalk.bold(`\n🚀 Generating ${typeLabel} from JSON schemas...\n`));

  // Find all .json files recursively (excluding entity-schema.json)
  const entityFiles = findEntityFiles(schemasDir);

  if (entityFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No entity JSON files found in schemas/'));
    console.log(chalk.gray('   Create files like: schemas/Post.json'));
    return;
  }

  console.log(chalk.gray(`Found ${entityFiles.length} entity file(s)\n`));

  let generatedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const factory = new GeneratorFactory({ force });

  for (const filePath of entityFiles) {
    const relativePath = path.relative(schemasDir, filePath);
    console.log(chalk.cyan(`📄 Processing: ${relativePath}`));

    try {
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
          console.log(chalk.green(`   ✓ Generated new ${type}`));
        } else {
          updatedCount++;
          console.log(chalk.blue(`   ✓ Updated existing ${type}`));
        }

        // Log generated files
        if (result.entity) {
          console.log(chalk.gray(`     Entity Base: ${path.relative(process.cwd(), result.entity.basePath)}`));
          console.log(chalk.gray(`     Entity Ext:  ${path.relative(process.cwd(), result.entity.extensionPath)}`));
        }
        if (result.inputs) {
          console.log(chalk.gray(`     Inputs:      ${path.relative(process.cwd(), result.inputs.inputsPath)}`));
        }
        if (result.resolver) {
          console.log(chalk.gray(`     Resolver:    ${path.relative(process.cwd(), result.resolver.resolverPath)}`));
        }
      } else {
        errorCount++;
        console.error(chalk.red(`   ✗ Failed: ${result.errors?.join(', ')}`));
      }
      console.log('');
    } catch (error) {
      errorCount++;
      console.error(chalk.red(`   ✗ Failed: ${error}`));
      console.log('');
    }
  }

  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  if (generatedCount > 0) console.log(chalk.green(`✓ Generated: ${generatedCount} new ${type}`));
  if (updatedCount > 0) console.log(chalk.blue(`✓ Updated: ${updatedCount} existing ${type}`));
  if (errorCount > 0) console.log(chalk.red(`✗ Errors: ${errorCount} failed`));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.yellow('💡 Next steps:'));
  if (type === 'all' || type === 'entities') {
    console.log(chalk.gray('   1. Review generated files in main/db/entities/'));
    console.log(chalk.gray('   2. Customize in main/db/entities/*.ts (not in generated/)'));
  }
  if (type === 'all' || type === 'inputs' || type === 'resolvers') {
    console.log(chalk.gray('   3. Run: yarn graphql (to update GraphQL schema)'));
  }
  console.log(chalk.gray('   4. Run: yarn type-check (to verify types)\n'));
}

async function generateEntityInternal(schemasDir: string, name: string, force: boolean = false, type: 'all' | 'entities' | 'inputs' | 'resolvers' = 'all'): Promise<void> {
  const typeLabel = type === 'all' ? 'entity, inputs, and resolver' : type;
  console.log(chalk.bold(`\n🚀 Generating ${typeLabel} for: ${name}\n`));

  const entityFile = findEntityFile(schemasDir, name);

  if (!entityFile) {
    console.error(chalk.red(`❌ Entity file not found: ${name}.json`));
    console.log(chalk.gray(`   Searched in: ${schemasDir}`));
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
    console.log(chalk.green(`✓ Generated ${typeLabel} for: ${name}`));

    // Log generated files
    if (result.entity) {
      console.log(chalk.gray(`  Entity Base: ${path.relative(process.cwd(), result.entity.basePath)}`));
      console.log(chalk.gray(`  Entity Ext:  ${path.relative(process.cwd(), result.entity.extensionPath)}`));
    }
    if (result.inputs) {
      console.log(chalk.gray(`  Inputs:      ${path.relative(process.cwd(), result.inputs.inputsPath)}`));
    }
    if (result.resolver) {
      console.log(chalk.gray(`  Resolver:    ${path.relative(process.cwd(), result.resolver.resolverPath)}`));
    }
  } else {
    console.error(chalk.red(`❌ Generation failed: ${result.errors?.join(', ')}`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.yellow('💡 Next steps:'));
  if (type === 'all' || type === 'entities') {
    console.log(chalk.gray(`   1. Customize in main/db/entities/${name}.ts`));
  }
  if (type === 'all' || type === 'inputs' || type === 'resolvers') {
    console.log(chalk.gray('   2. Run: yarn graphql'));
  }
  console.log(chalk.gray('   3. Run: yarn type-check\n'));
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
