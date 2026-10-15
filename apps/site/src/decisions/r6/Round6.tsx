import type { ReactNode } from 'react';
import {
  ANCHOR,
  CheckList,
  CodeFrame,
  Disclosure,
  Eyebrow,
  GEO,
  Label,
  LevelPair,
  LevelPanel,
  NumbersDisclosure,
  RoleList,
  SpecimenLegend,
  SurfacesStrip,
  Swatch,
  TerminalFrame,
  NO_GUTTER,
  anchor,
  seg,
} from '@/components/specimen';
import { ANSI_SLOTS, CSS_SEGS, FRAME_STATUS, FRAME_TITLE, LEGEND_FULL, LEGEND_NOTES, TRANSCRIPT, TRANSCRIPT_LABEL, frameRows, plainRows } from '@/data/code-syntax';
import { LV, ratio } from '../p2/Frame';
import { today } from '../r5/look';
import { LEVEL_IDS, bands, theme, themeChecks, worst } from './look';
import type { Cls, Look } from './look';

const SECTION = `flex ${ANCHOR} flex-col gap-5 border-t-4 border-double border-edge-strong pt-8`;

const H3 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h3 id={`${id}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">
    {children}
  </h3>
);

/* ------------------------------------------------------------- role tables */

const ROLE_ROWS: [string, Cls][] = [
  ['keyword', 'keyword'],
  ['function', 'function'],
  ['string', 'string'],
  ['number, constant, type', 'number'],
  ['operator, punctuation, bracket', 'op'],
  ['comment', 'comment'],
  ['identifier, property', 'plain'],
];

function RoleTable({ looks }: { looks: Look[] }) {
  const [mid, sk] = looks as [Look, Look];
  const rows: [string, { colour: string; label: string }, { colour: string; label: string }][] = [
    ...ROLE_ROWS.map(([name, c]): [string, { colour: string; label: string }, { colour: string; label: string }] => [
      name,
      { colour: mid.tok[c], label: mid.from[c] },
      { colour: sk.tok[c], label: sk.from[c] },
    ]),
    ['selection', { colour: mid.sel.fill, label: `accent.primary at ${mid.alphas.selection!.split(' ')[0]}` }, { colour: sk.sel.fill, label: `accent.primary at ${sk.alphas.selection!.split(' ')[0]}` }],
    ['find border', { colour: mid.find.otherBorder, label: 'accent.secondary, 1px; current 2px' }, { colour: sk.find.otherBorder, label: 'accent.secondary, 1px; current 2px' }],
    ['current line', { colour: mid.line.border, label: 'border.subtle hairline; number accent.primary' }, { colour: sk.line.border, label: 'border.subtle hairline; number accent.primary' }],
    ['bracket match', { colour: mid.bracket.border, label: 'keyword hue, 1px, 10% wash' }, { colour: sk.bracket.border, label: 'keyword hue, 1px, 10% wash' }],
    ['error', { colour: mid.err.fg, label: 'palette.red (not intent.danger, which is pink)' }, { colour: sk.err.fg, label: 'intent.danger (= palette.red)' }],
    ['warning', { colour: mid.warn.fg, label: 'intent.warning (yellow)' }, { colour: sk.warn.fg, label: 'intent.warning (orange), squiggle only' }],
    ['info', { colour: mid.info!.fg, label: 'intent.info (cyan)' }, { colour: sk.info!.fg, label: 'intent.info (blue)' }],
    ['diff', { colour: mid.add.bar, label: `intent.success and palette.red, ${mid.alphas['diff wash']!.split(' ')[0]}` }, { colour: sk.add.bar, label: `intent.success and intent.danger, ${sk.alphas['diff wash']!.split(' ')[0]}` }],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse font-mono text-xs">
        <thead>
          <tr className="text-left text-content-muted">
            <th className="p-1 pr-3">role</th>
            <th className="p-1 pr-3">midnight</th>
            <th className="p-1">sketch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, a, b]) => (
            <tr key={name} className="border-t border-edge-subtle align-top text-content-secondary">
              <td className="p-1 pr-3 text-content-primary">{name}</td>
              <td className="p-1 pr-3"><Swatch colour={a.colour} /> {a.label}</td>
              <td className="p-1"><Swatch colour={b.colour} /> {b.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Numbers({ details }: { details: ReturnType<typeof themeChecks>['details'] }) {
  return (
    <NumbersDisclosure tables={details}>
      {LEVEL_IDS.map((lv) => {
          const l = theme(lv);
          const w = worst(l);
          return (
            <div key={lv} className="flex flex-col gap-2">
              <Label>{`[ ${lv} · ground ${l.ground} · worst ${w.r.toFixed(2)}:1 on ${w.band} ]`}</Label>
              <div className="overflow-x-auto">
                <table className="border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="text-left text-content-muted">
                      <th className="p-1 pr-3">band</th>
                      <th className="p-1 pr-3">flat</th>
                      <th className="p-1 pr-3">text on it</th>
                      <th className="p-1 pr-3">lowest</th>
                      <th className="p-1">which</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bands(l).map((b) => {
                      const low = b.fgs.map((c) => ({ c, r: ratio(c, b.flat) })).sort((x, y) => x.r - y.r)[0]!;
                      return (
                        <tr key={b.name} className="border-t border-edge-subtle text-content-secondary">
                          <td className="p-1 pr-3 text-content-primary">{b.name}</td>
                          <td className="p-1 pr-3"><Swatch colour={b.flat} /> {b.flat}</td>
                          <td className="p-1 pr-3">{b.why}</td>
                          <td className="p-1 pr-3">{low.r.toFixed(2)}{low.r < 4.5 ? ' ✕' : ''}</td>
                          <td className="p-1"><Swatch colour={low.c} /> {low.c}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ul className="m-0 list-none p-0 font-mono text-[11px] text-content-secondary">
                {Object.entries(l.alphas).map(([k, v]) => (
                  <li key={k}><span className="text-content-primary">{k}:</span> {v}</li>
                ))}
              </ul>
            </div>
          );
        })}
    </NumbersDisclosure>
  );
}

/* ------------------------------------------------------------------- theme */

const STRUCTURE: [string, string][] = [
  ['Selection', 'accent.primary as a translucent region; every token inside it is forced to text.primary, so it reads as one block.'],
  ['Find', 'accent.secondary borders only, no fills. Other matches are 1px; the current one is 2px with bold glyphs and a ▸ in the gutter.'],
  ['Current line', 'a 1px border.subtle hairline and nothing else; the line number turns accent.primary. Nothing competes with the selection.'],
  ['Tokens', 'one job per colour: keyword the loudest accent, function accent.primary, string green, number, constant and type one quiet accent. Punctuation steps back to text.secondary, comments to text.muted.'],
  ['Bracket match', 'a 1px border and 10% wash in the keyword hue, so it stays off the find and selection colours.'],
  ['Diagnostics', 'underline shape first (wavy, dashed, dotted), colour second, with a mark in the gutter. Error uses the red hue because pink is a keyword on midnight.'],
  ['Diff', 'green and red behind the line at a lowered alpha, plus a 3px bar and a + or − in a column of their own.'],
];

function ThemeSection() {
  const rows = frameRows();
  const looks = LEVEL_IDS.map((lv) => theme(lv));
  const { checks, details } = themeChecks();
  return (
    <section id="R6-THEME" aria-labelledby="R6-THEME-h" className={SECTION}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R6-THEME ]</Eyebrow>
        <H3 id="R6-THEME">Our theme, from our roles</H3>
        <p className="m-0 max-w-3xl text-content-secondary">
          Round 5 showed how a code theme is structured. This is the same structure with the system's own accents: no Pink Ink hue is used. Midnight reads cyan, yellow and pink; sketch reads its own blue, green and
          red, the primary outputs the owner wants, with violet for constants because sketch's yellow and orange read as brown.
        </p>
        <p className="m-0 font-mono text-xs text-content-muted">
          14px on 21px · tab 2 · gutter: 2ch marks, 3ch numbers, 2ch diff bar and sign · the frame skips lines 2 to 8 and 10, so two of the eight matches are off-screen
        </p>
      </header>
      <LevelPair>
        {(lv) => <CodeFrame look={theme(lv)} rows={rows} title={FRAME_TITLE} status={FRAME_STATUS} frameId={`r6-${lv}`} />}
      </LevelPair>
      <SpecimenLegend items={LEGEND_FULL} look={theme} notes={LEGEND_NOTES} idPrefix="r6-legend" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RoleList roles={STRUCTURE} />
        <CheckList checks={checks} />
      </div>
      <Disclosure title="Role to token, per level">
        <RoleTable looks={looks} />
      </Disclosure>
      <Numbers details={details} />
      <Disclosure title="Greyscale on paper (sketch)">
        <p className="m-0 mb-3 max-w-3xl text-sm text-content-secondary">
          D5-B: paper prints in sketch's roles. The selection, borders, line and diff bars hold. Token classes mostly do not: sketch's blue, green, red and violet sit at one luminance.
        </p>
        <LevelPanel level="sketch" label="sketch · greyscale">
          <CodeFrame look={theme('sketch')} rows={rows} title={FRAME_TITLE} status="greyscale" grey frameId="r6-grey" />
        </LevelPanel>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------- real */

const CSS_ROWS = CSS_SEGS.map((segs, i) => seg(i + 1, ...segs));

/** The role each ANSI slot reads, in `ANSI_SLOTS` order. */
const PICKS: ((l: Look) => string)[] = [
  (l) => l.err.fg,
  (l) => l.tok.string,
  (l) => l.tok.number,
  (l) => l.tok.function,
  (l) => l.tok.keyword,
  (l) => l.info!.fg,
  (l) => l.ink,
  (l) => l.tok.comment,
];
const ANSI = ANSI_SLOTS.map((s, i) => ({ ...s, pick: PICKS[i]! }));

function Real() {
  return (
    <section id="R6-REAL" aria-labelledby="R6-REAL-h" className={SECTION}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R6-REAL ]</Eyebrow>
        <H3 id="R6-REAL">The same theme on two other surfaces</H3>
        <p className="m-0 max-w-3xl text-content-secondary">
          A preview, not a component change. The first is what a CodeBlock would print with this theme: no selection, no find, just the token roles on CSS. The second maps a terminal's eight ANSI slots to the
          same roles.
        </p>
      </header>
      <SurfacesStrip
        surfaces={[
          { label: 'CodeBlock-style, CSS', render: (lv) => <CodeFrame look={theme(lv)} rows={CSS_ROWS} geo={NO_GUTTER} title="page.css" frameId={`r6-code-${lv}`} /> },
          {
            label: 'Terminal-style, ANSI slots',
            render: (lv) => {
              const l = theme(lv);
              return <TerminalFrame ground={l.ground} ink={l.ink} slots={PICKS.map((p) => p(l))} lines={TRANSCRIPT} label={TRANSCRIPT_LABEL} />;
            },
          },
        ]}
      />
      <Disclosure title="ANSI slot to role">
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-content-muted">
                <th className="p-1 pr-3">slot</th>
                <th className="p-1 pr-3">role</th>
                <th className="p-1 pr-3">midnight</th>
                <th className="p-1">sketch</th>
              </tr>
            </thead>
            <tbody>
              {ANSI.map((a) => (
                <tr key={a.slot} className="border-t border-edge-subtle text-content-secondary">
                  <td className="p-1 pr-3 text-content-primary">{a.slot}</td>
                  <td className="p-1 pr-3">{a.role}</td>
                  {LEVEL_IDS.map((lv) => (
                    <td key={lv} className="p-1 pr-3"><Swatch colour={a.pick(theme(lv))} /> {a.pick(theme(lv))} · {ratio(a.pick(theme(lv)), LV[lv].surface.base).toFixed(2)}:1</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 mt-2 max-w-3xl font-mono text-[11px] text-content-muted">
          Slot 3 follows the theme's constants colour, so on sketch it is violet, not yellow; sketch's yellow is olive. The transcript has no warning line because sketch's warning (orange) is a squiggle colour only.
          Slot 5 is the keyword colour (pink on midnight).
        </p>
      </Disclosure>
    </section>
  );
}

/* ----------------------------------------------------------------- metrics */

function Metrics() {
  const rows = plainRows(11, 20);
  return (
    <section id="R6-METRICS" aria-labelledby="R6-METRICS-h" className={SECTION}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R6-METRICS ]</Eyebrow>
        <H3 id="R6-METRICS">Today against this theme, same ten lines</H3>
        <p className="m-0 max-w-3xl text-content-secondary">
          Lines 11 to 20 of paginate.ts, no highlights. Today is the editor sample as it ships, in its own classes: keyword accent.tertiary, string success, number warning, comment muted italic, function primary,
          type bold ink, punctuation secondary.
        </p>
      </header>
      <LevelPair>
        {(lv) => (
          <div className="grid grid-cols-1 gap-3">
            {(
              [
                ['Today', today(lv), GEO.today, '13px / 20px'],
                ['This theme', theme(lv), GEO.spec, '14px / 21px'],
              ] as const
            ).map(([label, look, geo, note]) => (
              <div key={label} data-r6-metrics={`${label}-${lv}`} className="flex min-w-0 flex-col gap-1">
                <p className="m-0 font-mono text-xs font-bold text-content-primary">
                  {label} <span className="font-normal text-content-muted">{note}</span>
                </p>
                <CodeFrame look={look} rows={rows} geo={geo} />
              </div>
            ))}
          </div>
        )}
      </LevelPair>
      <Disclosure title="The numbers">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-left text-content-muted">
              {['', 'size', 'leading', 'ratio', 'tab', 'gutter', 'width of 48 columns'].map((h) => <th key={h} className="p-1 pr-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {([['Today', GEO.today, 'not set (8)'], ['This theme', GEO.spec, '2']] as const).map(([label, geo, tab]) => (
              <tr key={label} className="border-t border-edge-subtle text-content-secondary">
                <td className="p-1 pr-3 text-content-primary">{label}</td>
                <td className="p-1 pr-3">{geo.fs}px</td>
                <td className="p-1 pr-3">{geo.lh}px</td>
                <td className="p-1 pr-3">{(geo.lh / geo.fs).toFixed(2)}</td>
                <td className="p-1 pr-3">{tab}</td>
                <td className="p-1 pr-3">{geo.mark + geo.num + 1 + geo.diff}ch</td>
                <td className="p-1 pr-3">{Math.round((48 + geo.mark + geo.num + 1 + geo.diff + geo.pad) * geo.fs * 0.6)}px</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-2 font-mono text-[11px] text-content-muted">IBM Plex Mono advances 0.6em. Today's gutter is the editor sample's 4ch stand-in for its 2.5rem number column.</p>
      </Disclosure>
    </section>
  );
}

/* ------------------------------------------------------------------- round */

/** Round 6: one theme from the system's own accent roles. */
export function Round6() {
  return (
    <section id="round-6" aria-labelledby="round-6-h" className={`flex ${ANCHOR} flex-col gap-10`}>
      <header className="flex flex-col gap-3">
        <Eyebrow>[ ROUND 6 · SCAFFOLDING ]</Eyebrow>
        <h2 id="round-6-h" className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">
          Round 6: our theme
        </h2>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          One theme, not a choice between two. It keeps round 5's structure and takes its colours from the accents the system already declares for each level.
        </p>
        <nav aria-label="Round 6 sections" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            {[
              ['R6-THEME', 'The theme', 'frames, legend, checks'],
              ['R6-REAL', 'On other surfaces', 'CodeBlock and terminal'],
              ['R6-METRICS', 'Today against this theme', 'same ten lines'],
            ].map(([id, name, tag]) => (
              <li key={id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a href={anchor(id!)} className="font-bold text-accent-primary">{id}</a>
                <span className="text-content-primary">{name}</span>
                <span className="text-xs text-content-muted">{tag}</span>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <ThemeSection />
      <Real />
      <Metrics />
    </section>
  );
}
