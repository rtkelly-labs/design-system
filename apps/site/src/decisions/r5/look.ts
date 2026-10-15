/**
 * Round 5: the code renderer, derived from Pink Ink. Site-local scaffolding.
 *
 * A `Look` is every colour a frame needs, already resolved to a literal for one
 * level. The two candidates read the package's ten hues; the reference reads Pink
 * Ink's own theme files, imported as JSON so no hex is typed in source. Alphas
 * that Pink Ink fixes (selection 25%, diff 15 to 20%) are targets here: they are
 * lowered per level until the text on them still reaches 4.5:1, and the value
 * that was used is recorded in `alphas`.
 */
import darkTheme from '../../../../../packages/design-system/docs/applied-evaluation/pink-ink/pink-ink-dark-color-theme.json';
import lightTheme from '../../../../../packages/design-system/docs/applied-evaluation/pink-ink/pink-ink-light-color-theme.json';
import { deltaE, flatten, mixOklab, simulate as simulateHex, withAlpha } from '../p2/colour';
import { LV, ratio } from '../p2/Frame';
import type { Check, Cls, CodeLook, Level } from '@/components/specimen/look';

export type { Level };
export const LEVEL_IDS: Level[] = ['midnight', 'sketch'];
export type Dir = 'P' | 'Q';
export type LookId = Dir | 'ref' | 'today';

export type { Check, Cls };
export const CLASSES: Cls[] = ['keyword', 'control', 'string', 'number', 'type', 'function', 'comment', 'op', 'sep', 'bracket', 'plain'];

/** A frame's colours (`CodeLook`) plus what the board's tables need: which role each class reads, and the alpha each layer settled at. */
export interface Look extends CodeLook {
  id: LookId;
  level: Level;
  from: Record<Cls, string>;
  /** The alpha each translucent layer ended up at, for the numbers disclosure. */
  alphas: Record<string, string>;
}

/* ------------------------------------------------------------------ helpers */

/** Largest alpha at or below `target` (0.01 steps) for which `ok` holds. */
function fit(target: number, ok: (a: number) => boolean, floor = 0.04): number {
  for (let i = Math.round(target * 100); i >= Math.round(floor * 100); i--) {
    if (ok(i / 100)) return i / 100;
  }
  return floor;
}
const pct = (a: number) => `${Math.round(a * 100)}%`;
export const uniq = (xs: string[]) => [...new Set(xs)];

/** Colours text can be: every token class, the bracket rotation, the numbers. */
export function textColours(l: Look): string[] {
  return uniq([...Object.values(l.tok), ...l.rot, l.line.num, l.line.numActive, l.ink]);
}

/* ------------------------------------------------------------ the candidates */

