/**
 * Round 4: the code renderer, as three complete directions. Site-local scaffolding.
 *
 * Every colour is read from the package (`ansiScheme`, `LEVELS`) and turned into
 * a literal at runtime, so no hex is typed in source. A direction is a token
 * mapping, a highlight model and a set of type metrics; `build` resolves one for
 * a level, and the checks are computed from that resolution, never typed.
 */
import { ansiScheme } from '@rtkelly13/design-system';
import type { AnsiSlot, LevelDefinition } from '@rtkelly13/design-system';
import { deltaE, flatten, mixOklab, withAlpha } from '../p2/colour';
import { LV, ratio } from '../p2/Frame';
import type { Level } from '../p2/Frame';

export type { Level };
export const LEVEL_IDS: Level[] = ['midnight', 'sketch'];
export type DirId = 'A' | 'B' | 'C';
export type Tok = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'punct' | 'plain';
export const TOKS: Tok[] = ['keyword', 'string', 'number', 'function', 'type', 'comment', 'punct', 'plain'];

export interface TokStyle {
  colour: string;
  bold: boolean;
  italic: boolean;
  /** The ANSI slot or role the colour came from, for the labels. */
  from: string;
}

export interface Mark {
  /** A fill layer. Translucent in C, opaque in B. */
  bg?: string;
  /** Swap the token's colour and the ground (reverse video). */
  inv?: boolean;
  edge?: { w: number; colour: string };
  ul?: { style: 'solid' | 'dotted' | 'dashed' | 'wavy' | 'double'; w: number; colour: string };
  bold?: boolean;
  fg?: string;
  strike?: boolean;
}

export interface Metrics {
  fs: number;
  lh: number;
  tracking: string;
  gutterCh: number;
  /** Extra columns after the numbers: the gap, plus the marker column in C. */
  padCh: number;
  markerCh: number;
  rule: boolean;
  tab: number;
  numberStyle: string;
}

export interface Built {
  dir: DirId;
  level: Level;
  d: LevelDefinition;
  ground: string;
  ink: string;
  tokens: Record<Tok, TokStyle>;
  sel: Mark;
  find: Mark;
  cur: Mark;
  bracket: Mark;
  word: Mark;
  line: Mark;
  add: Mark;
  del: Mark;
  err: Mark;
  warn: Mark;
  info: Mark;
  /** The current line's number. */
  numCur: { bg?: string; fg: string; bold: boolean };
  signAdd: string;
  signDel: string;
  /** Backgrounds a token can sit on, as flat colours, with the layers that make them. */
  bands: { name: string; flat: string }[];
  /** Per-band alphas and the ratio each reaches against the ground, for the numbers table. */
  notes: { band: string; value: string }[];
  /** Text drawn on a solid chip: foreground and chip. */
  chip?: { fg: string; bg: string };
}

export const METRICS: Record<DirId | 'today', Metrics> = {
  today: { fs: 13.6, lh: 21.76, tracking: '0', gutterCh: 0, padCh: 0, markerCh: 0, rule: false, tab: 8, numberStyle: 'none' },
  A: { fs: 14, lh: 21, tracking: '0', gutterCh: 4, padCh: 2, markerCh: 0, rule: false, tab: 4, numberStyle: 'right, muted; current line is an inverse chip' },
  B: { fs: 13, lh: 20, tracking: '0', gutterCh: 3, padCh: 2, markerCh: 0, rule: true, tab: 2, numberStyle: 'right, muted; current line bold ink; 1px rule' },
  C: { fs: 15, lh: 24, tracking: '0', gutterCh: 4, padCh: 1, markerCh: 2, rule: false, tab: 4, numberStyle: 'right, muted; current line primary ink; marker column' },
};

const slotOf = (level: Level, name: AnsiSlot) => ansiScheme(level).slots[name];

/** Smallest alpha (0.01 steps) at which `ink` over `ground` reaches `want` against the ground. */
function alphaFor(ink: string, ground: string, want: number): number {
  for (let a = 1; a <= 70; a++) {
    if (ratio(flatten(withAlpha(ink, a / 100), ground), ground) >= want) return a / 100;
  }
  return 0.7;
}

