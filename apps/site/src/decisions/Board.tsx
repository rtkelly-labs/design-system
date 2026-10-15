import type { ReactNode } from 'react';
import { Button, NerdIcon } from '@rtkelly13/design-system';
import { DECISIONS } from './data';
import type { Decision, DecisionOption } from './data';
import { DebugToggle } from './DebugToggle';
import { Phase2 } from './p2/Phase2';
import { Round3 } from './r3/Round3';
import { Round4 } from './r4/Round4';
import { Scenes } from './Scenes';
import { Sheet } from './Sheet';
import type { SheetMode } from './Sheet';
import { DEBUG_TARGET, VBtn } from './VBtn';

/** One level of the package, scoped to a subtree with `data-theme`. */
function Panel({ level, children }: { level: 'midnight' | 'sketch'; children: ReactNode }) {
  return (
    <div data-theme={level} className="min-w-0 border-2 border-edge-strong bg-surface-base p-3 text-content-primary sm:p-4">
      <p className="m-0 mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-primary">{`[ ${level} ]`}</p>
      {children}
    </div>
  );
}

function OptionHead({ id, name, rationale, evidence }: { id: string; name: string; rationale: string; evidence: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h3 className="m-0 flex flex-wrap items-baseline gap-3 font-display text-xl font-extrabold uppercase text-content-primary">
        <span className="font-mono text-sm text-accent-primary">{`[ ${id} ]`}</span>
        {name}
      </h3>
      <p className="m-0 max-w-3xl font-sans text-sm text-content-secondary">{rationale}</p>
      <p className="m-0 font-mono text-xs text-content-muted">Evidence: {evidence}</p>
    </header>
  );
}

function LevelPair({ children }: { children: (level: 'midnight' | 'sketch') => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel level="midnight">{children('midnight')}</Panel>
      <Panel level="sketch">{children('sketch')}</Panel>
    </div>
  );
}

function Article({ id, children }: { id: string; children: ReactNode }) {
  return (
    <article id={id} className="flex scroll-mt-20 flex-col gap-3 border-t-2 border-edge-subtle pt-5">
      {children}
    </article>
  );
}

function Control({ dec, note }: { dec: string; note: string }) {
  return (
    <Article id={`${dec}-current`}>
      <OptionHead id={`${dec}-CURRENT`} name="Current (ships today)" rationale={note} evidence="Control row; no change." />
      <LevelPair>{() => <Scenes opt={`CUR-${dec}`} dec={dec} />}</LevelPair>
    </Article>
  );
}

function OptionRow({ o, dec }: { o: DecisionOption; dec: string }) {
  return (
    <Article id={o.id}>
      <OptionHead {...o} />
      <LevelPair>{() => <Scenes opt={o.id} dec={dec} />}</LevelPair>
    </Article>
  );
}

/** D3: the finding that sketch tertiary is red, next to the danger options. */
function TertiaryVsDanger() {
  const row = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-[11px] uppercase text-content-muted">Tertiary (decorative)</span>
        <Button type="button" variant="tertiary" size="sm">SHARE</Button>
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-[11px] uppercase text-content-muted">D3-A danger</span>
        <VBtn opt="D3-A" slot={{ role: 'danger', label: 'DELETE', size: 'sm' }} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-[11px] uppercase text-content-muted">D3-B danger</span>
        <VBtn opt="D3-B" slot={{ role: 'danger', label: 'DELETE', size: 'sm' }} />
      </div>
    </div>
  );
  return (
    <Article id="D3-tertiary">
      <OptionHead
        id="D3-TERTIARY"
        name="Tertiary beside danger"
        rationale="On sketch the tertiary accent is red, so a decorative SHARE reads as a warning. On midnight it is pink and close to error pink. Danger needs its own role, not the tertiary hue."
        evidence="Roll-up row 3 (K-2, K-3, SET-01); WCAG 1.4.1."
      />
      <LevelPair>{() => row}</LevelPair>
    </Article>
  );
}

