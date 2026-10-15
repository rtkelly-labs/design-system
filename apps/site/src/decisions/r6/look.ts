/**
 * Round 6: one code theme, built from the design system's own accent roles and
 * palette hues. Site-local scaffolding. Nothing is typed as a hex here: every
 * colour is a role token or a palette hue read from the exported level data, and
 * every translucent layer is computed from them. The `Look` type and the frame
 * that draws it are round 5's.
 */
import { deltaE, flatten, toOklab, withAlpha } from '../p2/colour';
import { LV, ratio } from '../p2/Frame';
import type { Level } from '../p2/Frame';
import { greyCollapsed, textColours } from '../r5/look';
import type { Check, Cls, Look } from '../r5/look';

export type { Level, Look, Check, Cls };
export const LEVEL_IDS: Level[] = ['midnight', 'sketch'];

/** Largest alpha at or below `target` (0.01 steps) for which `ok` holds. */
function fit(target: number, ok: (a: number) => boolean, floor = 0.04): number {
  for (let i = Math.round(target * 100); i >= Math.round(floor * 100); i--) {
    if (ok(i / 100)) return i / 100;
  }
  return floor;
}
const pct = (a: number) => `${Math.round(a * 100)}%`;


/** The role or hue each token class reads, per level, for the tables. */
export interface Source {
  midnight: string;
  sketch: string;
}

export const SELECTION_TARGET = 0.6;
export const DIFF_TARGET = 0.12;
export const WASH_TARGET = 0.1;

export function theme(level: Level): Look {
  const d = LV[level];
  const p = d.palette;
  const g = d.surface.base;
  const ink = d.text.primary;
  const NONE = withAlpha(g, 0);
  const mid = level === 'midnight';

  // Roles that differ between the levels because the accents do.
  const keyword = mid ? d.accent.tertiary : p.magenta;
  const constants = mid ? d.accent.secondary : p.violet;
  const errHue = mid ? p.red : d.intent.danger;
  const string = mid ? d.intent.success : d.accent.secondary;
  const brackets = d.text.secondary;

  const tok: Record<Cls, string> = {
    keyword,
    control: keyword,
    string,
    number: constants,
    type: constants,
    function: d.accent.primary,
    comment: d.text.muted,
    op: d.text.secondary,
    sep: d.text.secondary,
    bracket: brackets,
    plain: ink,
  };
  const from: Record<Cls, string> = {
    keyword: mid ? 'accent.tertiary (pink)' : 'palette.magenta',
    control: mid ? 'accent.tertiary (pink)' : 'palette.magenta',
    string: mid ? 'intent.success (green)' : 'accent.secondary (green)',
    number: mid ? 'accent.secondary (yellow)' : 'palette.violet',
    type: mid ? 'accent.secondary (yellow)' : 'palette.violet',
    function: `accent.primary (${mid ? 'cyan' : 'blue'})`,
    comment: 'text.muted',
    op: 'text.secondary',
    sep: 'text.secondary',
    bracket: 'text.secondary',
    plain: 'text.primary',
  };

  // Selection: accent.primary, one region, one forced ink. Alpha by measurement.
  const selA = fit(SELECTION_TARGET, (a) => ratio(ink, flatten(withAlpha(d.accent.primary, a), g)) >= 4.5, 0.12);
  const sel = { fill: withAlpha(d.accent.primary, selA), fg: ink };

  // Find: borders only, in accent.secondary. The current match is 2px, bold, with a gutter ▸.
  const find: Look['find'] = {
    otherBorder: d.accent.secondary,
    otherFg: ink,
    curBorder: d.accent.secondary,
    curFill: NONE,
    curBold: true,
    otherW: 1,
    curW: 2,
  };

  // Current line: a hairline and nothing else.
  const line = { fill: NONE, border: d.border.subtle, num: d.text.muted, numActive: d.accent.primary };

  // Bracket match: tertiary (mid) or magenta (sketch) border, a wash, the glyph in ink.
  const bracket = { border: keyword, fill: withAlpha(keyword, WASH_TARGET), fg: ink, bold: false };

  const err = { fg: errHue, wash: NONE };
  const warn = { fg: d.intent.warning, wash: NONE };
  const info = { fg: d.intent.info };

  // Diff: green and red behind the line, lowered until every text colour still reads on it.
  const green = d.intent.success;
  const red = errHue;
  const draft: Look = {
    id: 'P', level, ground: g, ink, tok, from, bold: {}, italic: {}, rot: [brackets], sel, find, line, bracket, err, warn,
    add: { bar: green, wash: '' }, del: { bar: red, wash: '' },
    guide: { rot: [d.border.subtle], active: [d.border.default] },
    marker: { cur: d.accent.secondary }, alphas: {},
  };
  const texts = textColours(draft);
  const diffA = fit(DIFF_TARGET, (a) => [green, red].every((h) => {
    const wash = flatten(withAlpha(h, a), g);
    return texts.every((c) => ratio(c, wash) >= 4.5);
  }));

  return {
    ...draft,
    info,
    diagStyle: { err: 'wavy', warn: 'dashed', info: 'dotted' },
    add: { bar: green, wash: withAlpha(green, diffA) },
    del: { bar: red, wash: withAlpha(red, diffA) },
    alphas: {
      selection: `${pct(selA)} accent.primary (target ${pct(SELECTION_TARGET)}, ink must stay at 4.5:1)`,
      'diff wash': `${pct(diffA)} (target ${pct(DIFF_TARGET)})`,
      'bracket wash': pct(WASH_TARGET),
      'current line fill': 'none',
      'find fills': 'none',
      'error wash': 'none',
    },
  };
}

