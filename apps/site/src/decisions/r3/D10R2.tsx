import type { ReactNode } from 'react';
import { deltaE, simulate } from '../p2/colour';
import { Article, LV, LevelPair, OptionHead, Panel, SceneLabel, ratio } from '../p2/Frame';
import type { Row } from '../p2/Frame';
import { Measures } from './Measures';
import { Editor, MATCHES } from './Editor';
import { BAND_LABEL, BASE, CUR, KIND_ROWS, gridFor, greyAlike, looksFor, tokenStyle } from './model';
import type { Cfg, Level } from './model';

export interface R2Option {
  id: string;
  group: 'K' | 'S' | 'F' | 'X';
  name: string;
  rationale: string;
  evidence: string;
  cfg: Cfg;
}

export const R2_OPTIONS: R2Option[] = [
  {
    id: 'D10-K1',
    group: 'K',
    name: 'Keywords in ink, bold, no hue',
    rationale:
      'Keywords take text.primary and bold. Hue is kept for literals (string, number) and functions, so nothing about a keyword can be mistaken for an error.',
    evidence: 'WCAG 1.4.1 (colour is not the only channel); D10-C already adds the bold keyword channel.',
    cfg: { ...BASE, kw: 'text.primary' },
  },
  {
    id: 'D10-K2',
    group: 'K',
    name: 'Keywords in accent.primary',
    rationale: 'Keywords move off accent.tertiary onto accent.primary, bold. This is the hue functions already use.',
    evidence: 'No collision with danger on either level; see the nearest-token row for what it shares with functions.',
    cfg: { ...BASE, kw: 'accent.primary' },
  },
  {
    id: 'D10-K3',
    group: 'K',
    name: 'Keywords in accent.secondary',
    rationale: 'Keywords take accent.secondary, bold: yellow on midnight, green on sketch.',
    evidence: 'accent.secondary is the same hue as intent.warning on midnight and intent.success on sketch (levels.ts accentHue and intentHue).',
    cfg: { ...BASE, kw: 'accent.secondary' },
  },
  {
    id: 'D10-S1',
    group: 'S',
    name: 'Band keeps token colours, sized by headroom',
    rationale:
      'The selection is a translucent accent.primary literal per level. Its alpha is the largest at which every token colour still clears 4.5:1 over it, up to 0.30. Tokens are not recoloured.',
    evidence: 'WCAG 1.4.3; the headroom method of the D10 board.',
    cfg: { ...BASE, sel: 'S1' },
  },
  {
    id: 'D10-S2',
    group: 'S',
    name: 'Lighter band plus a 1px edge',
    rationale:
      'Half of the S1 alpha, plus a 1px border.strong edge round each selected run. The edge carries the selection so the fill can stay out of the tokens\' way. Tokens are not recoloured.',
    evidence: 'WCAG 1.4.11 (the edge is the non-text indicator); the edge is drawn per line fragment, not as one box.',
    cfg: { ...BASE, sel: 'S2' },
  },
  {
    id: 'D10-S3',
    group: 'S',
    name: 'Inverse: solid band, text.inverse tokens',
    rationale: 'A solid accent.primary band with every token in text.inverse. The classic terminal look. Hue is deliberately lost inside the band.',
    evidence: 'Terminal convention; the token pair is text.inverse over accent.primary, measured below.',
    cfg: { ...BASE, sel: 'S3' },
  },
  {
    id: 'D10-F1',
    group: 'F',
    name: 'Others underlined, current filled',
    rationale: 'Other matches get a 2px underline in intent.warning and no fill. The current match gets a filled box. The underline never changes the text colour.',
    evidence: 'Fill versus no fill is the strongest single-channel difference; the underline is an inset shadow so it does not fight the type underline or a squiggle.',
    cfg: { ...BASE, find: 'F1' },
  },
  {
    id: 'D10-F2',
    group: 'F',
    name: 'Others faint, current solid plus outline',
    rationale: 'Other matches get a faint intent.warning tint. The current match gets a solid intent.warning box with text.inverse ink and a 2px border.strong outline.',
    evidence: 'Three channels separate current from the rest: fill strength, ink colour and the outline.',
    cfg: { ...BASE, find: 'F2' },
  },
  {
    id: 'D10-F3',
    group: 'F',
    name: 'Others edge-only, current filled',
    rationale: 'Other matches get a 1px intent.warning edge and no fill. The current match is filled and keeps the edge.',
    evidence: 'Edge-only matches leave the token colours entirely alone; fill marks the current one.',
    cfg: { ...BASE, find: 'F3' },
  },
  {
    id: 'D10-X1',
    group: 'X',
    name: 'Bold keyword, italic comment, underlined type',
    rationale: 'The D10-C channel set, shown alone on today\'s rendering so the greyscale copy shows what it adds. Comments are already italic today.',
    evidence: 'D10-C (decided base); the board shows it so it can be judged next to X2 to X4.',
    cfg: { ...CUR, kwBold: true, typeUl: true },
  },
  {
    id: 'D10-X2',
    group: 'X',
    name: 'Punctuation and brackets in text.muted',
    rationale: 'Punctuation drops from text.secondary to text.muted so the words stand out from the syntax around them. It shares text.muted with comments, which are italic.',
    evidence: 'Contrast on ground and over every band is in the grid; muted is the dimmest text tone that passes.',
    cfg: { ...CUR, punc: 'text.muted' },
  },
  {
    id: 'D10-X3',
    group: 'X',
    name: 'A diff pair that is not red and green',
    rationale: 'Added lines use intent.info, removed lines intent.warning, each with its + or − gutter mark. The sample already draws the marks; the pair is what changes.',
    evidence: 'The success and danger intents have equal luminance on sketch (ED-F03); ΔE under deuteranopia and protanopia below.',
    cfg: { ...CUR, diff: 'X3' },
  },
  {
    id: 'D10-X4',
    group: 'X',
    name: 'Per-level translucent bands',
    rationale:
      'Selection, find, the current match and the current line are eight-digit literals chosen per level: midnight 0.25 and sketch 0.12 for selection and find, each capped at the headroom that keeps every token at 4.5:1.',
    evidence: 'levels.ts tint rationale: one alpha does not hold on both grounds. Room per band is in the table.',
    cfg: { ...CUR, bands: 'X4' },
  },
];