function D4Legend() {
  return (
    <div className="flex flex-col gap-3 border-2 border-edge-strong bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-3">
        <DebugToggle />
        <span className="font-mono text-xs text-content-secondary">
          Dashed boxes are the WCAG 2.5.8 24x24 minimum, centred on each target.
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-4 font-mono text-[11px] text-content-secondary">
        {[24, 28, 32, 40, 44].map((px) => (
          <div key={px} className="flex flex-col items-center gap-1">
            <span aria-hidden="true" style={{ width: px, height: px }} className="border border-dashed border-intent-warning" />
            {px}px
          </div>
        ))}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            aria-label="Toggle sidebar (18px, fails)"
            className={`inline-flex h-[18px] w-[18px] items-center justify-center border-2 border-edge-default text-[10px] text-content-primary ${DEBUG_TARGET}`}
          >
            <NerdIcon name="chevron-left" aria-hidden="true" className="text-[10px]" />
          </button>
          18px today (AUD-F25)
        </div>
      </div>
      <p className="m-0 font-mono text-xs text-content-muted">
        Tooltip need: an icon-only button has no visible name, so each one carries an aria-label and needs a Tooltip on
        hover and focus (the sighted equivalent of the label). Not wired here, since the board is static. The package has
        no ellipsis glyph, so the kanban menu uses chevron-down.
      </p>
    </div>
  );
}

const SHEETS: { id: string; mode: SheetMode; name: string; rationale: string; evidence: string }[] = [
  {
    id: 'D5-CURRENT',
    mode: 'economy',
    name: 'Current: browser default (backgrounds off)',
    rationale:
      'What users get unless exact is set: midnight text on white paper, every fill gone. PR 360 sets print-color-adjust: exact for the package, but a host page, a PDF driver or an ink-saving setting can still drop backgrounds.',
    evidence: 'MDN print-color-adjust: default economy drops backgrounds and adjusts text. Rasterised PDFs, PT-02/03/04.',
  },
  ...DECISIONS.find((d) => d.id === 'D5')!.options.map((o, i) => ({ ...o, mode: (['exact', 'keep', 'outline'] as const)[i]! })),
];

function D5Board() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {SHEETS.map((o) => (
        <article key={o.id} id={o.id} className="flex scroll-mt-20 flex-col gap-3 border-t-2 border-edge-subtle pt-5">
          <OptionHead {...o} />
          <Sheet mode={o.mode} />
        </article>
      ))}
    </div>
  );
}

