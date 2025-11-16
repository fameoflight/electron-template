#!/usr/bin/env node
/* @refresh skip */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface ProcessInfo {
  pid: number;
  command: string;
  type: 'main' | 'helper' | 'unknown';
}

class ProcessManager {
  private projectName: string;

  constructor(projectName: string = 'codeblocks') {
    this.projectName = projectName;
  }

  /**
   * Find all processes related to this project
   */
  async findProjectProcesses(): Promise<ProcessInfo[]> {
    try {
      const platform = process.platform;
      let command: string;

      if (platform === 'darwin') {
        // macOS
        command = `ps aux | grep -i electron | grep -i "${this.projectName}" | grep -v grep`;
      } else if (platform === 'win32') {
        // Windows
        command = `tasklist /fi "imagename eq electron.exe" /fo csv | findstr "${this.projectName}"`;
      } else {
        // Linux
        command = `ps aux | grep -i electron | grep -i "${this.projectName}" | grep -v grep`;
      }

      const { stdout } = await execAsync(command);
      return this.parseProcessList(stdout);
    } catch (error) {
      // No processes found or command failed
      return [];
    }
  }

  /**
   * Parse process list output
   */
  private parseProcessList(output: string): ProcessInfo[] {
    const lines = output.trim().split('\n').filter(line => line.trim());
    return lines.map(line => {
      const platform = process.platform;

      if (platform === 'darwin' || platform === 'linux') {
        // Unix-like systems
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[1]);
        const command = parts.slice(10).join(' ');

        return {
          pid,
          command,
          type: this.determineProcessType(command)
        };
      } else {
        // Windows
        const parts = line.split(',');
        const pid = parseInt(parts[1].replace(/"/g, ''));
        const command = parts.slice(1).join(' ');

        return {
          pid,
          command,
          type: this.determineProcessType(command)
        };
      }
    });
  }

  /**
   * Determine if this is a main process or helper
   */
  private determineProcessType(command: string): 'main' | 'helper' | 'unknown' {
    if (command.includes('--type=') || command.includes('Helper')) {
      return 'helper';
    } else if (command.includes('electron') && !command.includes('--type=')) {
      return 'main';
    }
    return 'unknown';
  }

  /**
   * Kill processes gracefully, then forcefully if needed
   */
  async killProcesses(processes: ProcessInfo[]): Promise<{ killed: number; failed: number }> {
    let killed = 0;
    let failed = 0;

    // Group by type - kill main process first, then helpers
    const mainProcesses = processes.filter(p => p.type === 'main');
    const helperProcesses = processes.filter(p => p.type === 'helper');

    console.log(chalk.blue(`🔄 Found ${processes.length} process(es):`));

    // Show what we're killing
    [...mainProcesses, ...helperProcesses].forEach(process => {
      const typeIcon = process.type === 'main' ? '🎯' : '⚙️';
      const typeName = process.type === 'main' ? 'main' : 'helper';
      console.log(`  ${typeIcon} PID ${process.pid} (${typeName})`);
    });

    // Kill main processes first
    killed += await this.killProcessGroup(mainProcesses);
    failed += mainProcesses.length - killed;

    // Wait a moment, then kill helpers
    if (helperProcesses.length > 0) {
      await this.sleep(1000);
      const helpersKilled = await this.killProcessGroup(helperProcesses);
      killed += helpersKilled;
      failed += helperProcesses.length - helpersKilled;
    }

    return { killed, failed };
  }

  /**
   * Kill a group of processes
   */
  private async killProcessGroup(processes: ProcessInfo[]): Promise<number> {
    let killed = 0;
    const platform = process.platform;

    for (const process of processes) {
      try {
        if (platform === 'win32') {
          await execAsync(`taskkill /pid ${process.pid} /T /F`);
        } else {
          // Try graceful kill first
          try {
            await execAsync(`kill ${process.pid}`);
            // Wait a moment to see if it dies gracefully
            await this.sleep(2000);

            // Check if still alive
            await execAsync(`kill -0 ${process.pid}`);

            // Still alive, force kill
            await execAsync(`kill -9 ${process.pid}`);
          } catch (gracefulError) {
            // Either process doesn't exist (already dead) or we need to force kill
            try {
              await execAsync(`kill -9 ${process.pid}`);
            } catch (forceError) {
              // Process is likely already dead
            }
          }
        }
        killed++;
      } catch (error) {
        console.log(chalk.red(`❌ Failed to kill PID ${process.pid}: ${error}`));
      }
    }

    return killed;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up all project processes
   */
  async cleanup(): Promise<boolean> {
    console.log(chalk.yellow('🧹 Cleaning up old processes...'));

    const processes = await this.findProjectProcesses();

    if (processes.length === 0) {
      console.log(chalk.green('✅ No old processes found'));
      return true;
    }

    const { killed, failed } = await this.killProcesses(processes);

    if (killed > 0) {
      console.log(chalk.green(`✅ Successfully killed ${killed} process(es)`));
    }

    if (failed > 0) {
      console.log(chalk.red(`❌ Failed to kill ${failed} process(es)`));
    }

    // Verify cleanup
    await this.sleep(1000);
    const remaining = await this.findProjectProcesses();

    if (remaining.length === 0) {
      console.log(chalk.green('🎉 Cleanup completed successfully'));
      return true;
    } else {
      console.log(chalk.yellow(`⚠️  ${remaining.length} process(es) still running`));
      return false;
    }
  }
}

/**
 * Main development script with cleanup
 */
async function devWithCleanup() {
  console.log(chalk.cyan('🚀 Starting development environment...'));

  const processManager = new ProcessManager('codeblocks');

  // Clean up old processes
  const cleanupSuccess = await processManager.cleanup();

  if (!cleanupSuccess) {
    console.log(chalk.yellow('⚠️  Some processes could not be cleaned up'));
    console.log(chalk.gray('You may need to manually kill remaining processes'));
  }

  console.log(chalk.blue('🔄 Starting development server...'));

  // Start the actual development server (call directly to avoid recursion)
  console.log(chalk.cyan('🚀 Running: yarn run dev:original'));

  const devProcess = spawn('yarn', ['run', 'dev:original'], {
    stdio: 'inherit',
    shell: false, // Avoid shell security warning and issues
    detached: false
  });

  // Enhanced error handling
  devProcess.on('error', (error) => {
    console.error(chalk.red(`❌ Failed to start development server: ${error.message}`));
    process.exit(1);
  });

  // Handle graceful shutdown
  const cleanup = (signal: string) => {
    console.log(chalk.yellow(`\n🛑 Received ${signal}, shutting down development server...`));

    // Try graceful shutdown first
    if (!devProcess.killed) {
      devProcess.kill(signal);

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!devProcess.killed) {
          console.log(chalk.yellow('⏰ Force killing development server...'));
          devProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  devProcess.on('exit', (code, signal) => {
    if (signal) {
      console.log(chalk.yellow(`Development server killed by signal: ${signal}`));
    } else if (code !== 0) {
      console.error(chalk.red(`Development server exited with code ${code}`));
    } else {
      console.log(chalk.green('Development server stopped successfully'));
    }
    process.exit(code || 0);
  });
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${chalk.cyan('Development Server with Process Cleanup')}

Usage:
  ${chalk.green('yarn dev:clean')}    Start dev server with automatic cleanup
  ${chalk.green('yarn dev:clean --cleanup-only')}    Only cleanup, don't start server

Options:
  --help, -h     Show this help message
  --cleanup-only Only cleanup old processes, don't start dev server

The script will:
1. Find all Electron processes related to this project
2. Kill them gracefully (and forcefully if needed)
3. Start the development server
4. Handle graceful shutdown on Ctrl+C
    `);
    return;
  }

  if (args.includes('--cleanup-only')) {
    const processManager = new ProcessManager('codeblocks');
    await processManager.cleanup();
    return;
  }

  await devWithCleanup();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProcessManager, devWithCleanup };