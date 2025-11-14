/**
 * Console REPL Module
 * 
 * Purpose: Node.js REPL server setup, configuration, and custom handlers.
 * Single Responsibility: Manage the REPL server lifecycle and behavior.
 * 
 * Features:
 * - Custom async/await support
 * - Variable persistence across commands
 * - History management
 * - GraphQL query execution
 * - Disabled inline autocomplete (TAB-only completion)
 */

import { REPLServer, start as nodeReplStart } from 'repl';
import { executeGraphQLQuery } from '../../../main/graphql/server.js';
import { GraphQLVariables } from '../../../shared/types.js';
import { customCompleter } from './ConsoleCompletion.js';

/**
 * Start the Node.js REPL server with custom configuration
 * 
 * @param historyPath - Path to history file
 * @param context - Console context for completion
 * @param onSetupComplete - Callback after REPL is configured
 * @returns REPL server instance
 */
export function startReplServer(
  historyPath: string,
  context: any,
  onSetupComplete?: (repl: REPLServer) => void
): REPLServer {
  const replServer = nodeReplStart({
    prompt: 'app> ',
    ignoreUndefined: true,
    useGlobal: true,
    completer: (line: string) => customCompleter(line, context),
    terminal: true,
    // Disable preview/inline autocomplete (Node 13.13.0+)
    preview: false,
  } as any); // Cast to any since preview type might not be in older type definitions

  // Disable readline's inline completion features
  disableInlineAutocomplete(replServer);

  // Setup history
  setupHistory(replServer, historyPath);

  // Setup custom REPL handlers for async/await support
  setupReplHandlers(replServer);

  // Call setup complete callback
  if (onSetupComplete) {
    onSetupComplete(replServer);
  }

  return replServer;
}

/**
 * Disable inline autocomplete features
 * Ensures completions only show on explicit TAB press
 */
function disableInlineAutocomplete(replServer: REPLServer): void {
  const replAny = replServer as any;
  
  if (replAny.editorMode !== undefined) {
    replAny.editorMode = false;
  }
  if (replAny.terminal !== undefined) {
    replAny.terminal = true;
  }

  // Access the underlying readline interface and disable preview
  const rli = replAny.rli || replAny.line;
  if (rli) {
    // Disable inline completion/preview
    if (rli._refreshLine) {
      rli._refreshLine = rli._refreshLine.bind(rli);
    }
    // Disable automatic completion display
    if (typeof rli.setPrompt === 'function') {
      const originalSetPrompt = rli.setPrompt.bind(rli);
      rli.setPrompt = (prompt: string) => {
        originalSetPrompt(prompt);
        // Clear any completion preview
        if (rli._writeToOutput) {
          rli._writeToOutput('');
        }
      };
    }
  }
}

/**
 * Setup command history persistence
 */
function setupHistory(replServer: REPLServer, historyPath: string): void {
  replServer.setupHistory(historyPath, (err) => {
    if (err) {
      console.warn('⚠️  Could not setup REPL history:', err.message);
    }
  });
}

/**
 * Setup custom REPL handlers for better async/await support
 * 
 * Transforms const/let declarations to persist across REPL commands:
 * - Input:  const users = await userRepository.find()
 * - Output: globalThis.users = await userRepository.find()
 * 
 * This ensures variables created with await persist in subsequent commands.
 */
function setupReplHandlers(replServer: REPLServer): void {
  const originalEval = replServer.eval;
  (replServer as any).eval = (cmd: any, context: any, filename: any, callback: any) => {
    try {
      // Support async/await by wrapping in async function if needed
      if (cmd.includes('await')) {
        // Transform const/let to global assignments for REPL persistence
        let transformedCmd = cmd.trim();

        // Match: const/let variableName = await ...
        const constLetMatch = transformedCmd.match(/^(const|let)\s+(\w+)\s*=\s*(.*)/);
        if (constLetMatch) {
          const [, , varName, expression] = constLetMatch;
          // Transform to: globalThis.varName = await ...
          transformedCmd = `globalThis.${varName} = ${expression}`;
        }

        const wrappedCmd = `(async () => { return ${transformedCmd} })()`;
        originalEval.call(replServer, wrappedCmd, context, filename, async (err: any, result: any) => {
          if (err) {
            callback(err);
          } else {
            // Handle promises
            if (result && typeof result.then === 'function') {
              try {
                const resolved = await result;
                callback(null, resolved);
              } catch (e) {
                callback(e);
              }
            } else {
              callback(null, result);
            }
          }
        });
      } else {
        originalEval.call(replServer, cmd, context, filename, callback);
      }
    } catch (error) {
      callback(error);
    }
  };
}

/**
 * Execute GraphQL query helper
 * 
 * @param query - GraphQL query string
 * @param variables - Optional query variables
 * @returns Query result data
 */
export async function executeGraphQL(query: string, variables?: GraphQLVariables): Promise<any> {
  try {
    const result = await executeGraphQLQuery(query, variables);

    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️  GraphQL errors:');
      result.errors.forEach(error => {
        console.warn(`  - ${error.message}`);
      });
    }

    return result.data;
  } catch (error) {
    console.error('❌ GraphQL execution failed:', error);
    throw error;
  }
}
