import { describe, expect, it } from 'vitest';
import {
  buildFlame,
  diffFlame,
  fitFlameLabel,
  flameDeltaTone,
  flamePath,
  flameFromTrace,
  formatFlameDelta,
  formatFlameShare,
  formatFlameValue,
  parseFoldedStacks,
  rankFlameFrames,
  rankFlameFunctions,
  searchFlame,
  zoomFlame,
  type FlameDiff,
} from './flame';
import type { TraceSpanInput } from './trace';

const folded = [
  'main;handle;parse 30',
  'main;handle;render 50',
  'main;gc 10',
  'main;handle 10',
  '',
  '# a comment',
  'main;handle;parse 20',
].join('\n');

describe('parseFoldedStacks', () => {
  it('splits the count at the last whitespace, so frame names keep their spaces', () => {
    const { stacks, skipped } = parseFoldedStacks('App.Run();Json.Read(string, Options) 12\r\nA;B 3');
    expect(stacks).toEqual([
      { frames: ['App.Run()', 'Json.Read(string, Options)'], value: 12 },
      { frames: ['A', 'B'], value: 3 },
    ]);
    expect(skipped).toEqual([]);
  });

  it('ignores blanks and comments, and reports the lines it could not read', () => {
    const { stacks, skipped } = parseFoldedStacks('a;b 1\n\n# note\nno count here\na;b -4\n 7\na 2');
    expect(stacks.map((stack) => stack.value)).toEqual([1, 2]);
    expect(skipped).toEqual([4, 5, 6]);
  });
});

describe('buildFlame', () => {
  it('merges same-name siblings, sorts by name, and measures total and self', () => {
    const tree = buildFlame(folded);
    expect(tree.total).toBe(120);
    expect(tree.root).toMatchObject({ id: '', name: 'all', depth: 0, total: 120, self: 0, x: 0, width: 1 });
    const handle = tree.byId.get('main;handle')!;
    expect(handle).toMatchObject({ total: 110, self: 10, depth: 2, parentId: 'main' });
    expect(handle.children.map((child) => child.name)).toEqual(['parse', 'render']);
    expect(tree.byId.get('main;handle;parse')).toMatchObject({ total: 50, self: 50, width: 50 / 120 });
    expect(tree.byId.get('main;handle;parse')!.x).toBeCloseTo(10 / 120);
    expect(tree.byId.get('main;handle;render')!.x).toBeCloseTo(60 / 120);
    // `gc` sorts before `handle`, so it sits at the left edge.
    expect(tree.byId.get('main')!.children.map((child) => child.name)).toEqual(['gc', 'handle']);
    expect(tree.byId.get('main;handle')!.x).toBeCloseTo(10 / 120);
    expect(tree.maxDepth).toBe(3);
    expect(tree.frames.map((frame) => frame.id)).toEqual(['', 'main', 'main;gc', 'main;handle', 'main;handle;parse', 'main;handle;render']);
  });

  it('keeps sequence in time order, merging only adjacent repeats', () => {
    const tree = buildFlame(
      [
        { frames: ['req', 'auth'], value: 2 },
        { frames: ['req', 'db'], value: 5 },
        { frames: ['req', 'db'], value: 1 },
        { frames: ['req', 'auth'], value: 3 },
      ],
      { order: 'time' },
    );
    expect(tree.byId.get('req')!.children.map((child) => child.id)).toEqual(['req;auth', 'req;db', 'req;auth#2']);
    expect(tree.byId.get('req;db')!.total).toBe(6);
    expect(tree.byId.get('req;auth#2')!.x).toBeCloseTo(8 / 11);
  });

  it('escapes separators in names, so ids stay unambiguous', () => {
    const tree = buildFlame([{ frames: ['a;b', 'c'], value: 1 }]);
    expect([...tree.byId.keys()]).toEqual(['', 'a\\;b', 'a\\;b;c']);
  });

  it('drops empty and non-positive stacks, and lays out an empty profile', () => {
    const tree = buildFlame([{ frames: [], value: 3 }, { frames: ['a'], value: 0 }, { frames: ['b'], value: Number.NaN }]);
    expect(tree.total).toBe(0);
    expect(tree.frames).toHaveLength(1);
    expect(tree.root.width).toBe(0);
  });
});

describe('flameFromTrace', () => {
  const spans: TraceSpanInput[] = [
    { id: 'a', name: 'GET /orders', service: 'api', start: 0, end: 100 },
    { id: 'b', parentId: 'a', name: 'auth', service: 'api', start: 5, end: 15 },
    { id: 'c', parentId: 'a', name: 'query', service: 'db', start: 20, end: 80 },
    { id: 'd', parentId: 'c', name: 'fetch rows', service: 'db', start: 30, end: 70 },
  ];

  it('weights each span by its self time, in start order, in milliseconds', () => {
    const tree = flameFromTrace(spans);
    expect(tree.unit).toBe('ms');
    expect(tree.order).toBe('time');
    expect(tree.total).toBe(100);
    expect(tree.byId.get('GET /orders')).toMatchObject({ total: 100, self: 30 });
    expect(tree.byId.get('GET /orders')!.children.map((child) => child.name)).toEqual(['auth', 'query']);
    expect(tree.byId.get('GET /orders;query')).toMatchObject({ total: 60, self: 20 });
    expect(tree.byId.get('GET /orders;query;fetch rows')).toMatchObject({ total: 40, self: 40, depth: 3 });
  });

  it('can name frames by service', () => {
    const tree = flameFromTrace(spans, { label: (span) => `${span.service}: ${span.name}`, order: 'alphabetical' });
    expect(tree.byId.get('api: GET /orders')!.children.map((child) => child.name)).toEqual(['api: auth', 'db: query']);
  });
});

