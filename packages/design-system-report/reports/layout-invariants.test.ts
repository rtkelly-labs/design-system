/**
 * Layout invariants over the compendium, in real Chromium at paper width under print media.
 *
 *   ratchet    every violation (escape, spill, truncation, overlap, font fallback) is attributed to its
 *              plate cell and element and keyed by invariant|component|where. The keys in
 *              layout-invariants.baseline.json are today's known defects; only a key NOT in it fails.
 *              Fix a defect and its key goes stale harmlessly. Re-record with
 *              UPDATE_LAYOUT_BASELINE=1 pnpm exec vitest run reports/layout-invariants.test.ts
 *   mutation   defects injected into clean plates must be flagged (kill table printed)
 *   control    a harmless style injected the same way adds nothing
 *
 * Skipped without a local Chromium, like compendium.print.test.ts.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { renderReport } from '../src/render';
import { collectGeometry, type CellGeometry } from './compendium.pdfcheck';
import {
  ALLOWLIST,
  applyAllowlist,
  chromiumAvailable,
  fontViolations,
  inspectFonts,
  newViolations,
  openPrintPage,
  playwright,
  runControls,
  runLayout,
  runMutations,
  type Violation,
} from './layout-invariants';

const scratch = path.resolve('.layout-invariants-tmp');
const baselinePath = path.resolve('reports/layout-invariants.baseline.json');

describe.skipIf(!chromiumAvailable())('compendium: geometric layout invariants (needs a local Chromium)', () => {
  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  it('records no new violations, and mutants are killed', async () => {
    await mkdir(scratch, { recursive: true });
    const result = await renderReport({ input: path.resolve('reports/compendium.tsx'), output: path.join(scratch, 'compendium.html'), theme: 'sketch', typecheck: false, strict: true });
    const started = Date.now();
    const browser = await playwright().chromium.launch();
    try {
      const page = await openPrintPage(browser, result.output);
      const raw = await runLayout(page);
      const { violations: layout, allowed } = applyAllowlist(raw);
      const geometry = await page.evaluate<CellGeometry[]>(collectGeometry);
      const pdfPath = path.join(scratch, 'compendium.pdf');
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
      const fonts = fontViolations(await inspectFonts(pdfPath, geometry));
      const violations: Violation[] = [...layout, ...fonts];

      // Every finding is attributed and carries numbers.
      for (const v of violations) {
        expect(v.component, v.detail).not.toBe('');
        expect(v.where, v.detail).not.toBe('');
        expect(v.page, v.detail).toBeGreaterThan(0);
        expect(v.detail).toMatch(/\d|"/);
      }
      expect(allowed.every((a) => a.reason.length > 0)).toBe(true);
      expect(ALLOWLIST.every((a) => a.reason.length > 20)).toBe(true);

      const keys = [...new Set(violations.map((v) => v.ratchetKey))].sort();
      const byComponent = new Map<string, number>();
      for (const v of violations) byComponent.set(v.component, (byComponent.get(v.component) ?? 0) + 1);
      // eslint-disable-next-line no-console
      console.log(`layout invariants: ${violations.length} violations, ${keys.length} distinct, ${allowed.length} allowed; ${[...byComponent].map(([c, n]) => `${c} ${n}`).join(', ')}`);

      if (process.env.UPDATE_LAYOUT_BASELINE) {
        await writeFile(baselinePath, `${JSON.stringify(keys, null, 2)}\n`);
      } else {
        const baseline = new Set(JSON.parse(await readFile(baselinePath, 'utf8')) as string[]);
        expect(newViolations(violations, baseline).map((v) => `${v.ratchetKey}  [${v.state}/${v.rung} p${v.page}] ${v.detail}`), 'new layout violations (fix them, or re-record the baseline on purpose)').toEqual([]);
      }

      // Mutation: plant defects in plates the detector finds clean.
      const dirty = new Set(violations.map((v) => `${v.component}/${v.state}/${v.rung}`));
      const results = await runMutations(page, { geometry, dirtyCells: dirty, tmpDir: scratch, perMutant: 8 });
      const kinds = [...new Set(results.map((r) => r.kind))];
      const table = kinds.map((k) => {
        const rs = results.filter((r) => r.kind === k);
        const eff = rs.filter((r) => r.effective);
        return { kind: k, applied: rs.length, effective: eff.length, killed: eff.filter((r) => r.killed).length, missed: eff.filter((r) => !r.killed).map((r) => `${r.cell} ${r.target}`) };
      });
      // eslint-disable-next-line no-console
      console.log(`mutation kill table\n${table.map((t) => `  ${t.kind.padEnd(16)} applied ${t.applied}  effective ${t.effective}  killed ${t.killed}`).join('\n')}`);
      expect(kinds.length, 'every mutant kind found somewhere to land').toBe(5);
      for (const t of table) {
        expect(t.effective, `${t.kind}: effective mutants`).toBeGreaterThanOrEqual(1);
        expect(t.missed, `${t.kind}: effective mutants the detector missed`).toEqual([]);
      }

      const controls = await runControls(page, dirty, 8);
      expect(controls.length).toBeGreaterThan(0);
      expect(controls.filter((c) => c.added.length > 0), 'a harmless style must not add violations').toEqual([]);
      // eslint-disable-next-line no-console
      console.log(`layout invariants total ${Date.now() - started}ms`);
    } finally {
      await browser.close();
    }
  }, 240_000);
});
