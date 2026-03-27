import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    '@babel/parser',
    '@babel/traverse',
    'chalk',
    'commander',
    'enhanced-resolve',
    'fast-glob',
    'fs-extra',
    'graphology',
    'graphology-layout',
    'graphology-layout-force',
    'ora',
    'open',
  ],
  treeshake: true,
  minify: false,
});
