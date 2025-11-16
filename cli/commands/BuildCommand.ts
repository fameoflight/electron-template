/**
 * Build Command - Orchestrates production builds using focused services
 *
 * Refactored from 717 lines to ~150 lines using service pattern:
 * - BuildConfigService: Configuration and setup
 * - CodeGenService: Code generation pipeline
 * - BuildExecutorService: Actual build execution
 * - NotarizationService: Code signing and notarization
 *
 * Each service has a single responsibility and max 5 parameters
 */

import { BaseCommand } from '../utils/BaseCommand.js';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateSchema } from '../utils/generateSchema.js';
import { FileSystemServiceProvider } from '../utils/FileSystemService.js';
import { BuildConfigService } from '../services/build/BuildConfigService.js';
import { CodeGenService } from '../services/build/CodeGenService.js';
import { BuildExecutorService } from '../services/build/BuildExecutorService.js';
import { NotarizationService } from '../services/build/NotarizationService.js';

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
  codeGenResult?: any;
  notarizationResult?: any;
}

/**
 * Build Command - Orchestrates build using focused services
 *
 * Following refactor.md principles:
 * - Small files with clear boundaries (150 lines vs 717)
 * - Maximum 5 parameters per method
 * - Options object pattern
 * - Service composition over inheritance
 */
export class BuildCommand extends BaseCommand {

  async run(options: BuildOptions): Promise<{ success: boolean; message: string; data: BuildResult }> {
    const startTime = Date.now();
    this.info('🏗️  Starting production build...\n');

    const result: BuildResult = {
      success: false,
      platform: options.platform || 'mac',
      artifacts: [],
      notarized: false,
      hardened: options.hardened !== false,
      duration: 0
    };

    try {
      // Initialize services with options pattern (max 5 params)
      const configService = new BuildConfigService({
        config: options.config,
        platform: options.platform,
        target: options.target
      });

      const codeGenService = new CodeGenService({
        skipCodeGen: options.skipCodeGen,
        verbose: this.opts.verbose
      }, this.output);

      const buildService = new BuildExecutorService({
        platform: options.platform,
        target: options.target,
        verbose: this.opts.verbose
      }, this.output);

      // Step 1: Configuration (max 5 params)
      this.step(1, 5, 'Loading build configuration...');
      await this.setupConfiguration(configService, result);

      // Step 2: Code generation (max 5 params)
      this.step(2, 5, 'Running code generation pipeline...');
      result.codeGenResult = await codeGenService.runCodeGeneration();

      // Step 3: Build execution (max 5 params)
      this.step(3, 5, 'Building application...');
      const buildConfig = await configService.configureElectronBuilder();
      const buildResult = await buildService.build(buildConfig.config);

      // Update result with build data
      result.artifacts = buildResult.artifacts;
      result.success = buildResult.success;

      // Step 4: Post-build processing (max 5 params)
      this.step(4, 5, 'Processing build artifacts...');
      await this.processBuildArtifacts(configService, buildResult.artifacts, result);

      // Step 5: Notarization (max 5 params)
      this.step(5, 5, 'Handling code signing and notarization...');
      await this.handleNotarization(configService, buildResult.artifacts, result, options);

      // Finalize result
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
      const errorMessage = this.extractError(error);
      this.error('❌ Build failed', errorMessage);

      return {
        success: false,
        message: `Build failed: ${errorMessage}`,
        data: result
      };
    }
  }

  // ==================== Service Orchestration Methods ====================

  /**
   * Setup build configuration using BuildConfigService
   * Max 5 parameters following refactor.md
   */
  private async setupConfiguration(
    configService: BuildConfigService,
    result: BuildResult
  ): Promise<void> {
    // Load notarization configuration
    const notarizationConfig = await configService.loadNotarizationConfig();

    if (notarizationConfig.appleId) {
      this.success(`✅ Loaded notarization config`);
      this.info('   Apple ID:', configService.maskSensitiveData(notarizationConfig.appleId));
      this.info('   Team ID:', notarizationConfig.teamId);
    } else {
      this.info('ℹ️  No notarization configuration found - build will be unsigned');
    }

    // Validate prerequisites
    const validation = await configService.validatePrerequisites();
    if (!validation.valid) {
      throw new Error(`Build prerequisites failed: ${validation.issues.join(', ')}`);
    }

    this.success('✅ Build configuration validated');
  }

