import { describe, expect, it } from 'vitest';
import { countPdfPages, describeOverflow, overflowingUnits, pdfPathFor, resolvePlaywright, type PdfResult } from './pdf';

describe('pdfPathFor', () => {
  it('names the PDF beside its HTML, level suffix kept', () => {
    expect(pdfPathFor('/tmp/audit.sketch.html')).toBe('/tmp/audit.sketch.pdf');
    expect(pdfPathFor('/tmp/audit.html')).toBe('/tmp/audit.pdf');
  });
});

describe('resolvePlaywright', () => {
  // The trade that keeps every optional peer in this package defensible: a
  // missing one is an install instruction, never a stack trace. The failing
  // `require` is injected rather than provoked through the filesystem, because
  // vitest patches `createRequire` and resolves from the project regardless of
  // the path given. The real walk is proven outside the runner: `node -e` with
  // a fake directory throws MODULE_NOT_FOUND into this same catch.
  it('turns a missing optional peer into an install instruction', () => {
    const missing = Object.assign(
      (): never => {
        throw Object.assign(new Error("Cannot find package 'playwright'"), {
          code: 'MODULE_NOT_FOUND',
        });
      },
      { resolve: (): never => missing() },
    );
    expect(() => resolvePlaywright('/somewhere', missing)).toThrowError(
      /needs playwright[\s\S]*pnpm add -D playwright/,
    );
  });
});

describe('countPdfPages', () => {
  it('counts page objects and ignores the /Pages tree node', () => {
    const pdf = '1 0 obj<</Type /Pages /Count 2>>endobj 2 0 obj<</Type /Page>>endobj 3 0 obj<</Type /Page>>endobj';
    expect(countPdfPages(Buffer.from(pdf))).toBe(2);
  });
});

describe('page overflow', () => {
  const base: PdfResult = {
    output: '/tmp/m.pdf',
    pages: 3,
    expectedPages: 2,
    printableHeightPx: 1000,
    units: [
      { index: 1, label: 'Cover', heightPx: 900 },
      { index: 2, label: 'Plate 02', heightPx: 1024 },
    ],
  };

  it('names the unit that outgrew the paper, and by how much', () => {
    expect(overflowingUnits(base).map((u) => [u.label, u.overflowPx])).toEqual([['Plate 02', 24]]);
    expect(describeOverflow(base, 'A4')).toMatch(/printed 3 pages.*declare 2.*Plate 02 \(page 2\).*24px over/);
  });

  it('is silent when the page count matches or no breaks are declared', () => {
    expect(describeOverflow({ ...base, pages: 2 }, 'A4')).toBeNull();
    expect(describeOverflow({ ...base, expectedPages: null }, 'A4')).toBeNull();
  });
});
