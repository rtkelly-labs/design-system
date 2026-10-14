import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { renderReport } from './render';
import { describeOverflow, htmlToPdf } from './pdf';

// The PDF is written inside this package on purpose: `htmlToPdf` resolves its
// Chromium from the *document's* directory, and only here does the walk find
// the devDependency. The output lands beside the input like a consumer's would.
const scratch = path.resolve('.pdf-e2e-tmp');

function chromiumAvailable(): boolean {
  try {
    const { chromium } = createRequire(import.meta.url)('playwright') as {
      chromium: { executablePath(): string };
    };
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

describe.skipIf(!chromiumAvailable())('htmlToPdf (needs a local Chromium)', () => {
  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  it('prints the sample report: %PDF header, real page behind it', async () => {
    await mkdir(scratch, { recursive: true });
    const result = await renderReport({
      input: path.resolve('src/templates/sample.tsx'),
      output: path.join(scratch, 'sample.html'),
      theme: 'sketch',
      typecheck: false,
    });
    const { output: pdf } = await htmlToPdf(result.output);
    expect(pdf).toBe(path.join(scratch, 'sample.pdf'));
    const bytes = await readFile(pdf);
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(10_000);
  }, 120_000);

  it('flags a sheet that outgrows the paper as an extra page', async () => {
    await mkdir(scratch, { recursive: true });
    const sheet = (id: string, height: string) =>
      `<section id="${id}" style="height:${height};break-after:page">${id}</section>`;
    const html = (tall: string) =>
      `<!doctype html><style>@page{margin:16mm 14mm}body{margin:0}</style>` +
      sheet('fits', '100mm') + sheet('last', tall).replace(';break-after:page', '');
    await writeFile(path.join(scratch, 'ok.html'), html('100mm'));
    await writeFile(path.join(scratch, 'over.html'), html('400mm'));
    const ok = await htmlToPdf(path.join(scratch, 'ok.html'));
    expect([ok.pages, ok.expectedPages]).toEqual([2, 2]);
    expect(describeOverflow(ok, 'A4')).toBeNull();
    const over = await htmlToPdf(path.join(scratch, 'over.html'));
    expect(over.pages).toBeGreaterThan(2);
    expect(describeOverflow(over, 'A4')).toMatch(/last \(page 2\).*px over the \d+px A4/);
  }, 120_000);

  it('measures at paper width: a block that only wraps on paper is caught', async () => {
    await mkdir(scratch, { recursive: true });
    // Fits one line at 1280px, wraps to many at 210mm, so only a paper-width
    // viewport sees it outgrow the sheet.
    const words = Array.from({ length: 900 }, () => 'overflowing').join(' ');
    await writeFile(
      path.join(scratch, 'wrap.html'),
      `<!doctype html><style>@page{margin:0}body{margin:0}</style>` +
        `<section style="height:100mm;break-after:page">a</section><section style="font-size:16px">${words}</section>`,
    );
    const result = await htmlToPdf(path.join(scratch, 'wrap.html'));
    expect(result.pages).toBeGreaterThan(2);
    expect(result.units.at(-1)?.heightPx).toBeGreaterThan(result.printableHeightPx as number);
  }, 120_000);

  it('inlines webfonts so the report is one file', async () => {
    await mkdir(scratch, { recursive: true });
    const result = await renderReport({
      input: path.resolve('src/templates/sample.tsx'),
      output: path.join(scratch, 'fonts.html'),
      theme: 'sketch',
      typecheck: false,
    });
    const html = await readFile(result.output, 'utf8');
    expect(html).toMatch(/@font-face[^}]*url\(data:font\/woff2;base64,/);
    expect(html).not.toMatch(/url\(\.\/(?:files|fonts)\//);
  }, 120_000);
});
