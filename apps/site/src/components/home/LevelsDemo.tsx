'use client';

import { Badge, Button, Input, ThemeProvider } from '@/ds';
import type { ThemeLevel } from '@/ds';

function Specimen({ level }: { level: ThemeLevel }) {
  return (
    <ThemeProvider scoped defaultLevel={level} persist={false} followSystem={false} className="h-full">
      <div className="flex h-full flex-col gap-5 border-2 border-edge-strong bg-surface-base p-6 text-content-primary">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-content-muted">
            data-theme=&quot;{level}&quot;
          </span>
          <Badge accent="success">14 / 14 CHECKS</Badge>
        </div>
        <div className="border-2 border-edge-strong bg-surface-raised p-4 shadow-hard-md">
          <p className="m-0 font-display text-xl font-extrabold uppercase">billing-api</p>
          <p className="mt-1 mb-0 font-mono text-sm text-content-secondary">&gt; 3f9c2e1 fix: retry invoices on 409</p>
        </div>
        <Input label="Release note" defaultValue="Retries 409s instead of dropping them" />
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="primary" bracketed>
            PROMOTE
          </Button>
          <Button size="sm" variant="tertiary">
            ROLL BACK
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
}

/**
 * The same markup under both levels, side by side. Each half is a *scoped*
 * `ThemeProvider`: the tokens resolve by ordinary CSS inheritance, so a sketch
 * panel inside a midnight page is just a `data-theme` attribute on a div.
 */
export function LevelsDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Specimen level="midnight" />
      <Specimen level="sketch" />
    </div>
  );
}