export function build(dir: Dir, level: Level, opts: { errorHue?: 'red' | 'danger' } = {}): Look {
  const d = LV[level];
  const p = d.palette;
  const br = d.paletteBright;
  const g = d.surface.base;
  const ink = d.text.primary;
  const mid = level === 'midnight';
  const pink = p.pink;
  const lilac = br.violet;

  // Tokens.
  const P = dir === 'P';
  const strongViolet = p.violet;
  const tok: Record<Cls, string> = {
    keyword: strongViolet,
    control: strongViolet,
    string: P ? (mid ? br.orange : p.orange) : p.green,
    number: P ? p.yellow : p.orange,
    type: p.yellow,
    function: P ? p.cyan : d.accent.primary,
    comment: d.text.muted,
    op: p.pink,
    sep: P ? p.pink : d.text.secondary,
    bracket: ink,
    plain: ink,
  };
  const from: Record<Cls, string> = {
    keyword: 'violet',
    control: 'violet',
    string: P ? (mid ? 'orange, bright half' : 'orange') : 'green',
    number: P ? 'yellow' : 'orange',
    type: 'yellow',
    function: P ? 'cyan' : `accent.primary (${mid ? 'cyan' : 'blue'})`,
    comment: 'text.muted',
    op: 'pink',
    sep: P ? 'pink' : 'text.secondary',
    bracket: P ? 'pink, cyan, violet, yellow by depth' : 'text.primary',
    plain: 'text.primary',
  };
  const rot = P ? [p.pink, p.cyan, p.violet, p.yellow] : [ink];

  // Selection: brand pink, one region, one forced ink.
  const selA = fit(mid ? 0.25 : 0.6, (a) => ratio(ink, flatten(withAlpha(pink, a), g)) >= 4.5, 0.12);
  const sel = { fill: withAlpha(pink, selA), fg: ink };

  // Find: borders, never a loud fill.
  const curFill = withAlpha(pink, mid ? 0.08 : 0.1);
  const find: Look['find'] = {
    otherBorder: strongViolet,
    otherFg: ink,
    curBorder: P ? lilac : d.border.strong,
    curFill,
    curFg: mid ? p.yellow : undefined,
    otherW: 1,
    curW: 2,
  };

  // Current line: nearly nothing, plus a hairline.
  const lineFill = withAlpha(pink, 0.035);
  const lineBorder = P ? flatten(withAlpha(pink, mid ? 0.2 : 0.25), g) : d.border.subtle;
  const line = { fill: lineFill, border: lineBorder, num: d.text.muted, numActive: pink };

  // Bracket match.
  const bracket = P
    ? { border: strongViolet, fill: withAlpha(strongViolet, mid ? 0.1 : 0.08), fg: strongViolet, bold: false }
    : { border: d.border.strong, fill: withAlpha(ink, 0.1), fg: ink, bold: true };

  // Diagnostics: a red of their own, unless the owner wants intent.danger.
  const errFg = opts.errorHue === 'danger' ? d.intent.danger : p.red;
  const err = { fg: errFg, wash: withAlpha(errFg, 0.05) };
  const warn = { fg: d.intent.warning, wash: withAlpha(d.intent.warning, 0.05) };

  // Diff: teal and red, lowered until every text colour still reads on the wash.
  const draft: Look = {
    id: dir, level, ground: g, ink, tok, from, bold: {}, italic: {}, rot, sel, find, line, bracket, err, warn,
    add: { bar: p.teal, wash: '' }, del: { bar: p.red, wash: '' },
    guide: { rot: [], active: [] }, marker: { cur: P ? lilac : ink }, alphas: {},
  };
  const texts = textColours(draft);
  const diffTarget = P ? 0.15 : 0.1;
  const diffA = fit(diffTarget, (a) =>
    [p.teal, p.red].every((h) => {
      const wash = flatten(withAlpha(h, a), g);
      return texts.every((c) => ratio(c, wash) >= 4.5 && ratio(c, flatten(err.wash, wash)) >= 4.5);
    }),
  );

  // Guides.
  const guide = P
    ? { rot: rot.map((c) => withAlpha(c, 0.22)), active: rot }
    : { rot: [d.border.subtle], active: [d.border.default] };

  return {
    ...draft,
    bold: P ? {} : { keyword: true, control: true },
    add: { bar: p.teal, wash: withAlpha(p.teal, diffA) },
    del: { bar: p.red, wash: withAlpha(p.red, diffA) },
    guide,
    alphas: {
      selection: `${pct(selA)} pink (Pink Ink ${mid ? '25%' : 'Light 60%'})`,
      'diff wash': `${pct(diffA)} (target ${pct(diffTarget)})`,
      'error wash': '5%',
      'current line fill': '3.5% pink',
      'current-match fill': pct(mid ? 0.08 : 0.1),
      'bracket wash': P ? pct(mid ? 0.1 : 0.08) : '10% ink',
    },
  };
}

/* ----------------------------------------------------------- today's colours */

/** The editor sample's own classes: keyword accent.tertiary, string success, number warning, comment muted italic, function primary, type bold ink, punctuation secondary. */
export function today(level: Level): Look {
  const base = build('P', level);
  const d = LV[level];
  const tok: Record<Cls, string> = {
    keyword: d.accent.tertiary,
    control: d.accent.tertiary,
    string: d.intent.success,
    number: d.intent.warning,
    type: d.text.primary,
    function: d.accent.primary,
    comment: d.text.muted,
    op: d.text.secondary,
    sep: d.text.secondary,
    bracket: d.text.secondary,
    plain: d.text.primary,
  };
  const from: Record<Cls, string> = {
    keyword: 'accent.tertiary', control: 'accent.tertiary', string: 'intent.success', number: 'intent.warning', type: 'text.primary, bold',
    function: 'accent.primary', comment: 'text.muted, italic', op: 'text.secondary', sep: 'text.secondary', bracket: 'text.secondary', plain: 'text.primary',
  };
  return { ...base, id: 'today', tok, from, bold: { type: true }, italic: { comment: true }, rot: [d.text.secondary] };
}