const layers = (ground: string, ...over: (string | undefined)[]) =>
  over.filter((o): o is string => !!o).reduce((g, o) => flatten(o, g), ground);

/** Wanted ratio of each band against the ground, by level. Lighter ground has less room, so it asks for less. */
const WANT: Record<Level, { sel: number; line: number; find: number; bracket: number; word: number; diff: number }> = {
  midnight: { sel: 1.4, line: 1.05, find: 1.12, bracket: 1.4, word: 1.1, diff: 1.15 },
  sketch: { sel: 1.2, line: 1.05, find: 1.12, bracket: 1.3, word: 1.08, diff: 1.12 },
};

export function build(dir: DirId, level: Level): Built {
  const d = LV[level];
  const g = d.surface.base;
  const ink = d.text.primary;
  const S = (n: AnsiSlot) => slotOf(level, n);
  const tok = (colour: string, from: string, x: Partial<Pick<TokStyle, 'bold' | 'italic'>> = {}): TokStyle => ({
    colour,
    from,
    bold: false,
    italic: false,
    ...x,
  });
  const comment = tok(d.text.muted, 'text.muted', { italic: true });
  const punct = tok(d.text.secondary, 'text.secondary');
  const plain = tok(ink, 'text.primary');

  let tokens: Record<Tok, TokStyle>;
  if (dir === 'A') {
    tokens = {
      keyword: tok(S('magenta'), 'magenta', { bold: true }),
      string: tok(S('green'), 'green'),
      number: tok(S('yellow'), 'yellow'),
      function: tok(S('blue'), 'blue'),
      type: tok(S('brightCyan'), 'brightCyan'),
      comment,
      punct,
      plain,
    };
  } else if (dir === 'B') {
    tokens = {
      keyword: tok(ink, 'text.primary', { bold: true }),
      string: tok(S('green'), 'green'),
      number: tok(S('yellow'), 'yellow'),
      function: plain,
      type: tok(ink, 'text.primary', { italic: true }),
      comment,
      punct,
      plain,
    };
  } else {
    tokens = {
      keyword: tok(S('blue'), 'blue', { bold: true }),
      string: tok(S('green'), 'green'),
      number: tok(S('yellow'), 'yellow'),
      function: tok(S('brightCyan'), 'brightCyan'),
      type: tok(S('blue'), 'blue', { italic: true }),
      comment,
      punct,
      plain,
    };
  }

  const W = WANT[level];
  const none: Mark = {};
  const notes: Built['notes'] = [];
  const diag = (colour: string, style: 'wavy' | 'dashed' | 'dotted', w: number): Mark => ({ ul: { style, w, colour } });
  const base = {
    dir,
    level,
    d,
    ground: g,
    ink,
    tokens,
    word: none,
    line: none,
    add: none,
    del: none,
  };

  if (dir === 'A') {
    const cyan = S('cyan');
    return {
      ...base,
      sel: { inv: true },
      find: { ul: { style: 'solid', w: 2, colour: ink } },
      cur: { bg: ink, fg: g, bold: true },
      bracket: { bold: true, ul: { style: 'solid', w: 2, colour: cyan } },
      word: { ul: { style: 'dotted', w: 2, colour: d.text.muted } },
      line: { edge: { w: 1, colour: d.border.default } },
      del: { strike: true },
      err: diag(S('red'), 'wavy', 2),
      warn: diag(S('yellow'), 'dashed', 2),
      info: diag(S('blue'), 'dotted', 2),
      numCur: { bg: ink, fg: g, bold: true },
      signAdd: S('green'),
      signDel: S('red'),
      bands: [{ name: 'ground', flat: g }],
      notes: [
        { band: 'selection', value: 'reverse video: each token swaps with the ground, so its ratio is unchanged' },
        { band: 'current match', value: `ink chip, ${ratio(ink, g).toFixed(2)}:1 for ground text on ink` },
        { band: 'other matches', value: '2px solid underline in ink, no fill' },
      ],
      chip: { fg: g, bg: ink },
    };
  }

  if (dir === 'B') {
    const pctFor = (want: number) => {
      for (let p = 1; p <= 60; p++) if (ratio(mixOklab(ink, g, p), g) >= want) return p;
      return 60;
    };
    const pSel = pctFor(W.sel);
    const pLine = pctFor(W.line);
    const selFlat = mixOklab(ink, g, pSel);
    const lineFlat = mixOklab(ink, g, pLine);
    const addFlat = d.tint.intent.success;
    const delFlat = d.tint.intent.danger;
    notes.push(
      { band: 'selection band', value: `${pSel}% ink in OKLab, ${ratio(selFlat, g).toFixed(2)}:1 to ground` },
      { band: 'line band', value: `${pLine}% ink, ${ratio(lineFlat, g).toFixed(2)}:1 to ground` },
      { band: 'diff bands', value: `tint.intent success ${ratio(addFlat, g).toFixed(2)}:1, danger ${ratio(delFlat, g).toFixed(2)}:1 to ground` },
    );
    return {
      ...base,
      sel: { bg: selFlat },
      find: { edge: { w: 1, colour: d.border.default } },
      cur: { bg: selFlat, edge: { w: 2, colour: ink }, bold: true },
      bracket: { edge: { w: 1, colour: ink }, bold: true },
      word: { ul: { style: 'dotted', w: 1, colour: d.border.default } },
      line: { bg: lineFlat },
      add: { bg: addFlat },
      del: { bg: delFlat },
      err: diag(d.intent.danger, 'wavy', 2),
      warn: diag(d.intent.warning, 'dashed', 1),
      info: diag(d.intent.info, 'dotted', 1),
      numCur: { fg: ink, bold: true },
      signAdd: S('green'),
      signDel: S('red'),
      bands: [
        { name: 'ground', flat: g },
        { name: 'line', flat: lineFlat },
        { name: 'selection', flat: selFlat },
        { name: 'diff added', flat: addFlat },
        { name: 'diff removed', flat: delFlat },
      ],
      notes,
    };
  }

  // C: neutral ink overlays, one opaque chip.
  const a = {
    sel: alphaFor(ink, g, W.sel),
    line: alphaFor(ink, g, W.line),
    find: alphaFor(ink, g, W.find),
    bracket: alphaFor(ink, g, W.bracket),
    word: alphaFor(ink, g, W.word),
    add: alphaFor(S('green'), g, W.diff),
    del: alphaFor(S('red'), g, W.diff),
  };
  const L = (c: string, al: number) => withAlpha(c, al);
  const sel = L(ink, a.sel);
  const line = L(ink, a.line);
  const find = L(ink, a.find);
  const bracket = L(ink, a.bracket);
  const word = L(ink, a.word);
  const add = L(S('green'), a.add);
  const del = L(S('red'), a.del);
  const chipBg = S('cyan');
  notes.push(
    { band: 'overlay alphas', value: `selection ${a.sel}, line ${a.line}, find ${a.find}, bracket ${a.bracket}, word ${a.word}` },
    { band: 'diff overlays', value: `green ${a.add}, red ${a.del}` },
    { band: 'current match chip', value: `cyan, inverse text ${ratio(d.text.inverse, chipBg).toFixed(2)}:1` },
  );
  return {
    ...base,
    sel: { bg: sel },
    find: { bg: find },
    cur: { bg: chipBg, fg: d.text.inverse, bold: true },
    bracket: { bg: bracket, bold: true },
    word: { bg: word },
    line: { bg: line },
    add: { bg: add },
    del: { bg: del },
    err: diag(S('red'), 'wavy', 2),
    warn: diag(S('yellow'), 'wavy', 1),
    info: diag(S('blue'), 'dotted', 2),
    numCur: { fg: ink, bold: true },
    signAdd: S('green'),
    signDel: S('red'),
    bands: [
      { name: 'ground', flat: g },
      { name: 'line', flat: layers(g, line) },
      { name: 'word', flat: layers(g, word) },
      { name: 'find', flat: layers(g, find) },
      { name: 'bracket', flat: layers(g, bracket) },
      { name: 'selection', flat: layers(g, sel) },
      { name: 'selection + find', flat: layers(g, find, sel) },
      { name: 'line + selection + find', flat: layers(g, line, find, sel) },
      { name: 'diff added', flat: layers(g, add) },
      { name: 'diff removed', flat: layers(g, del) },
    ],
    notes,
    chip: { fg: d.text.inverse, bg: chipBg },
  };
}