const f2 = (n: number) => n.toFixed(2);
const f3 = (n: number) => n.toFixed(3);

/** Contrast of every token over every band, with a flag under 4.5:1. */
function Grid({ cfg, level }: { cfg: Cfg; level: Level }) {
  const g = gridFor(cfg, level);
  return (
    <div>
      <SceneLabel>Composited contrast, token over band over surface.sunken</SceneLabel>
      <div className="overflow-x-auto border-2 border-edge-default bg-surface-raised">
        <table className="w-full min-w-[34rem] border-collapse font-mono text-[10px]">
          <thead>
            <tr className="border-b-2 border-edge-default text-left uppercase text-content-muted">
              <th scope="col" className="px-1 py-0.5">Token</th>
              {g.cells.map((c) => (
                <th key={c.id} scope="col" className="px-1 py-0.5 text-right">{BAND_LABEL[c.id]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.k} className="border-b border-edge-subtle">
                <th scope="row" className="px-1 py-0.5 text-left font-normal text-content-secondary">{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={g.cells[i]!.id} className={`px-1 py-0.5 text-right ${v < 4.5 ? 'font-bold text-intent-danger' : ''}`}>
                    {f2(v)}
                    {v < 4.5 ? '*' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-1 font-mono text-[10px] text-content-muted">
        * under 4.5:1. Every token is crossed with every band, including pairs the snippet never draws, so the grid is a ceiling on risk, not a count of defects.
        {g.looks.room.length > 0
          ? ` Alphas: ${g.looks.room.map((r) => `${r.band} ${f2(r.used ?? 0)} (room ${f2(r.max)}${r.target !== null && r.used !== null && r.used < r.target ? `, wanted ${f2(r.target)}` : ''})`).join('; ')}.`
          : ' Bands are the sample\'s own alphas, the same on both levels.'}
      </p>
    </div>
  );
}

/** Shared rows: grid summary and greyscale. */
function common(cfg: Cfg, level: Level): Row[] {
  const g = gridFor(cfg, level);
  const alike = greyAlike(cfg, level);
  return [
    { label: 'token/band cells under 4.5:1', value: `${g.failing} of ${g.total}`, bad: g.failing > 0 },
    { label: 'worst cell', value: `${f2(g.worst)}:1 (${g.worstLabel})`, bad: g.worst < 4.5 },
    { label: 'greyscale pairs with no channel', value: alike.length ? alike.join(', ') : 'none', bad: alike.length > 0 },
  ];
}

const GATE = 0.04;

function keywordRows(cfg: Cfg, level: Level): Row[] {
  const d = LV[level];
  const kw = tokenStyle(cfg, d, 'keyword');
  const toDanger = deltaE(kw.colour, d.intent.danger);
  const toWarn = deltaE(kw.colour, d.intent.warning);
  const others = KIND_ROWS.filter((r) => r.k !== 'keyword').map((r) => {
    const s = tokenStyle(cfg, d, r.k);
    return { label: r.label, de: deltaE(kw.colour, s.colour), same: s.bold === kw.bold && s.italic === kw.italic && s.underline === kw.underline };
  });
  const nearest = others.reduce((a, b) => (b.de < a.de ? b : a));
  const clash = others.filter((o) => o.de < GATE);
  const clashText = clash.length
    ? clash.map((o) => `${o.label}${o.same ? ' (no other channel)' : ' (bold or underline differs)'}`).join(', ')
    : 'none';
  return [
    { label: 'ΔE to error squiggle and ✕ (danger)', value: f3(toDanger), bad: toDanger < GATE },
    { label: 'ΔE to warning squiggle (warning)', value: f3(toWarn), bad: toWarn < GATE },
    { label: 'nearest other token', value: `${nearest.label} ${f3(nearest.de)}` },
    { label: 'same hue as another token', value: clashText, bad: clash.some((o) => o.same) },
    { label: 'keyword on ground', value: `${f2(ratio(kw.colour, d.surface.sunken))}:1` },
  ];
}

function selectionRows(cfg: Cfg, level: Level): Row[] {
  const d = LV[level];
  const l = looksFor(cfg, level);
  const ground = d.surface.sunken;
  const g = gridFor(cfg, level);
  const selCol = g.cells.findIndex((c) => c.id === 'sel');
  const minTok = Math.min(...g.rows.map((r) => r.values[selCol]!));
  const minRow = g.rows.find((r) => r.values[selCol] === minTok)!;
  const band = ratio(l.sel.flat ?? ground, ground);
  const rows: Row[] = [
    { label: 'band alpha', value: l.sel.alpha === null ? 'solid' : f2(l.sel.alpha) },
    { label: 'band against ground (non-text)', value: `${f2(band)}:1`, bad: band < 1.1 && !l.sel.edge },
    { label: 'weakest token inside the band', value: `${f2(minTok)}:1 (${minRow.label})`, bad: minTok < 4.5 },
    { label: 'tokens recoloured inside', value: l.sel.fg ? 'all, to text.inverse' : 'none' },
  ];
  if (l.sel.edge) {
    rows.push({ label: 'edge against ground (1.4.11)', value: `${f2(ratio(l.sel.edge.colour, ground))}:1`, bad: ratio(l.sel.edge.colour, ground) < 3 });
  }
  if (cfg.sel === 'S3') {
    rows.push({ label: 'text.inverse over accent.primary', value: `${f2(ratio(d.text.inverse, d.accent.primary))}:1`, bad: ratio(d.text.inverse, d.accent.primary) < 4.5 });
  }
  return rows;
}

function findRows(cfg: Cfg, level: Level): Row[] {
  const d = LV[level];
  const l = looksFor(cfg, level);
  const ground = d.surface.sunken;
  // The mark's own colour against the ground: fill flat colour, else the edge or underline colour.
  const mark = (x: typeof l.find) => x.flat ?? x.edge?.colour ?? x.under ?? ground;
  const otherC = mark(l.find);
  const curC = mark(l.cur);
  const channels = (x: typeof l.find) => [x.fill && 'fill', x.edge && 'edge', x.under && 'underline', x.outline && 'outline', x.fg && 'ink'].filter(Boolean) as string[];
  const co = channels(l.cur);
  const ct = channels(l.find);
  const differ = co.filter((c) => !ct.includes(c) || (c === 'fill' && l.cur.alpha !== l.find.alpha));
  const fillStep = ratio(l.cur.flat ?? ground, l.find.flat ?? ground);
  return [
    { label: 'other matches', value: ct.join(' + ') || 'none' },
    { label: 'current match', value: co.join(' + ') },
    { label: 'other match mark against ground', value: `${f2(ratio(otherC, ground))}:1`, bad: ratio(otherC, ground) < 3 },
    { label: 'current mark against ground', value: `${f2(ratio(curC, ground))}:1`, bad: ratio(curC, ground) < 3 },
    { label: 'current fill against other fill', value: `${f2(fillStep)}:1` },
    { label: 'ΔE current vs other mark colour', value: f3(deltaE(curC, otherC)) },
    { label: 'channels that differ', value: String(differ.length), bad: differ.length < 2 },
  ];
}

function diffRows(cfg: Cfg, level: Level): Row[] {
  const d = LV[level];
  const a = cfg.diff === 'X3' ? d.intent.info : d.intent.success;
  const r = cfg.diff === 'X3' ? d.intent.warning : d.intent.danger;
  const l = looksFor(cfg, level);
  const rows: Row[] = [];
  for (const v of ['normal', 'deuteranopia', 'protanopia'] as const) {
    const de = deltaE(simulate(a, v), simulate(r, v));
    rows.push({ label: `ΔE added vs removed, ${v}`, value: f3(de), bad: de < GATE });
  }
  rows.push({ label: 'luminance ratio added/removed marks', value: `${f2(ratio(a, r))}:1` });
  rows.push({ label: 'added mark on its band', value: `${f2(ratio(a, l.add.flat ?? l.ground))}:1`, bad: ratio(a, l.add.flat ?? l.ground) < 4.5 });
  rows.push({ label: 'removed mark on its band', value: `${f2(ratio(r, l.del.flat ?? l.ground))}:1`, bad: ratio(r, l.del.flat ?? l.ground) < 4.5 });
  return rows;
}

function punctRows(cfg: Cfg, level: Level): Row[] {
  const d = LV[level];
  const p = tokenStyle(cfg, d, 'punct').colour;
  const ink = d.text.primary;
  return [
    { label: 'punctuation on ground', value: `${f2(ratio(p, d.surface.sunken))}:1`, bad: ratio(p, d.surface.sunken) < 4.5 },
    { label: 'identifier ink over punctuation', value: `${f2(ratio(ink, p))}:1` },
    { label: 'same colour as comments', value: p === d.text.muted ? 'yes (comments are italic)' : 'no' },
  ];
}

function bandRows(cfg: Cfg, level: Level): Row[] {
  const l = looksFor(cfg, level);
  const d = LV[level];
  const g = d.surface.sunken;
  const rows: Row[] = [];
  for (const [label, x] of [['line', l.line], ['select', l.sel], ['find', l.find], ['current match', l.cur]] as const) {
    rows.push({ label: `${label}: alpha, band over ground`, value: `${x.alpha === null ? 'solid' : f2(x.alpha)}, ${f2(ratio(x.flat ?? g, g))}:1` });
  }
  return rows;
}

function rowsFor(o: R2Option, level: Level): Row[] {
  const head =
    o.group === 'K' ? keywordRows(o.cfg, level)
    : o.group === 'S' ? selectionRows(o.cfg, level)
    : o.group === 'F' ? findRows(o.cfg, level)
    : o.id === 'D10-X3' ? diffRows(o.cfg, level)
    : o.id === 'D10-X2' ? punctRows(o.cfg, level)
    : o.id === 'D10-X4' ? bandRows(o.cfg, level)
    : [];
  return [...head, ...common(o.cfg, level)];
}

/** The keyword beside the error squiggle and the problems ✕, so a collision is visible. */
function Collide({ cfg, level }: { cfg: Cfg; level: Level }) {
  const d = LV[level];
  const kw = tokenStyle(cfg, d, 'keyword');
  return (
    <div>
      <SceneLabel>Keyword beside error squiggle and problems ✕</SceneLabel>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-2 border-edge-default px-3 py-2 font-mono text-sm" style={{ background: d.surface.sunken }}>
        <span className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-content-muted">keyword</span>
          <span style={{ color: kw.colour, fontWeight: kw.bold ? 700 : undefined }}>import const return if</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-content-muted">error</span>
          <span style={{ color: d.text.primary, textDecoration: `underline wavy ${d.intent.danger}`, textDecorationThickness: 2, textUnderlineOffset: 3 }}>lenght</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-content-muted">problems</span>
          <span aria-hidden="true" className="font-bold text-intent-danger">✕</span>
          <span className="text-xs text-content-secondary">1 error</span>
        </span>
      </div>
    </div>
  );
}

function Scene({ o, level, children }: { o: R2Option; level: Level; children?: ReactNode }) {
  const rows = rowsFor(o, level);
  return (
    <Panel level={level}>
      <div className="grid grid-cols-1 gap-3">
        {children}
        <div>
          <SceneLabel>Editor: select, find, line, bracket, diff, squiggles</SceneLabel>
          <Editor cfg={o.cfg} level={level} />
        </div>
        <div>
          <SceneLabel>Greyscale render</SceneLabel>
          <Editor cfg={o.cfg} level={level} grey />
        </div>
        <Grid cfg={o.cfg} level={level} />
        <Measures rows={rows} />
      </div>
    </Panel>
  );
}

export function R2Control() {
  return (
    <Article id="D10-R2-CURRENT">
      <OptionHead
        id="D10-R2-CURRENT"
        name="Current (the editor sample as it ships)"
        rationale="Keywords in accent.tertiary, not bold. Selection is accent.primary at 25% and function tokens are accent.primary too. Every find match is a 25% warning box with an edge, the current one 50% with a 2px edge. The three owner observations are measured here."
        evidence="Control row; no change. Observed in apps/site/src/examples/editor."
      />
      <LevelPair>
        {(level) => {
          const d = LV[level];
          const l = looksFor(CUR, level);
          const fnOnSel = ratio(d.accent.primary, l.sel.flat ?? l.ground);
          const rows: Row[] = [
            ...keywordRows(CUR, level).slice(0, 2),
            { label: '(2) function token on selection band', value: `${f2(fnOnSel)}:1`, bad: fnOnSel < 4.5 },
            { label: '(2) function token and selection band', value: 'both accent.primary' },
            { label: `(3) matches carrying the heavy box`, value: `${MATCHES.length} of ${MATCHES.length}`, bad: true },
            { label: '(3) current fill against other fill', value: `${f2(ratio(l.cur.flat ?? l.ground, l.find.flat ?? l.ground))}:1` },
            ...common(CUR, level),
          ];
          return (
            <Panel level={level}>
              <div className="grid grid-cols-1 gap-3">
                <Collide cfg={CUR} level={level} />
                <div>
                  <SceneLabel>Editor: select, find, line, bracket, diff, squiggles</SceneLabel>
                  <Editor cfg={CUR} level={level} />
                </div>
                <div>
                  <SceneLabel>Greyscale render</SceneLabel>
                  <Editor cfg={CUR} level={level} grey />
                </div>
                <Grid cfg={CUR} level={level} />
                <Measures rows={rows} />
              </div>
            </Panel>
          );
        }}
      </LevelPair>
    </Article>
  );
}

export function R2Option({ o }: { o: R2Option }) {
  return (
    <Article id={o.id}>
      <OptionHead id={o.id} name={o.name} rationale={o.rationale} evidence={o.evidence} />
      <LevelPair>
        {(level) => (
          <Scene o={o} level={level}>
            {o.group === 'K' ? <Collide cfg={o.cfg} level={level} /> : null}
          </Scene>
        )}
      </LevelPair>
    </Article>
  );
}

export const R2_GROUPS: { id: string; group: R2Option['group']; title: string; text: string }[] = [
  {
    id: 'D10-K',
    group: 'K',
    title: 'Keyword colour',
    text: 'Observation 1: keywords use accent.tertiary, which is the same hue as intent.danger on both levels, so they read like the error squiggle and the ✕. Pick at most one.',
  },
  {
    id: 'D10-S',
    group: 'S',
    title: 'Selection band',
    text: 'Observation 2: inside the selection, function tokens (accent.primary) sit on an accent.primary band. Selection should not change what a token looks like. Pick at most one.',
  },
  {
    id: 'D10-F',
    group: 'F',
    title: 'Find matches',
    text: 'Observation 3: every match carries the same heavy boxed fill, so the current match cannot be told from the others. Pick at most one.',
  },
  {
    id: 'D10-X',
    group: 'X',
    title: 'Extra differentiation',
    text: 'Multi-select: take any of these on top of the K, S and F picks. Each is drawn alone on today\'s rendering so its own effect is visible.',
  },
];
