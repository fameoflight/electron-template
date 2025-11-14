/**
 * Build Command - Create production builds with notarization support
 *
 * Features:
 * - Reads .notarization.json configuration if available
 * - Creates hardened DMG builds
 * - Supports multiple build targets
 * - Handles code signing and notarization
 * - Provides clear build feedback
 */

import { BaseCommand } from '../utils/BaseCommand.js';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateSchema } from '../utils/generateSchema.js';
import { FileSystemServiceProvider } from '../utils/FileSystemService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NotarizationConfig {
  appleId?: string;
  appleIdPassword?: string;
  teamId?: string;
  certificate?: string;
  certificatePassword?: string;
  provider?: string;
  bundleId?: string;
}

interface BuildOptions {
  target?: string[];
  platform?: 'mac' | 'win' | 'linux' | 'all';
  hardened?: boolean;
  notarize?: boolean;
  skipCodeGen?: boolean;
  config?: string;
}

interface BuildResult {
  success: boolean;
  platform: string;
  artifacts: string[];
  notarized: boolean;
  hardened: boolean;
  duration: number;
}

/**
 * Build Command class
 */
export class BuildCommand extends BaseCommand {
  private notarizationConfig: NotarizationConfig = {};

  async run(options: BuildOptions): Promise<{ success: boolean; message: string; data: BuildResult }> {
    const startTime = Date.now();

    this.info('🏗️  Starting production build...\n');

    const result: BuildResult = {
      success: false,
      platform: options.platform || 'mac',
      artifacts: [],
      notarized: false,
      hardened: options.hardened !== false, // Default to true
      duration: 0
    };

    try {
      // Step 1: Load notarization configuration
      await this.loadNotarizationConfig(options.config);

      // Step 2: Generate code if not skipped
      if (!options.skipCodeGen) {
        this.step(1, 6, 'Generating GraphQL schema and Relay code...');
        await generateSchema();
        await this.runCommand('yarn', ['relay'], 'Relay Compiler');
        this.success('✅ Code generation completed\n');
      } else {
        this.info('⏭️  Skipping code generation');
      }

      // Step 3: Type checking
      this.step(2, 6, 'Type checking...');
      await this.runCommand('yarn', ['tsc'], 'TypeScript Compiler');
      this.success('✅ Type checking passed\n');

      // Step 4: Build frontend
      this.step(3, 6, 'Building frontend assets...');
      await this.runCommand('yarn', ['vite', 'build'], 'Vite Builder');
      this.success('✅ Frontend built\n');

      // Step 5: Copy preload script
      this.step(4, 7, 'Preparing preload script...');
      await this.copyPreloadScript();
      this.success('✅ Preload script prepared\n');

      // Step 6: Copy entitlements file
      this.step(5, 7, 'Preparing entitlements...');
      await this.copyEntitlementsFile();
      this.success('✅ Entitlements prepared\n');

      // Step 7: Configure Electron Builder
      this.step(6, 7, 'Configuring Electron Builder...');
      await this.configureElectronBuilder(options);
      this.success('✅ Build configuration prepared\n');

      // Step 8: Build application
      this.step(7, 7, 'Building application...');
      const buildArgs = await this.buildElectronApp(options);
      this.success('✅ Application built\n');

      // Step 9: Post-build processing
      if (options.hardened !== false && result.platform === 'mac') {
        this.separator();
        this.info('🔒 Applying hardened runtime...');
        await this.applyHardenedRuntime();
        this.success('✅ Hardened runtime applied\n');
      }

      // Step 10: Notarization (if configured)
      if (this.notarizationConfig.appleId && options.notarize !== false && result.platform === 'mac') {
        this.separator();
        this.info('📬 Starting notarization...');
        await this.notarizeApplication();
        result.notarized = true;
        this.success('✅ Notarization completed\n');
      } else if (result.platform === 'mac') {
        this.info('ℹ️  Skipping notarization (no configuration found or explicitly disabled)');
      }

      // Collect build artifacts
      result.artifacts = await this.collectBuildArtifacts();
      result.success = true;
      result.duration = Date.now() - startTime;

      this.separator();
      this.success('🎉 Build completed successfully!');
      this.printBuildSummary(result);

      return {
        success: true,
        message: 'Build completed successfully',
        data: result
      };

    } catch (error) {
      result.duration = Date.now() - startTime;
      this.error('❌ Build failed:', error);

      return {
        success: false,
        message: `Build failed: ${error instanceof Error ? error.message : String(error)}`,
        data: result
      };
    }
  }

