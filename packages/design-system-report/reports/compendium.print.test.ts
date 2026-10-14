/**
 * Source -> rendered -> printed: is every expected cell actually in the document Chromium prints?
 *
 * compendium.test.ts proves the source side (every component has a plate). This proves the rest by
 * rendering the report, loading the HTML in Chromium with print media at paper width, and checking
 * every expected (component, state, rung) cell, from the registry, against the live DOM:
 *
 *   present      exactly one element with that data-component / data-state / data-rung
 *   shown        not display:none / visibility:hidden / zero-size, and not collapsed to its chrome
 *   non-empty    visible text, a replaced/graphic element (svg, img, input, canvas) or a painted box in the body
 *   not clipped  no descendant is cut off by an overflow:hidden ancestor inside the cell
 *   no spill     nothing runs out past the cell's right edge unclipped (it would print over its neighbour)
 *   on its page  the cell sits wholly inside its own sheet, and sheet n carries exactly the cells
 *                the registry says page n does (a per-page manifest taken from the DOM)
 *   printed      the PDF has one page per sheet (the overflow check's own count)
 *   in the PDF   read back from the PDF with pdfjs-dist (compendium.pdfcheck.ts): every cell's words
 *                are among the text items inside that cell's rectangle on its page, and the cell body
 *                is not one flat colour when the PDF page is rasterised. Mutation-tested in
 *                compendium.pdfcheck.test.ts
 *
 * Residual gap, by construction: text clipped away by an overflow:hidden ancestor is still emitted
 * into the PDF, so only the DOM-side `clipped` check above sees it, not the PDF read-back.
 *
 * Skipped without a local Chromium, like pdf.e2e.test.ts.
 */

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { describeOverflow, htmlToPdf } from '../src/pdf';
import { renderReport } from '../src/render';
import { blockKey, blocksOf, orderedPlates, rungsOf } from './compendium.registry';
import { checkPdf, collectGeometry, type CellGeometry } from './compendium.pdfcheck';
import { SLACK_MM, paginate } from './compendium.layout';

const scratch = path.resolve('.compendium-print-tmp');
const PAPER_W = 794; // A4 at 96dpi, rounded

interface Browser {
  newPage(o: object): Promise<Page>;
  close(): Promise<void>;
}
interface Page {
  goto(url: string): Promise<unknown>;
  emulateMedia(o: object): Promise<void>;
  evaluate<T>(fn: string | ((arg: never) => T), arg?: unknown): Promise<T>;
}
const playwright = () => createRequire(import.meta.url)('playwright') as { chromium: { launch(): Promise<Browser>; executablePath(): string } };

function chromiumAvailable() {
  try {
    return existsSync(playwright().chromium.executablePath());
  } catch {
    return false;
  }
}

interface CellFacts {
  key: string;
  page: number;
  shown: boolean;
  empty: boolean;
  clipped: boolean;
  spills: boolean;
  inSheet: boolean;
}