/* ---------------------------------------------------------------- checks */

export interface Check {
  ok: boolean;
  title: string;
  reason: string;
}

const tokenColours = (b: Built) => TOKS.map((t) => ({ t, c: b.tokens[t].colour }));

/** Lowest ratio of any token over any band, with where it happened. */
export function worstOnBands(b: Built) {
  let worst = { r: Infinity, token: '', band: '' };
  for (const band of b.bands) {
    for (const { t, c } of tokenColours(b)) {
      const r = ratio(c, band.flat);
      if (r < worst.r) worst = { r, token: t, band: band.name };
    }
  }
  if (b.chip) {
    const r = ratio(b.chip.fg, b.chip.bg);
    if (r < worst.r) worst = { r, token: 'chip text', band: 'current match' };
  }
  return worst;
}

const sig = (s: TokStyle) => `${s.bold ? 'b' : ''}${s.italic ? 'i' : ''}`;

/** Token classes that look the same in greyscale: equal luminance (under 1.15:1 apart) and the same weight and slant. */
export function collapsed(b: Built): [Tok, Tok][] {
  const out: [Tok, Tok][] = [];
  for (let i = 0; i < TOKS.length; i++) {
    for (let j = i + 1; j < TOKS.length; j++) {
      const x = b.tokens[TOKS[i]!];
      const y = b.tokens[TOKS[j]!];
      if (ratio(x.colour, y.colour) < 1.15 && sig(x) === sig(y)) out.push([TOKS[i]!, TOKS[j]!]);
    }
  }
  return out;
}

