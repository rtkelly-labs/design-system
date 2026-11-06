import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The published artifact's shape, as opposed to its contents.
 *
 * These are the fields and files a consumer meets before any of the code runs,
 * and none of them are covered by anything else here: `tsup` does not read
 * them, `typecheck` cannot see them, and the visual suite is three layers away.
 * The failure they guard against is the one that already happened — `files`
 * listed `LICENSE` and `license` claimed MIT while no such file existed, so the
 * tarball shipped an MIT claim with no licence text for two minor versions.
 *
 * Note `pnpm test` runs *before* `pnpm build` in CI, so `dist/` does not exist
 * here. Only the checked-in entries can be asserted to be present; `dist` is
 * asserted to be *declared*, which is the part a human gets wrong.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
  license: string;
  files: string[];
  sideEffects: string[];
  engines: Record<string, string>;
  exports: Record<string, unknown>;
};

describe('published package shape', () => {
  it('ships the licence text it claims', () => {
    expect(pkg.license).toBe('MIT');
    expect(pkg.files).toContain('LICENSE');

    const licence = readFileSync(path.join(ROOT, 'LICENSE'), 'utf8');
    expect(licence).toContain('MIT License');
    expect(licence).toContain('Ryan Kelly');
  });

  it('every checked-in `files` entry exists', () => {
    // `dist` is generated after this suite runs; see the note above.
    // Entries starting with `!` are npm *exclusion* globs — `intent`'s
    // `edit-package-json` adds `!skills/_artifacts` to keep the working
    // artifacts out of the tarball. They are instructions to the packer, not
    // paths, so they are not checked in.
    const checkedIn = pkg.files.filter((entry) => entry !== 'dist' && !entry.startsWith('!'));
    const missing = checkedIn.filter((entry) => !existsSync(path.join(ROOT, entry)));

    expect(missing).toEqual([]);
    expect(pkg.files).toContain('dist');
  });

  /**
   * The package ships CSS and `@fontsource` imports, so a bundler cannot know
   * which files it is safe to drop without being told. Without this, a consumer
   * whose bundler tree-shakes aggressively can lose the stylesheet.
   */
  it('declares which files have side effects', () => {
    expect(pkg.sideEffects).toEqual(['**/*.css']);
  });

  /** CI runs Node 22, and nothing said so where an installer would see it. */
  it('declares a supported Node range', () => {
    expect(pkg.engines.node).toBe('>=22');
  });

  /**
   * Every stylesheet the README tells a consumer to import must be resolvable.
   * `prose.css` was once built into `dist/`, documented in its own header, and
   * absent from this map — so following the documentation produced a resolution
   * error. `check:deps` covers that from the dependency side; this covers the
   * map itself.
   */
  it.each(['./styles.css', './theme.css', './prose.css'])('exports %s', (subpath) => {
    expect(pkg.exports[subpath]).toBeDefined();
  });
});