/** Runs in the page. Plain function so it serialises. */
function measure(): { cells: CellFacts[]; sheets: { page: number; height: number }[]; plates: { name: string; height: number; mm: number }[] } {
  const sheets = [...document.querySelectorAll<HTMLElement>('[data-page]')];
  const cells = [...document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')].map((el) => {
    const sheet = el.closest<HTMLElement>('[data-page]');
    const r = el.getBoundingClientRect();
    const sr = sheet?.getBoundingClientRect();
    const style = getComputedStyle(el);
    let shown = style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    for (let a: HTMLElement | null = el; a && shown; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') shown = false;
    }
    // The body is everything under the cell's own header strip: the last child.
    const body = el.lastElementChild as HTMLElement | null;
    const text = (body?.textContent ?? '').trim();
    // A box painted with a background or border counts (a Skeleton is nothing else).
    const box = [...(body?.querySelectorAll<HTMLElement>('*') ?? [])].some((d) => {
      const r2 = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return r2.width > 0 && r2.height > 0 && (!/rgba\(.*, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none');
    });
    const graphic = box || body?.querySelector('svg, img, input, textarea, canvas, select, progress') != null;
    const clipped = [...(body?.querySelectorAll<HTMLElement>('*') ?? [])].some((d) => {
      const dr = d.getBoundingClientRect();
      if (dr.width === 0 && dr.height === 0) return false;
      for (let a = d.parentElement; a && a !== el; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (/hidden|clip/.test(o.overflowX + o.overflowY)) {
          const ar = a.getBoundingClientRect();
          if (dr.right > ar.right + 1 || dr.bottom > ar.bottom + 1) return true;
        }
      }
      return false;
    });
    // Spill: content that runs out past the cell's right edge with nothing clipping it, so it prints
    // over the gutter or the neighbouring cell.
    const spills = [...(body?.querySelectorAll<HTMLElement>('*') ?? [])].some((d) => {
      const dr = d.getBoundingClientRect();
      if (dr.width === 0 || dr.height === 0 || dr.right <= r.right + 1) return false;
      for (let a: HTMLElement | null = d; a && a !== el; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (o.overflowX !== 'visible') return false;
      }
      return getComputedStyle(d).position !== 'fixed';
    });
    return {
      key: `${el.dataset.component}/${el.dataset.state}/${el.dataset.rung}`,
      page: Number(sheet?.dataset.page ?? 0),
      shown,
      empty: text.length === 0 && !graphic,
      clipped,
      spills,
      inSheet: !!sr && r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1 && r.left >= sr.left - 1 && r.right <= sr.right + 1,
    };
  });
  const plates = [...document.querySelectorAll<HTMLElement>('[data-block]')].map((p) => ({
    name: p.dataset.block ?? '',
    height: Number(p.dataset.height),
    mm: (p.getBoundingClientRect().height * 25.4) / 96,
  }));
  return { cells, plates, sheets: sheets.map((s) => ({ page: Number(s.dataset.page), height: s.getBoundingClientRect().height })) };
}

describe.skipIf(!chromiumAvailable())('compendium: rendered and printed (needs a local Chromium)', () => {
  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  it('every expected cell is present, visible, non-empty, unclipped and on its own page', async () => {
    await mkdir(scratch, { recursive: true });
    const result = await renderReport({
      input: path.resolve('reports/compendium.tsx'),
      output: path.join(scratch, 'compendium.html'),
      theme: 'sketch',
      typecheck: false,
      strict: true,
    });
    const plates = orderedPlates();
    const mayClip = new Set(plates.filter((p) => p.clips).map((p) => p.component));
    const paging = paginate(blocksOf(plates));
    const expected = new Map<string, number>();
    plates.forEach((p) => p.states.forEach((s) => rungsOf(p).forEach((r) => expected.set(`${p.component}/${s.id}/${r}`, paging.pageOf.get(blockKey(p, r)) ?? 0))));

    let geometry: CellGeometry[] = [];
    const browser = await playwright().chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: PAPER_W, height: 1123 } });
      await page.goto(new URL(`file://${result.output}`).href);
      await page.emulateMedia({ media: 'print' });
      await page.evaluate('document.fonts.ready');
      const { cells, sheets, plates: heights } = await page.evaluate(measure);
      geometry = await page.evaluate(collectGeometry);

      const keys = cells.map((c) => c.key);
      expect(keys.filter((k, i) => keys.indexOf(k) !== i), 'duplicate cells').toEqual([]);
      expect([...expected.keys()].filter((k) => !keys.includes(k)), 'expected cell missing from the document').toEqual([]);
      expect(keys.filter((k) => !expected.has(k)), 'cell in the document the registry does not know').toEqual([]);
      expect(cells.filter((c) => !c.shown).map((c) => c.key), 'hidden or zero-size').toEqual([]);
      expect(cells.filter((c) => c.empty).map((c) => c.key), 'rendered empty').toEqual([]);
      expect(cells.filter((c) => c.clipped && !mayClip.has(c.key.split('/')[0]!)).map((c) => c.key), 'clipped by overflow').toEqual([]);
      expect(cells.filter((c) => c.spills && !mayClip.has(c.key.split('/')[0]!)).map((c) => c.key), 'content spills past the cell').toEqual([]);
      expect(cells.filter((c) => !c.inSheet).map((c) => c.key), 'spills out of its sheet').toEqual([]);
      // Per-page manifest: the DOM's page n carries exactly the registry's page n.
      for (const c of cells) expect(c.page, c.key).toBe(expected.get(c.key));
      expect(sheets.length).toBe(paging.total);
      // Declared heights must be honest, or the paginator packs more than a sheet holds (too small)
      // or wastes paper (too large).
      // eslint-disable-next-line no-console
      console.log(heights.map((h) => `${h.name} ${h.mm.toFixed(0)}/${h.height}`).join(', '));
      expect(heights.filter((h) => h.mm > h.height).map((h) => `${h.name}: measures ${h.mm.toFixed(0)}mm, declared ${h.height}`), 'plate outgrew its declared height').toEqual([]);
      expect(heights.filter((h) => h.height - h.mm > SLACK_MM).map((h) => `${h.name}: measures ${h.mm.toFixed(0)}mm, declared ${h.height}`), 'declared height is wasteful; lower it').toEqual([]);
    } finally {
      await browser.close();
    }

    const pdf = await htmlToPdf(result.output);
    expect(describeOverflow(pdf, 'A4')).toBeNull();
    expect(pdf.pages).toBe(paging.total);
    // The PDF itself: every cell's words are among the text items at its position on its page, and
    // its body is not flat when rasterised from the PDF.
    expect(geometry.length).toBe(expected.size);
    const failures = await checkPdf(pdf.output, geometry);
    expect(failures.map((f) => `${f.key} [${f.kind}] ${f.detail}`), 'cells whose content did not reach the PDF').toEqual([]);
  }, 180_000);
});
