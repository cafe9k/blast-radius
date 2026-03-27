import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Source file already has shebang, no need to add banner
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
  // Enable tsconfig paths resolution
  tsconfig: './tsconfig.json',
});
