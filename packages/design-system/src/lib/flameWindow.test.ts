import { describe, expect, it } from 'vitest';
import {
  buildFlame,
  clampFlameDepth,
  clampFlameWindow,
  diffFlame,
  fitFlameDepth,
  fitFlameWindow,
  FLAME_MIN_WINDOW,
  hottestFlameFrame,
  panFlameDepth,
  panFlameWindow,
  resolveFlameDepth,
  resolveFlameWindow,
  windowFlame,
  zoomFlameDepth,
  zoomFlameWindow,
} from './flame';

// gc 20 | handle 80 (parse 30, render 50 → paint → glyph); `glyph` is the hottest leaf.
const tree = buildFlame('main;handle;parse 30\nmain;handle;render;paint;glyph 50\nmain;gc 20');
const close = (window: { start: number; end: number }, start: number, end: number) => {
  expect(window.start).toBeCloseTo(start);
  expect(window.end).toBeCloseTo(end);
};

describe('horizontal window', () => {
  it('clamps to the root, slides rather than shrinks at an edge, and never goes below the minimum', () => {
    close(clampFlameWindow({ start: -0.2, end: 0.3 }), 0, 0.5);
    close(clampFlameWindow({ start: 0.8, end: 1.3 }), 0.5, 1);
    close(clampFlameWindow({ start: 0.6, end: 0.4 }), 0.4, 0.6);
    const tiny = clampFlameWindow({ start: 0.5, end: 0.5 });
    expect(tiny.end - tiny.start).toBeCloseTo(FLAME_MIN_WINDOW);
  });

  it('zooms about an anchor that stays put', () => {
    close(zoomFlameWindow({ start: 0, end: 1 }, 2, 0.25), 0.125, 0.625);
    close(zoomFlameWindow({ start: 0.2, end: 0.4 }, 0.5), 0.1, 0.5);
    close(zoomFlameWindow({ start: 0, end: 0.5 }, 0.1), 0, 1);
    const deep = zoomFlameWindow({ start: 0, end: 1 }, 1e6, 0.5);
    expect(deep.end - deep.start).toBeCloseTo(FLAME_MIN_WINDOW);
  });

  it('pans within the root', () => {
    close(panFlameWindow({ start: 0.2, end: 0.4 }, 0.1), 0.3, 0.5);
    close(panFlameWindow({ start: 0.2, end: 0.4 }, 5), 0.8, 1);
  });

  it('fits a frame, and the root is the whole profile', () => {
    close(fitFlameWindow(tree, 'main;handle'), 0.2, 1);
    close(fitFlameWindow(tree, ''), 0, 1);
    close(fitFlameWindow(tree, 'nope'), 0, 1);
  });

  it('clips frames crossing the window edges, and leaves out those that only touch it', () => {
    const view = windowFlame(tree, { start: 0.1, end: 0.6 }, { min: 0, max: 9 });
    const byId = new Map(view.map((entry) => [entry.frame.id, entry]));
    expect(byId.get('main;gc')).toMatchObject({ clipped: true });
    expect(byId.get('main;gc')!.x).toBeCloseTo(0);
    expect(byId.get('main;gc')!.width).toBeCloseTo(0.2);
    expect(byId.get('main;handle;parse')).toMatchObject({ clipped: false });
    expect(byId.get('main;handle;parse')!.width).toBeCloseTo(0.6);
    expect(windowFlame(tree, { start: 0, end: 0.2 }, { min: 0, max: 9 }).some((entry) => entry.frame.id === 'main;handle')).toBe(false);
    expect(windowFlame(tree, { start: 0, end: 1 }, { min: 2, max: 3 }).every((entry) => entry.frame.depth >= 2 && entry.frame.depth <= 3)).toBe(true);
  });
});

describe('depth window', () => {
  it('clamps to the tree, slides at an edge, and keeps at least one level', () => {
    expect(tree.maxDepth).toBe(5);
    expect(clampFlameDepth(tree, { min: -2, max: 1 })).toEqual({ min: 0, max: 3 });
    expect(clampFlameDepth(tree, { min: 4, max: 9 })).toEqual({ min: 0, max: 5 });
    expect(clampFlameDepth(tree, { min: 3, max: 3 })).toEqual({ min: 3, max: 3 });
    expect(panFlameDepth(tree, { min: 1, max: 3 }, 9)).toEqual({ min: 3, max: 5 });
  });

  it('zooms about the middle, always by at least a level', () => {
    expect(zoomFlameDepth(tree, { min: 0, max: 5 }, 2)).toEqual({ min: 2, max: 4 });
    expect(zoomFlameDepth(tree, { min: 2, max: 3 }, 0.5)).toEqual({ min: 1, max: 4 });
    expect(zoomFlameDepth(tree, { min: 2, max: 2 }, 0.9)).toEqual({ min: 2, max: 3 });
  });

  it('fits a frame from the root to its deepest descendant, capped around the frame', () => {
    expect(fitFlameDepth(tree, 'main;handle')).toEqual({ min: 0, max: 5 });
    expect(fitFlameDepth(tree, 'main;gc')).toEqual({ min: 0, max: 2 });
    expect(fitFlameDepth(tree, 'main;handle;render', 3)).toEqual({ min: 2, max: 4 });
  });
});

describe('opening window', () => {
  it('resolves ranges, frames, the whole profile, and the hottest preset', () => {
    close(resolveFlameWindow(tree), 0, 1);
    close(resolveFlameWindow(tree, [0.3, 0.1]), 0.1, 0.3);
    close(resolveFlameWindow(tree, { frameId: 'main;gc' }), 0, 0.2);
    // The hottest leaf is `glyph`; two levels up is `render`.
    expect(hottestFlameFrame(tree)?.id).toBe('main;handle;render');
    close(resolveFlameWindow(tree, 'hottest'), 0.5, 1);
  });

  it('takes the leaf that changed most when given a diff', () => {
    const after = buildFlame('main;handle;parse 30\nmain;handle;render;paint;glyph 52\nmain;gc;sweep;mark 45');
    const before = buildFlame('main;handle;parse 30\nmain;handle;render;paint;glyph 50\nmain;gc;sweep;mark 20');
    const diff = diffFlame(before, after);
    if (!diff.compatible) throw new Error(diff.reason);
    expect(hottestFlameFrame(after)?.id).toBe('main;handle;render');
    expect(hottestFlameFrame(after, diff)?.id).toBe('main;gc');
    close(resolveFlameWindow(after, 'hottest', diff), 0, 45 / 127);
  });

  it('never climbs past the root’s children for the preset', () => {
    expect(hottestFlameFrame(buildFlame('a;b 5\nc 1'))?.id).toBe('a');
  });

  it('resolves depth from a spec, an anchor frame, or the levels inside the window', () => {
    expect(resolveFlameDepth(tree, 3)).toEqual({ min: 0, max: 2 });
    expect(resolveFlameDepth(tree, [2, 4])).toEqual({ min: 2, max: 4 });
    expect(resolveFlameDepth(tree, null, { anchorId: 'main;gc' })).toEqual({ min: 0, max: 2 });
    expect(resolveFlameDepth(tree, null, { window: { start: 0, end: 0.2 } })).toEqual({ min: 0, max: 2 });
    expect(resolveFlameDepth(tree, null, { cap: 4 })).toEqual({ min: 0, max: 3 });
  });
});
