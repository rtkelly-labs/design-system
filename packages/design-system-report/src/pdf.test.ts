import { describe, expect, it } from 'vitest';
import { pdfPathFor, resolvePlaywright } from './pdf';

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
