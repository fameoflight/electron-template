/**
 * BuildExecutorService - Handles the actual build execution
 *
 * Responsibilities:
 * - Build frontend assets with Vite
 * - Execute Electron Builder
 * - Collect build artifacts
 * - Handle build errors and recovery
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { cyberOutput } from '../../utils/output.js';
import { FileSystemServiceProvider } from '../../utils/FileSystemService.js';
import { BaseCommand } from '../../utils/BaseCommand.js';

export interface BuildExecutorOptions {
  platform?: 'mac' | 'win' | 'linux' | 'all';
  target?: string[];
  verbose?: boolean;
}

export interface BuildResult {
  success: boolean;
  artifacts: string[];
  duration: number;
  platform: string;
  outputPath: string;
  errors: string[];
}

/**
 * Service for executing the actual build process
 */
export class BuildExecutorService {
  private fileService = FileSystemServiceProvider.getInstance();
  private output: BaseCommand['output'];

  constructor(private options: BuildExecutorOptions, output?: BaseCommand['output']) {
    this.output = output || {
      info: cyberOutput.info.bind(cyberOutput),
      success: cyberOutput.success.bind(cyberOutput),
      warning: cyberOutput.warning.bind(cyberOutput),
      error: cyberOutput.error.bind(cyberOutput),
      progress: cyberOutput.progress.bind(cyberOutput)
    } as BaseCommand['output'];
  }

  /**
   * Execute the complete build pipeline
   */
  async build(config?: Record<string, any>): Promise<BuildResult> {
    const startTime = Date.now();
    const platform = this.options.platform || 'mac';
    const outputPath = this.getOutputPath(platform);

    const result: BuildResult = {
      success: false,
      artifacts: [],
      duration: 0,
      platform,
      outputPath,
      errors: []
    };

    try {
      // Step 1: Build frontend assets
      await this.buildFrontend();

      // Step 2: Build Electron application
      await this.buildElectronApp(config);

      // Step 3: Collect artifacts
      result.artifacts = await this.collectBuildArtifacts();
      result.success = true;

      this.output.success(`✅ ${platform} build completed`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      this.output.error('❌ Build failed', errorMessage);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Build frontend assets using Vite
   */
  private async buildFrontend(): Promise<void> {
    this.output.progress('Building frontend assets with Vite...');

    await this.runCommand('yarn', ['vite', 'build'], 'Vite Builder');
    this.output.success('✅ Frontend built');
  }

  /**
   * Build Electron application using Electron Builder
   */
  private async buildElectronApp(config?: Record<string, any>): Promise<void> {
    this.output.progress('Building Electron application...');

    const buildArgs = ['electron-builder'];

    // Add platform-specific arguments
    const platform = this.options.platform || 'mac';
    if (platform !== 'all') {
      buildArgs.push(`--${platform}`);
    }

    // Add target-specific arguments
    if (this.options.target) {
      for (const target of this.options.target) {
        buildArgs.push('--' + target);
      }
    }

    // Add configuration if provided
    if (config) {
      const configPath = await this.writeBuildConfig(config);
      buildArgs.push('--config', configPath);
    }

    await this.runCommand('yarn', buildArgs, 'Electron Builder');
    this.output.success('✅ Electron application built');
  }

  /**
   * Write build configuration to temporary file
   */
  private async writeBuildConfig(config: Record<string, any>): Promise<string> {
    const configPath = 'build-config.json';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  /**
   * Collect all build artifacts from the output directory
   */
  private async collectBuildArtifacts(): Promise<string[]> {
    const artifacts: string[] = [];
    const outputPath = this.getOutputPath(this.options.platform || 'mac');

    if (!fs.existsSync(outputPath)) {
      this.output.warning(`Output directory not found: ${outputPath}`);
      return artifacts;
    }

    // Find all build artifacts
    const scanDirectory = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          // Include common build artifact types
          const extension = path.extname(item.name).toLowerCase();
          if (['.dmg', '.exe', '.deb', '.rpm', '.zip', '.tar.gz', '.app'].includes(extension)) {
            artifacts.push(fullPath);
          }
        }
      }
    };

    scanDirectory(outputPath);

    if (artifacts.length === 0) {
      this.output.warning('No build artifacts found in output directory');
    }

    return artifacts;
  }

  /**
   * Get the output directory for the specified platform
   */
  private getOutputPath(platform: string): string {
    const outputDirs = {
      mac: 'dist',
      win: 'dist',
      linux: 'dist'
    };

    return outputDirs[platform as keyof typeof outputDirs] || 'dist';
  }

  /**
   * Execute a command with proper error handling
   */
  private async runCommand(command: string, args: string[], name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true,
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      if (!this.options.verbose) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const error = stderr || stdout || `${name} failed with exit code ${code}`;
          reject(new Error(error));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start ${name}: ${error.message}`));
      });

      // Timeout after 10 minutes for safety
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`${name} timed out after 10 minutes`));
      }, 10 * 60 * 1000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Get build statistics
   */
  getBuildStats(result: BuildResult): { totalSize: number; largestFile?: string; fileCount: number } {
    let totalSize = 0;
    let largestFile: { path: string; size: number } | null = null;

    for (const artifact of result.artifacts) {
      if (fs.existsSync(artifact)) {
        const stats = fs.statSync(artifact);
        totalSize += stats.size;

        if (!largestFile || stats.size > largestFile.size) {
          largestFile = { path: artifact, size: stats.size };
        }
      }
    }

    return {
      totalSize,
      largestFile: largestFile?.path,
      fileCount: result.artifacts.length
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}