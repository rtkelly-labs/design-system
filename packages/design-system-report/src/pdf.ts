/**
 * `htmlToPdf` — the finished HTML on paper.
 *
 * This is deliberately not a second renderer. The PDF is what the browser does
 * with the document the report generator already produced, so every rule in
 * `styles.css`' print block, every `print:` utility and the paper rung all
 * apply here and nowhere else needs to know. `preferCSSPageSize` means the
 * margin has exactly one owner: the `@page` rule.
 *
 * Chromium is reached through `playwright` as an optional peer resolved from
 * the *document's* directory, in the same shape `render.ts` uses for
 * `@rtkelly-labs/design-system`: a report is printed by the browser its own
 * project installed, and a missing one is an install instruction rather than a
 * stack trace — the trade every optional peer in this package makes.
 */

import path from 'node:path';
import { createRequire } from 'node:module';

export type PaperSize = 'A4' | 'Letter';

export function pdfPathFor(htmlPath: string): string {
  return htmlPath.replace(/\.html$/, '.pdf');
}

interface Page {
  goto(url: string, options: { waitUntil: 'load' }): Promise<void>;
  emulateMedia(options: { media: 'print' | 'screen' }): Promise<void>;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  evaluate(expression: string): Promise<unknown>;
  pdf(options: {
    path: string;
    format: PaperSize;
    printBackground: true;
    preferCSSPageSize: true;
  }): Promise<Uint8Array>;
}

interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface ChromiumLauncher {
  launch(): Promise<Browser>;
  executablePath?(): string;
}

/** The narrow shape of `NodeJS.Require` this module uses — kept structural so the
 *  peer stays a runtime concern, and the failure path stays unit-testable
 *  (vitest patches `createRequire`, so the real walk cannot be proven under it). */
interface RequireLike {
  (id: string): unknown;
  resolve(id: string): string;
}

export function resolvePlaywright(
  from: string,
  require_: RequireLike = createRequire(path.join(from, 'noop.js')),
): { chromium: ChromiumLauncher } {
  try {
    return require_('playwright') as { chromium: ChromiumLauncher };
  } catch (error) {
    throw new Error(
      'ds-report --pdf needs playwright, which is an optional peer dependency of this ' +
        'package, and the Chromium browser it drives:\n' +
        '  pnpm add -D playwright && npx playwright install chromium\n\n' +
        String(error),
    );
  }
}

/** One intended page: an element the document breaks after (or before). */
export interface PageUnit {
  /** 1-based, in document order. */
  index: number;
  /** The element's id, else its first heading, else "Page N". */
  label: string;
  heightPx: number;
}

export interface PdfResult {
  output: string;
  /** Pages Chromium actually produced, counted from the PDF itself. */
  pages: number;
  /** Pages the document's own break rules ask for; null when it declares none. */
  expectedPages: number | null;
  /** Printable height per page in CSS px (paper minus the `@page` margin), or null if unreadable. */
  printableHeightPx: number | null;
  units: PageUnit[];
}

/** Units taller than the printable page, tallest first. Empty is the pass. */
export function overflowingUnits(result: PdfResult): (PageUnit & { overflowPx: number })[] {
  const limit = result.printableHeightPx;
  if (limit === null) return [];
  return result.units
    .map((unit) => ({ ...unit, overflowPx: Math.round(unit.heightPx - limit) }))
    .filter((unit) => unit.overflowPx > 0)
    .sort((a, b) => b.overflowPx - a.overflowPx);
}

/** The sentence a warning or a strict failure carries; null when the pages match. */
export function describeOverflow(result: PdfResult, paper: PaperSize): string | null {
  if (result.expectedPages === null || result.pages <= result.expectedPages) return null;
  const culprits = overflowingUnits(result)
    .map(
      (u) =>
        `${u.label} (page ${u.index}) is ${Math.round(u.heightPx)}px, ${u.overflowPx}px over the ` +
        `${Math.round(result.printableHeightPx as number)}px ${paper} printable height`,
    )
    .join('; ');
  return (
    `${path.basename(result.output)} printed ${result.pages} pages but its break rules declare ` +
    `${result.expectedPages}` +
    (culprits ? `: ${culprits}` : ' — no single page unit measures over, so look for a block split mid-page')
  );
}