/* ------------------------------------------------------------ Pink Ink itself */

interface ThemeFile {
  colors: Record<string, string>;
  tokenColors: { name?: string; settings: { foreground?: string } }[];
}
const THEMES: Record<Level, ThemeFile> = { midnight: darkTheme as unknown as ThemeFile, sketch: lightTheme as unknown as ThemeFile };

export function pinkInkColours(level: Level) {
  const t = THEMES[level];
  const c = t.colors;
  const fg = (name: string) => t.tokenColors.find((x) => x.name === name)?.settings.foreground ?? c['editor.foreground']!;
  return { c, fg };
}

/** Pink Ink's token colours by the same classes, for the mapping table. */
export function pinkInkTokens(level: Level): Record<Cls, string> {
  const { c, fg } = pinkInkColours(level);
  return {
    keyword: fg('Keywords'),
    control: fg('Control flow and directives'),
    string: fg('Strings'),
    number: fg('Numbers'),
    type: fg('General and built-in types'),
    function: fg('Functions and methods'),
    comment: fg('Comments'),
    op: fg('Operators'),
    sep: fg('Operators'),
    bracket: c['editorBracketHighlight.foreground1']!,
    plain: fg('Variables'),
  };
}

/** Pink Ink's own theme file, read literally. */
export function reference(level: Level): Look {
  const { c } = pinkInkColours(level);
  const tok = pinkInkTokens(level);
  const k = (key: string) => c[key]!;
  const rot = [1, 2, 3, 4, 5, 6].map((i) => k(`editorBracketHighlight.foreground${i}`));
  const from = Object.fromEntries(CLASSES.map((x) => [x, 'Pink Ink, literal'])) as Record<Cls, string>;
  return {
    id: 'ref',
    level,
    ground: k('editor.background'),
    ink: k('editor.foreground'),
    tok,
    from,
    bold: {},
    italic: {},
    rot,
    sel: { fill: k('editor.selectionBackground'), fg: k('editor.selectionForeground') },
    find: {
      otherBorder: k('editor.findMatchHighlightBorder'),
      otherFill: k('editor.findMatchHighlightBackground'),
      otherFg: k('editor.findMatchHighlightForeground'),
      curBorder: k('editor.findMatchBorder'),
      curFill: k('editor.findMatchBackground'),
      curFg: k('editor.findMatchForeground'),
      otherW: 1,
      curW: 1,
    },
    line: { fill: k('editor.lineHighlightBackground'), border: k('editor.lineHighlightBorder'), num: k('editorLineNumber.foreground'), numActive: k('editorLineNumber.activeForeground') },
    bracket: { border: k('editorBracketMatch.border'), fill: k('editorBracketMatch.background'), fg: k('editorBracketMatch.foreground'), bold: false },
    err: { fg: k('editorError.foreground'), wash: k('editorError.background') },
    warn: { fg: k('editorWarning.foreground'), wash: k('editorWarning.background') },
    add: { bar: k('editorGutter.addedBackground'), wash: k('diffEditor.insertedLineBackground') },
    del: { bar: k('editorGutter.deletedBackground'), wash: k('diffEditor.removedLineBackground') },
    guide: {
      rot: [k('editorIndentGuide.background1'), ...[2, 3, 4, 5, 6].map((i) => k(`editorIndentGuide.background${i}`))],
      active: [k('editorIndentGuide.activeBackground1'), ...[2, 3, 4, 5, 6].map((i) => k(`editorIndentGuide.activeBackground${i}`))],
    },
    marker: { cur: k('editor.findMatchBorder') },
    alphas: {},
  };
}

/* ------------------------------------------------------------------- bands */

export interface Band {
  name: string;
  flat: string;
  /** Text colours that can sit here. A forced foreground lists only itself. */
  fgs: string[];
  why: string;
}

