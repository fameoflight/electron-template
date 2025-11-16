/**
 * CodeBlocks ESLint Plugin - Modular Implementation
 * Each rule in its own file for better maintainability
 */

import classPropsLimitRule from './rules/class-props-limit.js';
import fileSizeLimitRule from './rules/file-size-limit.js';
import graphqlMixRule from './rules/graphql-mix.js';
import graphqlColocationRule from './rules/graphql-colocation.js';

export default {
  rules: {
    'class-props-limit': classPropsLimitRule,
    'file-size-limit': fileSizeLimitRule,
    'graphql-mix': graphqlMixRule,
    'graphql-colocation': graphqlColocationRule
  }
};