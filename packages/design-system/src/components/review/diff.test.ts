import { describe, expect, it } from 'vitest';
import { countDiff, diffAnchor, parseUnifiedDiff } from './diff';

const SAMPLE = `diff --git a/metrics/duplication.txt b/metrics/duplication.txt
index 1111111..2222222 100644
--- a/metrics/duplication.txt
+++ b/metrics/duplication.txt
@@ -7,3 +7,3 @@ header context
 # Emitted code is out of scope.
-# totals: clusters=63 duplicated-tokens=8418
+# totals: clusters=63 duplicated-tokens=8398
 K | span=173 copies=2
\\ No newline at end of file
`;

describe('parseUnifiedDiff', () => {
  it('numbers each side from the hunk header', () => {
    const [hunk] = parseUnifiedDiff(SAMPLE);
    expect(hunk!.header).toBe('@@ -7,3 +7,3 @@ header context');
    expect(hunk!.lines).toEqual([
      { kind: 'context', oldNumber: 7, newNumber: 7, text: '# Emitted code is out of scope.' },
      { kind: 'removed', oldNumber: 8, text: '# totals: clusters=63 duplicated-tokens=8418' },
      { kind: 'added', newNumber: 8, text: '# totals: clusters=63 duplicated-tokens=8398' },
      { kind: 'context', oldNumber: 9, newNumber: 9, text: 'K | span=173 copies=2' },
    ]);
  });

  it('reads several hunks and counts their lines', () => {
    const hunks = parseUnifiedDiff('@@ -1 +1,2 @@\n a\n+b\n@@ -10,2 +11 @@\n-c\n d\n');
    expect(hunks).toHaveLength(2);
    expect(hunks[1]!.lines[0]).toEqual({ kind: 'removed', oldNumber: 10, text: 'c' });
    expect(countDiff(hunks)).toEqual({ added: 1, removed: 1 });
  });

  it('ignores anything before the first hunk', () => {
    expect(parseUnifiedDiff('not a diff\n+looks added')).toEqual([]);
  });
});

describe('diffAnchor', () => {
  it('turns a path into a readable, stable fragment', () => {
    const anchor = diffAnchor('metrics/Parquet.SourceGenerator.metrics.txt');
    expect(anchor).toMatch(/^diff-metrics-parquet-sourcegenerator-metrics-txt-[0-9a-z]+$/);
    expect(diffAnchor('metrics/Parquet.SourceGenerator.metrics.txt')).toBe(anchor);
  });

  it('keeps paths that slug the same apart', () => {
    expect(diffAnchor('src/foo-bar.ts')).not.toBe(diffAnchor('src/foo/bar.ts'));
    expect(diffAnchor('README.md')).not.toBe(diffAnchor('readme.md'));
  });
});
