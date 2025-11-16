/**
 * GraphQL Runner - Execute GraphQL generation commands
 *
 * Handles GraphQL schema generation, entity generation, and Relay compilation
 * Used by both the standalone graphql-cli and the yarn g graphql command
 */

import { SchemaCommand } from '../commands/SchemaCommand.js';
import { cyberOutput } from './output.js';

export interface GraphQLCommandOptions {
  force?: boolean;
  watch?: boolean;
  noRelay?: boolean;
}

/**
 * Run GraphQL command with options
 */
export async function runGraphQLCommand(options: GraphQLCommandOptions): Promise<void> {
  // Step 1: Generate entities and schema
  const schemaCommand = new SchemaCommand();

  // execute() handles success/failure internally and exits on error
  await schemaCommand.execute({
    watch: options.watch || false,
    force: options.force || false
  });

  // Step 2: Compile Relay (unless skipped or in watch mode)
  if (!options.watch && !options.noRelay) {
    cyberOutput.newLine();
  cyberOutput.info('Compiling Relay...');
    const { spawn } = await import('child_process');

    await new Promise<void>((resolve, reject) => {
      const relayProcess = spawn('yarn', ['relay'], {
        stdio: 'inherit',
        shell: true
      });

      relayProcess.on('close', (code) => {
        if (code === 0) {
          cyberOutput.success('Relay compilation completed successfully!');
          resolve();
        } else {
          reject(new Error(`Relay compilation failed with exit code ${code}`));
        }
      });

      relayProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  if (!options.watch) {
    cyberOutput.newLine();
  cyberOutput.success('GraphQL generation completed successfully!');
  }


}