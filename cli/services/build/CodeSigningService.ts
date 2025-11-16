/**
 * CodeSigningService - Handles macOS code signing operations
 *
 * Responsibilities:
 * - Detect available code signing identities
 * - Apply hardened runtime to .app bundles
 * - Configure code signing for Electron Builder
 *
 * Pattern: Service with focused methods (max 5 params rule)
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { FileSystemServiceProvider } from '../../utils/FileSystemService.js';
import { cyberOutput } from '../../utils/output.js';

export interface CodeSigningOptions {
  appPath?: string;
  certificate?: string;
  hardenedRuntime?: boolean;
  entitlementsPath?: string;
}

export interface SigningIdentity {
  hash: string | null;
  status: 'valid' | 'invalid' | 'none';
}

export class CodeSigningService {
  /**
   * Detect available code signing identities
   */
  async detectSigningIdentity(): Promise<SigningIdentity> {
    try {
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
        return { hash: null, status: 'none' };
      }

      // Return the first valid identity hash
      const match = identities[0].match(/([A-F0-9]{40})/);
      if (match) {
        return { hash: match[1], status: 'valid' };
      }

      return { hash: null, status: 'invalid' };

    } catch (error) {
      cyberOutput.warning('Could not check for code signing identities:', error instanceof Error ? error.message : String(error));
      return { hash: null, status: 'none' };
    }
  }

  /**
   * Apply hardened runtime to macOS .app bundles
   */
  async applyHardenedRuntime(opts: CodeSigningOptions = {}): Promise<string[]> {
    const distPath = FileSystemServiceProvider.getInstance().resolveProjectPath('dist');

    if (!fs.existsSync(distPath)) {
      throw new Error('Distribution directory not found');
    }

    // Find built .app files
    const appFiles = fs.readdirSync(distPath)
      .filter(file => file.endsWith('.app'))
      .map(file => path.join(distPath, file));

    if (appFiles.length === 0) {
      cyberOutput.warning('No .app files found for hardening');
      return [];
    }

    const hardenedApps: string[] = [];

    for (const appPath of appFiles) {
      try {
        const entitlementsPath = opts.entitlementsPath || 'build/entitlements.mac.plist';

        // Apply hardened runtime using codesign
        const args = [
          '--force',
          '--deep',
          '--options', 'runtime',
          '--entitlements', entitlementsPath,
          '--sign', opts.certificate || '-',
          appPath
        ];

        await this.execAsync('codesign', args);
        cyberOutput.success(`Hardened runtime applied to ${path.basename(appPath)}`);
        hardenedApps.push(appPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        cyberOutput.warning(`Could not apply hardened runtime to ${path.basename(appPath)}: ${errorMessage}`);
      }
    }

    return hardenedApps;
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
