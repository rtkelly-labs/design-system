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
 * `@rtkelly13/design-system`: a report is printed by the browser its own
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

export async function htmlToPdf(
  htmlPath: string,
  { paper = 'A4' }: { paper?: PaperSize } = {},
): Promise<string> {
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
    const output = pdfPathFor(absolute);
    await page.pdf({
      path: output,
      format: paper,
      printBackground: true,
      preferCSSPageSize: true,
    });
    return output;
  } finally {
    await browser.close();
  }
}