/** Pages in a Chromium-written PDF: page objects, never the `/Pages` tree node. */
export function countPdfPages(bytes: Uint8Array): number {
  return (Buffer.from(bytes).toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

// Runs in the page, under print media. Page units are the elements the document
// breaks after (or before) — `print:break-after-page` is how a report says "this
// is one sheet". Expected pages is therefore units + the trailing run, and a
// document that declares no breaks has no expectation to violate.
const MEASURE = `(() => {
  const forced = (v) => v === 'page' || v === 'always' || v === 'left' || v === 'right';
  const all = Array.from(document.body.querySelectorAll('*'));
  const units = all.filter((el) => {
    const cs = getComputedStyle(el);
    return forced(cs.breakAfter) || forced(cs.breakBefore);
  });
  // The run after the last break is a page too, though nothing marks it.
  const next = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (e.nextElementSibling) return e.nextElementSibling; return null; };
  const last = units[units.length - 1];
  if (last && forced(getComputedStyle(last).breakAfter) && next(last)) units.push(next(last));
  const label = (el, i) => {
    if (el.id) return el.id;
    const h = el.querySelector('h1, h2, h3');
    return (h && h.textContent.trim().slice(0, 48)) || 'Page ' + (i + 1);
  };
  let margin = null;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = Array.from(sheet.cssRules); } catch { continue; }
    const walk = (list) => { for (const r of list) {
      if (r.type === CSSRule.PAGE_RULE && r.style.marginTop && r.style.marginBottom) margin = [r.style.marginTop, r.style.marginBottom, r.style.marginLeft || r.style.marginTop, r.style.marginRight || r.style.marginTop];
      else if (r.cssRules) walk(Array.from(r.cssRules));
    } };
    walk(rules);
  }
  const px = (len) => { const p = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;height:' + len; document.body.appendChild(p); const h = p.getBoundingClientRect().height; p.remove(); return h; };
  const inch = px('1in');
  return {
    units: units.map((el, i) => ({ index: i + 1, label: label(el, i), heightPx: el.getBoundingClientRect().height,
      before: forced(getComputedStyle(el).breakBefore), after: forced(getComputedStyle(el).breakAfter),
      // Nothing renders below it: a break here starts no page.
      tail: el.getBoundingClientRect().bottom + scrollY >= document.documentElement.scrollHeight - 1 })),
    marginPx: margin ? margin.map(px) : null,
    inch,
  };
})()`;

interface Measured {
  units: (PageUnit & { before: boolean; after: boolean; tail: boolean })[];
  /** top, bottom, left, right */
  marginPx: [number, number, number, number] | null;
  inch: number;
}

export async function htmlToPdf(
  htmlPath: string,
  { paper = 'A4' }: { paper?: PaperSize } = {},
): Promise<PdfResult> {
  const absolute = path.resolve(htmlPath);
  const { chromium } = resolvePlaywright(path.dirname(absolute));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(new URL(`file://${absolute}`).href, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    // Switch 2 of docs/deterministic-rendering.md: a family name resolves only
    // once the face is registered, and printing before that puts Courier New
    // on paper. The string form keeps the page-side global out of this
    // package's Node typechecking; Playwright awaits the returned promise.
    await page.evaluate('document.fonts.ready');
    // Layout width is the paper's, less the `@page` side margins — not the
    // browser's default 1280px window, where a block that wraps on paper can
    // fit and so read as not overflowing. Margins are read first, then the
    // viewport is set to the printable width, then the units are measured.
    const paperWidthIn = paper === 'A4' ? 210 / 25.4 : 8.5;
    const first = (await page.evaluate(MEASURE)) as Measured;
    const sides = first.marginPx ? first.marginPx[2] + first.marginPx[3] : 0;
    await page.setViewportSize({ width: Math.round(paperWidthIn * first.inch - sides), height: 1123 });
    const measured = (await page.evaluate(MEASURE)) as Measured;
    const output = pdfPathFor(absolute);
    const bytes = await page.pdf({
      path: output,
      format: paper,
      printBackground: true,
      preferCSSPageSize: true,
    });
    const paperHeightIn = paper === 'A4' ? 297 / 25.4 : 11;
    const printableHeightPx = measured.marginPx
      ? paperHeightIn * measured.inch - measured.marginPx[0] - measured.marginPx[1]
      : null;
    // N breaks make N+1 pages; a break after the final unit starts no page when nothing follows it, so
    // that one is not counted. A first-unit break-before likewise starts none.
    const { units } = measured;
    const breaks =
      units.filter((u) => u.after).length + units.filter((u) => u.before).length -
      (units.at(-1)?.after && units.at(-1)?.tail ? 1 : 0) - (units[0]?.before ? 1 : 0);
    const expectedPages = units.length === 0 ? null : breaks + 1;
    return {
      output,
      pages: countPdfPages(bytes),
      expectedPages,
      printableHeightPx,
      units: measured.units.map(({ index, label, heightPx }) => ({ index, label, heightPx })),
    };
  } finally {
    await browser.close();
  }
}
