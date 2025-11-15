/**
 * BuildConfigService - Handles build configuration and setup
 *
 * Responsibilities:
 * - Load and validate notarization configuration
 * - Configure Electron Builder settings
 * - Validate build prerequisites
 * - Handle configuration file parsing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { FileSystemServiceProvider } from '../../utils/FileSystemService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NotarizationConfig {
  appleId?: string;
  appleIdPassword?: string;
  teamId?: string;
  certificate?: string;
  certificatePassword?: string;
  provider?: string;
  bundleId?: string;
}

export interface BuildConfigOptions {
  config?: string;
  platform?: 'mac' | 'win' | 'linux' | 'all';
  target?: string[];
}

export interface BuilderConfig {
  config: Record<string, any>;
  signingDetected: boolean;
  platform: string;
}

/**
 * Service for handling build configuration and prerequisites
 */
export class BuildConfigService {
  private notarizationConfig: NotarizationConfig = {};
  private fileService = FileSystemServiceProvider.getInstance();

  constructor(private options: BuildConfigOptions) {}

  /**
   * Load notarization configuration from multiple possible config files
   */
  async loadNotarizationConfig(): Promise<NotarizationConfig> {
    const configFiles = [
      this.options.config,
      '.notarization.json',
      '.notarization.config.json',
      'notarization.json'
    ].filter(Boolean);

    for (const configFile of configFiles) {
      if (configFile && fs.existsSync(configFile)) {
        try {
          const configData = fs.readFileSync(configFile, 'utf8');
          this.notarizationConfig = JSON.parse(configData);
          return this.notarizationConfig;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Could not parse ${configFile}: ${errorMessage}`);
        }
      }
    }

    return this.notarizationConfig;
  }

  /**
   * Configure Electron Builder with appropriate settings
   */
  async configureElectronBuilder(): Promise<BuilderConfig> {
    const packageJsonPath = this.fileService.resolveProjectPath('package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Default configuration
    const config: Record<string, any> = {
      appId: packageJson.name || 'com.example.app',
      productName: packageJson.productName || packageJson.name || 'App',
      directories: {
        output: 'dist',
        buildResources: 'build'
      },
      files: [
        'main/dist/**/*',
        'ui/dist/**/*',
        'preload.cjs',
        'package.json'
      ],
      extraResources: [
        {
          from: '.data',
          to: '.data',
          filter: ['**/*']
        }
      ]
    };

    // Platform-specific configuration
    if (this.options.platform === 'mac' || this.options.platform === 'all') {
      config.mac = {
        category: 'public.app-category.productivity',
        target: this.options.target || ['dmg'],
        hardenedRuntime: true
      };
    }

    if (this.options.platform === 'win' || this.options.platform === 'all') {
      config.win = {
        target: this.options.target || ['nsis']
      };
    }

    if (this.options.platform === 'linux' || this.options.platform === 'all') {
      config.linux = {
        target: this.options.target || ['AppImage']
      };
    }

    // Detect signing configuration
    const signingDetected = this.detectSigningConfiguration();

    return {
      config,
      signingDetected,
      platform: this.options.platform || 'mac'
    };
  }

  /**
   * Validate that all build prerequisites are met
   */
  async validatePrerequisites(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check for required directories
    const requiredDirs = ['main', 'ui', 'preload.cjs'];
    for (const dir of requiredDirs) {
      if (dir.endsWith('.cjs')) {
        if (!fs.existsSync(dir)) {
          issues.push(`Required file not found: ${dir}`);
        }
      } else {
        if (!fs.existsSync(dir)) {
          issues.push(`Required directory not found: ${dir}`);
        }
      }
    }

    // Check package.json
    if (!fs.existsSync('package.json')) {
      issues.push('package.json not found');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Check if code signing configuration is available
   */
  private detectSigningConfiguration(): boolean {
    return !!(
      this.notarizationConfig.appleId ||
      this.notarizationConfig.certificate ||
      fs.existsSync('build/cert.p12')
    );
  }

  /**
   * Mask sensitive data for display
   */
  maskSensitiveData(value?: string): string {
    if (!value) return 'Not configured';

    if (value.length <= 4) return '****';

    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(Math.max(4, value.length - 4));

    return `${start}${middle}${end}`;
  }

  /**
   * Get current notarization configuration
   */
  getNotarizationConfig(): NotarizationConfig {
    return { ...this.notarizationConfig };
  }
}