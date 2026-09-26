/**
 * The published module graph: every source module `src/index.ts` reaches.
 *
 * `dist/` is one output file per source module (#301), so this list *is* the
 * package's file list. It is asked of esbuild rather than globbed, so a module
 * only a story or a test imports is never emitted — and a file under `src/`
 * that imports a devDependency cannot reach the package by merely existing.
 *
 * Shared by `tsup.config.ts` (what to emit) and `client-boundary.mjs` (which
 * of those modules need `'use client'`), so the two cannot disagree about
 * what ships.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSync } from 'esbuild';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = path.join(ROOT, 'src');
export const ENTRY = path.join(SRC, 'index.ts');
export const SOURCE = /\.(?:ts|tsx)$/;

/** Absolute paths of the shipped source modules, sorted. */
export function reachableModules() {
  const { metafile } = buildSync({
    entryPoints: [ENTRY],
    absWorkingDir: ROOT,
    bundle: true,
    write: false,
    metafile: true,
    packages: 'external',
    logLevel: 'silent',
    // Stylesheets are not modules; the CSS contract ships beside `dist/`.
    loader: { '.css': 'empty' },
  });
  return Object.keys(metafile.inputs)
    .map((input) => path.resolve(ROOT, input))
    .filter((file) => file.startsWith(SRC + path.sep) && SOURCE.test(file) && !file.endsWith('.d.ts'))
    .sort();
}
