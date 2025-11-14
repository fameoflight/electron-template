/**
 * Configuration management utilities for CLI commands
 */
import { FileSystemService } from './FileSystemService.js';
import * as path from 'path';

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  build?: {
    files?: string[];
    mac?: {
      icon?: string;
      identity?: string | null;
      hardenedRuntime?: boolean;
      entitlements?: string;
      entitlementsInherit?: string;
      gatekeeperAssess?: boolean;
      category?: string;
      title?: string;
    };
    win?: {
      icon?: string;
      title?: string;
    };
    linux?: {
      icon?: string;
    };
    dmg?: {
      icon?: string;
      title?: string;
      contents?: Array<{
        x: number;
        y: number;
        type?: string;
        path?: string;
      }>;
    };
    npmRebuild?: boolean;
    afterSign?: string;
  };
}

export interface NotarizationConfig {
  appleId?: string;
  appleIdPassword?: string;
  teamId?: string;
  certificate?: string;
  certificatePassword?: string;
  provider?: string;
  bundleId?: string;
}

export class ConfigManager {
  private fileService: FileSystemService;

  constructor(fileService: FileSystemService = new FileSystemService()) {
    this.fileService = fileService;
  }

  /**
   * Read and parse package.json
   */
  async readPackageJson(): Promise<PackageJson> {
    return await this.fileService.readJson('package.json');
  }

  /**
   * Write package.json with formatting
   */
  async writePackageJson(data: PackageJson): Promise<void> {
    await this.fileService.writeFile('package.json', JSON.stringify(data, null, 2));
  }

  /**
   * Update specific fields in package.json
   */
  async updatePackageJson(updates: Partial<PackageJson>): Promise<void> {
    const current = await this.readPackageJson();
    const updated = this.deepMerge(current, updates);
    await this.writePackageJson(updated);
  }

  /**
   * Load notarization configuration from various possible files
   */
  async loadNotarizationConfig(configPath?: string): Promise<NotarizationConfig | null> {
    const configFiles = [
      configPath,
      '.notarization.json',
      '.notarization.config.json',
      'notarization.json'
    ].filter(Boolean) as string[];

    for (const configFile of configFiles) {
      try {
        const config = await this.fileService.readJson(configFile);
        return config as NotarizationConfig;
      } catch (error) {
        // Continue to next file if current one doesn't exist or is invalid
        continue;
      }
    }

    return null;
  }

  /**
   * Ensure build configuration exists in package.json
   */
  async ensureBuildConfig(): Promise<PackageJson['build']> {
    const packageJson = await this.readPackageJson();

    if (!packageJson.build) {
      packageJson.build = {};
    }

    await this.writePackageJson(packageJson);
    return packageJson.build;
  }

  /**
   * Update build configuration for different platforms
   */
  async updateBuildConfig(config: {
    mac?: any;
    win?: any;
    linux?: any;
    dmg?: any;
    files?: string[];
    npmRebuild?: boolean;
  }): Promise<void> {
    const buildConfig = await this.ensureBuildConfig();

    if (config.mac && buildConfig) {
      buildConfig.mac = { ...(buildConfig.mac as any), ...config.mac };
    }

    if (config.win && buildConfig) {
      buildConfig.win = { ...(buildConfig.win as any), ...config.win };
    }

    if (config.linux && buildConfig) {
      buildConfig.linux = { ...(buildConfig.linux as any), ...config.linux };
    }

    if (config.dmg && buildConfig) {
      buildConfig.dmg = { ...(buildConfig.dmg as any), ...config.dmg };
    }

    if (config.files && buildConfig) {
      buildConfig.files = config.files;
    }

    if (typeof config.npmRebuild === 'boolean' && buildConfig) {
      buildConfig.npmRebuild = config.npmRebuild;
    }

    await this.updatePackageJson({ build: buildConfig });
  }

  /**
   * Set icon paths in build configuration
   */
  async setIconPaths(iconDir: string = 'build/icons'): Promise<void> {
    await this.updateBuildConfig({
      mac: { icon: path.join(iconDir, 'icon.icns') },
      win: { icon: path.join(iconDir, 'icon.ico') },
      linux: { icon: path.join(iconDir, 'linux/') },
      dmg: { icon: path.join(iconDir, 'icon.icns') }
    });
  }

  /**
   * Get application name from package.json
   */
  async getAppName(): Promise<string> {
    const packageJson = await this.readPackageJson();
    return packageJson.name || 'electron-app';
  }

  /**
   * Get application version from package.json
   */
  async getAppVersion(): Promise<string> {
    const packageJson = await this.readPackageJson();
    return packageJson.version || '1.0.0';
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data?: string): string {
    if (!data) return 'Not configured';

    // Simple masking - show first 2 and last 2 characters
    if (data.length > 4) {
      return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
    }

    return '*'.repeat(data.length);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || ({} as any), source[key] as any);
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }

    return result;
  }

  /**
   * Create a backup of a configuration file
   */
  async backupConfig(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    try {
      const content = await this.fileService.readJson(filePath);
      await this.fileService.writeFile(backupPath, JSON.stringify(content, null, 2));
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to backup ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate configuration structure
   */
  validateBuildConfig(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Build configuration must be an object');
      return { valid: false, errors };
    }

    // Check for required fields for different platforms
    if (config.mac && typeof config.mac !== 'object') {
      errors.push('mac configuration must be an object');
    }

    if (config.win && typeof config.win !== 'object') {
      errors.push('win configuration must be an object');
    }

    if (config.linux && typeof config.linux !== 'object') {
      errors.push('linux configuration must be an object');
    }

    return { valid: errors.length === 0, errors };
  }
}