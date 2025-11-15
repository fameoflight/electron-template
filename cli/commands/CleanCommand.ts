import { BaseCommand, type CommandResult } from '../utils/BaseCommand.js';
import { FileSystemService, type FileOperationOptions } from '../utils/index.js';

interface CleanOptions {
  data: boolean;
  nodeModules: boolean;
  js: boolean;
  cache: boolean;
  build: boolean;
  maps: boolean;
  logs: boolean;
  generated: boolean;
  dryRun: boolean;
}

interface CleanResult {
  removed: string[];
  errors: string[];
  skipped: string[];
}

/**
 * Clean Command - Remove build artifacts and generated files
 */
export class CleanCommand extends BaseCommand {
  private fileService = new FileSystemService();

  async run(options: Record<string, unknown>): Promise<CommandResult<CleanResult>> {
    const cleanOptions = options as unknown as CleanOptions;

    const combinedResult: CleanResult = {
      removed: [],
      errors: [],
      skipped: []
    };

    // Clean .data directory
    if (cleanOptions.data) {
      const result = await this.fileService.cleanDirectory('.data', 'Data directory', {
        dryRun: cleanOptions.dryRun,
        verbose: this.opts.verbose ?? false
      });
      this.combineResults(combinedResult, result);
    }

    // Clean .node_modules directory
    if (cleanOptions.nodeModules) {
      const result = await this.fileService.cleanDirectory('.node_modules', 'Node modules directory', {
        dryRun: cleanOptions.dryRun,
        verbose: this.opts.verbose ?? false
      });
      this.combineResults(combinedResult, result);
    }

    // Clean compiled JS files
    if (cleanOptions.js) {
      const result = await this.cleanJsFiles(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Clean cache directories
    if (cleanOptions.cache) {
      const result = await this.cleanCacheDirectories(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Clean build artifacts
    if (cleanOptions.build) {
      const result = await this.cleanBuildArtifacts(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Clean source maps
    if (cleanOptions.maps) {
      const result = await this.cleanSourceMaps(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Clean log files
    if (cleanOptions.logs) {
      const result = await this.cleanLogFiles(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Clean generated files
    if (cleanOptions.generated) {
      const result = await this.cleanGeneratedFiles(cleanOptions.dryRun);
      this.combineResults(combinedResult, result);
    }

    // Generate summary message
    const totalItems = combinedResult.removed.length + combinedResult.errors.length + combinedResult.skipped.length;

    if (combinedResult.removed.length > 0) {
      this.success(`Removed ${combinedResult.removed.length} item(s)`);
    }

    if (combinedResult.errors.length > 0) {
      this.warning(`${combinedResult.errors.length} item(s) had errors`);
    }

    if (combinedResult.skipped.length > 0) {
      this.info(`${combinedResult.skipped.length} item(s) skipped (not found)`);
    }

    const success = combinedResult.errors.length === 0;
    const message = success
      ? `Clean completed successfully. Processed ${totalItems} item(s).`
      : `Clean completed with ${combinedResult.errors.length} error(s).`;

    return { success, message, data: combinedResult };
  }

  /**
   * Combine multiple clean results
   */
  private combineResults(target: CleanResult, source: CleanResult): void {
    target.removed.push(...source.removed);
    target.errors.push(...source.errors);
    target.skipped.push(...source.skipped);
  }


  /**
   * Clean compiled JS files in main and ui directories
   */
  private async cleanJsFiles(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning compiled JS files...');

    const patterns = [
      /\.js$/ // JS files in main and ui directories
    ];

    const directories = ['main', 'ui'];
    return await this.fileService.cleanFilesByPattern(patterns, directories, {
      dryRun,
      verbose: this.opts.verbose ?? false
    });
  }

  /**
   * Clean cache directories
   */
  private async cleanCacheDirectories(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning cache directories...');

    const cacheDirs = [
      /\.cache$/, // Node modules cache
      /\.vite$/, // Vite cache
      /\.vite-temp$/ // Vite temp cache
    ];

    return await this.fileService.cleanFilesByPattern(cacheDirs, ['node_modules'], {
      dryRun,
      verbose: this.opts.verbose ?? false
    });
  }

  /**
   * Clean build artifacts
   */
  private async cleanBuildArtifacts(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning build artifacts...');

    const result: CleanResult = { removed: [], errors: [], skipped: [] };

    const buildDirs = [
      'dist',
      'out',
      'build',
      'release',
      '.webpack',
      'dist_electron'
    ];

    for (const buildDir of buildDirs) {
      const dirResult = await this.fileService.cleanDirectory(buildDir, `Build directory (${buildDir})`, {
        dryRun,
        verbose: this.opts.verbose ?? false
      });
      this.combineResults(result, dirResult);
    }

    return result;
  }

  /**
   * Clean source map files
   */
  private async cleanSourceMaps(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning source map files...');

    const patterns = [
      /\.js\.map$/ // Source map files
    ];

    const directories = ['ui', 'main', 'shared'];
    return await this.fileService.cleanFilesByPattern(patterns, directories, {
      dryRun,
      verbose: this.opts.verbose ?? false
    });
  }

  /**
   * Clean log files
   */
  private async cleanLogFiles(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning log files...');

    const result: CleanResult = { removed: [], errors: [], skipped: [] };

    // Remove log directories
    const logDirResult = await this.fileService.cleanDirectory('logs', 'Logs directory', {
      dryRun,
      verbose: this.opts.verbose ?? false
    });
    this.combineResults(result, logDirResult);

    // Remove *.log files in root
    const patterns = [
      /\.log$/ // Log files
    ];

    const logFileResult = await this.fileService.cleanFilesByPattern(patterns, ['.'], {
      dryRun,
      verbose: this.opts.verbose ?? false
    });
    this.combineResults(result, logFileResult);

    return result;
  }

  /**
   * Clean generated files and folders
   */
  private async cleanGeneratedFiles(dryRun: boolean): Promise<CleanResult> {
    this.progress('Cleaning generated files...');

    const result: CleanResult = { removed: [], errors: [], skipped: [] };

    // Find and remove all __generated__ directories
    const generatedDirs = ['ui', 'main', 'shared', 'tui', '__tests__'];

    for (const dir of generatedDirs) {
      const generatedResult = await this.fileService.cleanDirectory(
        `${dir}/__generated__`,
        `Generated files directory (${dir}/__generated__)`,
        { dryRun, verbose: this.opts.verbose ?? false }
      );
      this.combineResults(result, generatedResult);
    }

    // Also remove any __generated__ directories in subdirectories
    const subDirPatterns = [
      /__generated__/ // Generated files directories
    ];

    const subDirResult = await this.fileService.cleanFilesByPattern(
      subDirPatterns,
      ['ui', 'main', 'shared', 'tui', '__tests__'],
      { dryRun, verbose: this.opts.verbose ?? false }
    );
    this.combineResults(result, subDirResult);

    return result;
  }
}