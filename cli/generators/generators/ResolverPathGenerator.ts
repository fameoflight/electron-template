/**
 * ResolverPathGenerator - Generates resolverPaths.ts from existing resolvers
 *
 * Scans the resolvers directory and generates the centralized resolver paths file.
 * Handles User and Node resolvers as special cases (hardcoded paths) while dynamically generating
 * paths for all other resolvers.
 */

import * as path from 'path';
import * as fs from 'fs';
import { writeFile } from '../../utils/FileSystemService.js';
import { TemplateManager } from '../managers/TemplateManager.js';

interface ResolverInfo {
  name: string;
  filename: string;
}

export class ResolverPathGenerator {
  private projectRoot: string;
  private resolversDir: string;
  private templateManager: TemplateManager;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.resolversDir = path.join(projectRoot, 'main/graphql/resolvers');
    this.templateManager = new TemplateManager(projectRoot);
  }

  /**
   * Generate resolverPaths.ts file
   */
  async generate(outputPath?: string): Promise<string> {
    const resolvers = this.discoverResolvers();
    const data = this.prepareTemplateData(resolvers);
    const code = this.templateManager.render('paths-resolver', data);

    const targetPath = outputPath || path.join(this.projectRoot, 'main/graphql/resolverPaths.ts');

    // Write the file (TypeScript formatted)
    await writeFile(targetPath, code);

    return targetPath;
  }

  /**
   * Discover all resolvers in the resolvers directory
   */
  private discoverResolvers(): ResolverInfo[] {
    if (!fs.existsSync(this.resolversDir)) {
      return [];
    }

    const resolvers: ResolverInfo[] = [];
    const files = fs.readdirSync(this.resolversDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const resolverName = path.basename(file, '.ts');
        resolvers.push({
          name: resolverName,
          filename: resolverName
        });
      }
    }

    // Sort resolvers alphabetically for consistent ordering
    resolvers.sort((a, b) => a.name.localeCompare(b.name));

    return resolvers;
  }

  /**
   * Prepare template data for paths-resolver.hbs
   */
  private prepareTemplateData(resolvers: ResolverInfo[]) {
    return {
      resolvers: resolvers.map(resolver => ({
        name: resolver.name,
        filename: resolver.filename
      }))
    };
  }

  /**
   * Check if resolverPaths.ts exists and is up to date
   */
  needsRegeneration(): boolean {
    const targetPath = path.join(this.projectRoot, 'main/graphql/resolverPaths.ts');

    if (!fs.existsSync(targetPath)) {
      return true;
    }

    // Check if any resolver file is newer than the resolverPaths.ts file
    const pathsStat = fs.statSync(targetPath);

    for (const resolverFile of fs.readdirSync(this.resolversDir)) {
      if (resolverFile.endsWith('.ts')) {
        const resolverPath = path.join(this.resolversDir, resolverFile);
        const resolverStat = fs.statSync(resolverPath);

        if (resolverStat.mtime > pathsStat.mtime) {
          return true;
        }
      }
    }

    return false;
  }
}