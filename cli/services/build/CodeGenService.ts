/**
 * CodeGenService - Handles code generation for builds
 *
 * Responsibilities:
 * - Generate GraphQL schema from entities
 * - Compile Relay GraphQL code
 * - Run TypeScript type checking
 * - Handle code generation errors
 */

import { spawn } from 'child_process';
import { generateSchema } from '../../utils/generateSchema.js';
import { BaseCommand } from '../../utils/BaseCommand.js';
import { cyberOutput } from '../../utils/output.js';

export interface CodeGenOptions {
  skipCodeGen?: boolean;
  verbose?: boolean;
}

export interface CodeGenResult {
  schemaGenerated: boolean;
  relayCompiled: boolean;
  typeChecked: boolean;
  duration: number;
  errors: string[];
}

/**
 * Service for handling all code generation aspects of the build
 */
export class CodeGenService {
  private output: BaseCommand['output'];

  constructor(private options: CodeGenOptions, output?: BaseCommand['output']) {
    // Use provided output or create a cyberpunk output
    this.output = output || {
      info: cyberOutput.info.bind(cyberOutput),
      success: cyberOutput.success.bind(cyberOutput),
      warning: cyberOutput.warning.bind(cyberOutput),
      error: cyberOutput.error.bind(cyberOutput),
      progress: cyberOutput.progress.bind(cyberOutput)
    } as BaseCommand['output'];
  }

  /**
   * Run the complete code generation pipeline
   */
  async runCodeGeneration(): Promise<CodeGenResult> {
    const startTime = Date.now();
    const result: CodeGenResult = {
      schemaGenerated: false,
      relayCompiled: false,
      typeChecked: false,
      duration: 0,
      errors: []
    };

    if (this.options.skipCodeGen) {
      this.output.info('⏭️  Skipping code generation');
      result.schemaGenerated = true;
      result.relayCompiled = true;
      result.typeChecked = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    try {
      // Step 1: Generate GraphQL schema
      this.output.progress('Generating GraphQL schema from entities...');
      await generateSchema();
      result.schemaGenerated = true;
      this.output.success('✅ GraphQL schema generated');

      // Step 2: Compile Relay code
      this.output.progress('Compiling Relay GraphQL code...');
      await this.runCommand('yarn', ['relay'], 'Relay Compiler');
      result.relayCompiled = true;
      this.output.success('✅ Relay code compiled');

      // Step 3: Type checking
      this.output.progress('Running TypeScript type checking...');
      await this.runCommand('yarn', ['tsc'], 'TypeScript Compiler');
      result.typeChecked = true;
      this.output.success('✅ Type checking passed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      this.output.error('❌ Code generation failed', errorMessage);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Execute a command with proper error handling and output
   */
  private async runCommand(command: string, args: string[], name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true
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
          const error = stderr || stdout || `Command ${name} failed with exit code ${code}`;
          reject(new Error(error));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start ${name}: ${error.message}`));
      });
    });
  }

  /**
   * Check if code generation can be skipped (no schema changes)
   */
  async canSkipCodeGen(): Promise<boolean> {
    // Simple check - could be enhanced with timestamp comparison
    try {
      const fs = await import('fs');
      const schemaPath = 'schema.graphql';
      const generatedPath = 'ui/__generated__/';

      if (!fs.existsSync(schemaPath) || !fs.existsSync(generatedPath)) {
        return false;
      }

      // For now, always run code generation
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get code generation status summary
   */
  getStatusSummary(result: CodeGenResult): string {
    const parts: string[] = [];

    if (result.schemaGenerated) parts.push('Schema ✓');
    if (result.relayCompiled) parts.push('Relay ✓');
    if (result.typeChecked) parts.push('TypeScript ✓');

    if (result.errors.length > 0) {
      parts.push(`${result.errors.length} error(s)`);
    }

    return parts.join(' | ');
  }
}