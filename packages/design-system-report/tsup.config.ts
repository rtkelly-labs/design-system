import { defineConfig } from 'tsup';

export default defineConfig({
  // Three entries: the library and the two bins. Everything this package touches at
  // runtime — esbuild, tailwindcss, the design system — is a peer, so tsup
  // externalises it automatically and the bundle stays small.
  entry: ['src/index.ts', 'src/cli.ts', 'src/trace-cli.ts'],
  format: ['cjs', 'esm'],
  // Types for the importable entry only. The CLIs are `bin`s; nothing imports
  // it, so it has no exported types.
  dts: { entry: ['src/index.ts'] },
  splitting: false,
  sourcemap: true,
  clean: true,
  // `cli.ts` carries a shebang; without this the CJS build strips it and `bin`
  // points at a file the shell cannot execute.
  shims: true,
  // The templates ship as readable source: one to copy, one to read.
  onSuccess: 'mkdir -p dist/templates && cp src/templates/*.tsx dist/templates/',
});