  /**
   * Load notarization configuration from .notarization.json
   */
  private async loadNotarizationConfig(configPath?: string): Promise<void> {
    const configFiles = [
      configPath,
      '.notarization.json',
      '.notarization.config.json',
      'notarization.json'
    ].filter(Boolean);

    for (const configFile of configFiles) {
      if (configFile && fs.existsSync(configFile)) {
        try {
          const configData = fs.readFileSync(configFile, 'utf8');
          this.notarizationConfig = JSON.parse(configData);
          this.success(`✅ Loaded notarization config from ${configFile}`);
          this.info('   Apple ID:', this.maskSensitiveData(this.notarizationConfig.appleId));
          this.info('   Team ID:', this.notarizationConfig.teamId);
          this.info('   Bundle ID:', this.notarizationConfig.bundleId);
          this.separator();
          return;
        } catch (error) {
          this.warning(`⚠️  Could not parse ${configFile}:`, error);
        }
      }
    }

    this.info('ℹ️  No notarization configuration found - build will be unsigned');
  }

  /**
   * Configure Electron Builder with appropriate settings and signing detection
   */
  private async configureElectronBuilder(options: BuildOptions): Promise<void> {
    const packageJsonPath = FileSystemServiceProvider.getInstance().resolveProjectPath('package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Ensure build configuration exists
    if (!packageJson.build) {
      packageJson.build = {};
    }

    const build = packageJson.build;

    // Configure for macOS by default
    if (options.platform === 'mac' || options.platform === 'all') {
      build.mac = {
        ...build.mac,
        category: 'public.app-category.productivity',
        hardenedRuntime: true,
        entitlements: 'build/entitlements.mac.plist',
        entitlementsInherit: 'build/entitlements.mac.plist',
        gatekeeperAssess: false
      };

      // Detect and handle signing configuration
      const signingIdentity = await this.detectSigningIdentity();
      if (signingIdentity === null) {
        build.mac.identity = null;
        this.info('🔓 Code signing disabled - no valid certificate found');
      } else if (signingIdentity === 'invalid') {
        this.warning('⚠️  Code signing certificate exists but may be invalid');
        this.info('💡 Build will attempt signing but may timeout');
        this.info('💡 Set "identity": null in package.json to disable signing');
      } else {
        this.info(`🔏 Using code signing identity: ${signingIdentity}`);
      }

      // Configure DMG without optional assets
      build.dmg = {
        ...build.dmg,
        title: '${productName} ${version}',
        contents: [
          {
            x: 130,
            y: 220
          },
          {
            x: 410,
            y: 220,
            type: 'link',
            path: '/Applications'
          }
        ]
      };
    }

    // Add notarization configuration if available
    if (this.notarizationConfig.appleId) {
      build.afterSign = 'scripts/notarize.js';
    }

    // Skip rebuilding native dependencies to avoid Python/distutils issues
    build.npmRebuild = false;

    // Write updated package.json
    const fileService = FileSystemServiceProvider.getInstance();
    await fileService.writeFile(packageJsonPath, packageJson);
  }

  /**
   * Detect available code signing identities
   */
  private async detectSigningIdentity(): Promise<string | null> {
    try {
      // Try to find valid signing certificates
      const { stdout } = await this.execAsync('security', [
        'find-identity',
        '-v',
        '-p',
        'codesigning'
      ]);

      const identities = stdout.split('\n')
        .filter(line => line.includes('iPhone Developer') || line.includes('Developer ID Application'))
        .filter(line => !line.includes('(CSSMERR_TP_CERT_REVOKED)'))
        .filter(line => !line.includes('(CSSMERR_TP_CERT_EXPIRED)'));

      if (identities.length === 0) {
        return null;
      }

      // Return the first valid identity hash
      const match = identities[0].match(/([A-F0-9]{40})/);
      return match ? match[1] : 'invalid';

    } catch (error) {
      this.warning('Could not check for code signing identities:', error);
      return null;
    }
  }

  /**
   * Execute a command and return stdout
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

  /**
   * Build the Electron application with timeout and fallback logic
   */
  private async buildElectronApp(options: BuildOptions): Promise<string[]> {
    const buildArgs = ['electron-builder'];

    // Add platform
    if (options.platform && options.platform !== 'all') {
      buildArgs.push(`--${options.platform}`);
    }

    // Add architecture (detect current platform)
    buildArgs.push(`--${process.arch}`);

    // Skip publishing
    buildArgs.push('--publish', 'never');

    // Add config if specified
    if (options.config) {
      buildArgs.push('--config', options.config);
    }

    // Prepare fallback command that builds without signing
    const fallbackArgs = [...buildArgs, '--config.mac.identity=null'];

    await this.runCommand('yarn', buildArgs, 'Electron Builder', {
      timeout: 300000, // 5 minutes timeout for Electron Builder
      retries: 1,
      fallbackCommand: {
        command: 'yarn',
        args: fallbackArgs
      },
      onTimeout: () => {
        this.warning('\n⏰ Electron Builder timed out - this often happens with code signing issues');
        this.info('🔄 Trying to build without code signing...');
      }
    });

    return buildArgs;
  }

  /**
   * Apply hardened runtime to macOS builds
   */
  private async applyHardenedRuntime(): Promise<void> {
    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');

    if (!fs.existsSync(distPath)) {
      throw new Error('Distribution directory not found');
    }

    // Find built .app files
    const appFiles = fs.readdirSync(distPath)
      .filter(file => file.endsWith('.app'))
      .map(file => path.join(distPath, file));

    if (appFiles.length === 0) {
      this.warning('⚠️  No .app files found for hardening');
      return;
    }

    for (const appPath of appFiles) {
      try {
        // Apply hardened runtime using codesign
        const args = [
          '--force',
          '--deep',
          '--options', 'runtime',
          '--entitlements', 'build/entitlements.mac.plist',
          '--sign', this.notarizationConfig.certificate || '-',
          appPath
        ];

        await this.runCommand('codesign', args, 'Code Signing');
        this.success(`✅ Hardened runtime applied to ${path.basename(appPath)}`);
      } catch (error) {
        this.warning(`⚠️  Could not apply hardened runtime to ${path.basename(appPath)}:`, error);
      }
    }
  }

  /**
   * Notarize the application
   */
  private async notarizeApplication(): Promise<void> {
    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');
    const dmgFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.dmg'));

    if (dmgFiles.length === 0) {
      throw new Error('No DMG files found for notarization');
    }

    for (const dmgFile of dmgFiles) {
      const dmgPath = path.join(distPath, dmgFile);

      try {
        // Upload for notarization
        const uploadArgs = [
          'altool',
          '--notarize-app',
          '--primary-bundle-id', this.notarizationConfig.bundleId || 'com.example.app',
          '--username', this.notarizationConfig.appleId!,
          '--password', this.notarizationConfig.appleIdPassword!,
          '--file', dmgPath
        ];

        if (this.notarizationConfig.teamId) {
          uploadArgs.push('--asc-provider', this.notarizationConfig.teamId);
        }

        this.info(`📤 Uploading ${dmgFile} for notarization...`);
        await this.runCommand('xcrun', uploadArgs, 'Notarization Upload');

        this.success(`✅ ${dmgFile} uploaded for notarization`);
        this.info('   Check your email for notarization status');

      } catch (error) {
        this.error(`❌ Failed to notarize ${dmgFile}:`, error);
        throw error;
      }
    }
  }

  /**
   * Copy preload script to CommonJS format
   */
  private async copyPreloadScript(): Promise<void> {
    const sourceFile = FileSystemServiceProvider.getInstance().resolveProjectPath('dist-electron', 'preload.mjs');
    const targetFile = FileSystemServiceProvider.getInstance().resolveProjectPath('dist-electron', 'preload.cjs');

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      this.info('📄 Preload script copied to CommonJS format');
    } else {
      throw new Error('Preload script not found - build may have failed');
    }
  }

