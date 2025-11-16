/**
 * NotarizationService - Handles Apple notarization workflow
 *
 * Responsibilities:
 * - Load notarization configuration from JSON file
 * - Upload DMG files for notarization
 * - Handle Apple ID and team credentials
 *
 * Pattern: Service with focused methods (max 5 params rule)
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { FileSystemServiceProvider } from '../../utils/FileSystemService.js';
import { cyberOutput } from '../../utils/output';

export interface NotarizationConfig {
  appleId?: string;
  appleIdPassword?: string;
  teamId?: string;
  certificate?: string;
  certificatePassword?: string;
  provider?: string;
  bundleId?: string;
}

export interface NotarizationOptions {
  config?: NotarizationConfig;
  configPath?: string;
  dmgFile?: string;
}

export class NotarizationService {
  private config: NotarizationConfig = {};

  constructor(opts: NotarizationOptions = {}) {
    if (opts.config) {
      this.config = opts.config;
    }
  }

  /**
   * Load notarization configuration from file
   */
  async loadConfig(configPath?: string): Promise<NotarizationConfig> {
    const configFiles = [
      configPath,
      '.notarization.json',
      '.notarization.config.json',
      'notarization.json'
    ].filter(Boolean) as string[];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const configData = fs.readFileSync(configFile, 'utf8');
          this.config = JSON.parse(configData);
          cyberOutput.success(`Loaded notarization config from ${configFile}`);
          cyberOutput.info(`Apple ID: ${this.maskSensitiveData(this.config.appleId)}`);
          cyberOutput.info(`Team ID: ${this.config.teamId}`);
          cyberOutput.info(`Bundle ID: ${this.config.bundleId}`);
          return this.config;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          cyberOutput.warning(`Could not parse ${configFile}: ${errorMessage}`);
        }
      }
    }

    cyberOutput.info('No notarization configuration found - build will be unsigned');
    return this.config;
  }

  /**
   * Get current configuration
   */
  getConfig(): NotarizationConfig {
    return this.config;
  }

  /**
   * Check if notarization is configured
   */
  isConfigured(): boolean {
    return !!(this.config.appleId && this.config.appleIdPassword && this.config.bundleId);
  }

  /**
   * Notarize all DMG files in dist directory
   */
  async notarize(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Notarization not configured - missing appleId, appleIdPassword, or bundleId');
    }

    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');
    const dmgFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.dmg'));

    if (dmgFiles.length === 0) {
      throw new Error('No DMG files found for notarization');
    }

    const notarizedFiles: string[] = [];

    for (const dmgFile of dmgFiles) {
      const dmgPath = path.join(distPath, dmgFile);

      try {
        await this.notarizeSingleFile(dmgPath);
        notarizedFiles.push(dmgFile);
        cyberOutput.success(`${dmgFile} uploaded for notarization`);
        cyberOutput.info('Check your email for notarization status');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        cyberOutput.error(`Failed to notarize ${dmgFile}: ${errorMessage}`);
        throw error;
      }
    }

    return notarizedFiles;
  }

  /**
   * Notarize a single DMG file
   */
  private async notarizeSingleFile(dmgPath: string): Promise<void> {
    cyberOutput.info(`Uploading ${path.basename(dmgPath)} for notarization...`);

    const uploadArgs = [
      'altool',
      '--notarize-app',
      '--primary-bundle-id', this.config.bundleId || 'com.example.app',
      '--username', this.config.appleId!,
      '--password', this.config.appleIdPassword!,
      '--file', dmgPath
    ];

    if (this.config.teamId) {
      uploadArgs.push('--asc-provider', this.config.teamId);
    }

    await this.execAsync('xcrun', uploadArgs);
  }

  /**
   * Mask sensitive data for logging
   */
  private maskSensitiveData(data?: string): string {
    if (!data) return 'Not set';
    if (data.length <= 4) return '***';
    return `${data.substring(0, 2)}***${data.substring(data.length - 2)}`;
  }

  /**
   * Execute a command and return stdout/stderr
   */
  private async execAsync(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => stdout += data);
      proc.stderr?.on('data', (data) => stderr += data);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
        }
      });

      proc.on('error', reject);
    });
  }
}
