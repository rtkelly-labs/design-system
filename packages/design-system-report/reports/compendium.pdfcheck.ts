/**
 * The PDF-level guarantee: for every cell the document declares, is what the DOM says is in it
 * actually painted on the PDF page that holds it?
 *
 * Two halves, both read back from the PDF itself with pdfjs-dist, not inferred from the DOM:
 *
 *   text    every visible word of the cell body (read from the print-layout DOM) appears among the PDF
 *           text items that sit inside that cell's rectangle on that page. Positional, because the
 *           sketch and midnight cells of one state carry identical text and a blank twin must not pass
 *           on the other's words.
 *   pixels  the PDF page is rasterised and the cell body must not be one flat colour. This is the
 *           only check a text-less cell (Divider, Spinner, a chart) gets, and it also catches a
 *           cell whose text is in the file but painted transparent.
 *
 * Text is compared with whitespace stripped and case folded: Chromium emits letter-spaced and
 * uppercased runs one glyph at a time, so `font-mono uppercase tracking-[0.18em]` arrives as
 * "C O M P E N D I U M". Text a sighted reader cannot see is not expected: sr-only (clipped to a
 * pixel, absolutely positioned), visibility/opacity-hidden or transparent text (a pending Button
 * hides its label on purpose), icon-font glyphs (private-use code points: pdf.js cannot map them back
 * to the character, so an icon-only cell leans on the pixel half), `<select>` options, SVG `<title>`. The consequence: a cell whose ONLY
 * content is such text is caught by the pixel half; one that also has other painted content is not.
 */

import { readFile } from 'node:fs/promises';

export interface CellGeometry {
  key: string;
  /** 1-based sheet number (`data-page`). */
  page: number;
  /** CSS px relative to the sheet's top-left, for the cell body (the part under the header strip). */
  body: { x: number; y: number; w: number; h: number };
  /** Words a sighted reader sees in the body. */
  words: string[];
  /** Words in the layout but painted away on purpose (visibility hidden, opacity 0, transparent colour): a pending Button keeps its label for width and hides it. Not expected in the PDF, and not a failure. */
  invisible: string[];
}

/** Runs in the page, so it must be self-contained. Print media must already be emulated. */
export function collectGeometry(): CellGeometry[] {
  const hiddenTag = /^(SELECT|OPTION|DATALIST|SCRIPT|STYLE|TEMPLATE|NOSCRIPT|TITLE|DESC)$/;
  const transparent = (c: string) => c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c) || /\/\s*0(\.0+)?\s*\)$/.test(c);
  /** `skip`: not rendered or not for sighted readers. `invisible`: in the layout but painted away. */
  const classify = (el: Element, root: Element): 'ok' | 'skip' | 'invisible' => {
    let result: 'ok' | 'invisible' = 'ok';
    const own = getComputedStyle(el);
    if (transparent(own.color) || transparent(own.getPropertyValue('-webkit-text-fill-color'))) result = 'invisible';
    for (let a: Element | null = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none') return 'skip';
      if (hiddenTag.test(a.tagName.toUpperCase())) return 'skip';
      const r = a.getBoundingClientRect();
      if (s.position === 'absolute' && r.width <= 1 && r.height <= 1 && s.overflowX === 'hidden') return 'skip'; // sr-only
      if (s.visibility === 'hidden' || s.opacity === '0') result = 'invisible';
      if (a === root) break;
    }
    return result;
  };
  return [...document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')].map((cell) => {
    const sheet = cell.closest<HTMLElement>('[data-page]')!.getBoundingClientRect();
    const body = cell.lastElementChild as HTMLElement;
    const r = body.getBoundingClientRect();
    const words: string[] = [];
    const invisible: string[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent) continue;
      const how = classify(parent, body);
      if (how === 'skip') continue;
      for (const w of (n.nodeValue ?? '').replace(/[\p{Cf}\p{Co}]/gu, '').split(/\s+/)) if (w) (how === 'ok' ? words : invisible).push(w);
    }
    return {
      key: `${cell.dataset.component}/${cell.dataset.state}/${cell.dataset.rung}`,
      page: Number(cell.closest<HTMLElement>('[data-page]')!.dataset.page),
      body: { x: r.left - sheet.left, y: r.top - sheet.top, w: r.width, h: r.height },
      words,
      invisible,
    };
  });
}

export interface PdfFailure {
  key: string;
  kind: 'text' | 'pixels';
  detail: string;
}

const fold = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const PX_TO_PT = 0.75;
/** Slack, in pt, for sub-pixel layout and glyph origins sitting on the box edge. */
const EDGE = 3;
/** A cell body must have at least this many pixels that differ from its background. */
const MIN_PAINTED = 25;
const DIFF = 14;

