import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fingerprint, prepareCache, ruleInputs } from './eslint-cache.mjs';

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'eslint-cache-'));
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
    const dir = path.join(root, 'cache');
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
});