function DecisionSection({ d }: { d: Decision }) {
  const notes: Record<string, string> = {
    D1: 'There is no quiet variant, so a low-emphasis action ships as a small tertiary button: a full fill and a 4px shadow.',
    D2: 'Secondary today is the inverse variant: an ink fill with inverse text. Other buttons stay as they ship.',
    D3: 'There is no danger intent, so destructive actions ship as tertiary (red on sketch, pink on midnight). Calendar and kanban have no danger action and are left out.',
    D4: 'Today nothing is smaller than sm, and icon-only is an sm button with a glyph. Other buttons stay as they ship.',
  };
  return (
    <section
      id={d.id.toLowerCase() === 'd4' ? 'd4-board' : d.id}
      data-debug={d.id === 'D4' ? 'false' : undefined}
      aria-labelledby={`${d.id}-h`}
      className={`flex scroll-mt-20 flex-col gap-5 border-t-4 border-double border-edge-strong pt-8 ${d.id === 'D4' ? 'group/d4' : ''}`}
    >
      <header className="flex flex-col gap-2">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{`[ ${d.id} ]`}</p>
        <h2 id={`${d.id}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary sm:text-4xl">
          {d.title}
        </h2>
        <p className="m-0 max-w-3xl text-content-secondary">{d.finding}</p>
      </header>
      {d.id === 'D4' && <D4Legend />}
      {d.id === 'D5' ? (
        <D5Board />
      ) : (
        <>
          <Control dec={d.id} note={notes[d.id]!} />
          {d.options.map((o) => (
            <OptionRow key={o.id} o={o} dec={d.id} />
          ))}
          {d.id === 'D3' && <TertiaryVsDanger />}
        </>
      )}
      {d.id === 'D5' && (
        <p className="m-0 border-2 border-edge-strong bg-surface-raised p-3 font-mono text-xs text-content-secondary">
          Note: the browser default (backgrounds off) is what users get unless print-color-adjust: exact is set. D5-A
          depends on that being honoured; D5-B only needs it for fills; D5-C survives it.
        </p>
      )}
    </section>
  );
}

/** The Phase 1 picks, from docs/applied-evaluation/decisions.md. */
const PICKS: Record<string, string> = { D1: 'D1-A', D2: 'D2-B', D3: 'D3-B', D4: 'D4-A + touch', D5: 'D5-B' };

/** Index of every decision and option ID, then one section per decision. */
export function Board() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-10 pb-20 md:px-6">
      <header className="flex flex-col gap-4">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ SCAFFOLDING ]</p>
        <h1 className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">Decision board</h1>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          Pick one option per decision. Each is shown in context on both levels, next to a control row of what ships
          today. Site-local styles only; delete this route once the choices are made. Phases 1 and 2 and Round 3 are
          decided and collapsed;{' '}
          <a href="#round-4" className="font-bold text-accent-primary">Round 4: code renderer</a> is open.
        </p>
        <nav aria-label="Phase 1 decisions" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            {DECISIONS.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a href={`#${d.id === 'D4' ? 'd4-board' : d.id}`} className="font-bold text-accent-primary">{d.id}</a>
                <span className="text-content-primary">{d.title}</span>
                <span className="flex flex-wrap gap-x-2 text-xs">
                  {d.options.map((o) => (
                    <a key={o.id} href={`#${o.id}`} className="text-content-secondary">{o.id}</a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <section id="phase-1" aria-labelledby="phase-1-h" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="phase-1-h" className="m-0 font-display text-2xl font-extrabold uppercase text-content-primary">
          Phase 1 <span className="font-mono text-sm text-content-muted">· decided</span>
        </h2>
        <p className="m-0 max-w-3xl font-mono text-xs text-content-secondary">
          Collapsed by default. Open a section to see the options as they were shown.
        </p>
        {DECISIONS.map((d) => (
          <details key={d.id} className="border-2 border-edge-default">
            <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-raised p-3 font-mono text-sm">
              <span className="font-bold text-accent-primary">{d.id}</span>
              <span className="text-content-primary">{d.title}</span>
              <span className="border-2 border-edge-default px-1.5 text-[11px] font-bold uppercase text-content-secondary">
                decided: {PICKS[d.id]}
              </span>
            </summary>
            <div className="p-3 sm:p-4">
              <DecisionSection d={d} />
            </div>
          </details>
        ))}
      </section>
      <details className="border-2 border-edge-default">
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-raised p-3 font-mono text-sm">
          <span className="font-bold text-accent-primary">Phase 2</span>
          <span className="text-content-primary">D6 to D10</span>
          <span className="border-2 border-edge-default px-1.5 text-[11px] font-bold uppercase text-content-secondary">decided</span>
        </summary>
        <div className="p-3 sm:p-4">
          <Phase2 />
        </div>
      </details>
      <details className="border-2 border-edge-default">
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-raised p-3 font-mono text-sm">
          <span className="font-bold text-accent-primary">Round 3</span>
          <span className="text-content-primary">D10 round 2, D11 labels in tables</span>
          <span className="border-2 border-edge-default px-1.5 text-[11px] font-bold uppercase text-content-secondary">
            decided: D11-C; D10 superseded by round 4
          </span>
        </summary>
        <div className="p-3 sm:p-4">
          <Round3 />
        </div>
      </details>
      <Round4 />
    </div>
  );
}
