// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

/**
 * The `theme.css` consumer contract, compiled for real (#302).
 *
 * The documented Tailwind entrypoint is
 *
 *   @import "tailwindcss";
 *   @import "@rtkelly13/design-system/theme.css";
 *
 * and nothing else — `styles.css` is the opinionated extra, not a requirement.
 * 0.10.0 declared the `--animate-ds-*` tokens and their `@keyframes` in
 * `styles.css` only, so a consumer on this contract had `animate-ds-spin` in
 * the compiled components and no theme variable to back it: Tailwind emitted
 * nothing, and `Spinner`, `Skeleton` and indeterminate `Progress` stood still.
 * Every unit test passed, because they assert the class *name* on the element,
 * and Storybook imports `styles.css`, so it looked right there too.
 *
 * So this compiles exactly the consumer's CSS with the Tailwind v4 compiler and
 * asks it to build every `animate-*` candidate the components actually write.
 * A utility that needs a theme variable `theme.css` does not declare produces no
 * rule, and that is the failure asserted against.
 */

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, 'package.json'));

async function loadStylesheet(id: string, base: string) {
  const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') };
}

/** Every `animate-*` candidate, variants included, written in a shipped component. */
function componentAnimationCandidates(): string[] {
  const dir = path.join(ROOT, 'src', 'components');
  const found = new Set<string>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue;
    if (/\.(test|stories)\.tsx?$/.test(name)) continue;
    const source = readFileSync(path.join(dir, name), 'utf8');
    for (const match of source.matchAll(/[^\s'"`]*\banimate-[a-z0-9-]+/g)) found.add(match[0]);
  }
  return [...found].sort();
}

/** Tailwind's selector escaping for the characters these candidates use. */
const selectorFor = (candidate: string) => '.' + candidate.replace(/[:[\]]/g, (c) => `\\${c}`);

async function compileConsumer(candidates: string[]) {
  const input = `@import "tailwindcss";\n@import "./src/theme.css";\n`;
  const compiler = await compile(input, { base: ROOT, loadStylesheet });
  return compiler.build(candidates);
}

describe('theme.css alone generates the animations the components use', () => {
  const candidates = componentAnimationCandidates();

  it('finds the feedback primitives’ animation candidates', () => {
    // A floor rather than a list, so a new animated component widens the test
    // instead of needing it edited — but the three from #302 must be among them.
    expect(candidates).toEqual(
      expect.arrayContaining([
        'animate-ds-spin',
        'motion-reduce:animate-ds-spin-slow',
        'animate-ds-pulse',
        'data-[indeterminate]:animate-ds-track',
        'motion-reduce:data-[indeterminate]:animate-ds-pulse',
      ]),
    );
  });

  it('emits a rule for every candidate', async () => {
    const css = await compileConsumer(candidates);
    const missing = candidates.filter((candidate) => !css.includes(selectorFor(candidate)));
    expect(missing).toEqual([]);
  });

  it('emits the keyframes those rules name', async () => {
    const css = await compileConsumer(candidates);
    const named = new Set(
      [...css.matchAll(/animation:\s*var\(--animate-(ds-[a-z-]+)\)/g)].map((m) => m[1]),
    );
    expect(named.size).toBeGreaterThan(0);

    const declared = new Set([...css.matchAll(/@keyframes\s+(ds-[a-z-]+)/g)].map((m) => m[1]));
    const referenced = new Set(
      [...css.matchAll(/--animate-ds-[a-z-]+:\s*(ds-[a-z-]+)\s/g)].map((m) => m[1]),
    );
    expect(referenced.size).toBeGreaterThan(0);
    expect([...referenced].filter((name) => !declared.has(name))).toEqual([]);
  });

  it('keeps the reduced-motion partners behind the media query', async () => {
    const css = await compileConsumer(['motion-reduce:animate-ds-spin-slow']);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.motion-reduce\\:animate-ds-spin-slow\s*\{\s*animation: var\(--animate-ds-spin-slow\)/,
    );
  });
});