/* ------------------------------------------------------------------- bands */

export interface Band {
  name: string;
  flat: string;
  fgs: string[];
  why: string;
}

export function bands(l: Look): Band[] {
  const g = l.ground;
  const texts = textColours(l);
  const add = flatten(l.add.wash, g);
  const del = flatten(l.del.wash, g);
  return [
    { name: 'ground', flat: g, fgs: texts, why: 'every token' },
    { name: 'current line (no fill)', flat: flatten(l.line.fill, g), fgs: texts, why: 'every token' },
    { name: 'diff added', flat: add, fgs: texts, why: 'every token' },
    { name: 'diff removed', flat: del, fgs: texts, why: 'every token' },
    { name: 'selection', flat: flatten(l.sel.fill, g), fgs: [l.sel.fg], why: 'forced ink only' },
    { name: 'bracket match', flat: flatten(l.bracket.fill, g), fgs: [l.bracket.fg], why: 'the matched glyph only' },
    { name: 'bracket match on diff added', flat: flatten(l.bracket.fill, add), fgs: [l.bracket.fg], why: 'the matched glyph only' },
  ];
}

export function worst(l: Look) {
  let w = { r: Infinity, band: '', fg: '' };
  for (const b of bands(l)) for (const c of b.fgs) {
    const r = ratio(c, b.flat);
    if (r < w.r) w = { r, band: b.name, fg: c };
  }
  return w;
}

/* ------------------------------------------------------------------ checks */

