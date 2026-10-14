/**
 * Mutation test for the PDF-level guarantee. A checker that has never been seen to fail proves
 * nothing, so this builds a small document in the compendium's own cell shape (a sheet, cells with
 * data-component / data-state / data-rung, a header strip over a body), prints it with Chromium,
 * and mutates ONE cell at a time so that it paints nothing in a different way. Each mutation must
 * flag that cell and no other, and the unmutated document must pass.
 *
 * Skipped without a local Chromium, like compendium.print.test.ts.
 */

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { htmlToPdf } from '../src/pdf';
import { checkPdf, collectGeometry, type CellGeometry } from './compendium.pdfcheck';

const scratch = path.resolve('.compendium-pdfcheck-tmp');
interface Page {
  goto(url: string): Promise<unknown>;
  emulateMedia(o: object): Promise<void>;
  evaluate<T>(fn: string | (() => T)): Promise<T>;
}
const playwright = () =>
  createRequire(import.meta.url)('playwright') as { chromium: { launch(): Promise<{ newPage(o: object): Promise<Page>; close(): Promise<void> }>; executablePath(): string } };
const chromiumAvailable = () => {
  try {
    return existsSync(playwright().chromium.executablePath());
  } catch {
    return false;
  }
};

const ART = '<svg width="120" height="30"><rect width="120" height="30" fill="#c00"/></svg>';
/** Cell bodies, by name. Each is something a component might do. */
const BODIES: Record<string, string> = {
  text: '<p style="margin:0;font:16px sans-serif">Alpha beta gamma</p>',
  graphic: `<div style="padding:8px">${ART}</div>`,
  twin: '<p style="margin:0;font:16px sans-serif">Alpha beta gamma</p>',
  mixed: `<div style="padding:8px;font:16px sans-serif">Delta epsilon ${ART}</div>`,
};

function cell(name: string, mutate?: (body: string) => string) {
  const body = BODIES[name]!;
  return `<div data-component="Probe" data-state="${name}" data-rung="sketch" style="width:300px;border:2px solid #000">
    <div style="font:11px monospace;padding:4px;background:#eee">${name.toUpperCase()}</div>
    <div style="padding:12px;background:#fff;min-height:60px">${mutate ? mutate(body) : body}</div></div>`;
}

function document_(mutated: Record<string, (b: string) => string>) {
  return `<!doctype html><html><head><style>@page{size:A4;margin:0}body{margin:0}</style></head><body>
  <section data-page="1" style="min-height:297mm;padding:20px;display:flex;flex-direction:column;gap:20px">
    ${Object.keys(BODIES).map((n) => cell(n, mutated[n])).join('\n')}
  </section></body></html>`;
}

async function run(name: string, mutated: Record<string, (b: string) => string>) {
  await mkdir(scratch, { recursive: true });
  const html = path.join(scratch, `${name}.html`);
  await writeFile(html, document_(mutated));
  const browser = await playwright().chromium.launch();
  let cells: CellGeometry[];
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto(new URL(`file://${html}`).href);
    await page.emulateMedia({ media: 'print' });
    cells = await page.evaluate(collectGeometry);
  } finally {
    await browser.close();
  }
  const pdf = await htmlToPdf(html);
  return checkPdf(pdf.output, cells);
}

describe.skipIf(!chromiumAvailable())('compendium pdf check catches cells that paint nothing', () => {
  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  it('passes a document in which every cell paints', async () => {
    expect(await run('clean', {})).toEqual([]);
  }, 60_000);

  const wrap = (style: string) => (b: string) => `<div style="${style}">${b}</div>`;
  const cases: [string, string, (b: string) => string, 'text' | 'pixels' | 'either'][] = [
    ['opacity 0', 'text', wrap('opacity:0'), 'either'],
    ['visibility hidden on the content', 'text', wrap('visibility:hidden'), 'either'],
    ['transparent text', 'text', wrap('color:transparent'), 'either'],
    ['text moved off its cell while its identical twin stays', 'twin', wrap('display:block;transform:translateX(-5000px)'), 'text'],
    ['content removed (empty body)', 'text', () => '', 'pixels'],
    ['graphic with no fill', 'graphic', (b) => b.replace('fill="#c00"', 'fill="none"'), 'pixels'],
    ['graphic clipped to nothing', 'graphic', wrap('overflow:hidden;height:0'), 'pixels'],
  ];
  for (const [label, target, mutate, kind] of cases) {
    it(`flags only the ${target} cell: ${label}`, async () => {
      const failures = await run(label.replace(/\W+/g, '-'), { [target]: mutate });
      expect(failures.map((f) => f.key)).toEqual(expect.arrayContaining([`Probe/${target}/sketch`]));
      expect([...new Set(failures.map((f) => f.key))]).toEqual([`Probe/${target}/sketch`]);
      if (kind !== 'either') expect(failures.some((f) => f.kind === kind)).toBe(true);
    }, 60_000);
  }
});
