/**
 * Console Completion Module
 * 
 * Purpose: Rails-style TAB completion for the interactive console.
 * Single Responsibility: Generate completion suggestions based on context and user input.
 * 
 * Features:
 * - Complete on TAB only (no auto-trigger)
 * - Show ALL options on empty TAB
 * - Include runtime variables (user-created vars)
 * - Property chain navigation (user.name.[TAB])
 * - Smart filtering based on input
 */

/**
 * Custom tab completer with Rails-style behavior
 * 
 * @param line - Current input line
 * @param context - Console context with all available objects
 * @returns Tuple of [completions, originalLine]
 */
export function customCompleter(line: string, context: any): [string[], string] {
  // Get runtime variables from globalThis (variables created during session)
  const runtimeVars = Object.keys(globalThis)
    .filter(key => {
      // Filter out built-in globals and private properties
      const isBuiltin = ['console', 'process', 'global', 'Buffer', 'require',
                        'module', '__dirname', '__filename', 'exports', 'clearImmediate',
                        'clearInterval', 'clearTimeout', 'setImmediate', 'setInterval',
                        'setTimeout', 'queueMicrotask', 'performance', 'fetch'].includes(key);
      const isPrivate = key.startsWith('_');
      const isInContext = key in context;

      // Include if it's a user-created variable (not builtin, not in initial context)
      return !isBuiltin && !isPrivate && !isInContext;
    });

  // Get all available completions
  const completions = [
    // Core commands
    'help()',
    'types()',
    'reload()',
    'graphql(',
    'exit()',
    'clear()',
    'cls()',

    // Type inspection
    'typeOf(',
    'signature(',
    'methods(',
    'props(',

    // Data inspection
    'inspect(',
    'table(',
    'pretty(',
    'memory()',
    'benchmark(',

    // Database utilities
    'getRepository(',
    'tables()',
    'schema(',
    'count(',
    'last(',
    'truncate(',
    'query(',

    // Data generation
    'faker.',
    'create.user(',
    'create.users(',
    'create.job(',
    'factories.',

    // Job management
    'jobs.status()',
    'jobs.stats()',
    'jobs.pending()',
    'jobs.running()',
    'jobs.failed()',
    'jobs.completed()',
    'jobs.cancel(',
    'jobs.retry(',

    // Database objects
    'dataSource.',
    'Entity.',

    // Add all context entities, repositories, and services
    ...Object.keys(context)
      .filter(key => !key.startsWith('_'))
      .map(key => {
        const value = context[key];
        if (typeof value === 'function') {
          return key + '(';
        } else if (value && typeof value === 'object') {
          return key + '.';
        }
        return key;
      }),

    // Add runtime variables created by user
    ...runtimeVars,
  ];

  // Remove duplicates and sort
  const uniqueCompletions = Array.from(new Set(completions)).sort();

  // Trim the line for matching
  const trimmedLine = line.trim();

  // If line is empty, show ALL completions (Rails behavior)
  if (!trimmedLine) {
    return [uniqueCompletions, line];
  }

  // Handle property access (e.g., "user." should show user's properties)
  if (trimmedLine.includes('.')) {
    const propertyCompletions = getPropertyCompletions(trimmedLine, context);
    if (propertyCompletions) {
      return [propertyCompletions, line];
    }
  }

  // Filter completions based on current input
  const hits = uniqueCompletions.filter(c => c.startsWith(trimmedLine));

  // Return filtered hits, or all completions if no match (Rails behavior)
  return [hits.length > 0 ? hits : uniqueCompletions, line];
}

/**
 * Get property completions for object property access
 *
 * @param line - Current input line (e.g., "user.name." or "Entity.J")
 * @param context - Console context
 * @returns Array of property completions or null
 */
function getPropertyCompletions(line: string, context: any): string[] | null {
  const parts = line.split('.');
  const objName = parts[0];
  const partialProp = parts[parts.length - 1]; // Last part is the partial property name

  // Try to get the object from context or globalThis
  let obj = context[objName] || (globalThis as any)[objName];

  // Navigate through the property chain (all parts except the last one)
  for (let i = 1; i < parts.length - 1; i++) {
    if (obj && typeof obj === 'object') {
      obj = obj[parts[i]];
    }
  }

  if (obj && typeof obj === 'object') {
    const props = Object.getOwnPropertyNames(obj);
    const protoProps = obj.constructor && obj.constructor.prototype
      ? Object.getOwnPropertyNames(obj.constructor.prototype).filter(p => p !== 'constructor')
      : [];

    // Build base path (everything before the partial property)
    const basePath = parts.slice(0, -1).join('.');

    const allProps = Array.from(new Set([...props, ...protoProps]))
      .filter(p => !p.startsWith('_') && p.startsWith(partialProp))
      .map(p => {
        const value = obj[p];
        const fullPath = basePath + '.' + p;
        if (typeof value === 'function') {
          return fullPath + '(';
        }
        return fullPath;
      });

    if (allProps.length > 0) {
      return allProps;
    }
  }

  return null;
}