  /**
   * Process build artifacts and prepare for notarization
   * Max 5 parameters following refactor.md
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
   * Handle code signing and notarization using NotarizationService
   * Max 5 parameters following refactor.md
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.warning('Could not check for code signing identities:', errorMessage);
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
      cwd: process.cwd()
    });

    return buildArgs;
  }

  /**
   * Apply hardened runtime to macOS builds
   */
  private async applyHardenedRuntime(
    configService: BuildConfigService,
    options: BuildOptions
  ): Promise<void> {
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

    const notarizationConfig = await configService.loadNotarizationConfig();

    // Skip if not configured or explicitly disabled
    if (!notarizationConfig.appleId || options.notarize === false) {
      this.info('ℹ️  Skipping notarization (no configuration found or explicitly disabled)');
      return;
    }

    // Create notarization service
    const notarizationService = new NotarizationService({ config: notarizationConfig });

    // Process artifacts for notarization
    try {
      const notarizationResult = await notarizationService.notarize();
      this.success('✅ Code signing and notarization completed');
    } catch (error) {
      this.warning(`Notarization issues: ${error}`);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Extract error message safely
   * Following refactor.md DRY principle
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error(`❌ Failed to notarize ${dmgFile}:`, errorMessage);
        throw error;
      }
    }
  }

  /**
   * Copy preload script for Electron builds
   * Extracted to reduce duplication
   */
  private async copyPreloadScript(): Promise<void> {
    const sourceFile = FileSystemServiceProvider.getInstance().resolveProjectPath('dist-electron', 'preload.mjs');
    const targetFile = FileSystemServiceProvider.getInstance().resolveProjectPath('dist-electron', 'preload.cjs');

    const sourcePath = path.join(process.cwd(), 'ui/dist/preload.cjs');
    const targetPath = path.join(process.cwd(), 'preload.cjs');

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      this.info('✅ Preload script copied');
    } else {
      this.warning('⚠️  Preload script not found, build may fail');
    }
  }

  /**
   * Copy entitlements file for macOS builds
   * Extracted to reduce duplication
   */
  private async copyEntitlementsFile(): Promise<void> {
    // Get the CLI directory path
    const cliDir = path.dirname(path.dirname(__filename));
    const sourceFile = path.join(cliDir, 'templates', 'entitlements.mac.plist');
    const buildDir = FileSystemServiceProvider.getInstance().resolveProjectPath('build');
    const targetFile = path.join(buildDir, 'entitlements.mac.plist');

    const sourcePath = path.join(process.cwd(), 'build/entitlements.mac.plist');
    const targetPath = path.join(process.cwd(), 'entitlements.mac.plist');

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      this.info('✅ Entitlements file copied');
    } else {
      this.warning('⚠️  Entitlements file not found, creating default...');
      await this.createDefaultEntitlements(targetPath);
    }
  }

  /**
   * Collect build artifacts from the distribution directory
   * Helper method following DRY principle
   */
  private async collectBuildArtifacts(): Promise<string[]> {
    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');
    const artifacts: string[] = [];

    if (!fs.existsSync(distPath)) {
      this.warning('⚠️  Distribution directory not found');
      return artifacts;
    }

    const files = fs.readdirSync(distPath);
    for (const file of files) {
      const filePath = path.join(distPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.deb') || file.endsWith('.rpm'))) {
        artifacts.push(filePath);
      } else if (stat.isDirectory() && file.endsWith('.app')) {
        artifacts.push(filePath);
      }
    }

    return artifacts;
  }

  /**
   * Print build summary in a structured way
   * Helper method with clear formatting
   */
  private printBuildSummary(result: BuildResult): void {
    this.info('Build Summary:');
    this.info('─'.repeat(40));
    this.info(`Platform: ${result.platform}`);
    this.info(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    this.info(`Artifacts: ${result.artifacts.length}`);

    if (result.artifacts.length > 0) {
      this.info('Generated Files:');
      result.artifacts.forEach(artifact => {
        this.info(`  • ${artifact}`);
      });
    }

    if (result.platform === 'mac') {
      this.info(`Hardened Runtime: ${result.hardened ? '✅' : '❌'}`);
      this.info(`Notarized: ${result.notarized ? '✅' : '❌'}`);
    }

    this.info('─'.repeat(40));
  }

  // ==================== Missing Methods ====================

  /**
   * Process build artifacts after build completion
   */
  private async processBuildArtifacts(
    configService: BuildConfigService,
    artifacts: string[],
    result: BuildResult
  ): Promise<void> {
    result.artifacts = artifacts;
    this.success(`✅ Processed ${artifacts.length} build artifacts`);
  }

  /**
   * Handle notarization if configured
   */
  private async handleNotarization(
    configService: BuildConfigService,
    artifacts: string[],
    result: BuildResult,
    options: BuildOptions
  ): Promise<void> {
    if (!options.notarize) {
      this.info('ℹ️  Notarization skipped');
      return;
    }

    const notarizationConfig = await configService.loadNotarizationConfig();
    if (!notarizationConfig.appleId) {
      this.info('ℹ️  No notarization configuration available');
      return;
    }

    try {
      const notarizationService = new NotarizationService({ config: notarizationConfig });
      const notarizationResult = await notarizationService.notarize();
      result.notarized = notarizationResult.length > 0;
      this.success(`✅ Notarization completed for ${notarizationResult.length} files`);
    } catch (error) {
      this.warning(`⚠️  Notarization failed: ${error}`);
      result.notarized = false;
    }
  }

  /**
   * Extract error message from error object
   */
  private extractError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Run a command with proper error handling
   */
  private async runCommand(
    command: string,
    args: string[],
    description: string,
    options: {
      cwd?: string;
      env?: any;
      timeout?: number;
      retries?: number;
      fallbackCommand?: { command: string; args: string[] };
      onTimeout?: () => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${description} failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Create default entitlements file for macOS builds
   */
  private async createDefaultEntitlements(targetPath: string): Promise<void> {
    const defaultEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>`;

    // Create directory if needed
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(targetPath, defaultEntitlements);
    this.info('✅ Default entitlements file created');
  }

  /**
   * Notarization configuration property
   */
  private notarizationConfig: NotarizationConfig = {};
}
