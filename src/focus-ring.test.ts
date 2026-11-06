import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the global keyboard focus indicator.
 *
 * `styles.css` declares `:focus-visible { outline: 2px solid … }` and the
 * comment above it states the reason: a component that signals focus by
 * swapping a border colour or drawing a `ring` (a box-shadow) has no indicator
 * at all under forced-colors, so the outline has to survive underneath both.
 *
 * A utility defeats it silently. `focus:outline-none` compiles to
 * `.focus\:outline-none:focus`, which carries a class and a pseudo-class —
 * specificity (0,2,0) against the bare `:focus-visible` rule's (0,1,0). Both
 * match a keyboard focus, so the utility wins and removes the outline on
 * exactly the interaction the global rule was written for. Writing it as
 * `focus-visible:outline-none` does not help: that is (0,2,0) too, and it
 * targets the keyboard case directly.
 *
 * Three components had this — `Input` (and so `TextArea`/`Select`), `Modal`'s
 * close button and `Tag` — which is the package's three most-used interactive
 * surfaces. The fix in each was to delete the suppression and let the global
 * rule stand.
 *
 * **Why a source scan rather than a computed-style assertion.** Reading the
 * resolved outline off a keyboard-focused control is the assertion this
 * deserves, and it is not available here: the cascade that decides it lives in
 * the Tailwind output generated at build time, which jsdom never loads, and
 * jsdom does not resolve `:focus-visible` against `getComputedStyle` regardless.
 * A test built on either would assert its own fixture. Scanning the source for
 * the one construct that can suppress the outline is narrower, but it is honest
 * about what it checks and it covers every component rather than the three that
 * happened to be found.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = path.join(ROOT, 'src/components');

/** Every `outline-*` utility that resolves to `outline-style: none`. */
const SUPPRESSORS = ['outline-none', 'outline-hidden', 'outline-0'];

function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    if (!entry.name.endsWith('.tsx')) return [];
    if (entry.name.includes('.test.')) return [];
    return [full];
  });
}

describe('the global :focus-visible outline', () => {
  it.each(SUPPRESSORS)('is not suppressed by a `%s` utility in any component', (suppressor) => {
    const offenders = tsxFiles(COMPONENTS)
      .flatMap((file) =>
        fs
          .readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ file, line, number: i + 1 }))
      )
      // The rationale above names the utility it is guarding against, so skip
      // the comment lines that do the naming.
      .filter(({ line }) => !line.trimStart().startsWith('*'))
      .filter(({ line }) => new RegExp(`(^|[\\s'"\`:])${suppressor}([\\s'"\`]|$)`).test(line))
      .map(({ file, number }) => `${path.relative(ROOT, file)}:${number}`);

    expect(offenders).toEqual([]);
  });
});
