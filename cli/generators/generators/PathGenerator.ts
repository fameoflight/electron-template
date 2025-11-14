/**
 * PathGenerator - Generates entityPaths.ts from existing entities
 *
 * Scans the entities directory and generates the centralized entity paths file.
 * Handles User as a special case (hardcoded path) while dynamically generating
 * paths for all other entities.
 */

import * as path from 'path';
import * as fs from 'fs';
import { writeFile } from '../../utils/FileSystemService.js';
import { TemplateManager } from '../managers/TemplateManager.js';

interface EntityInfo {
  name: string;
  filename: string;
}

export class PathGenerator {
  private projectRoot: string;
  private entitiesDir: string;
  private templateManager: TemplateManager;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.entitiesDir = path.join(projectRoot, 'main/db/entities');
    this.templateManager = new TemplateManager(projectRoot);
  }

  /**
   * Generate entityPaths.ts file
   */
  async generate(outputPath?: string): Promise<string> {
    const entities = this.discoverEntities();
    const data = this.prepareTemplateData(entities);
    const code = this.templateManager.render('paths', data);

    const targetPath = outputPath || path.join(this.projectRoot, 'main/db/entityPaths.ts');

    // Write the file (TypeScript formatted)
    await writeFile(targetPath, code);

    return targetPath;
  }

  /**
   * Discover all entities in the entities directory
   */
  private discoverEntities(): EntityInfo[] {
    if (!fs.existsSync(this.entitiesDir)) {
      return [];
    }

    const entities: EntityInfo[] = [];
    const files = fs.readdirSync(this.entitiesDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);

    for (const file of files) {
      if (file.endsWith('.ts') && !file.startsWith('__')) {
        const entityName = path.basename(file, '.ts');
        entities.push({
          name: entityName,
          filename: entityName
        });
      }
    }

    // Sort entities alphabetically for consistent ordering
    entities.sort((a, b) => a.name.localeCompare(b.name));

    return entities;
  }

  /**
   * Prepare template data for paths.hbs
   */
  private prepareTemplateData(entities: EntityInfo[]) {
    return {
      entities: entities.map(entity => ({
        name: entity.name,
        filename: entity.filename
      }))
    };
  }

  /**
   * Check if entityPaths.ts exists and is up to date
   */
  needsRegeneration(): boolean {
    const targetPath = path.join(this.projectRoot, 'main/db/entityPaths.ts');

    if (!fs.existsSync(targetPath)) {
      return true;
    }

    // Check if any entity file is newer than the entityPaths.ts file
    const pathsStat = fs.statSync(targetPath);

    for (const entityFile of fs.readdirSync(this.entitiesDir)) {
      if (entityFile.endsWith('.ts') && !entityFile.startsWith('__')) {
        const entityPath = path.join(this.entitiesDir, entityFile);
        const entityStat = fs.statSync(entityPath);

        if (entityStat.mtime > pathsStat.mtime) {
          return true;
        }
      }
    }

    return false;
  }
}