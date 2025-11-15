/**
 * Database Commands Module
 *
 * Provides database-related commands following refactor.md principles:
 * - Command classes with proper encapsulation
 * - Single responsibility per command
 * - Options object pattern
 * - Convenience getter pattern
 */

export { DbStatsCommand } from './DbStatsCommand.js';
export { DbInspectCommand } from './DbInspectCommand.js';
export { DbSnapshotCommand } from './DbSnapshotCommand.js';

export type { DbStatsOptions, DbStatsResult } from './DbStatsCommand.js';
export type { DbInspectOptions, EntitySchema } from './DbInspectCommand.js';
export type { DbSnapshotOptions, SnapshotResult } from './DbSnapshotCommand.js';

// Re-export for backward compatibility with existing code
export async function dbStatsCommand() {
  const { DbStatsCommand } = await import('./DbStatsCommand.js');
  const command = new DbStatsCommand();
  return await command.execute({});
}

export async function dbInspectCommand(entityName?: string) {
  const { DbInspectCommand } = await import('./DbInspectCommand.js');
  const command = new DbInspectCommand();
  return await command.execute({ entityName });
}

export async function dbSnapshotCommand(options: { name?: string } = {}) {
  const { DbSnapshotCommand } = await import('./DbSnapshotCommand.js');
  const command = new DbSnapshotCommand();
  return await command.execute(options);
}