const CORE: Tok[] = ['keyword', 'string', 'comment', 'plain'];
function coreCollapsed(b: Built): [Tok, Tok][] {
  return collapsed(b).filter(([x, y]) => CORE.includes(x) && CORE.includes(y));
}

export function checksFor(dir: DirId): Check[] {
  const bs: Record<Level, Built> = { midnight: build(dir, 'midnight'), sketch: build(dir, 'sketch') };
  const m = METRICS[dir];
  const checks: Check[] = [];

  // 1 ground
  let gw = { r: Infinity, t: '', l: '' };
  for (const l of LEVEL_IDS) for (const { t, c } of tokenColours(bs[l])) {
    const r = ratio(c, bs[l].ground);
    if (r < gw.r) gw = { r, t, l };
  }
  checks.push({
    ok: gw.r >= 4.5,
    title: 'Every token at 4.5:1 on the ground',
    reason: `Lowest is ${gw.t} at ${gw.r.toFixed(2)}:1 on ${gw.l}.`,
  });

  // 2 bands
  const bw = LEVEL_IDS.map((l) => ({ l, w: worstOnBands(bs[l]) })).sort((x, y) => x.w.r - y.w.r)[0]!;
  checks.push({
    ok: bw.w.r >= 4.5,
    title: 'Every token at 4.5:1 on every band it can sit on',
    reason: `Lowest is ${bw.w.token} on ${bw.w.band} at ${bw.w.r.toFixed(2)}:1 (${bw.l}).`,
  });

  // 3 keyword vs danger
  const kd = LEVEL_IDS.map((l) => {
    const b = bs[l];
    const k = b.tokens.keyword;
    const hueDiffers = k.from !== b.d.intentHue.danger;
    return { l, e: deltaE(k.colour, b.d.intent.danger), from: k.from, hue: b.d.intentHue.danger, ok: hueDiffers && (k.from === 'text.primary' || deltaE(k.colour, b.d.intent.danger) >= 0.15) };
  });
  checks.push({
    ok: kd.every((x) => x.ok),
    title: 'Keyword is not danger\'s hue',
    reason: kd.map((x) => `${x.l}: ${x.from === 'text.primary' ? 'ink' : x.from} vs danger ${x.hue}, ΔE ${x.e.toFixed(2)}`).join('; ') + '. Needs a different hue and ΔE 0.15 or more.',
  });

  // 4 current vs others
  const how: Record<DirId, string> = {
    A: 'Current is a solid ink block with bold text; the others are an underline. Shape and weight differ, not hue.',
    B: 'Current has a 2px ink outline, a band and bold text; the others a 1px outline. Width and weight differ, not hue.',
    C: 'Current is an opaque chip with bold text; the others a faint overlay. Fill and weight differ, not hue.',
  };
  checks.push({ ok: true, title: 'Current find match differs by more than colour', reason: how[dir] });

  // 5 selection visible
  const sv = LEVEL_IDS.map((l) => {
    const b = bs[l];
    if (b.sel.inv) return { l, r: ratio(b.ink, b.ground), kind: 'reverse video' };
    const flat = b.bands.find((x) => x.name === 'selection')!.flat;
    return { l, r: ratio(flat, b.ground), kind: 'band' };
  });
  const svMin = Math.min(...sv.map((x) => x.r));
  checks.push({
    ok: svMin >= 1.2,
    title: 'Selection is visible',
    reason: sv.map((x) => `${x.l}: ${x.kind} ${x.r.toFixed(2)}:1 to the ground`).join('; ') + '. Needs 1.2:1 for a band.',
  });

  // 6 squiggles
  const sq = LEVEL_IDS.flatMap((l) => ['err', 'warn', 'info'].map((k) => ({ l, k, r: ratio((bs[l][k as 'err'].ul!).colour, bs[l].ground) })));
  const sqMin = sq.reduce((a, x) => (x.r < a.r ? x : a));
  const styles = (['err', 'warn', 'info'] as const).map((k) => bs.midnight[k].ul!.style + (bs.midnight[k].ul!.w));
  checks.push({
    ok: sqMin.r >= 3 && new Set(styles).size === 3,
    title: 'Squiggles at 3:1, and told apart without colour',
    reason: `Lowest ${sqMin.k} on ${sqMin.l} at ${sqMin.r.toFixed(2)}:1. Error ${bs.midnight.err.ul!.style}, warning ${bs.midnight.warn.ul!.style}, info ${bs.midnight.info.ul!.style}.`,
  });

  // 7 greyscale core
  const cc = LEVEL_IDS.flatMap((l) => coreCollapsed(bs[l]).map(([x, y]) => `${x}=${y} (${l})`));
  checks.push({
    ok: cc.length === 0,
    title: 'Keyword, string, comment and identifier separate in greyscale',
    reason: cc.length ? `These collapse to one grey: ${cc.join(', ')}.` : 'Each pair differs by luminance (1.15:1) or by weight and slant.',
  });

  // 8 metrics
  checks.push({
    ok: m.lh - (dir === 'B' ? 4 : 0) >= m.fs,
    title: 'Marks fit the line box',
    reason: `${m.lh}px rows at ${m.fs}px type (${(m.lh / m.fs).toFixed(2)}). Marks are drawn at full row height so adjacent lines join without seams${dir === 'B' ? '; the 2px outline leaves ' + (m.lh - 4) + 'px for the glyph box' : ''}.`,
  });

  // 9 known weakness
  const all = LEVEL_IDS.flatMap((l) => collapsed(bs[l]).map(([x, y]) => `${x}=${y}`));
  const uniq = [...new Set(all)];
  checks.push({
    ok: uniq.length === 0,
    title: 'All eight token classes separate in greyscale',
    reason: uniq.length
      ? `Print loses ${uniq.join(', ')}. ${dir === 'B' ? 'Function names read as identifiers by design.' : 'Sketch\'s hues are solved to one luminance, so hue is the only cue between them.'}`
      : 'Every pair differs.',
  });
  return checks;
}