interface TextItem {
  str: string;
  transform: number[];
}
interface PdfPage {
  view: number[];
  getViewport(o: { scale: number }): { width: number; height: number };
  getTextContent(): Promise<{ items: (TextItem | object)[] }>;
  render(o: { canvasContext: unknown; canvas: unknown; viewport: unknown }): { promise: Promise<void> };
}
interface PdfDoc {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  canvasFactory: { create(w: number, h: number): { canvas: unknown; context: { getImageData(x: number, y: number, w: number, h: number): { data: Uint8ClampedArray } } } };
}

export async function checkPdf(pdfPath: string, cells: readonly CellGeometry[]): Promise<PdfFailure[]> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as {
    getDocument(o: { data: Uint8Array }): { promise: Promise<PdfDoc>; destroy(): Promise<void> };
  };
  const task = pdfjs.getDocument({ data: new Uint8Array(await readFile(pdfPath)) });
  const doc = await task.promise;
  const failures: PdfFailure[] = [];
  try {
    const byPage = new Map<number, CellGeometry[]>();
    for (const c of cells) byPage.set(c.page, [...(byPage.get(c.page) ?? []), c]);
    for (const [n, onPage] of byPage) {
      if (n > doc.numPages) {
        for (const c of onPage) failures.push({ key: c.key, kind: 'text', detail: `page ${n} is not in the PDF (${doc.numPages} pages)` });
        continue;
      }
      const page = await doc.getPage(n);
      const height = page.view[3]! - page.view[1]!;
      const items = (await page.getTextContent()).items.filter((i): i is TextItem => 'str' in i && i.str.trim() !== '');

      // Text, per cell, positional.
      for (const c of onPage) {
        const left = c.body.x * PX_TO_PT - EDGE;
        const right = (c.body.x + c.body.w) * PX_TO_PT + EDGE;
        const top = c.body.y * PX_TO_PT - EDGE;
        const bottom = (c.body.y + c.body.h) * PX_TO_PT + EDGE;
        const inside = items.filter((i) => {
          const x = i.transform[4]!;
          const y = height - i.transform[5]!;
          return x >= left && x <= right && y >= top && y <= bottom;
        });
        const printed = fold(inside.map((i) => i.str).join(''));
        const missing = c.words.filter((w) => !printed.includes(fold(w)));
        if (missing.length > 0) {
          failures.push({ key: c.key, kind: 'text', detail: `${missing.length} of ${c.words.length} words not in the PDF at the cell's position: ${missing.slice(0, 5).map((w) => `${JSON.stringify(w)}(U+${[...w].map((ch) => ch.codePointAt(0)!.toString(16)).join(',')})`).join(' ')}` });
        }
      }

      // Pixels: rasterise the page at 96dpi so one CSS px is one pixel.
      const viewport = page.getViewport({ scale: 96 / 72 });
      const w = Math.ceil(viewport.width);
      const h = Math.ceil(viewport.height);
      const { canvas, context } = doc.canvasFactory.create(w, h);
      await page.render({ canvasContext: context, canvas, viewport }).promise;
      const data = context.getImageData(0, 0, w, h).data;
      for (const c of onPage) {
        const x0 = Math.max(0, Math.round(c.body.x) + 2);
        const y0 = Math.max(0, Math.round(c.body.y) + 2);
        const x1 = Math.min(w, Math.round(c.body.x + c.body.w) - 2);
        const y1 = Math.min(h, Math.round(c.body.y + c.body.h) - 2);
        const counts = new Map<number, number>();
        const quant = (i: number) => ((data[i]! >> 3) << 10) | ((data[i + 1]! >> 3) << 5) | (data[i + 2]! >> 3);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) counts.set(quant((y * w + x) * 4), (counts.get(quant((y * w + x) * 4)) ?? 0) + 1);
        const [bgKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0];
        const bg = [((bgKey! >> 10) & 31) << 3, ((bgKey! >> 5) & 31) << 3, (bgKey! & 31) << 3];
        let painted = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * w + x) * 4;
            if (Math.max(Math.abs(data[i]! - bg[0]!), Math.abs(data[i + 1]! - bg[1]!), Math.abs(data[i + 2]! - bg[2]!)) > DIFF) painted++;
          }
        }
        if (painted < MIN_PAINTED) failures.push({ key: c.key, kind: 'pixels', detail: `only ${painted} painted pixels in the cell body: blank` });
      }
    }
  } finally {
    await task.destroy();
  }
  return failures;
}
