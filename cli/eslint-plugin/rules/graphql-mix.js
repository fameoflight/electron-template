/**
 * GraphQL Mix Rule
 *
 * Detects files that contain both GraphQL queries and fragments.
 * Encourages separation of concerns following Relay best practices.
 *
 * ALLOWED patterns:
 * - Mutations + fragments (common in component files)
 * - Queries alone
 * - Fragments alone
 * - Pagination queries (@refetchable, @connection) + fragments
 *
 * FORBIDDEN patterns:
 * - Regular queries + fragments (should be separated)
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow mixing GraphQL queries and fragments in the same file',
      category: 'Best Practices',
      recommended: true
    },
    fixable: undefined,
    schema: [{
      type: 'object',
      properties: {
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
        },
        mode: {
          type: 'string',
          enum: ['strict', 'lenient'],
          default: 'strict'
        }
      }
    }],
    messages: {
      mixedGraphQL: 'File contains both GraphQL queries and fragments. Consider separating queries into query files and fragments into fragment files.',
      queryInFragmentFile: 'Query found in what appears to be a fragment file. Consider moving queries to separate query files.',
      fragmentInQueryFile: 'Fragment found in what appears to be a query file. Consider moving fragments to separate fragment files.',
      recommendSeparation: 'Recommended: Create separate files for queries (e.g., UserQuery.graphql) and fragments (e.g., UserFragment.graphql)'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'strict';
    const ignoreTestFiles = options.ignoreTestFiles !== false;
    const ignoreGenerated = options.ignoreGenerated !== false;
    const ignorePatterns = options.ignorePatterns || ['**/__generated__/**'];

    const filename = context.filename || '';

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
      if (ignoreGenerated && filename.includes('__generated__')) {
        return true;
      }

      return false;
    };

    if (shouldIgnore()) {
      return {};
    }

    return {
      // Analyze the entire file once at the end
      'Program:exit'() {
        const source = context.getSourceCode().getText();
        const sourceCode = context.getSourceCode();

        // Check for pagination patterns that allow mixing
        const hasPagination = /@refetchable|@connection|@pagination/.test(source);

        // Check for queries (exclude mutations, subscriptions, and pagination-related hooks)
        const hasQueries = /useLazyLoadQuery|useNetworkLazyReloadQuery|usePreloadedQuery|query\s+\w+/.test(source);

        // Check for mutations (separate from queries since mutations+fragments are allowed)
        const hasMutations = /useMutation|mutation\s+\w+/.test(source);

        // Check for fragments
        const hasFragments = /fragment\s+\w+|useFragment/.test(source);

        if (mode === 'strict') {
          // Strict mode: queries + fragments mixing is forbidden, but mutations + fragments are allowed
          if (hasQueries && hasFragments && !hasPagination && !hasMutations) {
            context.report({
              node: sourceCode.ast,
              messageId: 'mixedGraphQL'
            });
          }
        } else {
          // Lenient mode: check file naming conventions
          const isFragmentFile = /fragment|fragments?/i.test(filename) ||
            filename.includes('.fragment.') ||
            filename.endsWith('Fragments.tsx') ||
            filename.endsWith('Fragments.ts');

          const isQueryFile = /query|queries?/i.test(filename) ||
            filename.includes('.query.') ||
            filename.endsWith('Query.tsx') ||
            filename.endsWith('Query.ts') ||
            filename.endsWith('Queries.tsx') ||
            filename.endsWith('Queries.ts');

          if (isFragmentFile && hasQueries && !hasMutations) {
            context.report({
              node: sourceCode.ast,
              messageId: 'queryInFragmentFile'
            });
          }

          if (isQueryFile && hasFragments && !hasMutations) {
            context.report({
              node: sourceCode.ast,
              messageId: 'fragmentInQueryFile'
            });
          }

          // If file has mixed content and doesn't follow naming conventions (allow mutations+fragments)
          if (hasQueries && hasFragments && !isFragmentFile && !isQueryFile && !hasMutations) {
            context.report({
              node: sourceCode.ast,
              messageId: 'recommendSeparation'
            });
          }
        }
      }
    };
  }
};