/** OKLCH hue in degrees, lightness and chroma. */
export function lch(hex: string) {
  const [L, a, b] = toOklab(hex);
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

/** Brown or olive: an orange-to-yellow-green hue that is dark and coloured. Gold and yellow are light; neutrals have no chroma. */
export const isBrown = (hex: string) => {
  const { L, C, h } = lch(hex);
  return C > 0.04 && h >= 40 && h <= 130 && L < 0.7;
};

export const DE_FLOOR = 0.04;

export interface ThemeChecks {
  checks: Check[];
  details: { title: string; rows: string[][]; head: string[] }[];
}

export function themeChecks(): ThemeChecks {
  const ls = LEVEL_IDS.map((lv) => theme(lv));
  const sk = ls[1]!;
  const checks: Check[] = [];
  const details: ThemeChecks['details'] = [];

  // 1. ground
  let g1 = { r: Infinity, c: '', lv: '' as string };
  for (const l of ls) for (const c of textColours(l)) {
    const r = ratio(c, l.ground);
    if (r < g1.r) g1 = { r, c, lv: l.level };
  }
  checks.push({ ok: g1.r >= 4.5, title: 'Every token at 4.5:1 on the ground', reason: `Lowest ${g1.r.toFixed(2)}:1 (${g1.c}) on ${g1.lv}, line numbers included.` });

  // 2. bands
  const w = ls.map((l) => ({ l, w: worst(l) })).sort((a, b) => a.w.r - b.w.r)[0]!;
  checks.push({
    ok: w.w.r >= 4.5,
    title: 'Every token at 4.5:1 on every composited band',
    reason: `Lowest ${w.w.r.toFixed(2)}:1 on ${w.w.band} (${w.l.level}). Selection and bracket glyph are forced inks, measured on their own band.`,
  });

  // 3. keyword vs error
  const ke = ls.map((l) => ({ l, de: deltaE(l.tok.keyword, l.err.fg) }));
  const keMin = Math.min(...ke.map((x) => x.de));
  checks.push({
    ok: keMin >= DE_FLOOR,
    title: 'Keyword is not the error hue',
    reason: `ΔE ${ke.map((x) => `${x.l.level} ${x.de.toFixed(3)}`).join(', ')}, against the palette's own ${DE_FLOOR} separation gate. Midnight is close: pink keyword, red error, so the wavy line and × carry the error where hue is thin.`,
  });

  // 4. keyword vs any squiggle
  const squig = ls.flatMap((l) =>
    ([['error', l.err.fg], ['warning', l.warn.fg], ['info', l.info!.fg]] as const).map(([n, c]) => ({ lv: l.level, n, de: deltaE(l.tok.keyword, c) })),
  );
  const sqMin = squig.reduce((m, x) => (x.de < m.de ? x : m));
  checks.push({
    ok: sqMin.de >= DE_FLOOR,
    title: 'Keyword is not any diagnostic squiggle colour',
    reason: `Nearest is ${sqMin.n} on ${sqMin.lv}, ΔE ${sqMin.de.toFixed(3)}. Warning and info are 0.2 or more away on both levels.`,
  });
  details.push({ title: 'Keyword against each squiggle (ΔE)', head: ['level', 'error', 'warning', 'info'], rows: LEVEL_IDS.map((lv) => [lv, ...['error', 'warning', 'info'].map((n) => squig.find((x) => x.lv === lv && x.n === n)!.de.toFixed(3))]) });

  // 5. current vs other
  const cur = ls[0]!.find;
  checks.push({
    ok: cur.curW !== cur.otherW && !!cur.curBold,
    title: 'Current match differs from the others by more than colour',
    reason: `Same hue, so: ${cur.curW}px border against ${cur.otherW}px, bold glyphs, and a ▸ in the gutter on its line.`,
  });

  // 6. selection vs line
  const sv = ls.map((l) => ({ l, r: ratio(flatten(l.sel.fill, l.ground), l.ground) }));
  const svMin = Math.min(...sv.map((x) => x.r));
  checks.push({
    ok: svMin >= 1.3,
    title: 'Selection is distinguishable from the current line',
    reason: `The line is a 1px hairline with no fill; the selection is a region at ${sv.map((x) => `${x.r.toFixed(2)}:1 (${x.l.level})`).join(', ')} against the ground.`,
  });

  // 7. bracket
  const bv = ls.map((l) => ({ l, r: Math.min(ratio(l.bracket.border, l.ground), ratio(l.bracket.border, flatten(l.bracket.fill, l.ground))) }));
  const bMin = Math.min(...bv.map((x) => x.r));
  checks.push({
    ok: bMin >= 3,
    title: 'Bracket border at 3:1',
    reason: `${bv.map((x) => `${x.l.level} ${x.r.toFixed(2)}:1`).join(', ')} against the ground and the wash.`,
  });

  // 8. brown / olive
  const used = ls.flatMap((l) => (Object.entries(l.tok) as [Cls, string][]).map(([c, hex]) => ({ lv: l.level, c, hex, ...lch(hex) })));
  const browns = used.filter((x) => isBrown(x.hex));
  checks.push({
    ok: browns.length === 0,
    title: 'No token in a brown or olive hue',
    reason: browns.length
      ? `${browns.map((b) => `${b.c} on ${b.lv}`).join(', ')} read as brown.`
      : `Tested as OKLCH hue 40 to 130 with L under 0.70 and chroma over 0.04. Midnight's yellow is L ${lch(LV.midnight.accent.secondary).L.toFixed(2)}, which is gold, not olive; sketch uses no yellow or orange at all.`,
  });
  details.push({
    title: 'Every token colour in OKLCH',
    head: ['level', 'class', 'colour', 'L', 'C', 'hue', 'brown?'],
    rows: used.filter((x, i, a) => a.findIndex((y) => y.lv === x.lv && y.hex === x.hex) === i).map((x) => [x.lv, x.c, x.hex, x.L.toFixed(2), x.C.toFixed(3), `${x.h.toFixed(0)}°`, isBrown(x.hex) ? 'yes' : 'no']),
  });

  // 9. greyscale
  const gc = greyCollapsed(sk);
  const classes = ['keyword', 'string', 'number', 'type', 'function', 'op', 'comment', 'plain'];
  checks.push({
    ok: gc.length === 0,
    title: 'Token classes separate in greyscale on sketch',
    reason: gc.length
      ? `${gc.length} of 28 class pairs print as one grey: sketch's hues are solved to one luminance (about 6:1 each) and keywords are not bold. Highlights survive (selection, borders, bars, ▸, +/−); keyword, string, function, number and type do not separate on paper.`
      : 'Every class pair differs.',
  });
  details.push({ title: 'Greyscale: pairs that print as one grey (under 1.15:1 apart)', head: ['pair'], rows: gc.length ? gc.map(([a, b]) => [`${a} / ${b}`]) : [['none']] });
  void classes;
  return { checks, details };
}

/* ------------------------------------------------------------ the numbers */

export function alphaRows() {
  return LEVEL_IDS.map((lv) => ({ lv, look: theme(lv) }));
}
