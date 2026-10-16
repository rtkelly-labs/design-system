/**
 * Runs the report CLI straight from `src/`, so a report can be rendered in this
 * repo without building first.
 *
 *   pnpm report path/to/report.tsx --theme midnight
 *
 * Consumers get the built `ds-report` bin instead. The one subtlety is *where*
 * the bundle is written: the renderer resolves
 * `@rtkelly-labs/design-system` from the *report's* directory, and the dev bundle
 * has to sit inside this package for that walk to reach the workspace's
 * node_modules. It is gitignored, and dot-prefixed so neither tsup, knip nor tsc
 * picks it up.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outfile = path.join(root, 'src/.dev-cli.mjs');

await build({
  entryPoints: [path.join(root, 'src/cli.ts')],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  // esbuild and tailwindcss resolve from this repo at runtime, not from a bundle.
  packages: 'external',
  logLevel: 'warning',
});

await import(pathToFileURL(outfile).href);
