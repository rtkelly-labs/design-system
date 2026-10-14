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
import { RUNGS, blockKey, blocksOf, orderedPlates, type Block, type PlateSpec } from './compendium.registry';
import { FULL, paginate } from './compendium.layout';

/** Display only: `data-state` keeps the story export name verbatim. */
const words = (id: string) => id.replace(/([a-z])([A-Z])/g, '$1 $2');
const REV = 'REV 2026.10';
/** Plates print at this fraction of their natural size: a component sheet is a reference, not a proof of the real size, and the scale is what keeps ~100 components near 30 sheets. Cells are wider in CSS pixels at a lower zoom, so fewer components wrap or clip. */
const PLATE_ZOOM = 0.65;

function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-content-muted ${className}`}>{children}</span>;
}

/**
 * Fixed sheet: the report owns its page box. Two things that mean something on a screen and
 * nothing on paper are neutralised inside a cell. Viewport units (a `min-h-screen` root would fill a
 * whole sheet per cell): the component shows at its content height, which is what a static
 * document can honestly say about it. And `print:hidden`, below.
 */
const STATIC_CSS =
  // `print:hidden` is how navigation chrome (DocsSidebar, SiteFooter) opts out of paper; a plate shows the screen rendering, so it is undone in a cell.
  '@media print { @page { size: A4; margin: 0; } [data-component] .print\\:hidden { display: revert !important; } [data-component] .docs-header.print\\:hidden { display: flex !important; } [data-component] .docs-pager.print\\:hidden { display: grid !important; } }' +
  '[data-component] :is(.min-h-screen,.min-h-dvh,.h-screen,[class*="vh]"]){min-height:0!important;height:auto!important}' +
  // A scrollable code region cannot scroll on paper, so it wraps instead of cutting the line off at the cell edge.
  '[data-component] pre[role="region"]{white-space:pre-wrap!important;overflow:visible!important;overflow-wrap:anywhere}' +
  // `truncate` and `line-clamp-*` cut a string off with an ellipsis, which a reference sheet reads as lost text (and the PDF drops the cut words): a plate shows the whole string, wrapped.
  '[data-component] .truncate{overflow:visible!important;text-overflow:clip!important;white-space:normal!important;overflow-wrap:anywhere}' +
  '[data-component] [class*="line-clamp-"]{display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important}' +
  // The blog-grid card is `md:w-1/2` of its container, and `md` is always true at paper width: in a cell it fills the cell instead of squeezing to 40% of it.
  '[data-component="Card"] [data-slot="card"]{width:100%!important}' +
  // A page-scale template (whole-page padding, `py-24`) shows its content, not its margins.
  '[data-fit]>*{padding-block:1.5rem!important}';
function PageBox() {
  return <style>{STATIC_CSS}</style>;
}

const PLATES = orderedPlates();
const PAGING = paginate(blocksOf(PLATES));
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

/**
 * Controls and small marks whose cells are short and narrow: more cells per row, so a plate of nine
 * states is a few rows rather than nine half-empty ones. Cells run state-major, sketch then midnight,
 * so four columns is two states a row.
 */
const COLUMNS: Readonly<Record<string, number>> = { Button: 4, Badge: 4, Switch: 4, Checkbox: 4, Select: 4, RadioGroup: 4, Input: 4 };
/** Whole-page templates: their own page padding is trimmed, so the plate sizes to the content shown. */
const FIT = new Set(['NotFoundPage', 'ServerErrorPage', 'StatusPage']);

/** One state of one component on one rung. This is the unit a diff localises to. */
function Cell({ plate, state, rung, node }: { plate: PlateSpec; state: string; rung: ThemeLevel; node: ReactNode }) {
  return (
    <div data-component={plate.component} data-state={state} data-rung={rung} className="flex min-w-0 flex-col border-2 border-edge-strong">
      <div className="flex items-center justify-between gap-2 border-b border-edge-default bg-surface-raised px-2.5 py-1 text-content-primary">
        <Kicker>{words(state)}</Kicker>
        <Kicker>{rung}</Kicker>
      </div>
      <ThemeProvider scoped defaultLevel={rung} className="min-w-0 flex-1 bg-surface-base p-3 text-content-primary">
        {FIT.has(plate.component) ? <div data-fit>{node}</div> : node}
      </ThemeProvider>
    </div>
  );
}

/** The plate's cells: header, then each state on each rung, in a grid of `columns` cells. */
function PlateBody({ block }: { block: Block }) {
  const { plate } = block;
  // Two rungs next to each other for a `side` plate; one cell a row for a `stack` plate. A block
  // with a single rung has no twin to sit beside, so a `side` plate's states take the columns.
  const columns = COLUMNS[plate.component] ?? (plate.layout === 'side' ? 2 : 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4 border-b border-edge-default pb-2">
        <h2 className={`m-0 font-display font-bold leading-none tracking-tight ${plate.height >= FULL ? 'text-[2.5rem]' : 'text-[1.5rem]'}`}>{plate.component}</h2>
        <Kicker>
          {plate.group} · {plate.states.length} state{plate.states.length === 1 ? '' : 's'}
          {plate.split ? ` · ${block.rungs[0]}` : block.rungs.length === 1 ? ` · ${block.rungs[0]} only` : ''}
        </Kicker>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {plate.states.flatMap((s) => block.rungs.map((rung) => <Cell key={`${s.id}/${rung}`} plate={plate} state={s.id} rung={rung} node={s.render()} />))}
      </div>
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
function Plate({ block }: { block: Block }) {
  const { plate } = block;
  const html = renderToStaticMarkup(<PlateBody block={block} />, { identifierPrefix: block.key.replace('#', '-') });
  return <div data-plate={plate.component} data-block={block.key} data-group={plate.group} data-height={block.height} id={block.rungs[0] === RUNGS[0] ? `plate-${plate.component}` : undefined} className="break-inside-avoid" style={{ zoom: PLATE_ZOOM }} dangerouslySetInnerHTML={{ __html: html }} />;
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
              <h1 className="m-0 font-display text-[3rem] font-bold uppercase leading-[0.9] tracking-[-0.02em]">Compendium</h1>
              <p className="m-0 max-w-[44rem] font-sans text-sm leading-snug text-content-secondary">
                Each component as its own stories render it, on the sketch and midnight rungs. The HTML is the golden artifact: every cell carries data-component, data-state and data-rung.
              </p>
            </div>
          )}
          <nav aria-label="Index" className="columns-3 gap-6">
            {rows.map((row) =>
              row.kind === 'group' ? (
                <div key={`g-${row.group}`} className="mt-2 break-after-avoid break-inside-avoid border-t-2 border-edge-strong pb-0.5 pt-1 first:mt-0">
                  <Kicker>{row.group}</Kicker>
                </div>
              ) : (
                // The page column is `auto` and nowrap: a range like "p. 19–20" must stay on one line, whatever the width.
                <a key={row.plate.key} href={`#plate-${row.plate.component}`} className="grid break-inside-avoid grid-cols-[1fr_auto] items-baseline gap-2 border-t border-edge-default py-0.5">
                  <span className="truncate font-display text-[0.8125rem] font-bold leading-tight">{row.plate.component}</span>
                  <Kicker className="whitespace-nowrap text-right">p. {[...new Set(RUNGS.map((r) => PAGING.pageOf.get(blockKey(row.plate.plate, r))))].map((n) => String(n).padStart(2, '0')).join('–')}</Kicker>
                </a>
              ),
            )}
          </nav>
        </Sheet>
      ))}
      {PAGING.sheets.map((plates, i) => (
        <Sheet key={`sheet-${i}`} n={PAGING.index.length + i + 1} head={[...new Set(plates.map((p) => p.group))].join(' · ')}>
          {plates.map((block) => (
            <Plate key={block.key} block={block} />
          ))}
        </Sheet>
      ))}
    </main>
  );
}