describe('zoomFlame and flamePath', () => {
  const tree = buildFlame(folded);

  it('draws the whole profile when not zoomed', () => {
    const view = zoomFlame(tree);
    expect(view).toHaveLength(tree.frames.length);
    expect(view.every((entry) => !entry.context && entry.x === entry.frame.x)).toBe(true);
  });

  it('stretches the focus to the full width and keeps its ancestors as context', () => {
    const view = zoomFlame(tree, 'main;handle');
    expect(view.map((entry) => [entry.frame.id, entry.context])).toEqual([
      ['', true],
      ['main', true],
      ['main;handle', false],
      ['main;handle;parse', false],
      ['main;handle;render', false],
    ]);
    const parse = view.find((entry) => entry.frame.id === 'main;handle;parse')!;
    expect(parse.x).toBeCloseTo(0);
    expect(parse.width).toBeCloseTo(50 / 110);
    expect(view.find((entry) => entry.frame.id === 'main;handle;render')!.x).toBeCloseTo(50 / 110);
  });

  it('builds a breadcrumb from the root', () => {
    expect(flamePath(tree, 'main;handle;render').map((frame) => frame.name)).toEqual(['all', 'main', 'handle', 'render']);
    expect(flamePath(tree, 'nope').map((frame) => frame.id)).toEqual(['']);
  });
});

describe('searchFlame', () => {
  it('matches names case-insensitively and counts nested matches once', () => {
    const tree = buildFlame('a;Parse;parseInner 10\na;other 30\nb;PARSE 20');
    const result = searchFlame(tree, ' parse ');
    expect([...result.ids].sort()).toEqual(['a;Parse', 'a;Parse;parseInner', 'b;PARSE']);
    expect(result.matched).toBe(30);
    expect(result.share).toBeCloseTo(0.5);
  });

  it('finds nothing for an empty query', () => {
    expect(searchFlame(buildFlame(folded), '  ')).toEqual({ ids: new Set(), matched: 0, share: null });
  });
});

describe('formatting', () => {
  it('formats values by unit', () => {
    expect(formatFlameValue(1204, 'samples')).toBe('1,204 samples');
    expect(formatFlameValue(1, 'samples')).toBe('1 sample');
    expect(formatFlameValue(1240, 'ms')).toBe('1.24s');
    expect(formatFlameValue(3, 'allocs')).toBe('3 allocs');
  });

  it('formats shares', () => {
    expect(formatFlameShare(0.3421)).toBe('34.2%');
    expect(formatFlameShare(0.0004)).toBe('<0.1%');
    expect(formatFlameShare(0)).toBe('0%');
    expect(formatFlameShare(null)).toBe('n/a');
  });

  it('fits labels by character budget', () => {
    expect(fitFlameLabel('render', 100, 7)).toBe('render');
    expect(fitFlameLabel('Microsoft.AspNetCore.Routing', 70, 7)).toBe('Microsoft…');
    expect(fitFlameLabel('render', 14, 7)).toBe('');
    expect(fitFlameLabel('render', 0, 7)).toBe('');
  });
});

describe('rankFlameFunctions', () => {
  it('folds a function’s frames into one row, counting recursion once in its total', () => {
    const tree = buildFlame('main;a;fmt 10\nmain;b;fmt 20\nmain;rec;rec;rec 6\nmain;rec 2');
    const rows = rankFlameFunctions(tree);
    expect(rows.map((row) => [row.name, row.self, row.total])).toEqual([['fmt', 30, 30], ['rec', 8, 8]]);
    expect(rows[0].frameIds).toEqual(['main;b;fmt', 'main;a;fmt']);
  });

  it('ranks a diff by each function’s change, new and removed included', () => {
    const before = buildFlame('main;a;fmt 10\nmain;b;fmt 20\nmain;gone 4\nmain;same 5');
    const after = buildFlame('main;a;fmt 13\nmain;b;fmt 26\nmain;fresh 2\nmain;same 5');
    const diff = diffFlame(before, after);
    if (!diff.compatible) throw new Error(diff.reason);
    const rows = rankFlameFunctions(after, diff);
    expect(rows.map((row) => [row.name, row.change?.status, row.change?.self.absolute])).toEqual([
      ['fmt', 'changed', 9],
      ['gone', 'removed', -4],
      ['fresh', 'new', 2],
    ]);
    expect(rows[0].change?.self.relative).toBeCloseTo(0.3);
    expect(rows[1].frameIds).toEqual([]);
  });
});

