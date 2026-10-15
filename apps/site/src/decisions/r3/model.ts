/**
 * Round 3, D10: the editor's treatment model. Site-local scaffolding.
 *
 * Every colour here is read from the package's exported level data and turned
 * into a literal at runtime (`withAlpha`, `flatten`), so no hex is typed in
 * source. An option is a `Cfg`: which role each hue-bearing channel takes and
 * which of the S, F and X treatments are switched on.
 */
import type { LevelDefinition } from '@rtkelly13/design-system';
import { flatten, withAlpha } from '../p2/colour';
import { LV, ratio } from '../p2/Frame';
import type { Level } from '../p2/Frame';

export type { Level };

type Group = 'text' | 'border' | 'surface' | 'accent' | 'intent';
export type RoleKey = `${Group}.${string}`;

export function role(d: LevelDefinition, key: RoleKey): string {
  const [g, k] = key.split('.') as [Group, string];
  const groups: Record<Group, Readonly<Record<string, string>>> = {
    text: d.text,
    border: d.border,
    surface: d.surface,
    accent: d.accent,
    intent: d.intent,
  };
  return groups[g][k]!;
}

export type Kind = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'punct' | 'plain';

export const KIND_ROWS: { k: Kind; label: string }[] = [
  { k: 'keyword', label: 'keyword' },
  { k: 'string', label: 'string' },
  { k: 'number', label: 'number' },
  { k: 'function', label: 'function' },
  { k: 'type', label: 'type' },
  { k: 'comment', label: 'comment' },
  { k: 'punct', label: 'punctuation' },
  { k: 'plain', label: 'identifier' },
];

export interface Cfg {
  /** Role the keyword takes. */
  kw: RoleKey;
  kwBold: boolean;
  /** Type underlined (D10-C) rather than bold ink (what ships). */
  typeUl: boolean;
  /** Role for punctuation and brackets. */
  punc: RoleKey;
  sel: 'cur' | 'S1' | 'S2' | 'S3';
  find: 'cur' | 'F1' | 'F2' | 'F3';
  /** Selection, find and line bands: today's one-alpha-for-both-levels, or per-level literals sized by headroom. */
  bands: 'cur' | 'X4';
  diff: 'cur' | 'X3';
}

/** What the editor sample ships today. */
export const CUR: Cfg = {
  kw: 'accent.tertiary',
  kwBold: false,
  typeUl: false,
  punc: 'text.secondary',
  sel: 'cur',
  find: 'cur',
  bands: 'cur',
  diff: 'cur',
};

/** D10-C: today's hues plus the bold-keyword, italic-comment and underlined-type channels. */
export const BASE: Cfg = { ...CUR, kwBold: true, typeUl: true };

