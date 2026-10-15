'use client';

import { useState } from 'react';

/** Toggles the 24x24 target outlines inside the D4 section by flipping `data-debug` on it. */
export function DebugToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        const el = document.getElementById('d4-board');
        if (el) el.dataset.debug = String(next);
      }}
      className="inline-flex items-center border-2 border-edge-strong bg-surface-raised px-3 py-2 font-mono text-xs font-bold uppercase text-content-primary shadow-hard-sm aria-pressed:bg-accent-primary aria-pressed:text-content-inverse"
    >
      [ 24px targets: {on ? 'ON' : 'OFF'} ]
    </button>
  );
}
