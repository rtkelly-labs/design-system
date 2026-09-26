import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Unmount, then put the shared environment back — one hook, in this order.
 *
 * Testing Library registers its own `afterEach(cleanup)` only when Vitest runs
 * with `globals: true`. This project keeps globals off — tests import
 * `describe`/`it`/`expect` explicitly — so the unmount has to be wired up here.
 *
 * Without it, every `render()` leaves its tree in `document.body` and queries
 * start matching elements from earlier tests: `getByLabelText` throws "found
 * multiple elements", and a `queryBy*` asserting something is absent finds the
 * previous test's copy of it.
 *
 * The order after the unmount is load-bearing. Base UI's scroll lock is a
 * module-level singleton that releases on `setTimeout(0)`, so an unmount leaves
 * an unlock pending. Under fake timers that timeout sits on the fake clock and
 * is discarded by `useRealTimers()`; under real timers it fires during the
 * *next* test. Either way the singleton ends up believing a lock is held, the
 * next `Modal` never locks the body, and — with files sharing one module cache
 * — the next file inherits it. So: drain the fake clock while it exists, go
 * back to real timers, then let one real macrotask pass before anything else.
 */
/**
 * Put the shared globals back after every test.
 *
 * A test that stubs `window.matchMedia`, redefines `localStorage`, installs
 * fake timers or leaves an attribute on `<html>` changes the environment every
 * later test runs in. Under Vitest's per-file isolation that was invisible
 * across files — each file got a fresh jsdom — but it still leaked between the
 * tests *inside* a file, and it is the whole reason the suite could not share
 * an environment between files (`isolate: false`). Run with shuffled files and
 * no isolation, seven runs in eight failed, each somewhere different:
 * `ThemeProvider`'s `matchMedia` stub (`{ matches: true }`, no listener API)
 * never removed, so `SiteHeader` threw `list.addEventListener is not a
 * function`; a `data-theme` left on `<html>`; `body` styles; focus.
 *
 * So the baseline is captured once, before any test, and restored after each
 * one — rather than trusting every test to undo itself, which is the pattern
 * that already failed. `pnpm test:leaks` is the detector that proves it holds.
 */
const WATCHED: Array<[object, string]> = [
  [window, 'window'],
  [document, 'document'],
  [navigator, 'navigator'],
  [document.body, 'document.body'],
];

const attributes = (el: Element) => Array.from(el.attributes, (a) => [a.name, a.value] as const);

/**
 * The environment as the *first* file in this worker found it.
 *
 * Captured once per worker, not once per file. Without isolation Vitest still
 * re-runs this setup file before every test file, so a module-level capture is
 * taken *after* the previous file's leaks and treats them as the baseline —
 * which is how an orphaned fake `requestAnimationFrame` survived the first
 * version of this hook. `globalThis` is the one thing that outlives the re-run.
 */
const KEY = Symbol.for('design-system.test-setup.baseline');
/**
 * The APIs tests replace, restored by *value*.
 *
 * Vitest's jsdom environment defines these on `globalThis` (which is `window`
 * here) as accessors, and `vi.stubGlobal` and fake timers write through the
 * setter — so the descriptor, getter and setter included, is identical before
 * and after a stub, and comparing descriptors sees nothing. Comparing what the
 * getter returns does. The rest of `globalThis` carries Vitest's own worker
 * state and is never swept.
 */
const GLOBALS = [
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
  'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
  'cancelIdleCallback', 'Date', 'performance', 'matchMedia', 'IntersectionObserver',
  'ResizeObserver', 'MutationObserver', 'fetch', 'localStorage', 'sessionStorage',
] as const;

type Baseline = {
  globals: Map<string, { present: boolean; value: unknown }>;
  descriptors: Map<object, PropertyDescriptorMap>;
  html: ReadonlyArray<readonly [string, string]>;
  body: ReadonlyArray<readonly [string, string]>;
};
const store = globalThis as typeof globalThis & { [KEY]?: Baseline };
const baseline: Baseline = (store[KEY] ??= {
  globals: new Map(
    GLOBALS.map((key) => [key, { present: key in globalThis, value: Reflect.get(globalThis, key) }]),
  ),
  descriptors: new Map(
    WATCHED.map(([target]) => [target, Object.getOwnPropertyDescriptors(target)] as const),
  ),
  html: attributes(document.documentElement),
  body: attributes(document.body),
});

function restoreAttributes(el: Element, original: ReadonlyArray<readonly [string, string]>) {
  for (const name of el.getAttributeNames()) el.removeAttribute(name);
  for (const [name, value] of original) el.setAttribute(name, value);
}

function restoreProperties(target: object, original: PropertyDescriptorMap) {
  for (const key of Reflect.ownKeys(target)) {
    if (!(key in original)) Reflect.deleteProperty(target, key);
  }
  for (const [key, descriptor] of Object.entries(original)) {
    const now = Object.getOwnPropertyDescriptor(target, key);
    const same =
      now &&
      now.value === descriptor.value &&
      now.get === descriptor.get &&
      now.set === descriptor.set;
    if (!same && descriptor.configurable !== false) Object.defineProperty(target, key, descriptor);
  }
}

afterEach(async () => {
  cleanup();
  // Stubs before timers. `useFakeTimers()` fakes `requestAnimationFrame`, so a
  // test that then stubs it has `stubGlobal` remember the *fake* as the value
  // to restore. Real timers first, then unstub, reinstalls that orphaned fake —
  // a rAF on a clock nothing advances — and Base UI moves Menu and Drawer
  // focus inside a frame, so focus silently stopped moving in every later file.
  vi.unstubAllGlobals();
  if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
  vi.useRealTimers();
  await new Promise((resolve) => setTimeout(resolve, 0));
  // Anything `cleanup()` did not own — a portal kept mounted for an exit
  // animation, a node a test appended by hand. A fresh jsdom per file used to
  // clear these between files; without isolation, `Input` found a second
  // textbox from an earlier file's popup.
  document.body.replaceChildren();
  vi.restoreAllMocks();
  for (const [key, { present, value }] of baseline.globals) {
    if (!present) {
      if (key in globalThis) Reflect.deleteProperty(globalThis, key);
    } else if (Reflect.get(globalThis, key) !== value && !Reflect.set(globalThis, key, value)) {
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    }
  }
  for (const [target] of WATCHED) restoreProperties(target, baseline.descriptors.get(target)!);
  restoreAttributes(document.documentElement, baseline.html);
  restoreAttributes(document.body, baseline.body);
  (document.activeElement as HTMLElement | null)?.blur?.();
  // Node 25's own experimental `localStorage` can shadow jsdom's and lacks
  // `clear()` without `--localstorage-file`; clear whichever storage is real.
  for (const storage of [window.localStorage, window.sessionStorage]) {
    if (typeof storage?.clear === 'function') storage.clear();
  }
});
