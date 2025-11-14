import { defineConfig } from 'vite'
import path from 'node:path'

import electron from 'vite-plugin-electron/simple'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import relay from "vite-plugin-relay";


const aliases = {
  '@ui': path.resolve(__dirname, 'ui'),
  '@shared': path.resolve(__dirname, 'shared'),
  '@main': path.resolve(__dirname, 'main'),
  '@base': path.resolve(__dirname, 'main/base'),
  '@db': path.resolve(__dirname, 'main/db'),
  '@cli': path.resolve(__dirname, 'cli'),
  '@tests': path.resolve(__dirname, '__tests__'),
  '@factories': path.resolve(__dirname, '__tests__/factories'),
}


export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const IGNORE_CODES = ["SOURCEMAP_ERROR", "INVALID_ANNOTATION", "MODULE_LEVEL_DIRECTIVE"];
        if (IGNORE_CODES.includes(warning.code || '')) {
          return; // Ignore the specified warnings
        }
        warn(warning); // Otherwise, call the default warn handler
      },
    },
  },
  optimizeDeps: {
    exclude: ['@lancedb/lancedb']
  },
  plugins: [
    react(),
    relay,
    tailwindcss(),
    electron({
      main: {
        vite: {
          resolve: { alias: aliases },
          build: {
            rollupOptions: {
              external: [
                "@yaacovcr/transform",
                'typeorm',
                'electron',
                'node:*',
                'buffer',
                'crypto',
                'stream',
                'util',
                'path',
                'fs',
                'os',
                'events',
                'typeorm',
                'reflect-metadata',
                'sqlite3',
                'sqlite',
                'node:sqlite',
                'type-graphql',
                'graphql',
                'graphql-scalars',
                'class-validator',
                /^@google-cloud\/.*/,
                /^@sap\/.*/,
                /^better-sqlite3.*/,
                /^hdb-pool.*/,
                /^ioredis.*/,
                /^mongodb.*/,
                /^mssql.*/,
                /^mysql.*/,
                /^mysql2.*/,
                /^oracledb.*/,
                /^pg.*/,
                /^redis.*/,
                /^sql\.js.*/,
                /^typeorm-aurora-data-api-driver.*/,
                // LanceDB native modules
                '@lancedb/lancedb',
                /^@lancedb\/.*/,
                // EPUB parser dependencies that use CommonJS
                'epub2',
                'jszip',
                '@gxl/epub-parser',
                'cheerio',
                'xmlhttprequest',
                // PDF parser dependencies
                'pdf-parse',
                'mammoth',
              ]
            },
          },
        },
        entry: 'main/index.ts',
      },
      preload: {
        vite: {
          resolve: { alias: aliases },
          build: {
            rollupOptions: {
              output: {
                format: 'es',
              },
            },
          },
        },
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'main/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  resolve: {
    alias: aliases
  },
})
