/**
 * CLI Utilities - Reusable utility modules for CLI commands
 */

// Core utilities
export { GitUtils, type GitStatusResult } from './gitUtils.js';
export { IconUtils, type IconSizes, type IconFormat } from './iconUtils.js';

// Advanced utilities
export { ProcessManager, type ProcessOptions, type ProcessResult } from './processUtils.js';
export { ConfigManager, type PackageJson, type NotarizationConfig } from './configUtils.js';
export { FileSystemService, FileSystemServiceProvider, type CleanResult, type FileOperationOptions, type FileInfo, type FindFilesOptions, type FileSystemServiceOptions } from './FileSystemService.js';
export { FileWatcher, type WatcherOptions, createSimpleWatcher } from './watcherUtils.js';

// Code generation utilities
export { SimplifiedSchemaGenerator, type SimplifiedSchemaData } from './SimplifiedSchemaGenerator.js';

// Terminal UI and Color Schemes
export {
  CyberpunkOutput,
  cyberOutput,
  createCyberOutput,
  createCyberOutputWithColors,
  type CyberpunkOptions,
  type CyberpunkSpinner,
  type CyberpunkProgress,
} from './output';

export {
  CyberpunkColorScheme,
  defaultColorScheme,
  ColorSchemes,
  type ColorScheme,
  type ColorConfig,
} from './ColorScheme';

// Import classes for internal use
import { GitUtils } from './gitUtils.js';
import { IconUtils } from './iconUtils.js';
import { ProcessManager } from './processUtils.js';
import { ConfigManager } from './configUtils.js';
import { FileSystemService } from './FileSystemService.js';
import { FileWatcher } from './watcherUtils.js';

// Re-export commonly used combinations
export interface CLITools {
  gitUtils: GitUtils;
  iconUtils: IconUtils;
  processManager: ProcessManager;
  configManager: ConfigManager;
  fileSystemService: FileSystemService;
  fileWatcher: FileWatcher;
}

export function createCLITools(cwd?: string): CLITools {
  const fileSystemService = new FileSystemService({ cwd });
  return {
    gitUtils: new GitUtils(cwd),
    iconUtils: new IconUtils(fileSystemService),
    processManager: new ProcessManager(cwd),
    configManager: new ConfigManager(fileSystemService),
    fileSystemService,
    fileWatcher: new FileWatcher(fileSystemService)
  };
}