export interface TokStyle {
  colour: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export function tokenStyle(cfg: Cfg, d: LevelDefinition, k: Kind): TokStyle {
  const s = (colour: string, x: Partial<TokStyle> = {}): TokStyle => ({ colour, bold: false, italic: false, underline: false, ...x });
  switch (k) {
    case 'keyword':
      return s(role(d, cfg.kw), { bold: cfg.kwBold });
    case 'string':
      return s(d.intent.success);
    case 'number':
      return s(d.intent.warning);
    case 'function':
      return s(d.accent.primary);
    case 'type':
      return s(d.text.primary, cfg.typeUl ? { underline: true } : { bold: true });
    case 'comment':
      return s(d.text.muted, { italic: true });
    case 'punct':
      return s(role(d, cfg.punc));
    case 'plain':
      return s(d.text.primary);
  }
}

/** A band, mark or edge one decoration draws. `fill` may be translucent; `flat` is that fill over the ground. */
export interface Look {
  fill?: string;
  flat?: string;
  /** Inset edge, drawn as a box-shadow so edges can stack. */
  edge?: { w: number; colour: string };
  /** A 2px line under the text, for underline-only match marks. */
  under?: string;
  /** Outer outline, with a gap. */
  outline?: { w: number; colour: string; gap: number };
  /** Foreground forced inside this band. */
  fg?: string;
  /** Alpha used, for the table; `null` for opaque or none. */
  alpha: number | null;
}

export interface Looks {
  ground: string;
  line: Look;
  sel: Look;
  find: Look;
  cur: Look;
  bracket: Look;
  add: Look;
  del: Look;
  /** The alphas chosen and the most each band could take at 4.5:1, for the board's table. */
  room: { band: string; used: number | null; max: number; target: number | null }[];
  /** Token colours of the option, for contrast. */
  tokens: string[];
}

const STEP = 0.01;

/** Largest alpha (0.01 steps, up to `cap`) at which every colour in `tokens` clears 4.5:1 over `colour` laid on `ground`. */
export function headroom(colour: string, ground: string, tokens: string[], cap = 1): number {
  let ok = 0;
  for (let a = 0; a <= Math.round(cap / STEP); a++) {
    const bg = flatten(withAlpha(colour, a * STEP), ground);
    if (tokens.every((t) => ratio(t, bg) >= 4.5)) ok = a * STEP;
    else break;
  }
  return Math.round(ok * 100) / 100;
}

const lit = (colour: string, alpha: number, ground: string): Look => {
  const fill = withAlpha(colour, alpha);
  return { fill, flat: flatten(fill, ground), alpha };
};

const TARGET: Record<Level, { line: number; sel: number; find: number; faint: number; strong: number }> = {
  midnight: { line: 0.08, sel: 0.25, find: 0.25, faint: 0.12, strong: 0.45 },
  sketch: { line: 0.06, sel: 0.12, find: 0.12, faint: 0.1, strong: 0.3 },
};

const LOOKS = new Map<string, Looks>();

export function looksFor(cfg: Cfg, level: Level): Looks {
  const key = `${level}|${JSON.stringify(cfg)}`;
  const hit = LOOKS.get(key);
  if (hit) return hit;
  const made = computeLooks(cfg, level);
  LOOKS.set(key, made);
  return made;
}

function computeLooks(cfg: Cfg, level: Level): Looks {
  const d = LV[level];
  const g = d.surface.sunken;
  const tokens = [
    ...new Set(KIND_ROWS.map((r) => tokenStyle(cfg, d, r.k).colour)),
  ];
  const T = TARGET[level];
  const room: Looks['room'] = [];
  const cap = (name: string, colour: string, target: number): number => {
    const max = headroom(colour, g, tokens);
    const used = Math.min(target, max);
    room.push({ band: name, used, max, target });
    return used;
  };
  const primary = d.accent.primary;
  const warn = d.intent.warning;

  // Today: one alpha per band for both levels, as the sample's Tailwind classes write them.
  let line: Look;
  let sel: Look;
  let find: Look = { ...lit(warn, 0.25, g), edge: { w: 1, colour: warn } };
  let cur: Look = { ...lit(warn, 0.5, g), edge: { w: 2, colour: warn } };
  if (cfg.bands === 'X4') {
    line = lit(d.text.primary, cap('line', d.text.primary, T.line), g);
    sel = lit(primary, cap('selection', primary, T.sel), g);
    find = { ...lit(warn, cap('find', warn, T.find), g), edge: { w: 1, colour: warn } };
    cur = { ...lit(warn, cap('current match', warn, T.strong), g), edge: { w: 2, colour: warn } };
  } else {
    line = lit(primary, 0.1, g);
    sel = lit(primary, 0.25, g);
  }

  if (cfg.sel === 'S1') {
    sel = lit(primary, cap('selection', primary, 0.3), g);
  } else if (cfg.sel === 'S2') {
    const a = Math.min(0.3, headroom(primary, g, tokens)) / 2;
    room.push({ band: 'selection (half of S1)', used: a, max: headroom(primary, g, tokens), target: null });
    sel = { ...lit(primary, a, g), edge: { w: 1, colour: d.border.strong } };
  } else if (cfg.sel === 'S3') {
    sel = { fill: primary, flat: primary, fg: d.text.inverse, alpha: null };
  }

  if (cfg.find === 'F1') {
    find = { under: warn, alpha: null };
    cur = lit(warn, cap('current match', warn, T.strong), g);
  } else if (cfg.find === 'F2') {
    find = lit(warn, cap('other matches', warn, T.faint), g);
    cur = {
      fill: warn,
      flat: warn,
      fg: d.text.inverse,
      outline: { w: 2, colour: d.border.strong, gap: 1 },
      alpha: null,
    };
  } else if (cfg.find === 'F3') {
    find = { edge: { w: 1, colour: warn }, alpha: null };
    cur = { ...lit(warn, cap('current match', warn, T.strong), g), edge: { w: 1, colour: warn } };
  }

  const bracket: Look = { ...lit(d.text.primary, 0.15, g), edge: { w: 1, colour: d.border.strong } };
  const addRole = cfg.diff === 'X3' ? d.intent.info : d.intent.success;
  const delRole = cfg.diff === 'X3' ? d.intent.warning : d.intent.danger;
  return {
    ground: g,
    line,
    sel,
    find,
    cur,
    bracket,
    add: lit(addRole, 0.15, g),
    del: lit(delRole, 0.15, g),
    room,
    tokens,
  };
}

/** A band over the ground, then another over that: the colour the eye gets where two decorations overlap. */
export function stack(top: Look, under: Look, ground: string): string {
  const base = under.flat ?? ground;
  if (!top.fill) return base;
  return flatten(top.fill, base);
}

export type BandId = 'ground' | 'line' | 'sel' | 'find' | 'cur' | 'findSel' | 'curSel' | 'bracket' | 'add' | 'del';

export const BAND_LABEL: Record<BandId, string> = {
  ground: 'ground',
  line: 'line',
  sel: 'select',
  find: 'find',
  cur: 'current',
  findSel: 'find in sel',
  curSel: 'cur in sel',
  bracket: 'bracket',
  add: 'added',
  del: 'removed',
};

export interface BandCell {
  id: BandId;
  bg: string;
  /** Foreground override in this band, if the option sets one. */
  fg?: string;
}

/** Every band an option draws, as the flat colour behind the text and any forced foreground. */
export function bandCells(l: Looks): BandCell[] {
  return [
    { id: 'ground', bg: l.ground },
    { id: 'line', bg: l.line.flat ?? l.ground },
    { id: 'sel', bg: l.sel.flat ?? l.ground, fg: l.sel.fg },
    { id: 'find', bg: l.find.flat ?? l.ground },
    { id: 'cur', bg: l.cur.flat ?? l.ground, fg: l.cur.fg },
    { id: 'findSel', bg: stack(l.find, l.sel, l.ground), fg: l.find.fg ?? l.sel.fg },
    { id: 'curSel', bg: stack(l.cur, l.sel, l.ground), fg: l.cur.fg ?? l.sel.fg },
    { id: 'bracket', bg: l.bracket.flat ?? l.ground },
    { id: 'add', bg: l.add.flat ?? l.ground },
    { id: 'del', bg: l.del.flat ?? l.ground },
  ];
}

/** Contrast of every token over every band, and the summary numbers. */
export function gridFor(cfg: Cfg, level: Level) {
  const d = LV[level];
  const l = looksFor(cfg, level);
  const cells = bandCells(l);
  const rows = KIND_ROWS.map(({ k, label }) => {
    const colour = tokenStyle(cfg, d, k).colour;
    return { k, label, values: cells.map((c) => ratio(c.fg ?? colour, c.bg)) };
  });
  let failing = 0;
  let total = 0;
  let worst = Infinity;
  let worstLabel = '';
  for (const r of rows) {
    r.values.forEach((v, i) => {
      total++;
      if (v < 4.5) failing++;
      if (v < worst) {
        worst = v;
        worstLabel = `${r.label} on ${BAND_LABEL[cells[i]!.id]}`;
      }
    });
  }
  return { looks: l, cells, rows, failing, total, worst, worstLabel };
}

/** Pairs of token kinds that a greyscale render cannot tell apart: similar luminance and the same weight, slant and underline. */
export function greyAlike(cfg: Cfg, level: Level): string[] {
  const d = LV[level];
  const kinds = KIND_ROWS.map((r) => ({ ...r, s: tokenStyle(cfg, d, r.k) }));
  const out: string[] = [];
  for (let i = 0; i < kinds.length; i++) {
    for (let j = i + 1; j < kinds.length; j++) {
      const a = kinds[i]!;
      const b = kinds[j]!;
      const same = a.s.bold === b.s.bold && a.s.italic === b.s.italic && a.s.underline === b.s.underline;
      if (same && ratio(a.s.colour, b.s.colour) < 1.25) out.push(`${a.label}/${b.label}`);
    }
  }
  return out;
}
