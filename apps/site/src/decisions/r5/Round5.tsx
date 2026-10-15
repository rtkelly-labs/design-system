import { LV, ratio } from '../p2/Frame';
import { ANCHOR, CheckList, CodeFrame as Frame, Disclosure, Eyebrow, GEO, Label, LevelPair as Pair, LevelPanel as Panel, Swatch, anchor } from '@/components/specimen';
import { CURRENT_LINE, CURRENT_MATCH, LEGEND, MATCHES, frameRows, pickRows, plainRows } from '@/data/code-syntax';
import { LEVEL_IDS, bands, build, checksFor, diagnosticsMeasure, mapRows, pinkInkColours, reference, today, worst } from './look';
import type { Check, Dir, Level, Look } from './look';
import { deltaE } from '../p2/colour';


function Numbers({ dir }: { dir: Dir }) {
  return (
    <Disclosure title="The numbers">
      <div className="flex flex-col gap-5">
        {LEVEL_IDS.map((lv) => {
          const l = build(dir, lv);
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
                          <td className="p-1 pr-3">
                            <Swatch colour={b.flat} /> {b.flat}
                          </td>
                          <td className="p-1 pr-3">{b.why}</td>
                          <td className="p-1 pr-3">
                            {low.r.toFixed(2)}
                            {low.r < 4.5 ? ' ✕' : ''}
                          </td>
                          <td className="p-1">
                            <Swatch colour={low.c} /> {low.c}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ul className="m-0 list-none p-0 font-mono text-[11px] text-content-secondary">
                {Object.entries(l.alphas).map(([k, v]) => (
                  <li key={k}>
                    <span className="text-content-primary">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Disclosure>
  );
}

/* ------------------------------------------------------------------ legend */

function Legend({ dir }: { dir: Dir }) {
  const looks = LEVEL_IDS.map((lv) => build(dir, lv));
  return (
    <div className="flex flex-col gap-2">
      <Label>[ Legend ]</Label>
      <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)]">
        <span className="hidden sm:block" />
        {LEVEL_IDS.map((lv) => (
          <span key={lv} className="hidden font-mono text-[11px] text-content-muted sm:block">{lv}</span>
        ))}
        {LEGEND.map((item) => (
          <div key={item.label} className="contents">
            <span className="self-center font-mono text-xs font-bold text-content-primary">{item.label}</span>
            {looks.map((l) => (
              <div key={l.level} className="min-w-0">
                <Frame look={l} rows={item.rows} frameId={`legend-${dir}-${item.label}-${l.level}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- directions */

interface Direction {
  id: Dir;
  anchor: string;
  name: string;
  tag: string;
  what: string;
  sketch: string;
  highlights: { name: string; value: string }[];
  recommend: string;
}

const HIGHLIGHTS_COMMON: { name: string; value: string }[] = [
  { name: 'selection', value: 'brand pink, one region, every token forced to one ink' },
  { name: 'other matches', value: '1px violet border, no fill, text in ink; box sits 2px clear of the glyphs' },
  { name: 'current match', value: '2px border, a near-ground pink fill, a ▸ in the gutter on its line' },
  { name: 'current line', value: '3.5% pink fill and a 1px hairline; the number turns brand pink' },
  { name: 'diagnostics', value: 'red wavy line and a 5% red wash on the line, × in the gutter; warning wavy in intent.warning, ! in the gutter' },
  { name: 'diff', value: 'a 3px bar and a + or − in the gutter, and a teal or red wash on the row' },
  { name: 'line numbers', value: 'text.muted; the active one is brand pink' },
];

const DIRECTIONS: Direction[] = [
  {
    id: 'P',
    anchor: 'R5-P',
    name: 'Pink Ink, faithful',
    tag: 'the model as written, hues from the palette',
    what:
      'Pink Ink\'s editor model with each colour swapped for the nearest hue this system declares. Keywords are violet, operators and separators pink, functions cyan, strings orange (the bright half on midnight, the nearest to peach), numbers and types yellow, comments muted, no italics and no bold. Brackets and indent guides rotate through pink, cyan, violet and yellow. The matched bracket gets a violet border, a 10% wash and a violet glyph.',
    sketch:
      'Sketch takes the model from Pink Ink Light, not its colours. The selection is the same pink hue at the largest alpha that keeps ink at 4.5:1, which is lower than Light\'s 60% because sketch\'s pink is a dark pen colour. The current match keeps ink text, as Pink Ink Light does, because gold is an olive on paper.',
    highlights: [
      ...HIGHLIGHTS_COMMON,
      { name: 'bracket match', value: '1px violet border, 10% violet wash, violet glyph' },
      { name: 'brackets, guides', value: 'pink, cyan, violet, yellow by depth; guides the same at 22%, the active one at full strength' },
    ],
    recommend: 'The closest to what the owner already runs. Pink operators on midnight sit in danger\'s hue, which is why the diagnostics decision below matters most here.',
  },
  {
    id: 'Q',
    anchor: 'R5-Q',
    name: 'Pink Ink, in our voice',
    tag: 'the same highlights, the site\'s accents',
    what:
      'The selection, find, line, diagnostic and diff model of P, with tokens that follow the site as it ships: functions in accent.primary (cyan on midnight, blue on sketch), strings green, keywords violet and bold, operators pink, numbers orange, types yellow. Separators fall back to text.secondary so a line is not a wall of pink. Brackets are ink. The matched pair gets a 1px ink border and a bold glyph, the current match a 2px ink border, and indent guides are neutral borders. That is the brutalist reading: hard edges, ink, one colour spent on the selection.',
    sketch:
      'Sketch uses the same assignments; only the hue values change. Bold keywords are the one print aid, since italics are out.',
    highlights: [
      ...HIGHLIGHTS_COMMON.map((h) => (h.name === 'current match' ? { name: h.name, value: '2px ink border, a near-ground pink fill, a ▸ in the gutter on its line' } : h)),
      { name: 'bracket match', value: '1px ink border, 10% ink wash, bold ink glyph' },
      { name: 'brackets, guides', value: 'ink; guides border.subtle, the active one border.default' },
    ],
    recommend: 'Fits the site\'s hard edges and keeps the colour it already uses. Its tokens carry six hues, so it is the busier of the two.',
  },
];

const TOKEN_ROWS: [string, 'keyword' | 'control' | 'string' | 'number' | 'type' | 'function' | 'comment' | 'op' | 'sep' | 'bracket'][] = [
  ['keyword (all)', 'control'],
  ['operator', 'op'],
  ['separator , ; . :', 'sep'],
  ['function', 'function'],
  ['string', 'string'],
  ['number', 'number'],
  ['type', 'type'],
  ['comment', 'comment'],
  ['bracket', 'bracket'],
];

function Spec({ dir }: { dir: Direction }) {
  const looks = LEVEL_IDS.map((lv) => build(dir.id, lv));
  return (
    <Disclosure title="Token to hue, and the highlight model">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-xs">
            <thead>
              <tr className="text-left text-content-muted">
                <th className="p-1 pr-3">token</th>
                <th className="p-1 pr-3">midnight</th>
                <th className="p-1">sketch</th>
              </tr>
            </thead>
            <tbody>
              {TOKEN_ROWS.map(([label, cls]) => (
                <tr key={label} className="border-t border-edge-subtle align-top text-content-secondary">
                  <td className="p-1 pr-3 text-content-primary">{label}</td>
                  {looks.map((l) => (
                    <td key={l.level} className="p-1 pr-3">
                      <Swatch colour={l.tok[cls]} /> {l.from[cls]}
                      {l.bold[cls] ? ', bold' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
          {dir.highlights.map((r) => (
            <div key={r.name} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-content-muted">{r.name}</dt>
              <dd className="m-0 text-content-primary">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Disclosure>
  );
}

const FRAME_STATUS = `find "items" ${CURRENT_MATCH + 1}/${MATCHES.length} · ln ${CURRENT_LINE}`;

function DirectionSection({ dir }: { dir: Direction }) {
  const rows = frameRows();
  return (
    <section id={dir.anchor} aria-labelledby={`${dir.anchor}-h`} className={`flex ${ANCHOR} flex-col gap-5 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>{`[ ${dir.anchor} ]`}</Eyebrow>
        <h3 id={`${dir.anchor}-h`} className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">
          {dir.id}. {dir.name} <span className="font-mono text-sm font-normal normal-case text-content-muted">{dir.tag}</span>
        </h3>
        <p className="m-0 font-mono text-xs text-content-muted">
          14px on 21px · tab 2 · gutter: 2ch marks, 3ch numbers, 2ch diff bar and sign · the frame skips lines 2 to 8 and 10, so two of the eight matches are off-screen
        </p>
      </header>
      <Pair>
        {(lv) => (
          <Frame look={build(dir.id, lv)} rows={rows} title="paginate.ts · lines 1, 9, 11 to 22" status={FRAME_STATUS} frameId={`${dir.id}-${lv}`} />
        )}
      </Pair>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="m-0 max-w-prose text-content-secondary">{dir.what}</p>
          <p className="m-0 max-w-prose text-sm text-content-secondary">
            <strong className="text-content-primary">Sketch:</strong> {dir.sketch}
          </p>
          <p className="m-0 max-w-prose text-sm text-content-secondary">
            <strong className="text-content-primary">Type:</strong> 14px on 21px (1.5). That is the ratio WCAG 1.4.12 asks to survive, and it leaves 17px for a match border with 2px of air above and below, so matches on
            consecutive lines never touch. VS Code's macOS default is 12px on 18px and Zed's buffer font is 15px; 14px keeps IBM Plex Mono at a width the 600px frames hold. Tab is 2
            because the fixture indents by 2.
          </p>
          <p className="m-0 max-w-prose text-sm text-content-primary">
            <strong>Read:</strong> {dir.recommend}
          </p>
        </div>
        <CheckList checks={checksFor(dir.id)} />
      </div>
      <Legend dir={dir.id} />
      <Spec dir={dir} />
      <Numbers dir={dir.id} />
    </section>
  );
}

/* ----------------------------------------------------------------- mapping */

function HueMap() {
  const rows = mapRows();
  const cell = (c: string, label: string) => (
    <span className="inline-flex items-baseline gap-1.5">
      <Swatch colour={c} />
      <span>{label}</span>
    </span>
  );
  return (
    <section id="R5-HUES" aria-labelledby="R5-HUES-h" className={`flex ${ANCHOR} flex-col gap-4 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R5-HUES ]</Eyebrow>
        <h3 id="R5-HUES-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Pink Ink hue to system hue</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          What direction P uses for each Pink Ink colour, on each level, and where the system has no equal. Midnight is mapped from Pink Ink Dark and sketch from Pink Ink Light.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="text-left text-content-muted">
              <th className="p-1.5 pr-3">Pink Ink role</th>
              <th className="p-1.5 pr-3">Pink Ink Dark</th>
              <th className="p-1.5 pr-3">midnight</th>
              <th className="p-1.5 pr-3">Pink Ink Light</th>
              <th className="p-1.5 pr-3">sketch</th>
              <th className="p-1.5">Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.role} className="border-t border-edge-subtle align-top text-content-secondary">
                <td className="p-1.5 pr-3 font-bold text-content-primary">{r.role}</td>
                <td className="p-1.5 pr-3">{cell(r.pi.midnight, r.pi.midnight)}</td>
                <td className="p-1.5 pr-3">{cell(r.ours.midnight.colour, r.ours.midnight.hue)}</td>
                <td className="p-1.5 pr-3">{cell(r.pi.sketch, r.pi.sketch)}</td>
                <td className="p-1.5 pr-3">{cell(r.ours.sketch.colour, r.ours.sketch.hue)}</td>
                <td className="min-w-[16rem] p-1.5 font-sans text-sm">{r.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Disclosure title="Nearest declared hue by ΔE, and how far the chosen one is">
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-content-muted">
                <th className="p-1 pr-3">role</th>
                <th className="p-1 pr-3">midnight: nearest (ΔE)</th>
                <th className="p-1 pr-3">midnight: chosen (ΔE)</th>
                <th className="p-1 pr-3">sketch: nearest (ΔE)</th>
                <th className="p-1">sketch: chosen (ΔE)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.role} className="border-t border-edge-subtle text-content-secondary">
                  <td className="p-1 pr-3 text-content-primary">{r.role}</td>
                  {LEVEL_IDS.flatMap((lv) => [
                    <td key={`${lv}n`} className="p-1 pr-3">
                      {r.nearest[lv].hue}
                      {Number.isNaN(r.nearest[lv].de) ? '' : ` (${r.nearest[lv].de.toFixed(2)})`}
                    </td>,
                    <td key={`${lv}o`} className="p-1 pr-3">
                      {r.ours[lv].hue.split(' (')[0]} ({deltaE(r.pi[lv], r.ours[lv].colour).toFixed(2)})
                    </td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </section>
  );
}

/* --------------------------------------------------------------- reference */

function Reference() {
  const rows = frameRows();
  const note: Record<Level, string> = {
    midnight: 'Pink Ink Dark, literal',
    sketch: 'Pink Ink Light, literal (white ground)',
  };
  return (
    <section id="R5-REF" aria-labelledby="R5-REF-h" className={`flex ${ANCHOR} flex-col gap-4 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R5-REF · NOT A CANDIDATE ]</Eyebrow>
        <h3 id="R5-REF-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Pink Ink original</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          The same fixture drawn with Pink Ink's own colours, read from the two theme files at build time. Declaration keywords (const, function, interface) are brand pink and control-flow
          keywords violet, as in the theme; the candidates paint both violet. The find borders are both 1px, as the theme has them. Compare it with P to see what the hue swap costs.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {LEVEL_IDS.map((lv) => (
          <div key={lv} className="flex min-w-0 flex-col gap-2">
            <Label>{`[ ${note[lv]} ]`}</Label>
            <Frame look={reference(lv)} rows={rows} title="paginate.ts · lines 1, 9, 11 to 22" status={FRAME_STATUS} frameId={`ref-${lv}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- greyscale */

function Paper() {
  const rows = frameRows();
  return (
    <section id="R5-PAPER" aria-labelledby="R5-PAPER-h" className={`flex ${ANCHOR} flex-col gap-4 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R5-PAPER · SKETCH ONLY ]</Eyebrow>
        <h3 id="R5-PAPER-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Greyscale on paper</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          D5-B: paper prints in sketch's roles. Both candidates with every colour taken out. The selection, the borders, the current line and the diff bars hold. Token classes do not: sketch's hues sit
          at one luminance, and with no italics only Q's bold keywords break out.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(['P', 'Q'] as const).map((d) => (
          <Panel key={d} level="sketch" label={`${d} · sketch · greyscale`}>
            <Frame look={build(d, 'sketch')} rows={rows} title="paginate.ts · lines 1, 9, 11 to 22" status="greyscale" grey frameId={`grey-${d}`} />
          </Panel>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- diagnostics */

function Diagnostics() {
  const m = diagnosticsMeasure();
  const mid = m[0]!;
  const sk = m[1]!;
  const rows = pickRows(['l12', 'r13', 'l13', 'l14', 'l15']);
  const f = (n: number, d = 2) => n.toFixed(d);
  const redLook = build('P', 'midnight', { errorHue: 'red' });
  const dangerLook = build('P', 'midnight', { errorHue: 'danger' });
  const redOps = deltaE(redLook.tok.op, redLook.err.fg);
  const dangerOps = deltaE(dangerLook.tok.op, dangerLook.err.fg);
  const checksRed: Check[] = [
    { ok: mid.deRedViolet >= 0.15, title: 'Not the keyword hue', reason: `Red against violet ΔE ${f(mid.deRedViolet)}.` },
    { ok: mid.deRedPink >= 0.1, title: 'Not the brand pink', reason: `Red against pink ΔE ${f(mid.deRedPink)} on midnight. Pink Ink's own pair is ${f(deltaE(pinkInkColours('midnight').c['editorError.foreground']!, pinkInkColours('midnight').c['focusBorder']!))}. Close, and carried by the wavy line, the wash and the × in the gutter.` },
    { ok: redOps >= 0.1, title: 'Not the operator colour in P', reason: `Red against P's pink operators ΔE ${f(redOps)}.` },
    { ok: mid.groundRed >= 4.5, title: 'Text-grade on the ground', reason: `${f(mid.groundRed)}:1 on midnight; sketch ${f(sk.groundRed)}:1.` },
    { ok: true, title: 'Sketch is unchanged', reason: 'Sketch\'s intent.danger is already red, so there it is one colour either way.' },
  ];
  const checksDanger: Check[] = [
    { ok: mid.deDangerViolet >= 0.15, title: 'Not the keyword hue', reason: `Danger (pink) against violet ΔE ${f(mid.deDangerViolet)}.` },
    { ok: dangerOps >= 0.1, title: 'Not the operator colour in P', reason: `Danger is the pink P paints every operator and separator in: ΔE ${f(dangerOps)}. Q's operators are pink too.` },
    { ok: false, title: 'Not the brand pink', reason: 'On midnight intent.danger, accent.tertiary and the selection hue are one value, so an error and a selection are the same colour.' },
    { ok: mid.groundDanger >= 4.5, title: 'Text-grade on the ground', reason: `${f(mid.groundDanger)}:1.` },
  ];
  return (
    <section id="R5-DIAG" aria-labelledby="R5-DIAG-h" className={`flex ${ANCHOR} flex-col gap-5 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R5-DIAG · OWNER DECISION ]</Eyebrow>
        <h3 id="R5-DIAG-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Diagnostics: red, or intent.danger</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          Pink Ink draws errors in a red of their own, never the brand pink. In this system midnight's <code>intent.danger</code> is the pink hue, the same value as <code>accent.tertiary</code>. The
          frames above use <code>red</code>. Below, the same lines with <code>intent.danger</code> instead. Sketch is not affected: its danger is already red.
        </p>
      </header>
      <div data-theme="midnight" className="flex flex-wrap gap-x-5 gap-y-2 bg-surface-base p-3 font-mono text-xs text-content-secondary">
        {[
          [mid.red, 'red hue'],
          [mid.danger, 'intent.danger = accent.tertiary = pink hue = selection'],
          [LV.midnight.palette.violet, 'violet (keywords)'],
        ].map(([c, label]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-5 w-10 border border-edge-default" style={{ background: c }} />
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel level="midnight" label="midnight · red (as shown)">
          <Frame look={redLook} rows={rows} frameId="diag-red" />
        </Panel>
        <Panel level="midnight" label="midnight · intent.danger (pink)">
          <Frame look={dangerLook} rows={rows} frameId="diag-danger" />
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CheckList checks={checksRed} title="Errors in red" />
        <CheckList checks={checksDanger} title="Errors in intent.danger" />
      </div>
      <div className="flex flex-col gap-3 border-2 border-edge-strong bg-surface-raised p-4">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-wider text-accent-primary">[ The choice ]</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-content-secondary">
          <li>
            <strong className="text-content-primary">A. Diagnostics use intent.danger.</strong> No package change. On midnight an error line and a selection share a hue, and P's operators match the squiggle.
          </li>
          <li>
            <strong className="text-content-primary">B. Diagnostics use the red hue, in the editor only (as shown).</strong> No package change. The editor's errors are red and the rest of the UI's danger is
            pink on midnight, so one concept has two colours.
          </li>
          <li>
            <strong className="text-content-primary">C. Re-point midnight's intent.danger to red.</strong> One colour for danger on both levels, and <code>accent.tertiary</code> stays pink. It touches
            {' '}<code>intentHue.danger</code>, <code>intent.danger</code> and the danger tint in <code>levels.ts</code>, and every danger consumer.
          </li>
        </ul>
        <p className="m-0 text-sm text-content-primary">
          <strong>Read:</strong> B if this stays inside the editor renderer; C if the owner wants Pink Ink's rule everywhere. A makes the error colour and the selection colour one value. Be aware that red is
          only just clear of pink here: ΔE {f(mid.deRedPink)} on midnight, against {f(deltaE(pinkInkColours('midnight').c['editorError.foreground']!, pinkInkColours('midnight').c['focusBorder']!))} in Pink Ink itself, so the wavy line, the wash and the × carry
          the meaning as much as the hue does.
        </p>
      </div>
      <Disclosure title="Measured consequences of C (midnight; sketch already has red)">
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-content-muted">
                <th className="p-1 pr-3">measure</th>
                <th className="p-1 pr-3">intent.danger today (pink)</th>
                <th className="p-1 pr-3">red</th>
                <th className="p-1">sketch (red both ways)</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['colour', mid.danger, mid.red, sk.red],
                  ['on the ground', `${f(mid.groundDanger)}:1`, `${f(mid.groundRed)}:1`, `${f(sk.groundRed)}:1`],
                  ['on its own 20% tint', `${f(mid.tintDanger)}:1`, `${f(mid.tintRed)}:1`, '—'],
                  ['ink on its 20% tint', `${f(mid.inkOnTintDanger)}:1`, `${f(mid.inkOnTintRed)}:1`, '—'],
                  ['ΔE to violet (keywords)', f(mid.deDangerViolet), f(mid.deRedViolet), '—'],
                  ['ΔE to the brand pink', f(mid.deDangerPink), f(mid.deRedPink), f(sk.deRedPink)],
                  ['ΔE to intent.warning', f(mid.deDangerWarn), f(mid.deRedWarn), f(sk.deRedWarn)],
                  ['ΔE to intent.success, worst of deuteranopia and protanopia', f(mid.cvdDanger), f(mid.cvdRed), f(sk.cvdRed)],
                  ['ΔE to intent.warning, worst of deuteranopia and protanopia', f(mid.cvdDangerWarn), f(mid.cvdRedWarn), f(sk.cvdRedWarn)],
                  ['equals accent.tertiary', mid.tertiaryIsDanger ? 'yes' : 'no', 'no', sk.tertiaryIsDanger ? 'yes' : 'no'],
                ] as [string, string, string, string][]
              ).map(([k, a, b, c]) => (
                <tr key={k} className="border-t border-edge-subtle text-content-secondary">
                  <td className="p-1 pr-3 text-content-primary">{k}</td>
                  <td className="p-1 pr-3">{a}</td>
                  <td className="p-1 pr-3">{b}</td>
                  <td className="p-1">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 mt-3 max-w-3xl text-sm text-content-secondary">
          Reach, from a grep at commit time (stories, tests and the board excluded): 82 references to <code>intent-danger</code> or <code>intent.danger</code> (which includes <code>--ds-intent-danger</code>) across the
          package and the site, in 31 files, led by <code>theme.css</code> (21), <code>accentClasses.ts</code> (9), <code>Button.tsx</code> (6) and the editor sample (5). Red is also
          <code> seriesHue[0]</code>, so the first categorical series would share danger's hue, as danger shares tertiary's today. <code>check:contrast</code> asserts a role equals its declared hue, so the
          change is three lines in <code>levels.ts</code> plus whatever that check flags. It was not run here.
        </p>
      </Disclosure>
    </section>
  );
}

/* ----------------------------------------------------------------- metrics */

function MetricsStrip() {
  const rows = plainRows(11, 20);
  const items: { id: string; label: string; look: Look; geo: typeof GEO.spec; note: string }[] = [
    { id: 'today', label: 'Today (editor sample)', look: today('midnight'), geo: GEO.today, note: '13px / 20px · its own classes: keyword accent.tertiary, string success, number warning, comment muted italic' },
    { id: 'P', label: 'P', look: build('P', 'midnight'), geo: GEO.spec, note: '14px / 21px' },
    { id: 'Q', label: 'Q', look: build('Q', 'midnight'), geo: GEO.spec, note: '14px / 21px' },
  ];
  return (
    <section id="R5-METRICS" aria-labelledby="R5-METRICS-h" className={`flex ${ANCHOR} flex-col gap-4 border-t-4 border-double border-edge-strong pt-8`}>
      <header className="flex flex-col gap-2">
        <Eyebrow>[ R5-METRICS ]</Eyebrow>
        <h3 id="R5-METRICS-h" className="m-0 font-display text-3xl font-extrabold uppercase text-content-primary">Type metrics, same ten lines</h3>
        <p className="m-0 max-w-3xl text-content-secondary">
          Lines 11 to 20 of paginate.ts on midnight, no highlights. Today is the editor sample as it ships, in its own colours; P and Q are each drawn in their own.
        </p>
      </header>
      <div data-theme="midnight" className="grid grid-cols-1 gap-4 bg-surface-base p-3 xl:grid-cols-2">
        {items.map((r) => (
          <div key={r.id} data-r5-metrics={r.id} className="flex min-w-0 flex-col gap-1">
            <p className="m-0 font-mono text-xs font-bold text-content-primary">
              {r.label} <span className="font-normal text-content-muted">{r.note}</span>
            </p>
            <Frame look={r.look} rows={rows} geo={r.geo} />
          </div>
        ))}
      </div>
      <Disclosure title="The numbers">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-left text-content-muted">
              {['', 'size', 'leading', 'ratio', 'tab', 'gutter', 'width of 48 columns'].map((h) => (
                <th key={h} className="p-1 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-edge-subtle text-content-secondary">
                <td className="p-1 pr-3 text-content-primary">{r.label}</td>
                <td className="p-1 pr-3">{r.geo.fs}px</td>
                <td className="p-1 pr-3">{r.geo.lh}px</td>
                <td className="p-1 pr-3">{(r.geo.lh / r.geo.fs).toFixed(2)}</td>
                <td className="p-1 pr-3">{r.id === 'today' ? 'not set (8)' : 2}</td>
                <td className="p-1 pr-3">
                  {r.geo.mark + r.geo.num + 1 + r.geo.diff}ch
                </td>
                <td className="p-1 pr-3">{Math.round((48 + r.geo.mark + r.geo.num + 1 + r.geo.diff + r.geo.pad) * r.geo.fs * 0.6)}px</td>
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

const FIXED: [string, string][] = [
  ['Selection and current line were one faint band', 'Selection is a 25% pink region with one forced ink; the line is a hairline and a pink number.'],
  ['A: per-token reverse video, stray gutter cell, invisible matches and bracket', 'No reverse video. Matches and the bracket are borders 2px clear of the glyphs; the gutter has its own columns.'],
  ['B: eight heavy boxes, near-monochrome, diff outshouting code', 'Other matches are 1px; colour is spent on tokens; the diff wash is 10 to 15% and the bar and sign carry it.'],
  ['C: keyword blue next to function cyan; marks colliding with numbers', 'Keywords are violet, functions cyan; marks, numbers and the diff bar are separate columns.'],
  ['Board: header over anchors, duplicate diff, three legends, wrong Today row', 'scroll-margin on every anchor, the diff is part of the frame, one legend per direction, Today uses its own classes.'],
];

/** Round 5: the code renderer, rebuilt on Pink Ink's model. */
export function Round5() {
  return (
    <section id="round-5" aria-labelledby="round-5-h" className={`flex ${ANCHOR} flex-col gap-10`}>
      <header className="flex flex-col gap-3">
        <Eyebrow>[ ROUND 5 · SCAFFOLDING ]</Eyebrow>
        <h2 id="round-5-h" className="m-0 font-display text-4xl font-extrabold uppercase text-content-primary sm:text-5xl">
          Round 5: Pink Ink
        </h2>
        <p className="m-0 max-w-3xl text-lg text-content-secondary">
          Round 4 is superseded. This round takes the owner's reference theme, Pink Ink, as the model for the code renderer: a pink selection with one forced ink, borders for find and brackets, a hairline
          current line, a separate red for errors, and teal and rose for diff. Two directions, each drawn once per level in a single frame with the diff inside it. A reference frame in Pink Ink's
          own colours follows.
        </p>
        <nav aria-label="Round 5 sections" className="border-2 border-edge-strong bg-surface-raised p-3 shadow-hard-md">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
            {[
              ['R5-P', 'P. Pink Ink, faithful', 'the model as written'],
              ['R5-Q', 'Q. Pink Ink, in our voice', 'the site\'s accents, ink brackets'],
              ['R5-HUES', 'Pink Ink hue to system hue', 'with the gaps'],
              ['R5-REF', 'Pink Ink original', 'reference, not a candidate'],
              ['R5-PAPER', 'Greyscale on paper', 'sketch only'],
              ['R5-DIAG', 'Diagnostics: red or intent.danger', 'owner decision'],
              ['R5-METRICS', 'Type metrics', 'today, P and Q'],
            ].map(([id, name, tag]) => (
              <li key={id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a href={anchor(id!)} className="font-bold text-accent-primary">{id}</a>
                <span className="text-content-primary">{name}</span>
                <span className="text-xs text-content-muted">{tag}</span>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-2">
          <Label>[ What failed in round 4, and where it is fixed ]</Label>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {FIXED.map(([a, b]) => (
              <li key={a} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 text-sm">
                <span aria-hidden="true" className="font-mono text-base font-bold leading-5 text-intent-success">✓</span>
                <span>
                  <span className="font-bold text-content-primary">{a}.</span> <span className="text-content-secondary">{b}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 max-w-3xl text-sm text-content-secondary">
            Not shown: a third direction. Nothing distinct emerged that P and Q do not already span, so R5-R is skipped.
          </p>
        </div>
      </header>
      {DIRECTIONS.map((d) => (
        <DirectionSection key={d.id} dir={d} />
      ))}
      <HueMap />
      <Reference />
      <Paper />
      <Diagnostics />
      <MetricsStrip />
    </section>
  );
}