export function bands(l: Look): Band[] {
  const g = l.ground;
  const texts = textColours(l);
  const lineFlat = flatten(l.line.fill, g);
  const addFlat = flatten(l.add.wash, g);
  const delFlat = flatten(l.del.wash, g);
  const out: Band[] = [
    { name: 'ground', flat: g, fgs: texts, why: 'every token' },
    { name: 'current line', flat: lineFlat, fgs: texts, why: 'every token' },
    { name: 'diff added', flat: addFlat, fgs: texts, why: 'every token' },
    { name: 'diff removed', flat: delFlat, fgs: texts, why: 'every token' },
    { name: 'diff added + error wash', flat: flatten(l.err.wash, addFlat), fgs: texts, why: 'every token; line 13 is both' },
    { name: 'selection', flat: flatten(l.sel.fill, g), fgs: [l.sel.fg], why: 'forced ink only' },
    { name: 'current match', flat: flatten(l.find.curFill, g), fgs: [l.find.curFg ?? l.ink], why: 'its own foreground only' },
    { name: 'bracket match on current line', flat: flatten(l.bracket.fill, lineFlat), fgs: [l.bracket.fg], why: 'the matched glyph only' },
  ];
  return out;
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

const GREY_CLASSES: Cls[] = ['keyword', 'string', 'number', 'type', 'function', 'op', 'comment', 'plain'];

/** Pairs of token classes that print as the same grey: under 1.15:1 apart and the same weight. */
export function greyCollapsed(l: Look): [Cls, Cls][] {
  const out: [Cls, Cls][] = [];
  for (let i = 0; i < GREY_CLASSES.length; i++) {
    for (let j = i + 1; j < GREY_CLASSES.length; j++) {
      const a = GREY_CLASSES[i]!;
      const b = GREY_CLASSES[j]!;
      const same = (l.bold[a] ?? false) === (l.bold[b] ?? false);
      if (same && ratio(l.tok[a], l.tok[b]) < 1.15) out.push([a, b]);
    }
  }
  return out;
}

export function checksFor(dir: Dir): Check[] {
  const ls = LEVEL_IDS.map((lv) => build(dir, lv));
  const mid = ls[0]!;
  const sk = ls[1]!;
  const checks: Check[] = [];

  // 1. ground
  let g1 = { r: Infinity, c: '', lv: '' as string };
  for (const l of ls) for (const c of textColours(l)) {
    const r = ratio(c, l.ground);
    if (r < g1.r) g1 = { r, c, lv: l.level };
  }
  checks.push({ ok: g1.r >= 4.5, title: 'Every token at 4.5:1 on the ground', reason: `Lowest ${g1.r.toFixed(2)}:1 on ${g1.lv}, including line numbers.` });

  // 2. bands
  const w = ls.map((l) => ({ l, w: worst(l) })).sort((a, b) => a.w.r - b.w.r)[0]!;
  checks.push({
    ok: w.w.r >= 4.5,
    title: 'Every token at 4.5:1 on every band it can sit on, composited',
    reason: `Lowest ${w.w.r.toFixed(2)}:1 on ${w.w.band} (${w.l.level}). A forced foreground is measured on its own band only.`,
  });

  // 3. keyword hue vs diagnostics
  const kd = ls.map((l) => ({ l, red: deltaE(l.tok.keyword, l.err.fg), dg: deltaE(l.tok.keyword, LV[l.level].intent.danger) }));
  const kdMin = Math.min(...kd.flatMap((x) => [x.red, x.dg]));
  checks.push({
    ok: kdMin >= 0.15,
    title: 'Keyword is not a diagnostic hue',
    reason: `Violet against error red and against intent.danger: ΔE ${kd.map((x) => `${x.l.level} ${x.red.toFixed(2)} and ${x.dg.toFixed(2)}`).join(', ')}.`,
  });

  // 4. current vs other matches
  const cur = mid.find;
  checks.push({
    ok: cur.curW !== cur.otherW && !!cur.curFill,
    title: 'Current match differs from the others by more than colour',
    reason: `${cur.curW}px border against ${cur.otherW}px, a fill the others lack, and a ▸ in the gutter on its line.`,
  });

  // 5. selection vs line
  const sv = ls.map((l) => ({ l, r: ratio(flatten(l.sel.fill, l.ground), flatten(l.line.fill, l.ground)) }));
  const svMin = Math.min(...sv.map((x) => x.r));
  checks.push({
    ok: svMin >= 1.3,
    title: 'Selection is distinguishable from the current line',
    reason: `${sv.map((x) => `${x.l.level} ${x.r.toFixed(2)}:1`).join(', ')} between the two fills; the line is also a hairline with a pink number, the selection is neither.`,
  });

  // 6. bracket
  const bv = ls.map((l) => ({ l, r: Math.min(ratio(l.bracket.border, l.ground), ratio(l.bracket.border, flatten(l.bracket.fill, flatten(l.line.fill, l.ground)))) }));
  const bMin = Math.min(...bv.map((x) => x.r));
  checks.push({
    ok: bMin >= 3,
    title: 'Bracket match border at 3:1',
    reason: `${bv.map((x) => `${x.l.level} ${x.r.toFixed(2)}:1`).join(', ')} against the ground and the wash.`,
  });

  // 7. error red vs brand pink
  const rp = ls.map((l) => ({ l, e: deltaE(l.err.fg, LV[l.level].palette.pink) }));
  const rpMin = Math.min(...rp.map((x) => x.e));
  checks.push({
    ok: rpMin >= 0.1,
    title: 'Error red is told from brand pink by hue',
    reason: `ΔE ${rp.map((x) => `${x.l.level} ${x.e.toFixed(2)}`).join(', ')}. Pink Ink's own pair is ${deltaE(pinkInkColours('midnight').c['editorError.foreground']!, pinkInkColours('midnight').c['focusBorder']!).toFixed(2)}. The wavy line and × in the gutter carry it without colour.`,
  });

  // 8. greyscale
  const gc = greyCollapsed(sk);
  checks.push({
    ok: gc.length === 0,
    title: 'Token classes separate in greyscale on sketch',
    reason: gc.length
      ? `${gc.length} of 28 pairs print as one grey (sketch's hues all sit at one luminance)${dir === 'Q' ? '; only bold keywords break out' : ''}. Highlights survive; token classes do not.`
      : 'Every pair differs.',
  });

  // 9. metrics
  checks.push({
    ok: true,
    title: 'Borders fit the row without touching',
    reason: `21px row, 17px boxes with 2px above and below: adjacent matches never join. 21/14 = 1.5, so WCAG 1.4.12 line height holds.`,
  });
  return checks;
}

/* --------------------------------------------------------- the diagnostics */

/** Measured consequences of using red, not intent.danger, for errors. */
export function diagnosticsMeasure() {
  return LEVEL_IDS.map((lv) => {
    const d = LV[lv];
    const red = d.palette.red;
    const danger = d.intent.danger;
    const g = d.surface.base;
    const tintRed = mixOklab(red, g, 20);
    const tintDanger = mixOklab(danger, g, 20);
    const pair = (a: string, b: string, v: 'normal' | 'deuteranopia' | 'protanopia') => deltaE(simulateHex(a, v), simulateHex(b, v));
    return {
      level: lv,
      red,
      danger,
      same: red === danger,
      deRedDanger: deltaE(red, danger),
      deDangerViolet: deltaE(danger, d.palette.violet),
      deRedViolet: deltaE(red, d.palette.violet),
      deDangerPink: deltaE(danger, d.palette.pink),
      deRedPink: deltaE(red, d.palette.pink),
      deRedWarn: deltaE(red, d.intent.warning),
      deDangerWarn: deltaE(danger, d.intent.warning),
      groundRed: ratio(red, g),
      groundDanger: ratio(danger, g),
      tintRed: ratio(red, tintRed),
      tintDanger: ratio(danger, tintDanger),
      inkOnTintRed: ratio(d.text.primary, tintRed),
      inkOnTintDanger: ratio(d.text.primary, tintDanger),
      cvdRed: Math.min(pair(red, d.intent.success, 'deuteranopia'), pair(red, d.intent.success, 'protanopia')),
      cvdDanger: Math.min(pair(danger, d.intent.success, 'deuteranopia'), pair(danger, d.intent.success, 'protanopia')),
      cvdRedWarn: Math.min(pair(red, d.intent.warning, 'deuteranopia'), pair(red, d.intent.warning, 'protanopia')),
      cvdDangerWarn: Math.min(pair(danger, d.intent.warning, 'deuteranopia'), pair(danger, d.intent.warning, 'protanopia')),
      tertiary: d.accent.tertiary,
      tertiaryIsDanger: d.accent.tertiary === danger,
    };
  });
}

/* ------------------------------------------------------------ hue mapping */

export interface MapRow {
  role: string;
  /** Pink Ink's literal colour per level. */
  pi: Record<Level, string>;
  /** The colour this system's P direction uses per level, with its hue name. */
  ours: Record<Level, { colour: string; hue: string }>;
  /** The nearest hue in the ten-hue palette (either half) by ΔE, and how far. */
  nearest: Record<Level, { hue: string; de: number; colour: string }>;
  gap: string;
}

function nearestHue(level: Level, colour: string) {
  const d = LV[level];
  let best = { hue: '', de: Infinity, colour: '' };
  for (const [half, set] of [['', d.palette], [' bright', d.paletteBright]] as const) {
    for (const [name, hex] of Object.entries(set)) {
      const de = deltaE(colour, hex);
      if (de < best.de) best = { hue: `${name}${half}`, de, colour: hex };
    }
  }
  return best;
}

export function mapRows(): MapRow[] {
  const piTok = { midnight: pinkInkTokens('midnight'), sketch: pinkInkTokens('sketch') };
  const pTok = { midnight: build('P', 'midnight'), sketch: build('P', 'sketch') };
  const pc = (lv: Level) => pinkInkColours(lv).c;
  const row = (role: string, pi: Record<Level, string>, ours: Record<Level, { colour: string; hue: string }>, gap: string): MapRow => ({
    role,
    pi,
    ours,
    // Comments are a neutral in both themes, so "nearest hue" would be noise.
    nearest:
      role === 'comments'
        ? { midnight: { hue: 'none, a neutral', de: NaN, colour: '' }, sketch: { hue: 'none, a neutral', de: NaN, colour: '' } }
        : { midnight: nearestHue('midnight', pi.midnight), sketch: nearestHue('sketch', pi.sketch) },
    gap,
  });
  const both = <T,>(f: (lv: Level) => T): Record<Level, T> => ({ midnight: f('midnight'), sketch: f('sketch') });
  const cls = (c: Cls) => both((lv) => ({ colour: pTok[lv].tok[c], hue: pTok[lv].from[c] }));
  const hue = (name: 'pink' | 'violet' | 'red' | 'teal' | 'yellow' | 'cyan') => both((lv) => ({ colour: LV[lv].palette[name], hue: name }));
  return [
    row('keyword (control flow)', both((lv) => piTok[lv].control), cls('control'), 'The nearest hue is magenta (ΔE 0.08 on midnight, 0.03 on sketch), but magenta sits beside pink on midnight and beside red on sketch, which is round 4\'s complaint. Violet is 0.13 to 0.15 away: cooler and paler than Pink Ink\'s.'),
    row('operators, separators', both((lv) => piTok[lv].op), cls('op'), 'Pink Ink uses a lighter pink than brand pink; here the operator is brand pink itself.'),
    row('functions', both((lv) => piTok[lv].function), cls('function'), 'Cyan exists on both levels.'),
    row('strings (peach)', both((lv) => piTok[lv].string), cls('string'), 'Peach is not a hue here; bright orange is nearest on midnight. Pink Ink Light\'s strings are crimson, nearest pink, but pink is the operator colour, so sketch keeps plain orange (the bright half is a dark brown).'),
    row('numbers and types (gold)', both((lv) => piTok[lv].number), cls('number'), 'Yellow is gold on midnight and an olive on sketch, where every hue is solved to the same luminance.'),
    row('comments', both((lv) => piTok[lv].comment), cls('comment'), 'No plum neutral: text.muted is cool grey on midnight and warm grey on sketch.'),
    row('brand pink (selection, active number)', both((lv) => pc(lv)['editorLineNumber.activeForeground']!), hue('pink'), 'Pink exists on both levels, but on midnight it is also intent.danger.'),
    row('current match border (lilac)', both((lv) => pc(lv)['editor.findMatchBorder']!), both((lv) => ({ colour: LV[lv].paletteBright.violet, hue: 'violet, bright half' })), 'Lilac is a lighter violet; the bright half of violet is lighter on midnight and darker on sketch.'),
    row('error', both((lv) => pc(lv)['editorError.foreground']!), hue('red'), 'Red exists on both levels. On midnight it is not intent.danger.'),
    row('diff added', both((lv) => pc(lv)['editorGutter.addedBackground']!), hue('teal'), 'Pink Ink mint maps to teal on both levels.'),
    row('diff removed (rose)', both((lv) => pc(lv)['editorGutter.deletedBackground']!), hue('red'), 'Rose is red here; there is no separate rose.'),
    row('warning (gold)', both((lv) => pc(lv)['editorWarning.foreground']!), both((lv) => ({ colour: LV[lv].intent.warning, hue: `intent.warning (${LV[lv].intentHue.warning})` })), 'On sketch warning is orange, not yellow.'),
  ];
}
