/**
 * GraphQL Colocation Rule
 *
 * Enforces co-location of GraphQL queries/mutations with their components.
 * Detects both suffix-based and content-based standalone GraphQL files.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce co-location of GraphQL queries/mutations with their components',
      category: 'Best Practices',
      recommended: true
    },
    fixable: undefined,
    schema: [{
      type: 'object',
      properties: {
        allowedSuffixes: {
          type: 'array',
          items: {
            type: 'string'
          },
          default: ['.mutations.ts', '.queries.ts', '.fragments.ts']
        },
        maxNonGraphQLRatio: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.3
        },
        ignoreTestFiles: {
          type: 'boolean',
          default: true
        },
        ignoreGenerated: {
          type: 'boolean',
          default: true
        },
        ignorePatterns: {
          type: 'array',
          items: {
            type: 'string'
          },
          default: ['**/__generated__/**']
        }
      },
      additionalProperties: false
    }],
    messages: {
      standaloneGraphQLFile: 'Standalone GraphQL file detected. Please co-locate GraphQL queries/mutations with the components that use them. Move the GraphQL definitions into the component file itself.',
      pureGraphQLFile: 'File contains only GraphQL operations without component definitions. Please co-locate GraphQL queries/mutations with the components that use them.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedSuffixes = options.allowedSuffixes || ['.mutations.ts', '.queries.ts', '.fragments.ts'];
    const maxNonGraphQLRatio = options.maxNonGraphQLRatio || 0.3;
    const ignoreTestFiles = options.ignoreTestFiles !== false;
    const ignoreGenerated = options.ignoreGenerated !== false;
    const ignorePatterns = options.ignorePatterns || ['**/__generated__/**'];

    const filename = context.filename || '';
    const sourceCode = context.getSourceCode();
    const sourceText = sourceCode.getText();

    // Check if file should be ignored
    const shouldIgnore = () => {
      // Check ignore patterns
      if (ignorePatterns.some(pattern => {
        const regexPattern = pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '[^/]');
        const regex = new RegExp(regexPattern);
        return regex.test(filename);
      })) {
        return true;
      }

      // Check test files
      if (ignoreTestFiles && (
        filename.includes('.test.') ||
        filename.includes('__tests__/') ||
        filename.includes('.spec.')
      )) {
        return true;
      }

      // Check generated files
      if (ignoreGenerated && (
        sourceText.includes('@generated') ||
        sourceText.includes('GENERATED CODE') ||
        sourceText.includes('This file is auto-generated') ||
        filename.includes('__generated__/')
      )) {
        return true;
      }

      return false;
    };

    return {
      // Analyze the entire file once at the end
      'Program:exit'() {
        if (shouldIgnore()) {
          return;
        }

        // Check if this file has any GraphQL content
        const hasGraphQL = /graphql`|mutation\s+\w+|query\s+\w+|fragment\s+\w+/.test(sourceText);
        if (!hasGraphQL) {
          return;
        }

        // Check if file contains React component definitions
        const hasReactComponent = [
          /(function|const)\s+\w+.*=.*React\./,
          /(function|const)\s+\w+.*=.*\(props\)\s*=>/,
          /export\s+(default\s+)?function\s+\w+.*React\./,
          /export\s+(default\s+)?(function|const)\s+\w+.*JSX\./,
          /React\.(memo|forwardRef|useCallback|useMemo|useState|useEffect)/,
          /\(.*\)\s*:\s*JSX\.Element/,
          /React\.FC</,
          /import.*React(,{[^}]*})?/
        ].some(pattern => pattern.test(sourceText)) && filename.endsWith('.tsx');

        // Calculate non-GraphQL content ratio
        const lines = sourceText.split('\n').filter(line => line.trim().length > 0);
        const meaningfulLines = lines.filter(line =>
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*') &&
          !line.trim().startsWith('import') &&
          !line.trim().startsWith('export')
        );

        let nonGraphQLRatio = 0;
        if (meaningfulLines.length > 0) {
          const nonGraphQLLines = meaningfulLines.filter(line =>
            !line.includes('graphql`') &&
            !line.includes('mutation ') &&
            !line.includes('query ') &&
            !line.includes('fragment ') &&
            !line.includes('export const') &&
            line.trim() !== ''
          );
          nonGraphQLRatio = nonGraphQLLines.length / meaningfulLines.length;
        }

        // Method 1: Check file suffix patterns
        const isStandaloneBySuffix = allowedSuffixes.some(suffix => filename.endsWith(suffix));

        // Method 2: Content-based detection
        const isPureGraphQL = !hasReactComponent && nonGraphQLRatio <= maxNonGraphQLRatio;

        if (isStandaloneBySuffix || isPureGraphQL) {
          context.report({
            node: sourceCode.ast,
            messageId: isStandaloneBySuffix ? 'standaloneGraphQLFile' : 'pureGraphQLFile'
          });
        }
      }
    };
  }
};