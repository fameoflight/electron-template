/**
 * Custom CodeBlocks ESLint Configuration - Custom Rules Only
 *
 * This config runs ONLY the @codeblocks/* custom rules
 * Perfect for checking just your custom quality rules
 */

import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// Import the CodeBlocks ESLint plugin
import codeblocksPlugin from "./cli/eslint-plugin/index.js";

export default defineConfig(
  {
    // Global ignore patterns
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-electron/**",
      "build/**",
      "coverage/**",
      ".git/**",
      "cli/eslint-plugin/**",
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__generated__/**",
      ".data/**",
      "cli/**",
      "main/db/migrations/.temp.validation.*",
    ],
  },
  {
    // Basic TypeScript parser setup
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },

    // Custom plugin with our rules
    plugins: {
      "@codeblocks": codeblocksPlugin,
    },

    // Explicit file patterns - BE SPECIFIC
    files: [
      "main/**/*.ts",
      "ui/**/*.ts",
      "ui/**/*.tsx",
      "shared/**/*.ts",
      "cli/**/*.ts",
      // EXCLUDE: node_modules, dist, build, __tests__, etc.
    ],

    rules: {
      "@codeblocks/class-props-limit": ["error", { max: 5 }],
      "@codeblocks/file-size-limit": ["error", { max: 300 }],
      "@codeblocks/graphql-mix": ["error"],
      "@codeblocks/graphql-colocation": ["error"],

      // Hide unused disable directive warnings
      "eslint-comments/no-unused-disable": "off",
    },
  }
);
