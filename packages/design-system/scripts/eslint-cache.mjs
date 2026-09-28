/**
 * When ESLint's cache can be trusted, and clearing it when it cannot.
 *
 * `--cache` re-lints a file only when the file or its resolved config changes.
 * That is sound for a ruleset that reads nothing but the file. Two rules here
 * read more:
 *
 *   - `tailwindcss/no-custom-classname` loads `src/styles.css` (and what it
 *     imports) from disk, and its whitelist is derived from the stylesheets by
 *     `authored-classes.mjs`.
 *   - `design-system/no-colour-literals` is implemented in
 *     `src/lib/tokenRules.ts`, and a rule's code is not part of the config hash
 *     ESLint compares — only its options are.
 *
 * So a stylesheet or a rule change can alter the verdict on a file nobody
 * touched, and a warm cache would replay the old one. This fingerprints every
 * such input and throws the cache away when the fingerprint moves: the lint
 * config and everything it imports, followed transitively; every stylesheet at
 * the top of `src/`; and the lockfile, which pins the plugins. Correctness lives
 * here rather than in the CI cache key, so a stale restore costs a cold run,
 * never a wrong verdict.
 */

import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Local modules `file` imports, resolved to absolute paths. */
function localImports(file, text) {
  const out = [];
  for (const [, spec] of text.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(file), spec);
    // TypeScript sources import extensionless; resolve the way the bundler does.
    const hit = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts'].map((ext) => base + ext).find((f) => existsSync(f) && statSync(f).isFile());
    if (hit) out.push(hit);
  }
  return out;
}

/** Every input the lint verdict depends on beyond the linted file itself. */
export function ruleInputs(root, lockfile) {
  const seen = new Set();
  const queue = [path.join(root, 'eslint.config.mjs')];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    queue.push(...localImports(file, readFileSync(file, 'utf8')));
  }
  for (const name of readdirSync(path.join(root, 'src'))) {
    if (name.endsWith('.css')) seen.add(path.join(root, 'src', name));
  }
  if (lockfile && existsSync(lockfile)) seen.add(lockfile);
  return [...seen].sort();
}

export function fingerprint(files, root) {
  const hash = createHash('sha256');
  for (const file of files) hash.update(`${path.relative(root, file)}\0`).update(readFileSync(file)).update('\0');
  return hash.digest('hex');
}

/**
 * Prepare `dir` for `--cache-location`: keep it when the fingerprint matches
 * the one recorded beside it, empty it otherwise. Returns whether it was kept.
 */
export function prepareCache(dir, print) {
  dir = path.resolve(dir);
  if (path.basename(dir) !== 'eslint-ci') {
    throw new Error('ESLINT_CACHE_DIR must name a dedicated eslint-ci directory.');
  }
  if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) {
    throw new Error('ESLINT_CACHE_DIR must not be a symlink.');
  }
  mkdirSync(dir, { recursive: true });
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (name !== 'inputs.sha256' && name !== '.eslintcache' && !/^\.cache_[a-z0-9]+$/i.test(name)) {
      throw new Error(`Unexpected file in ESLint cache: ${name}`);
    }
    if (!lstatSync(path.join(dir, name)).isFile()) {
      throw new Error(`ESLint cache entry must be a regular file: ${name}`);
    }
  }
  const stamp = path.join(dir, 'inputs.sha256');
  const kept = existsSync(stamp) && readFileSync(stamp, 'utf8') === print;
  if (!kept) {
    for (const name of entries) rmSync(path.join(dir, name));
    writeFileSync(stamp, print);
  }
  return kept;
}
