'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/ds';
import type { ThemeLevel } from '@/ds';

type Choice = 'page' | ThemeLevel;

const CHOICES: { value: Choice; label: string }[] = [
  { value: 'page', label: 'PAGE' },
  { value: 'midnight', label: 'MIDNIGHT' },
  { value: 'sketch', label: 'SKETCH' },
];

/**
 * The live half of an example.
 *
 * Each preview can be pinned to either level on its own — the design system's
 * rule is "both themes, always; test sketch, it is the one that breaks", so a
 * reader should not have to flip the whole site to check. Pinning wraps the
 * example in a *scoped* `ThemeProvider`: it sets `data-theme` on its own
 * subtree, never touches the document, and never writes to storage.
 */
export function PreviewFrame({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  const [level, setLevel] = useState<Choice>('page');

  const stage = (
    <div
      data-slot="preview-stage"
      className={
        'flex min-h-40 overflow-x-auto bg-surface-base p-5 text-content-primary sm:p-8 ' +
        'bg-[radial-gradient(var(--ds-border-subtle)_1px,transparent_1px)] bg-[size:14px_14px] ' +
        (wide ? 'flex-col items-stretch' : 'items-center justify-center')
      }
    >
      {children}
    </div>
  );

  return (
    <div className="border-2 border-edge-strong">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-edge-strong bg-surface-raised px-3 py-1.5 font-mono text-xs uppercase tracking-wider">
        <span className="font-bold text-content-muted">[ PREVIEW ]</span>
        <div role="group" aria-label={`Level for the ${label} preview`} className="flex gap-1">
          {CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              aria-pressed={level === choice.value}
              onClick={() => setLevel(choice.value)}
              className={
                'min-h-8 cursor-pointer border-2 px-2 font-bold ' +
                (level === choice.value
                  ? 'border-accent-primary bg-accent-primary text-content-inverse'
                  : 'border-transparent text-content-secondary hover:text-accent-primary')
              }
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
      {level === 'page' ? (
        stage
      ) : (
        <ThemeProvider key={level} scoped defaultLevel={level} persist={false} followSystem={false}>
          {stage}
        </ThemeProvider>
      )}
    </div>
  );
}
