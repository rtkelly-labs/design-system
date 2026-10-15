import type { CSSProperties } from 'react';
import type { Hue, LevelDefinition } from '@rtkelly13/design-system';
import { flatten, toHex, withAlpha } from './colour';
import { Article, LV, LevelPair, Measures, OptionHead, Panel, SceneLabel, ratio, vars } from './Frame';
import type { Level, Row } from './Frame';
import { KINDS, SNIPPET } from './snippet';
import type { Kind, Tok } from './snippet';

interface TokStyle {
  colour: (d: LevelDefinition) => string;
  /** What the colour is declared as, for the legend. */
  source: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const hue = (h: Hue): TokStyle => ({ colour: (d) => d.palette[h], source: `hue ${h}` });
const muted: Pick<TokStyle, 'colour' | 'source'> = { colour: (d) => d.text.muted, source: 'text.muted' };
const secondary: Pick<TokStyle, 'colour' | 'source'> = { colour: (d) => d.text.secondary, source: 'text.secondary' };
const ink: Pick<TokStyle, 'colour' | 'source'> = { colour: (d) => d.text.primary, source: 'text.primary' };

/** Role to hue, per option. Same shape as `accentHue` in levels.ts. */
export const STYLES: Record<string, Record<Kind, TokStyle>> = {
  CUR: {
    kw: { colour: (d) => d.accent.tertiary, source: 'accent.tertiary', bold: true },
    str: { colour: (d) => d.intent.success, source: 'intent.success' },
    num: { colour: (d) => d.intent.warning, source: 'intent.warning' },
    fn: { colour: (d) => d.accent.primary, source: 'accent.primary' },
    type: { ...ink, bold: true },
    const: { ...ink },
    com: { ...muted },
    punc: { ...secondary },
    plain: { ...ink },
  },
  'D10-A': {
    kw: hue('violet'),
    str: hue('green'),
    num: hue('orange'),
    fn: hue('blue'),
    type: hue('teal'),
    const: hue('pink'),
    com: { ...muted },
    punc: { ...secondary },
    plain: { ...ink },
  },
  'D10-B': {
    kw: { ...hue('violet'), bold: true },
    str: hue('green'),
    num: hue('orange'),
    fn: hue('blue'),
    type: { ...hue('teal'), underline: true },
    const: hue('orange'),
    com: { ...muted, italic: true },
    punc: { ...secondary },
    plain: { ...ink },
  },
  'D10-C': {
    kw: { colour: (d) => d.accent.tertiary, source: 'accent.tertiary', bold: true },
    str: { colour: (d) => d.intent.success, source: 'intent.success' },
    num: { colour: (d) => d.intent.warning, source: 'intent.warning' },
    fn: { colour: (d) => d.accent.primary, source: 'accent.primary' },
    type: { ...ink, underline: true },
    const: { colour: (d) => d.intent.warning, source: 'intent.warning' },
    com: { ...muted, italic: true },
    punc: { ...secondary },
    plain: { ...ink },
  },
};

type Band = 'ground' | 'line' | 'sel' | 'find' | 'bracket' | 'add' | 'del';
const BANDS: { b: Exclude<Band, 'ground'>; label: string; colour: (d: LevelDefinition) => string; source: string }[] = [
  { b: 'line', label: 'line', colour: (d) => d.text.primary, source: 'text.primary' },
  { b: 'sel', label: 'select', colour: (d) => d.accent.primary, source: 'accent.primary' },
  { b: 'find', label: 'find', colour: (d) => d.intent.warning, source: 'intent.warning' },
  { b: 'bracket', label: 'bracket', colour: (d) => d.text.primary, source: 'text.primary' },
  { b: 'add', label: 'added', colour: (d) => d.intent.success, source: 'intent.success' },
  { b: 'del', label: 'removed', colour: (d) => d.intent.danger, source: 'intent.danger' },
];

/** The per-level alpha literals the board proposes. Sketch is lower: its hues have little headroom. */
export const ALPHA: Record<Level, Record<Exclude<Band, 'ground'>, number>> = {
  midnight: { line: 0.08, sel: 0.25, find: 0.25, bracket: 0.18, add: 0.15, del: 0.15 },
  sketch: { line: 0.06, sel: 0.12, find: 0.12, bracket: 0.1, add: 0.1, del: 0.1 },
};

const bandHex = (level: Level, b: (typeof BANDS)[number]) => withAlpha(b.colour(LV[level]), ALPHA[level][b.b]);

/** Composited contrast of one colour over one band over the editor ground (surface.sunken). */
function over(level: Level, fg: string, b: (typeof BANDS)[number] | undefined, alpha?: number): number {
  const d = LV[level];
  if (!b) return ratio(fg, d.surface.sunken);
  const a = alpha ?? ALPHA[level][b.b];
  return ratio(fg, flatten(withAlpha(b.colour(d), a), d.surface.sunken));
}

/** Largest alpha, in 0.01 steps, at which every token colour still clears 4.5:1 over the band. */
function headroom(level: Level, opt: string, b: (typeof BANDS)[number]): number {
  const d = LV[level];
  const cols = KINDS.map((k) => STYLES[opt]![k.k].colour(d));
  let ok = 0;
  for (let a = 0; a <= 100; a++) {
    if (cols.every((c) => over(level, c, b, a / 100) >= 4.5)) ok = a;
    else break;
  }
  return ok / 100;
}

function tokStyle(opt: string, k: Kind): CSSProperties {
  const s = STYLES[opt]![k];
  return {
    color: `var(--p2-t-${k})`,
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
    textUnderlineOffset: s.underline ? 3 : undefined,
  };
}

function TokSpan({ opt, tok }: { opt: string; tok: Tok }) {
  const style: CSSProperties = { ...tokStyle(opt, tok.k) };
  if (tok.band) style.background = `var(--p2-b-${tok.band})`;
  if (tok.ring) style.outline = '1px solid var(--ds-border-strong)';
  if (tok.sq) {
    style.textDecoration = `underline wavy var(--ds-intent-${tok.sq === 'error' ? 'danger' : 'warning'})`;
    style.textDecorationThickness = '1px';
    style.textUnderlineOffset = 3;
  }
  return <span style={style}>{tok.s}</span>;
}

function Editor({ opt, grey }: { opt: string; grey?: boolean }) {
  return (
    <div className="overflow-x-auto border-2 border-edge-strong bg-surface-sunken" style={grey ? { filter: 'grayscale(1)' } : undefined}>
      <div className="flex items-center gap-2 border-b-2 border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">
        <span>retry.ts</span>
        <span aria-hidden="true">{grey ? '[ greyscale ]' : ''}</span>
      </div>
      <pre className="m-0 min-w-[27rem] py-1 font-mono text-[11px] leading-[18px]">
        {SNIPPET.map((ln, i) => {
          const lineBg = ln.line === 'cur' ? 'var(--p2-b-line)' : ln.line === 'add' ? 'var(--p2-b-add)' : ln.line === 'del' ? 'var(--p2-b-del)' : undefined;
          return (
            <div key={i} style={{ background: lineBg }} className="flex">
              <span aria-hidden="true" className="w-8 shrink-0 select-none pr-2 text-right text-content-muted">{i + 1}</span>
              <span aria-hidden="true" className="w-3 shrink-0 select-none text-content-secondary">{ln.line === 'add' ? '+' : ln.line === 'del' ? '-' : ''}</span>
              <code className="whitespace-pre">
                {ln.toks.map((tok, j) => (
                  <TokSpan key={j} opt={opt} tok={tok} />
                ))}
                {ln.toks.length === 0 ? ' ' : null}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function Grid({ opt, level }: { opt: string; level: Level }) {
  const d = LV[level];
  const cols: { id: Band; label: string; b?: (typeof BANDS)[number] }[] = [
    { id: 'ground', label: 'ground' },
    ...BANDS.map((b) => ({ id: b.b as Band, label: b.label, b })),
  ];
  const cell = (key: string, v: number) => (
    <td key={key} className={`px-1 py-0.5 text-right ${v < 4.5 ? 'font-bold text-intent-danger' : ''}`}>
      {v.toFixed(2)}
      {v < 4.5 ? '*' : ''}
    </td>
  );
  return (
    <div>
      <SceneLabel>Composited contrast, token over band over surface.sunken</SceneLabel>
      <div className="overflow-x-auto border-2 border-edge-default bg-surface-raised">
        <table className="w-full min-w-[24rem] border-collapse font-mono text-[10px]">
          <thead>
            <tr className="border-b-2 border-edge-default text-left uppercase text-content-muted">
              <th scope="col" className="px-1 py-0.5">Token</th>
              {cols.map((c) => (
                <th key={c.id} scope="col" className="px-1 py-0.5 text-right">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KINDS.map(({ k, label }) => {
              const colour = STYLES[opt]![k].colour(d);
              return (
                <tr key={k} className="border-b border-edge-subtle">
                  <th scope="row" className="px-1 py-0.5 text-left font-normal text-content-secondary">{label}</th>
                  {cols.map((c) => (
                    cell(c.id, over(level, colour, c.b))
                  ))}
                </tr>
              );
            })}
            <tr className="border-t-2 border-edge-default">
              <th scope="row" className="px-1 py-0.5 text-left font-normal text-content-secondary">alpha used</th>
              <td className="px-1 py-0.5 text-right text-content-muted">-</td>
              {BANDS.map((b) => (
                <td key={b.b} className="px-1 py-0.5 text-right">{ALPHA[level][b.b].toFixed(2)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-1 py-0.5 text-left font-normal text-content-secondary">max alpha at 4.5</th>
              <td className="px-1 py-0.5 text-right text-content-muted">-</td>
              {BANDS.map((b) => {
                const h = headroom(level, opt, b);
                const lit = ALPHA[level][b.b];
                return (
                  <td key={b.b} className={`px-1 py-0.5 text-right ${h < lit ? 'font-bold text-intent-danger' : ''}`}>{h.toFixed(2)}</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-1 font-mono text-[10px] text-content-muted">
        * under 4.5:1. The last row is the largest alpha at which every token still passes; red where the board's literal exceeds it.
      </p>
    </div>
  );
}

const f2 = (n: number) => n.toFixed(2);

function summary(opt: string, level: Level): Row[] {
  const d = LV[level];
  let failing = 0;
  let total = 0;
  let worst = Infinity;
  let worstLabel = '';
  for (const { k, label } of KINDS) {
    const colour = STYLES[opt]![k].colour(d);
    for (const b of [undefined, ...BANDS]) {
      const v = over(level, colour, b);
      total++;
      if (v < 4.5) failing++;
      if (v < worst) {
        worst = v;
        worstLabel = `${label} on ${b ? b.label : 'ground'}`;
      }
    }
  }
  // Greyscale: kinds that differ by luminance alone, with no bold/italic/underline difference.
  const kinds = KINDS.filter((x) => x.k !== 'plain');
  let alike = 0;
  for (let i = 0; i < kinds.length; i++) {
    for (let j = i + 1; j < kinds.length; j++) {
      const a = STYLES[opt]![kinds[i]!.k];
      const b = STYLES[opt]![kinds[j]!.k];
      const sig = (s: TokStyle) => `${s.bold}${s.italic}${s.underline}`;
      if (sig(a) === sig(b) && ratio(a.colour(d), b.colour(d)) < 1.25) alike++;
    }
  }
  return [
    { label: 'token/band cells under 4.5:1', value: `${failing} of ${total}`, bad: failing > 0 },
    { label: 'worst cell', value: `${f2(worst)}:1 (${worstLabel})`, bad: worst < 4.5 },
    { label: 'error squiggle (danger) on ground', value: `${f2(ratio(d.intent.danger, d.surface.sunken))}:1` },
    { label: 'warning squiggle on ground', value: `${f2(ratio(d.intent.warning, d.surface.sunken))}:1` },
    { label: 'grey pairs under 1.25:1 with no channel', value: String(alike), bad: alike > 0 },
  ];
}

export function D10Option({ opt, id, name, rationale, evidence }: { opt: string; id: string; name: string; rationale: string; evidence: string }) {
  return (
    <Article id={id}>
      <OptionHead id={id} name={name} rationale={rationale} evidence={evidence} />
      <LevelPair>
        {(level) => {
          const d = LV[level];
          const map: Record<string, string> = {};
          for (const { k } of KINDS) map[`--p2-t-${k}`] = toHex(STYLES[opt]![k].colour(d));
          for (const b of BANDS) map[`--p2-b-${b.b}`] = bandHex(level, b);
          return (
            <Panel level={level} style={vars(map)}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <SceneLabel>Editor: select, find, line, bracket, diff, squiggles</SceneLabel>
                  <Editor opt={opt} />
                </div>
                <div>
                  <SceneLabel>Greyscale render</SceneLabel>
                  <Editor opt={opt} grey />
                </div>
                <Grid opt={opt} level={level} />
                <Measures rows={summary(opt, level)} />
                <p className="m-0 font-mono text-[10px] text-content-muted">
                  Bands (literals): {BANDS.map((b) => `${b.label} ${b.source} ${bandHex(level, b)}`).join('; ')}.
                </p>
                <p className="m-0 font-mono text-[10px] text-content-muted">
                  Tokens: {KINDS.map(({ k, label }) => `${label} = ${STYLES[opt]![k].source}${STYLES[opt]![k].bold ? ' bold' : ''}${STYLES[opt]![k].italic ? ' italic' : ''}${STYLES[opt]![k].underline ? ' underline' : ''}`).join('; ')}.
                </p>
              </div>
            </Panel>
          );
        }}
      </LevelPair>
    </Article>
  );
}
