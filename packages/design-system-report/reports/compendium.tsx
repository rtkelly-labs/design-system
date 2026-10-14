/**
 * The Compendium: one plate per component of @rtkelly13/design-system, as an A4 print document.
 *
 * Three jobs, in this order of importance: a golden artifact (the HTML is deterministic and every
 * plate and state carries stable `data-component` / `data-state` / `data-rung` attributes, so a text
 * diff localises to one component), a documentation portal, and a format agents can pass visual
 * elements through. The PDF is the human rendering; it carries a CreationDate and is never
 * byte-compared.
 *
 * Plates are generated from the stories (see compendium.registry.tsx), each shown on the `sketch`
 * and `midnight` rungs inside scoped ThemeProviders. Several small plates share a sheet, packed by
 * their declared heights (compendium.layout.ts); a big one keeps a sheet. Sheets are
 * `min-h-[297mm]`, so `ds-report --pdf --strict` fails a sheet that outgrows the paper. Every value is fixed; colours
 * are roles only.
 *
 * Coverage (every public component has a plate, an exemption or a backlog entry; every part is
 * exercised in its parent's plate) is compendium.test.ts's job, not this file's.
 */

import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, type ThemeLevel } from '@rtkelly13/design-system';
import { orderedPlates, type PlateSpec } from './compendium.registry';
import { FULL, paginate } from './compendium.layout';

/** Display only: `data-state` keeps the story export name verbatim. */
const words = (id: string) => id.replace(/([a-z])([A-Z])/g, '$1 $2');
const RUNGS: readonly ThemeLevel[] = ['sketch', 'midnight'];
const REV = 'REV 2026.10';

function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-content-muted ${className}`}>{children}</span>;
}

/** Fixed sheet: the report owns its page box. */
function PageBox() {
  return <style>{'@media print { @page { size: A4; margin: 0; } }'}</style>;
}

const PLATES = orderedPlates();
const PAGING = paginate(PLATES);
const PAGES = PAGING.total;

function Sheet({ n, head, children }: { n: number; head: string; children: ReactNode }) {
  return (
    <section data-page={n} className={n === PAGES ? '' : 'break-after-page'}>
      <ThemeProvider scoped defaultLevel="sketch" className="flex min-h-[297mm] flex-col bg-surface-base px-[14mm] pb-[9mm] pt-[10mm] text-content-primary">
        <header className="flex items-center justify-between border-b-2 border-edge-strong pb-2">
          <Kicker className="text-content-primary">Compendium</Kicker>
          <Kicker>{head}</Kicker>
        </header>
        <div className="flex flex-1 flex-col gap-[6mm] py-5">{children}</div>
        <footer className="flex items-center justify-between border-t-2 border-edge-strong pt-2">
          <Kicker>DS-CMPD-01 · {REV}</Kicker>
          <Kicker>
            {String(n).padStart(2, '0')} / {String(PAGES).padStart(2, '0')}
          </Kicker>
        </footer>
      </ThemeProvider>
    </section>
  );
}

/** One state of one component on one rung. This is the unit a diff localises to. */
function Cell({ plate, state, rung, node }: { plate: PlateSpec; state: string; rung: ThemeLevel; node: ReactNode }) {
  return (
    <div data-component={plate.component} data-state={state} data-rung={rung} className="flex min-w-0 flex-col border-2 border-edge-strong">
      <div className="flex items-center justify-between border-b border-edge-default bg-surface-raised px-2.5 py-1 text-content-primary">
        <Kicker>{words(state)}</Kicker>
        <Kicker>{rung}</Kicker>
      </div>
      <ThemeProvider scoped defaultLevel={rung} className="min-w-0 flex-1 bg-surface-base p-3 text-content-primary">
        {node}
      </ThemeProvider>
    </div>
  );
}

/** The plate's cells: header, then each state on each rung. */
function PlateBody({ plate }: { plate: PlateSpec }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4 border-b border-edge-default pb-2">
        <h2 className={`m-0 font-display font-bold leading-none tracking-tight ${plate.height >= FULL ? 'text-[2.5rem]' : 'text-[1.5rem]'}`}>{plate.component}</h2>
        <Kicker>
          {plate.group} · {plate.states.length} state{plate.states.length === 1 ? '' : 's'}
        </Kicker>
      </div>
      {plate.states.map((s) => (
        <div key={s.id} className={plate.layout === 'side' ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
          {RUNGS.map((rung) => (
            <Cell key={rung} plate={plate} state={s.id} rung={rung} node={s.render()} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Each plate is rendered as its OWN React root, then inlined. `useId` derives its ids from a
 * component's position in the tree, so in one shared tree adding a plate renumbers every id after
 * it (measured: removing one id-free plate changed 36 of 42 ids), and the text diff stops
 * localising to a component. A root per plate with the component name as `identifierPrefix` makes
 * a plate's ids a function of that plate alone, wherever pagination puts it.
 */
function Plate({ plate }: { plate: PlateSpec }) {
  const html = renderToStaticMarkup(<PlateBody plate={plate} />, { identifierPrefix: plate.component });
  return <div data-plate={plate.component} data-group={plate.group} data-height={plate.height} id={`plate-${plate.component}`} className="break-inside-avoid" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Compendium() {
  return (
    <main className="w-full bg-surface-base font-sans text-content-primary">
      <PageBox />
      {PAGING.index.map((rows, i) => (
        <Sheet key={`index-${i}`} n={i + 1} head={i === 0 ? 'Index' : 'Index (continued)'}>
          {i === 0 && (
            <div className="flex flex-col gap-3">
              <Kicker className="text-accent-primary">[ @rtkelly13/design-system · every plate, both rungs ]</Kicker>
              <h1 className="m-0 font-display text-[4rem] font-bold uppercase leading-[0.9] tracking-[-0.02em]">Compendium</h1>
              <p className="m-0 max-w-[34rem] font-sans text-base leading-snug text-content-secondary">
                Each component as its own stories render it, on the sketch and midnight rungs. The HTML is the golden artifact: every cell carries data-component, data-state and data-rung.
              </p>
            </div>
          )}
          <nav aria-label="Index" className="flex flex-col">
            {rows.map((row) =>
              row.kind === 'group' ? (
                <div key={`g-${row.group}`} className="mt-3 border-t-2 border-edge-strong pb-1 pt-1.5 first:mt-0">
                  <Kicker>{row.group}</Kicker>
                </div>
              ) : (
                <a key={row.plate.component} href={`#plate-${row.plate.component}`} className="grid grid-cols-[1fr_auto_3rem] items-baseline gap-4 border-t border-edge-default py-1">
                  <span className="font-display text-base font-bold leading-tight">{row.plate.component}</span>
                  <Kicker>
                    {row.plate.states.length} state{row.plate.states.length === 1 ? '' : 's'}
                  </Kicker>
                  <Kicker className="text-right">p. {String(PAGING.pageOf.get(row.plate.component)).padStart(2, '0')}</Kicker>
                </a>
              ),
            )}
          </nav>
        </Sheet>
      ))}
      {PAGING.sheets.map((plates, i) => (
        <Sheet key={`sheet-${i}`} n={PAGING.index.length + i + 1} head={[...new Set(plates.map((p) => p.group))].join(' · ')}>
          {plates.map((plate) => (
            <Plate key={plate.component} plate={plate} />
          ))}
        </Sheet>
      ))}
    </main>
  );
}
