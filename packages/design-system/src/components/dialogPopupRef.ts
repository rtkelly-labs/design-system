'use client';

import { useCallback, useRef } from 'react';
import type { ForwardedRef } from 'react';

/**
 * The ref plumbing every dialog surface needs, in one place.
 *
 * A module of its own for the reason `dialogSurface.ts` is one: `src/index.ts`
 * re-exports `Modal.tsx` and `Drawer.tsx` wholesale, so a helper living in
 * either would be published — and a hook in the `.d.ts` is API, whatever it
 * was written for. Nothing exports this file, so it stays internal.
 *
 * It was `Modal`'s, verbatim, until `Drawer` needed the same thing. Copying it
 * would have meant two `initialFocus` races to fix the day one of them is
 * found.
 */

/**
 * Module scope on purpose: written inline, the assignment reads to the
 * compiler lint as a component mutating a value it captured during render.
 */
function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref) {
    ref.current = node;
  }
}

/**
 * Keeps a local handle on the popup while still honouring a caller's ref.
 *
 * `initialFocus` needs the popup *element*, and the only ref slot Base UI
 * offers is the one the caller may also have asked for. Merging them here is
 * cheaper than making the caller give theirs up.
 */
export function usePopupRef(forwarded: ForwardedRef<HTMLDivElement>) {
  const popup = useRef<HTMLDivElement | null>(null);

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      popup.current = node;
      assignRef(forwarded, node);
    },
    [forwarded],
  );

  return [popup, attach] as const;
}
