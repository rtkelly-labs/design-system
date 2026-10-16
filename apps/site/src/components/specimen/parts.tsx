import type { ReactNode } from 'react';

/**
 * Small pieces every specimen section is built from. A specimen is a docs
 * section that shows one design decision in realistic frames, on both levels,
 * with one legend, a role list, pass/fail checks and the numbers folded away.
 */

/** The sticky header measures 72px at 1280 and 84px at 375 (Playwright, getBoundingClientRect). 96px clears both. */
export const ANCHOR = 'scroll-mt-24';

/** An in-page link target, written as a call so a literal hash never reads as a hex colour to check:tokens. */
export const anchor = (id: string) => `#${id}`;

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{children}</p>
);

export const Label = ({ children }: { children: ReactNode }) => (
  <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-wider text-content-muted">{children}</p>
);

export const Swatch = ({ colour }: { colour: string }) => (
  <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 border border-edge-default align-middle" style={{ background: colour }} />
);

/** A native `<details>`: closed by default, keyboard and screen-reader friendly with no script. */
export const Disclosure = ({ title, children }: { title: string; children: ReactNode }) => (
  <details className="border-2 border-edge-default">
    <summary className="cursor-pointer bg-surface-raised p-2 font-mono text-xs font-bold uppercase text-content-primary">{title}</summary>
    <div className="p-3">{children}</div>
  </details>
);