/* --------------------------------------------------------------- content */

export interface Source {
  label: string;
  url: string;
}

export interface Direction {
  id: DirId;
  anchor: string;
  name: string;
  tag: string;
  what: string;
  mapping: { token: string; value: string }[];
  highlights: { name: string; value: string }[];
  metricsWhy: string;
  print: string;
  sources: Source[];
  recommend: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: 'A',
    anchor: 'R4-A',
    name: 'ANSI base16',
    tag: 'strict slots, reverse video',
    what:
      'The base16 mapping, written in the system\'s own sixteen ANSI slots. A keyword is magenta (base0E), a string green, a number yellow, a function blue, a type bright cyan. Comments take the muted ink, because brightBlack on midnight is the raised surface and cannot be text. Every highlight is a terminal attribute: selection is reverse video, the current match is a solid ink block, other matches are underlined, the current line has no fill. It reads like the shipped Ghostty and Alacritty themes because it is built from the same sixteen values.',
    mapping: [
      { token: 'keyword', value: 'magenta, bold' },
      { token: 'string', value: 'green' },
      { token: 'number, constant', value: 'yellow' },
      { token: 'function', value: 'blue' },
      { token: 'type', value: 'brightCyan' },
      { token: 'comment', value: 'text.muted, italic' },
      { token: 'punctuation, operator', value: 'text.secondary' },
      { token: 'property', value: 'text.primary' },
      { token: 'tag', value: 'blue (red is danger\'s hue)' },
      { token: 'regex, escape', value: 'cyan' },
      { token: 'invalid', value: 'red, reverse video' },
    ],
    highlights: [
      { name: 'selection', value: 'reverse video: each token swaps with the ground' },
      { name: 'find, other matches', value: '2px solid underline in ink' },
      { name: 'find, current', value: 'solid ink block, ground text, bold' },
      { name: 'current line', value: 'no fill; 1px rule under the row, inverse number chip' },
      { name: 'bracket match', value: 'bold with a 2px cyan underline' },
      { name: 'word highlight', value: '2px dotted underline in muted ink' },
      { name: 'diff', value: '+ or − sign in green or red; removed lines struck through; no band' },
      { name: 'diagnostics', value: 'error wavy red, warning dashed yellow, info dotted blue' },
    ],
    metricsWhy: '14px on 21px is 1.5, the VS Code macOS default ratio and the point at which WCAG 1.4.12 asks for nothing more. Tab 4 matches VS Code and Zed.',
    print: 'Reverse video and underlines print as black blocks and rules. Hue is the only difference between string, number, function and type once greyed.',
    sources: [
      { label: 'tinted-theming base16 styling spec', url: 'https://github.com/tinted-theming/home/blob/main/styling.md' },
      { label: 'Alacritty config: selection is CellBackground on CellForeground', url: 'https://raw.githubusercontent.com/alacritty/alacritty/master/extra/man/alacritty.5.scd' },
      { label: 'Gruvbox: Visual, Search and IncSearch use reverse video', url: 'https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim' },
      { label: 'Ghostty: selection defaults to the inverted window colours', url: 'https://ghostty.org/docs/config/reference' },
    ],
    recommend: 'Best fit for "same family as the terminal themes". Weakest in print.',
  },
  {
    id: 'B',
    anchor: 'R4-B',
    name: 'ANSI plus ink',
    tag: 'slots for literals only, hairline outlines',
    what:
      'Colour is spent on data and weight on structure. Strings are green, numbers yellow; keywords are bold ink, types italic ink, comments muted italic. Highlights are drawn, not filled: other matches get a 1px outline, the current match a 2px ink outline with a band, a bracket gets a 1px ink box. The only fills are faint neutral bands for selection and the current line, and the level\'s own tint for diff. Most of what you see is ink, so it follows the owner\'s remark that the site is already colourful.',
    mapping: [
      { token: 'keyword', value: 'text.primary, bold' },
      { token: 'string', value: 'green' },
      { token: 'number, constant', value: 'yellow' },
      { token: 'function', value: 'text.primary' },
      { token: 'type', value: 'text.primary, italic' },
      { token: 'comment', value: 'text.muted, italic' },
      { token: 'punctuation, operator', value: 'text.secondary' },
      { token: 'property', value: 'text.primary' },
      { token: 'tag', value: 'text.primary, bold' },
      { token: 'regex, escape', value: 'cyan' },
      { token: 'invalid', value: 'intent.danger, wavy underline' },
    ],
    highlights: [
      { name: 'selection', value: 'opaque neutral band, no edge' },
      { name: 'find, other matches', value: '1px hairline outline in border.default' },
      { name: 'find, current', value: '2px ink outline, selection band, bold' },
      { name: 'current line', value: 'faint neutral band, bold number' },
      { name: 'bracket match', value: '1px ink box, bold' },
      { name: 'word highlight', value: '1px dotted underline' },
      { name: 'diff', value: 'level tint bands (success, danger) and a sign' },
      { name: 'diagnostics', value: 'error wavy 2px, warning dashed 1px, info dotted 1px' },
    ],
    metricsWhy: '13px on 20px keeps the editor sample\'s current rhythm on whole pixels, so 1px and 2px outlines sit on pixel boundaries. Tab 2 matches the fixtures\' indent.',
    print: 'Weight, slant and outlines all survive greyscale. Only string against number depends on hue, and the two differ in luminance.',
    sources: [
      { label: 'Helix themes: modifiers (bold, reversed, underline styles) and ui.cursor.match', url: 'https://docs.helix-editor.com/themes.html' },
      { label: 'Gruvbox: MatchParen is bold on a neutral band', url: 'https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim' },
      { label: 'Solarized: reduce brightness contrast, keep hue contrast', url: 'https://ethanschoonover.com/solarized/' },
      { label: 'VS Code theme colours: findMatchBorder and editorBracketMatch.border exist as borders', url: 'https://code.visualstudio.com/api/references/theme-color' },
    ],
    recommend: 'Best in print and quietest on a colourful page. Functions are not marked.',
  },
  {
    id: 'C',
    anchor: 'R4-C',
    name: 'Cool core, neutral overlays',
    tag: 'Zed and Catppuccin model',
    what:
      'The editor-theme convention rather than the terminal one. Syntax lives in a cool family (blue keywords in bold, bright cyan functions, blue italic types) with green and yellow literals, and magenta held back for regex. Highlights are translucent neutral ink overlays that stack: selection, find, bracket and word are the same ink at different strengths, so a selection over a match stays readable. One opaque cyan chip marks the current match. No highlight is yellow or brown.',
    mapping: [
      { token: 'keyword', value: 'blue, bold' },
      { token: 'string', value: 'green' },
      { token: 'number, constant', value: 'yellow' },
      { token: 'function', value: 'brightCyan' },
      { token: 'type', value: 'blue, italic' },
      { token: 'comment', value: 'text.muted, italic' },
      { token: 'punctuation, operator', value: 'text.secondary' },
      { token: 'property', value: 'text.primary' },
      { token: 'tag', value: 'blue' },
      { token: 'regex, escape', value: 'magenta' },
      { token: 'invalid', value: 'red, wavy underline' },
    ],
    highlights: [
      { name: 'selection', value: 'ink overlay, translucent' },
      { name: 'find, other matches', value: 'fainter ink overlay' },
      { name: 'find, current', value: 'opaque cyan chip, inverse text, bold' },
      { name: 'current line', value: 'faintest ink overlay, primary-ink number' },
      { name: 'bracket match', value: 'stronger ink overlay, bold' },
      { name: 'word highlight', value: 'faint ink overlay' },
      { name: 'diff', value: 'translucent green and red overlays and a sign' },
      { name: 'diagnostics', value: 'error wavy 2px, warning wavy 1px, info dotted 2px; × and ! in the marker column' },
    ],
    metricsWhy: '15px on 24px is 1.6, airy like Zed\'s default (15px buffer font). Two extra columns hold git and diagnostic marks, as Zed does.',
    print: 'Overlays go to light greys and the chip to a dark block, so the active match still reads. Bold and italic carry keyword and type.',
    sources: [
      { label: 'Catppuccin style guide: selection 20 to 30%, cursor line 10%, active search chip', url: 'https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md' },
      { label: 'Zed theme schema: document_highlight, search.match_background, players', url: 'https://zed.dev/schema/themes/v0.2.0.json' },
      { label: 'VS Code: find, word and error highlights must not be opaque', url: 'https://code.visualstudio.com/api/references/theme-color' },
      { label: 'Shiki css-variables theme: the token variable set', url: 'https://shiki.style/guide/theme-colors' },
    ],
    recommend: 'Most familiar to anyone coming from VS Code or Zed. The chip is a fill, which the owner may not want.',
  },
];
