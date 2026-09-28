import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprint, prepareCache, ruleInputs } from './eslint-cache.mjs';
import { REPO_ROOT } from './repo-root.mjs';

const fixtures = [];
afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const temp = path.join(REPO_ROOT, 'temp');
  mkdirSync(temp, { recursive: true });
  const root = mkdtempSync(path.join(temp, 'eslint-cache-'));
  fixtures.push(root);
  mkdirSync(path.join(root, 'scripts'));
  mkdirSync(path.join(root, 'src/lib'), { recursive: true });
  const write = (file, text) => writeFileSync(path.join(root, file), text);
  write('eslint.config.mjs', "import { rule } from './scripts/rule.mjs';");
  write('scripts/rule.mjs', "export { rule } from '../src/lib/rules';");
  write('src/lib/rules.ts', "import { helper } from './helper';");
  write('src/lib/helper.ts', 'export const helper = 1;');
  write('src/lib/unrelated.ts', 'export const x = 1;');
  write('src/styles.css', '.a {}');
  write('src/prose.css', '.b {}');
  write('pnpm-lock.yaml', 'lockfileVersion: 9');
  return { root, write };
}

describe('ruleInputs', () => {
  it('follows the config’s imports into src, extensionless ones included', () => {
    const { root } = fixture();
    const inputs = ruleInputs(root, path.join(root, 'pnpm-lock.yaml')).map((f) => path.relative(root, f));
    expect(inputs).toEqual([
      'eslint.config.mjs',
      'pnpm-lock.yaml',
      'scripts/rule.mjs',
      'src/lib/helper.ts',
      'src/lib/rules.ts',
      'src/prose.css',
      'src/styles.css',
    ]);
  });
});

describe('prepareCache', () => {
  it('keeps the cache while the rule inputs are unchanged, and empties it when one moves', () => {
    const { root, write } = fixture();
    const dir = path.join(root, 'eslint-ci');
    const print = () => fingerprint(ruleInputs(root, path.join(root, 'pnpm-lock.yaml')), root);

    expect(prepareCache(dir, print())).toBe(false); // nothing recorded yet
    writeFileSync(path.join(dir, '.eslintcache'), '{}');
    expect(prepareCache(dir, print())).toBe(true);
    expect(readdirSync(dir)).toContain('.eslintcache');

    // A stylesheet the rules read changes; no linted file does.
    write('src/prose.css', '.b {} .c {}');
    expect(prepareCache(dir, print())).toBe(false);
    expect(readdirSync(dir)).toEqual(['inputs.sha256']);
  });

  it('ignores files the rules never read', () => {
    const { root, write } = fixture();
    const before = fingerprint(ruleInputs(root, null), root);
    write('src/lib/unrelated.ts', 'export const x = 2;');
    expect(fingerprint(ruleInputs(root, null), root)).toBe(before);
  });

  it('refuses a directory that is not dedicated to ESLint', () => {
    const { root, write } = fixture();
    write('keep.txt', 'consumer data');
    expect(() => prepareCache(root, 'changed')).toThrow(/dedicated/);
    expect(readFileSync(path.join(root, 'keep.txt'), 'utf8')).toBe('consumer data');
  });

  it('preserves unrelated files even in a directory named eslint-ci', () => {
    const { root } = fixture();
    const dir = path.join(root, 'eslint-ci');
    mkdirSync(dir);
    writeFileSync(path.join(dir, 'keep.txt'), 'consumer data');
    expect(() => prepareCache(dir, 'changed')).toThrow(/Unexpected/);
    expect(readFileSync(path.join(dir, 'keep.txt'), 'utf8')).toBe('consumer data');
  });

  it('refuses a symlink as the cache directory', () => {
    const { root } = fixture();
    const dir = path.join(root, 'eslint-ci');
    symlinkSync(root, dir, 'dir');
    expect(() => prepareCache(dir, 'changed')).toThrow(/symlink/);
    expect(readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8')).toBe('lockfileVersion: 9');
  });

  it('refuses directories or symlinks disguised as cache files', () => {
    const { root } = fixture();
    const dir = path.join(root, 'eslint-ci');
    mkdirSync(dir);
    mkdirSync(path.join(dir, '.cache_example'));
    expect(() => prepareCache(dir, 'changed')).toThrow(/regular file/);
  });
});
