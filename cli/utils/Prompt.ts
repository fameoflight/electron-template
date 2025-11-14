/**
 * Interactive prompt utilities
 *
 * Simple confirmation prompts using Node.js built-in readline
 * No external dependencies required
 */

import * as readline from 'readline';

export interface PromptOptions {
  message: string;
  defaultValue?: boolean;
  showWarning?: boolean;
  warningMessage?: string;
}

/**
 * Create a simple Yes/No prompt
 */
export async function confirm(options: PromptOptions): Promise<boolean> {
  const { message, defaultValue = false, showWarning = false, warningMessage = '' } = options;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  try {
    // Show warning if provided
    if (showWarning && warningMessage) {
      console.log(`\n⚠️  ${warningMessage}`);
    }

    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const prompt = `${message} (${defaultText}): `;

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        const normalizedAnswer = answer.trim().toLowerCase();

        if (normalizedAnswer === '') {
          resolve(defaultValue);
        } else if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
          resolve(true);
        } else if (normalizedAnswer === 'n' || normalizedAnswer === 'no') {
          resolve(false);
        } else {
          console.log('Please enter "y" or "n"');
          resolve(defaultValue);
        }
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * Create a force confirmation prompt with warnings about extension files
 */
export async function confirmForce(entities: string[]): Promise<boolean> {
  const entityList = entities.length > 5
    ? `${entities.slice(0, 3).join(', ')}, ... and ${entities.length - 3} more`
    : entities.join(', ');

  return confirm({
    message: `Are you sure you want to force regenerate entities? This will override extension files for: ${entityList}`,
    defaultValue: false,
    showWarning: true,
    warningMessage: 'Force regeneration will overwrite your custom entity extension files (.ts files not in __generated__ directory). Any custom business logic in these files will be lost!'
  });
}