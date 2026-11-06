import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  injectStyle: false,
  external: ['react', 'react-dom'],
  onSuccess: 'cp src/styles.css src/theme.css src/prose.css dist/ && cp -r src/fonts dist/',
});
