import { describe, expect, it } from 'vitest';

/**
 * The environment reset in `src/test-setup.ts` must not reset itself.
 *
 * Its baseline lives on `globalThis`, which in jsdom *is* `window` — one of the
 * objects the reset sweeps. The first version captured `window`'s properties
 * before the baseline was stored there, so the first `afterEach` deleted the
 * baseline as an unknown property. The next file's setup then captured a fresh
 * one, taken after whatever the previous file left behind, which is exactly the
 * leak the once-per-worker baseline exists to prevent.
 *
 * Two tests, because the sweep runs between them: the second sees the state an
 * `afterEach` has already restored.
 */
const KEY = Symbol.for('design-system.test-setup.baseline');
const read = () => (globalThis as Record<symbol, unknown>)[KEY];

describe('the test environment baseline', () => {
  let first: unknown;

  it('exists before any reset has run', () => {
    first = read();
    expect(first).toBeTypeOf('object');
  });

  it('survives the reset, as the same object', () => {
    expect(read()).toBe(first);
  });
});
