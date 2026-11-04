import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureEdges, type EdgeCensus } from './edges';
import { waitForStoryRendered } from './story-ready';

/**
 * Edge hierarchy: is a surface drawn with a few heavy objects and lighter edges around them, or
 * with a strong box on everything?
 *
 * Every asserted story is measured on `midnight` with `measureEdges` (see `edges.ts` for what
 * counts). Two numbers gate, as a ratchet against `edges.baseline.json`:
 *
 *   - **heavy panels** — 2px, 3:1 boxes of card size or larger, or anything with a hard offset
 *     shadow. The brand's emphasis device; it reads as emphasis only while it is rare;
 *   - **depth** — boxes inside boxes. Each level is a frame the eye has to resolve.
 *
 * A story may not rise above its recorded numbers. A story with no record is held to the
 * absolute limits below, which come from the benchmark in `docs/edge-hierarchy.md`: GOV.UK
 * Frontend, Primer and Carbon, measured with this same function.
 *
 *   pnpm edges:census                  clear temp/edges/, then write each story's census there, gating nothing
 *   node scripts/edges-baseline.mjs    fold that census into edges.baseline.json
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CENSUS_DIR = path.join(ROOT, '..', '..', 'temp', 'edges');
const CENSUS = process.env.EDGES_CENSUS === '1';

/**
 * Limits for a story with no recorded baseline. The benchmark's three systems put at most one
 * heavy object on a page (GOV.UK's notification banner; Primer and Carbon none) and nest boxes
 * at most one level deep. The brand is heavier on purpose, so a new story may carry two — the
 * object it is about and one more — but nothing deeper than a box in a box.
 */
export const LIMITS = { heavyPanels: 2, maxDepth: 1 } as const;

const VISUAL_SPEC = readFileSync(path.join(ROOT, 'tests/visual.spec.ts'), 'utf8');

/** Every `VisualCase.id`, read as a literal so this spec can enrol cases without running `visual.spec.ts`. */
function assertedStoryIds(): string[] {
  return [...new Set([...VISUAL_SPEC.matchAll(/\bid: (['"`])([a-z0-9-]+--[a-z0-9-]+)\1/g)].map((m) => m[2]!))];
}

/** Every `id:` property in the visual spec other than the `VisualCase` type's own `id: string`. */
const idProperties = () => [...VISUAL_SPEC.matchAll(/\bid: (?!string;)/g)].length;

type Recorded = Pick<EdgeCensus, 'heavyPanels' | 'maxDepth'>;
const baseline: Record<string, Recorded> = JSON.parse(readFileSync(path.join(ROOT, 'tests/edges.baseline.json'), 'utf8'));

test.describe('Edge hierarchy', () => {
  test('enrols every visual case', { tag: '@chromium-only' }, () => {
    // A case whose id is computed rather than written as a literal would run in test:visual and
    // never reach this gate. Fail rather than skip it.
    const literal = [...VISUAL_SPEC.matchAll(/\bid: (['"`])([a-z0-9-]+--[a-z0-9-]+)\1/g)].length;
    expect(literal, 'a visual case id is not a string literal the edge gate can read').toBe(idProperties());
  });

  for (const id of assertedStoryIds()) {
    test(id, { tag: '@chromium-only' }, async ({ page }) => {
      const pinned = /--(dark|sketch|midnight)-mode$|--all-levels$|--sketch-theme$/.test(id);
      await page.goto(`/iframe.html?id=${id}&viewMode=story${pinned ? '' : '&globals=level:midnight'}`);
      await waitForStoryRendered(page, id);
      await page.evaluate(() => document.fonts.ready);
      // Overlays (Modal, Drawer, Popover, Menu, Toast…) portal to <body>, outside #storybook-root,
      // so the census measures the whole body.
      const census = await page.evaluate(measureEdges, 'body');

      if (CENSUS) {
        mkdirSync(CENSUS_DIR, { recursive: true });
        writeFileSync(path.join(CENSUS_DIR, `${id}.json`), `${JSON.stringify(census)}\n`);
        return;
      }

      const limit = baseline[id] ?? LIMITS;
      const where = baseline[id] ? 'its recorded baseline' : 'the limit for a new story';
      expect(census.heavyPanels, `${id}: heavy panels above ${where}`).toBeLessThanOrEqual(limit.heavyPanels);
      expect(census.maxDepth, `${id}: boxes nested deeper than ${where}`).toBeLessThanOrEqual(limit.maxDepth);
    });
  }
});