  /**
   * Copy entitlements file from CLI templates to build directory
   */
  private async copyEntitlementsFile(): Promise<void> {
    // Get the CLI directory path
    const cliDir = path.dirname(path.dirname(__filename));
    const sourceFile = path.join(cliDir, 'templates', 'entitlements.mac.plist');
    const buildDir = FileSystemServiceProvider.getInstance().resolveProjectPath('build');
    const targetFile = path.join(buildDir, 'entitlements.mac.plist');

    // Create build directory if it doesn't exist
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Copy entitlements file
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      this.info('🔐 Entitlements file copied to build directory');
    } else {
      throw new Error(`Entitlements template not found at ${sourceFile}`);
    }
  }

  /**
   * Collect build artifacts
   */
  private async collectBuildArtifacts(): Promise<string[]> {
    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');
    const artifacts: string[] = [];

    if (!fs.existsSync(distPath)) {
      return artifacts;
    }

    const files = fs.readdirSync(distPath);

    // Collect common build artifacts
    const extensions = ['.dmg', '.exe', '.deb', '.rpm', '.AppImage', '.zip'];

    for (const file of files) {
      if (extensions.some(ext => file.endsWith(ext))) {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        artifacts.push(`${file} (${this.formatFileSize(stats.size)})`);
      }
    }

    return artifacts;
  }

  /**
   * Print build summary
   */
  private printBuildSummary(result: BuildResult): void {
    this.info('\n📊 Build Summary:');
    this.info('   Platform:', result.platform);
    this.info('   Duration:', `${(result.duration / 1000).toFixed(2)}s`);
    this.info('   Hardened:', result.hardened ? '✅ Yes' : '❌ No');
    this.info('   Notarized:', result.notarized ? '✅ Yes' : '❌ No');

    if (result.artifacts.length > 0) {
      this.info('\n📦 Build Artifacts:');
      result.artifacts.forEach(artifact => {
        this.info(`   • ${artifact}`);
      });
    }

    if (result.platform === 'mac' && !result.notarized && this.notarizationConfig.appleId) {
      this.info('\n💡 Tip: Run "yarn notarize" to notarize your DMG files');
    }
  }

  /**
   * Run a command and return the result with timeout and retry logic
   */
  private async runCommand(
    command: string,
    args: string[],
    name: string,
    options: {
      timeout?: number;
      retries?: number;
      fallbackCommand?: { command: string; args: string[] };
      onTimeout?: () => void;
    } = {}
  ): Promise<void> {
    const { timeout = 120000, retries = 1, fallbackCommand, onTimeout } = options;

    let attempt = 0;

    while (attempt <= retries) {
      attempt++;

      if (attempt > 1) {
        this.info(`🔄 Retrying ${name} (attempt ${attempt}/${retries + 1})`);
      }

      try {
        await this.runCommandWithTimeout(command, args, name, timeout, onTimeout);
        return; // Success
      } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timeout');

        if (isTimeout && fallbackCommand) {
          this.warning(`⏰ ${name} timed out after ${timeout}ms`);
          this.info(`🔄 Trying fallback command...`);

          try {
            await this.runCommandWithTimeout(
              fallbackCommand.command,
              fallbackCommand.args,
              `${name} (fallback)`,
              timeout
            );
            return; // Fallback succeeded
          } catch (fallbackError) {
            this.error(`❌ Fallback command also failed:`, fallbackError);
          }
        }

        if (attempt <= retries) {
          this.warning(`⚠️  ${name} failed (attempt ${attempt}/${retries + 1}):`, error);
          continue;
        }

        // All attempts failed
        this.error(`❌ ${name} failed after ${attempt} attempts:`, error);
        throw error;
      }
    }
  }

  /**
   * Run a command with timeout
   */
  private async runCommandWithTimeout(
    command: string,
    args: string[],
    name: string,
    timeout: number,
    onTimeout?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout;

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          proc.kill('SIGTERM');

          // Force kill if SIGTERM doesn't work
          setTimeout(() => {
            if (!proc.killed) {
              proc.kill('SIGKILL');
            }
          }, 5000);

          if (onTimeout) {
            onTimeout();
          }

          reject(new Error(`${name} timed out after ${timeout}ms`));
        }, timeout);
      }

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        // Log important output in real-time for debugging
        const output = data.toString().trim();
        if (output && (output.includes('signing') || output.includes('error') || output.includes('failed'))) {
          this.info(`   ${name}: ${output}`);
        }
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        // Log errors in real-time
        const output = data.toString().trim();
        if (output) {
          this.warning(`   ${name} error: ${output}`);
        }
      });

      proc.on('error', (error) => {
        if (timeout) clearTimeout(timeoutId);
        this.error(`${name} process error:`, error);
        reject(error);
      });

      proc.on('close', (code) => {
        if (timeout) clearTimeout(timeoutId);

        if (code === 0) {
          resolve();
        } else {
          // Check for common error patterns and provide helpful messages
          let errorMsg = `${name} failed with exit code ${code}`;

          if (stderr.includes('no such file or directory')) {
            errorMsg += '\n💡 Tip: Missing files - check build paths and required assets';
          } else if (stderr.includes('code signing') || stderr.includes('identity')) {
            errorMsg += '\n💡 Tip: Code signing issue - try setting "identity": null in package.json build config';
          } else if (stderr.includes('certificate')) {
            errorMsg += '\n💡 Tip: Certificate issue - check keychain access and certificate validity';
          }

          if (stderr) {
            errorMsg += '\nError output:\n' + stderr;
          }

          reject(new Error(errorMsg));
        }
      });
    });
  }

  /**
   * Mask sensitive data for logging
   */
  private maskSensitiveData(data?: string): string {
    if (!data) return 'Not configured';

    // Simple masking - show first 2 and last 2 characters
    if (data.length > 4) {
      return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
    }

    return '*'.repeat(data.length);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}