import type { CSSProperties, ReactNode } from 'react';
import { LV, ratio } from '../p2/Frame';
import { CURRENT_LINE, CURRENT_MATCH, Frame, GEO, LEGEND, MATCHES, frameRows, plainRows, spec } from '../r5/Frame';
import type { Geo, LegendItem, RowSpec } from '../r5/Frame';
import { today } from '../r5/look';
import { ANCHOR, CheckList, Disclosure, Eyebrow, Label, Panel, Pair, Swatch } from '../r5/Round5';
import { LEVEL_IDS, bands, theme, themeChecks, worst } from './look';
import type { Cls, Look } from './look';

/** An in-page link target, written as a call so a literal hash never reads as a hex colour to check:tokens. */
const anchor = (id: string) => `#${id}`;

const SECTION = `flex ${ANCHOR} flex-col gap-5 border-t-4 border-double border-edge-strong pt-8`;

const H3 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h3 id={`${id}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">
    {children}
  </h3>
);

/* ------------------------------------------------------------------ legend */

const LEGEND6: LegendItem[] = [
  ...LEGEND.filter((i) => i.label !== 'warning'),
  { label: 'warning', rows: [spec('w', '  total: number;', { no: 7, mark: '!', warn: [2, 7] })] },
  { label: 'info', rows: [spec('i', '  export const LABEL;', { no: 7, mark: 'i', info: [15, 20] })] },
];
const ORDER = ['selection', 'other match', 'current match 4/8', 'current line', 'bracket pair', 'error', 'warning', 'info', 'diff'];
const LEGEND_SORTED = ORDER.map((l) => LEGEND6.find((i) => i.label === l)!);
const UNDERLINE: Record<string, string> = { error: 'wavy underline, × in the gutter', warning: 'dashed underline, ! in the gutter', info: 'dotted underline, i in the gutter' };

function Legend() {
  const looks = LEVEL_IDS.map((lv) => theme(lv));
  return (
    <div className="flex flex-col gap-2">
      <Label>[ Legend ]</Label>
      <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)]">
        <span className="hidden sm:block" />
        {LEVEL_IDS.map((lv) => (
          <span key={lv} className="hidden font-mono text-[11px] text-content-muted sm:block">{lv}</span>
        ))}
        {LEGEND_SORTED.map((item) => (
          <div key={item.label} className="contents">
            <span className="self-center font-mono text-xs font-bold text-content-primary">
              {item.label}
              {UNDERLINE[item.label] && <span className="block text-[10px] font-normal text-content-muted">{UNDERLINE[item.label]}</span>}
            </span>
            {looks.map((l) => (
              <div key={l.level} className="min-w-0">
                <Frame look={l} rows={item.rows} frameId={`r6-legend-${item.label}-${l.level}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <Disclosure title="The numbers">
      <div className="flex flex-col gap-5">
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
        {details.map((t) => (
          <div key={t.title} className="flex flex-col gap-2">
            <Label>{`[ ${t.title} ]`}</Label>
            <div className="overflow-x-auto">
              <table className="border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="text-left text-content-muted">
                    {t.head.map((h) => <th key={h} className="p-1 pr-3">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={i} className="border-t border-edge-subtle text-content-secondary">
                      {r.map((c, j) => (
                        <td key={j} className="p-1 pr-3">{c.startsWith('#') ? <><Swatch colour={c} /> {c}</> : c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Disclosure>
  );
}

/* ------------------------------------------------------------------- theme */

const FRAME_STATUS = `find "items" ${CURRENT_MATCH + 1}/${MATCHES.length} · ln ${CURRENT_LINE}`;

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
          Round 5 showed how a code theme is structured. This is the same structure with the system's own accents: no Pink Ink hue is used. Midnight reads cyan, yellow and pink; sketch reads blue, green and
          magenta, with violet for constants because the owner reads sketch's yellow and orange as brown.
        </p>
        <p className="m-0 font-mono text-xs text-content-muted">
          14px on 21px · tab 2 · gutter: 2ch marks, 3ch numbers, 2ch diff bar and sign · the frame skips lines 2 to 8 and 10, so two of the eight matches are off-screen
        </p>
      </header>
      <Pair>
        {(lv) => <Frame look={theme(lv)} rows={rows} title="paginate.ts · lines 1, 9, 11 to 22" status={FRAME_STATUS} frameId={`r6-${lv}`} />}
      </Pair>
      <Legend />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>[ How it's structured ]</Label>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {STRUCTURE.map(([a, b]) => (
              <li key={a} className="text-sm text-content-secondary">
                <span className="font-bold text-content-primary">{a}.</span> {b}
              </li>
            ))}
          </ul>
        </div>
        <CheckList checks={checks} />
      </div>
      <Disclosure title="Role to token, per level">
        <RoleTable looks={looks} />
      </Disclosure>
      <Numbers details={details} />
      <Disclosure title="Greyscale on paper (sketch)">
        <p className="m-0 mb-3 max-w-3xl text-sm text-content-secondary">
          D5-B: paper prints in sketch's roles. The selection, borders, line and diff bars hold. Token classes mostly do not: sketch's blue, green, magenta and violet sit at one luminance.
        </p>
        <Panel level="sketch" label="sketch · greyscale">
          <Frame look={theme('sketch')} rows={rows} title="paginate.ts · lines 1, 9, 11 to 22" status="greyscale" grey frameId="r6-grey" />
        </Panel>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------- real */

const NO_GUTTER: Geo = { fs: 14, lh: 21, mark: 0, num: 3, diff: 0, pad: 1 };

type Seg = [string, Cls];
/** A row built from coloured segments, for languages the editor sample's tokenizer does not know. */
function seg(no: number, ...segs: Seg[]): RowSpec {
  let col = 0;
  const toks = segs.map(([text, cls]) => {
    const t = { text, cls, col };
    col += text.length;
    return t;
  });
  return { key: `s${no}`, no, text: segs.map((s) => s[0]).join(''), toks };
}

const CSS_ROWS: RowSpec[] = [
  seg(1, ['/* One page of results. */', 'comment']),
  seg(2, ['@media', 'keyword'], [' ', 'plain'], ['(min-width: ', 'op'], ['40rem', 'number'], [')', 'op'], [' ', 'plain'], ['{', 'op']),
  seg(3, ['  ', 'plain'], ['.page', 'type'], [' ', 'plain'], ['{', 'op']),
  seg(4, ['    ', 'plain'], ['display', 'plain'], [': ', 'op'], ['grid', 'plain'], [';', 'op']),
  seg(5, ['    ', 'plain'], ['gap', 'plain'], [': ', 'op'], ['12px', 'number'], [';', 'op']),
  seg(6, ['    ', 'plain'], ['color', 'plain'], [': ', 'op'], ['var', 'function'], ['(', 'op'], ['--text-primary', 'plain'], [')', 'op'], [';', 'op']),
  seg(7, ['    ', 'plain'], ['content', 'plain'], [': ', 'op'], ['"next"', 'string'], [';', 'op']),
  seg(8, ['    ', 'plain'], ['padding', 'plain'], [': ', 'op'], ['4px 16px', 'number'], [';', 'op']),
  seg(9, ['  ', 'plain'], ['}', 'op']),
  seg(10, ['}', 'op']),
];

interface Ansi {
  slot: string;
  role: string;
  pick: (l: Look) => string;
}
const ANSI: Ansi[] = [
  { slot: '1 red', role: 'error', pick: (l) => l.err.fg },
  { slot: '2 green', role: 'pass, strings', pick: (l) => l.tok.string },
  { slot: '3 yellow', role: 'numbers (violet on sketch)', pick: (l) => l.tok.number },
  { slot: '4 blue', role: 'prompt, commands', pick: (l) => l.tok.function },
  { slot: '5 magenta', role: 'keywords', pick: (l) => l.tok.keyword },
  { slot: '6 cyan', role: 'hints (intent.info)', pick: (l) => l.info!.fg },
  { slot: '7 white', role: 'text.primary', pick: (l) => l.ink },
  { slot: '8 bright black', role: 'text.muted', pick: (l) => l.tok.comment },
];

function Terminal({ look: l }: { look: Look }) {
  const c = (slot: number) => ANSI[slot - 1]!.pick(l);
  const S = (colour: string, children: ReactNode, bold = false): ReactNode => <span style={{ color: colour, fontWeight: bold ? 700 : undefined }}>{children}</span>;
  const line = (key: string, children: ReactNode) => (
    <div key={key} style={{ height: NO_GUTTER.lh, whiteSpace: 'pre' }}>{children}</div>
  );
  const dim = c(8);
  const style: CSSProperties = { fontFamily: 'var(--ds-font-mono)', fontSize: NO_GUTTER.fs, lineHeight: `${NO_GUTTER.lh}px`, padding: '6px 12px', background: l.ground, color: l.ink, width: 'max-content', minWidth: '100%' };
  return (
    <div className="overflow-x-auto border-2 border-edge-strong" style={{ background: l.ground }}>
      <div style={style} role="img" aria-label="Terminal transcript: a test run with two passes and one failure">
        {line('1', <>{S(c(4), '~/paginate', true)} {S(dim, '$')} vitest run paginate</>)}
        {line('2', '')}
        {line('3', <> {S(c(2), '✓')} clamp keeps the cursor in range {S(dim, '3ms')}</>)}
        {line('4', <> {S(c(2), '✓')} returns one page of items {S(dim, '5ms')}</>)}
        {line('5', <> {S(c(1), '✕', true)} counts the total {S(dim, '2ms')}</>)}
        {line('6', <>   {S(c(1), 'TypeError: items.lenght is not a function')}</>)}
        {line('7', <>   expected {S(c(3), '25')} received {S(c(3), '0')}</>)}
        {line('8', '')}
        {line('9', <> Tests  {S(c(1), '1 failed')} {S(dim, '|')} {S(c(2), '2 passed')} {S(dim, '(3)')}</>)}
        {line('10', <> {S(c(6), 'hint:')} {S(dim, 'rerun with')} {S(c(5), '--update')} {S(dim, 'to rewrite snapshots')}</>)}
      </div>
    </div>
  );
}

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
      <Pair>
        {(lv) => (
          <div className="flex flex-col gap-3">
            <Label>CodeBlock-style, CSS</Label>
            <Frame look={theme(lv)} rows={CSS_ROWS} geo={NO_GUTTER} title="page.css" frameId={`r6-code-${lv}`} />
            <Label>Terminal-style, ANSI slots</Label>
            <Terminal look={theme(lv)} />
          </div>
        )}
      </Pair>
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
      <Pair>
        {(lv) => (
          <div className="grid grid-cols-1 gap-3">
            {(
              [
                ['Today', today(lv), GEO.today, '13px / 20px'],
                ['This theme', theme(lv), GEO.r5, '14px / 21px'],
              ] as const
            ).map(([label, look, geo, note]) => (
              <div key={label} data-r6-metrics={`${label}-${lv}`} className="flex min-w-0 flex-col gap-1">
                <p className="m-0 font-mono text-xs font-bold text-content-primary">
                  {label} <span className="font-normal text-content-muted">{note}</span>
                </p>
                <Frame look={look} rows={rows} geo={geo} />
              </div>
            ))}
          </div>
        )}
      </Pair>
      <Disclosure title="The numbers">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-left text-content-muted">
              {['', 'size', 'leading', 'ratio', 'tab', 'gutter', 'width of 48 columns'].map((h) => <th key={h} className="p-1 pr-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {([['Today', GEO.today, 'not set (8)'], ['This theme', GEO.r5, '2']] as const).map(([label, geo, tab]) => (
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