describe('rankFlameFrames', () => {
  it('ranks one profile by self time, leaving out the root and frames with none', () => {
    const tree = buildFlame('main;handle;parse 30\nmain;handle;render 50\nmain;gc 20\nmain;handle 5');
    expect(rankFlameFrames(tree).map((row) => [row.name, row.self])).toEqual([['render', 50], ['parse', 30], ['gc', 20], ['handle', 5]]);
  });

  it('ranks a diff by the size of the change, either sign, removed frames included', () => {
    const before = buildFlame('main;a 50\nmain;b 40\nmain;gone 8\nmain;same 10');
    const after = buildFlame('main;a 65\nmain;b 30\nmain;new 4\nmain;same 10');
    const diff = diffFlame(before, after);
    if (!diff.compatible) throw new Error(diff.reason);
    expect(rankFlameFrames(after, diff).map((row) => [row.name, row.change?.self.absolute])).toEqual([
      ['a', 15],
      ['b', -10],
      ['gone', -8],
      ['new', 4],
    ]);
  });
});

describe('diffFlame', () => {
  const baseline = buildFlame('main;handle;parse 50\nmain;handle;render 50\nmain;gc 20\nmain;idle 0\nmain;legacy;shim 8');
  const candidate = buildFlame('main;handle;parse 65\nmain;handle;render 50\nmain;gc 20\nmain;handle;validate 12');

  const ok = (result: ReturnType<typeof diffFlame>): FlameDiff => {
    if (!result.compatible) throw new Error(result.reason);
    return result;
  };

  it('reports absolute and relative change per frame, matched by path', () => {
    const diff = ok(diffFlame(baseline, candidate));
    expect(diff.basis).toBe('absolute');
    expect(diff.tree).toBe(candidate);
    expect(diff.frames.get('main;handle;parse')).toMatchObject({
      status: 'changed',
      self: { baseline: 50, candidate: 65, absolute: 15, relative: 0.3 },
    });
    expect(diff.frames.get('main;gc')).toMatchObject({ status: 'unchanged', total: { absolute: 0, relative: 0 } });
  });

  it('makes new and removed frames explicit, with no ratio to report', () => {
    const diff = ok(diffFlame(baseline, candidate));
    expect(diff.frames.get('main;handle;validate')).toMatchObject({
      status: 'new',
      self: { baseline: null, candidate: 12, absolute: 12, relative: null },
    });
    expect(diff.removed.map((frame) => frame.id)).toEqual(['main;legacy']);
    expect(diff.removed[0]).toMatchObject({ status: 'removed', total: { baseline: 8, candidate: null, absolute: -8, relative: -1 } });
  });

  it('never divides by a zero baseline', () => {
    // `handle` had no self time in the baseline; give it some.
    const later = buildFlame('main;handle 5\nmain;handle;parse 50\nmain;handle;render 50\nmain;gc 20\nmain;legacy;shim 8');
    const change = ok(diffFlame(baseline, later)).frames.get('main;handle')!;
    expect(change.self).toEqual({ baseline: 0, candidate: 5, absolute: 5, relative: null });
    expect(flameDeltaTone(change)).toBe('grew');
    expect(formatFlameDelta(change, 'self', 'samples')).toBe('+5 samples (n/a)');
  });

  it('compares shares when asked to normalize', () => {
    const doubled = buildFlame('main;handle;parse 100\nmain;handle;render 100\nmain;gc 40\nmain;legacy;shim 16');
    const diff = ok(diffFlame(baseline, doubled, { normalize: true }));
    expect(diff.basis).toBe('share');
    expect(diff.frames.get('main;gc')!.total.absolute).toBeCloseTo(0);
    expect(ok(diffFlame(baseline, doubled)).frames.get('main;gc')!.total.absolute).toBe(20);
  });

  it('refuses profiles in different units or orders', () => {
    const traced = buildFlame('main 1', { unit: 'ms' });
    expect(diffFlame(baseline, traced)).toMatchObject({ compatible: false, reason: expect.stringContaining('samples') as unknown });
    expect(diffFlame(baseline, buildFlame('main 1', { order: 'time' })).compatible).toBe(false);
  });

  it('buckets changes into tones without claiming sizes it cannot compute', () => {
    const diff = ok(diffFlame(baseline, candidate));
    expect(flameDeltaTone(diff.frames.get('main;handle;parse'))).toBe('grew-large');
    expect(flameDeltaTone(diff.frames.get('main;handle;parse'), { large: 0.5 })).toBe('grew');
    expect(flameDeltaTone(diff.frames.get('main;handle;validate'))).toBe('new');
    expect(flameDeltaTone(diff.frames.get('main;gc'))).toBe('same');
    expect(flameDeltaTone(undefined)).toBe('unknown');
    const shrunk = ok(diffFlame(candidate, baseline)).frames.get('main;handle;parse')!;
    expect(flameDeltaTone(shrunk)).toBe('shrank');
    expect(formatFlameDelta(shrunk, 'self', 'samples')).toBe('−15 samples (−23.1%)');
  });
});
