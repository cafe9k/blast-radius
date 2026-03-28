import { defineConfig } from 'tsup';

export default defineConfig([
  // Main CLI entry
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [],
    treeshake: true,
    minify: false,
    platform: 'node',
    target: 'node18',
    outExtension() {
      return {
        js: '.js',
      };
    },
    tsconfig: './tsconfig.json',
  },
  // Worker script for parallel parsing
  {
    entry: ['src/analyzer/parser/worker.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean, main entry already did
    external: [],
    treeshake: true,
    minify: false,
    platform: 'node',
    target: 'node18',
    outDir: 'dist/analyzer/parser',
    outExtension() {
      return {
        js: '.js',
      };
    },
    tsconfig: './tsconfig.json',
  },
]);
