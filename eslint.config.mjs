// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// Import the improved modular CodeBlocks ESLint plugin
import codeblocksPlugin from "./cli/eslint-plugin/index.js";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "dist-electron/**",
      "build/**",
      "node_modules/**",
      "cli/eslint-plugin/**",
      "**/__generated__/**",
      "main/db/migrations/.temp.validation.*",
    ],
  },
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@codeblocks": codeblocksPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",

      // Custom CodeBlocks rules
      "@codeblocks/class-props-limit": ["error", { max: 5 }],
      "@codeblocks/file-size-limit": ["error", { max: 320 }],
      "@codeblocks/graphql-mix": ["error"],
      "@codeblocks/graphql-colocation": ["error"],

      // Hide unused disable directive warnings
      "eslint-comments/no-unused-disable": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-async-promise-executor": "off",

      // More lenient rules for test files
      "@codeblocks/class-props-limit": ["warn", { max: 7 }],
      "@codeblocks/file-size-limit": ["warn", { max: 500 }],
    },
  }
);
