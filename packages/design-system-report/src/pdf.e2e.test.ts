import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { renderReport } from './render';
import { htmlToPdf } from './pdf';

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
    const pdf = await htmlToPdf(result.output);
    expect(pdf).toBe(path.join(scratch, 'sample.pdf'));
    const bytes = await readFile(pdf);
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(10_000);
  }, 120_000);
});
