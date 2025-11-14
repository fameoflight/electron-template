/**
 * EntityFileGenerator - Handles file path generation and writing operations
 *
 * Centralizes all file system operations with proper error handling and logging
 */

import * as fs from 'fs';
import * as path from 'path';
import { writeCodeToFile } from '../utils/format.js';

export class EntityFileGenerator {
  private projectRoot: string;
  private outputDir: string;

  constructor(projectRoot: string = process.cwd(), outputDir?: string) {
    this.projectRoot = projectRoot;
    this.outputDir = outputDir || projectRoot;
  }

  /**
   * Checks if a file exists
   */
  private fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Generates the base entity class file
   */
  generateBaseEntity(className: string, content: string): string {
    const filePath = path.join(this.outputDir, 'main/db/entities/__generated__', `${className}Base.ts`);
    writeCodeToFile(filePath, content);
    return filePath;
  }

  /**
   * Generates the entity extension stub file
   */
  generateEntityExtension(className: string, content: string, force: boolean = false): { path: string; created: boolean } {
    const extensionPath = path.join(this.outputDir, 'main/db/entities', `${className}.ts`);

    // Only create if doesn't exist, unless force=true
    if (this.fileExists(extensionPath) && !force) {
      return { path: extensionPath, created: false };
    }

    writeCodeToFile(extensionPath, content);
    return { path: extensionPath, created: true };
  }

  /**
   * Generates the consolidated inputs file
   */
  generateInputsBase(className: string, content: string): string {
    const inputsPath = path.join(this.outputDir, 'main/graphql/inputs/__generated__', `${className}InputsBase.ts`);
    writeCodeToFile(inputsPath, content);
    return inputsPath;
  }

  /**
   * Generates the inputs extension stub file
   */
  generateInputsExtension(className: string, content: string, force: boolean = false): { path: string; created: boolean } {
    const extensionPath = path.join(this.outputDir, 'main/graphql/inputs', `${className}Inputs.ts`);

    // Only create if doesn't exist, unless force=true
    if (this.fileExists(extensionPath) && !force) {
      console.log(`  ⏭️  Skipped inputs extension (already exists): ${className}Inputs.ts`);
      return { path: extensionPath, created: false };
    }

    writeCodeToFile(extensionPath, content);
    console.log(`  ✅ Created inputs extension: ${className}Inputs.ts`);
    return { path: extensionPath, created: true };
  }

  /**
   * Generates the resolver base class file
   */
  generateResolverBase(className: string, content: string): string {
    const filePath = path.join(this.outputDir, 'main/graphql/resolvers/__generated__', `${className}ResolverBase.ts`);
    writeCodeToFile(filePath, content);
    return filePath;
  }

  /**
   * Generates the resolver extension stub file
   */
  generateResolverExtension(className: string, content: string, force: boolean = false): { path: string; created: boolean } {
    const extensionPath = path.join(this.outputDir, 'main/graphql/resolvers', `${className}Resolver.ts`);

    // Only create if doesn't exist - NEVER overwrite user code, unless force=true
    if (this.fileExists(extensionPath) && !force) {
      console.log(`  ⏭️  Skipped resolver extension (already exists): ${className}Resolver.ts`);
      return { path: extensionPath, created: false };
    }

    writeCodeToFile(extensionPath, content);
    console.log(`  ✅ Created resolver extension: ${className}Resolver.ts`);
    return { path: extensionPath, created: true };
  }
}