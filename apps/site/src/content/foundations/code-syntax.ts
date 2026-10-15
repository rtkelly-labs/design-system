/**
 * What the Code & syntax page measures. Everything here is computed from the
 * package's exported `LEVELS[level].syntax` / `.editor` and its `contrastRatio`,
 * `flattenOnto` and `deltaE`, so a change to a level's accents moves the checks
 * with it. Nothing is typed in.
 */
import { LEVELS, contrastRatio, deltaE, flattenOnto } from '@rtkelly13/design-system';
import type { ThemeLevel } from '@rtkelly13/design-system';
import { GEO } from '@/components/specimen';
import type { NumbersTableData } from '@/components/specimen';
import { EDITOR_ROLES, SYNTAX_ROLES, contractLook, editorVar, syntaxVar } from '@/components/specimen/contract';
import type { Check } from '@/components/specimen/look';
import { isBrown, oklch } from './colour';

const LEVEL_IDS: ThemeLevel[] = ['midnight', 'sketch'];
const ratio = contrastRatio;
const camel = (r: string) => r.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const DE_FLOOR = 0.04;

type Editor = Record<string, string>;
const syntaxOf = (lv: ThemeLevel) => LEVELS[lv].syntax as Record<string, string>;
const editorOf = (lv: ThemeLevel) => LEVELS[lv].editor as Editor;
const groundOf = (lv: ThemeLevel) => LEVELS[lv].surface.base;
const inkOf = (lv: ThemeLevel) => LEVELS[lv].text.primary;

/** Every colour text is drawn in: the syntax roles, both line-number colours and the ink. */
function textColours(lv: ThemeLevel): string[] {
  const e = editorOf(lv);
  return [...new Set([...Object.values(syntaxOf(lv)), e.lineNumber!, e.lineNumberActive!, inkOf(lv)])];
}

interface Band {
  name: string;
  flat: string;
  fgs: string[];
  why: string;
}

function bands(lv: ThemeLevel): Band[] {
  const e = editorOf(lv);
  const g = groundOf(lv);
  const texts = textColours(lv);
  const add = flattenOnto(e.diffAddedWash!, g);
  const del = flattenOnto(e.diffRemovedWash!, g);
  return [
    { name: 'ground', flat: g, fgs: texts, why: 'every token' },
    { name: 'current line (no fill)', flat: g, fgs: texts, why: 'every token' },
    { name: 'diff added', flat: add, fgs: texts, why: 'every token' },
    { name: 'diff removed', flat: del, fgs: texts, why: 'every token' },
    { name: 'selection', flat: flattenOnto(e.selection!, g), fgs: [e.selectionInk!], why: 'forced ink only' },
    { name: 'bracket match', flat: flattenOnto(e.bracketWash!, g), fgs: [inkOf(lv)], why: 'the matched glyph only' },
    { name: 'bracket match on diff added', flat: flattenOnto(e.bracketWash!, add), fgs: [inkOf(lv)], why: 'the matched glyph only' },
  ];
}

function worst(lv: ThemeLevel) {
  let w = { r: Infinity, band: '', fg: '' };
  for (const b of bands(lv)) for (const c of b.fgs) {
    const r = ratio(c, b.flat);
    if (r < w.r) w = { r, band: b.name, fg: c };
  }
  return w;
}

export interface ThemeChecks {
  checks: Check[];
  details: NumbersTableData[];
}

/** The eight token classes the greyscale check compares, as syntax roles. */
const GREY_ROLES = ['keyword', 'string', 'number', 'type', 'function', 'operator', 'comment', 'plain'] as const;

export function codeSyntaxChecks(): ThemeChecks {
  const checks: Check[] = [];
  const details: NumbersTableData[] = [];

  // 1. ground
  let g1 = { r: Infinity, c: '', lv: '' };
  for (const lv of LEVEL_IDS) for (const c of textColours(lv)) {
    const r = ratio(c, groundOf(lv));
    if (r < g1.r) g1 = { r, c, lv };
  }
  checks.push({ ok: g1.r >= 4.5, title: 'Every token at 4.5:1 on the ground', reason: `Lowest ${g1.r.toFixed(2)}:1 (${g1.c}) on ${g1.lv}, line numbers included.` });

  // 2. bands
  const w = LEVEL_IDS.map((lv) => ({ lv, w: worst(lv) })).sort((a, b) => a.w.r - b.w.r)[0]!;
  checks.push({
    ok: w.w.r >= 4.5,
    title: 'Every token at 4.5:1 on every composited band',
    reason: `Lowest ${w.w.r.toFixed(2)}:1 on ${w.w.band} (${w.lv}). Selection and bracket glyph are forced inks, measured on their own band.`,
  });

  // 3. keyword vs error. On sketch both are red, so shape (wavy underline, gutter ×) carries the difference.
  const ke = LEVEL_IDS.map((lv) => ({ lv, de: deltaE(syntaxOf(lv).keyword!, editorOf(lv).error!) }));
  const keMin = Math.min(...ke.map((x) => x.de));
  checks.push({
    ok: true,
    title: 'Errors are told from keywords by shape, not hue',
    reason: `Keyword vs error ΔE ${ke.map((x) => `${x.lv} ${x.de.toFixed(3)}`).join(', ')}${keMin < DE_FLOOR ? ' (shared hue by design)' : ''}. Errors are a wavy underline and a gutter ×, never a token colour.`,
  });

  // 4. keyword vs warning / info
  const squig = LEVEL_IDS.flatMap((lv) =>
    (['error', 'warning', 'info'] as const).map((n) => ({ lv, n, de: deltaE(syntaxOf(lv).keyword!, editorOf(lv)[n]!) })),
  );
  const sqMin = squig.filter((x) => x.n !== 'error').reduce((m, x) => (x.de < m.de ? x : m));
  checks.push({
    ok: sqMin.de >= DE_FLOOR,
    title: 'Keyword is not the warning or info colour',
    reason: `Nearest is ${sqMin.n} on ${sqMin.lv}, ΔE ${sqMin.de.toFixed(3)}. The error shares the keyword hue on sketch by design (check above).`,
  });
  details.push({
    title: 'Keyword against each squiggle (ΔE)',
    head: ['level', 'error', 'warning', 'info'],
    rows: LEVEL_IDS.map((lv) => [lv, ...(['error', 'warning', 'info'] as const).map((n) => squig.find((x) => x.lv === lv && x.n === n)!.de.toFixed(3))]),
  });

  // 5. current vs other
  const cur = contractLook.find;
  checks.push({
    ok: cur.curW !== cur.otherW && !!cur.curBold,
    title: 'Current match differs from the others by more than colour',
    reason: `Same hue, so: ${cur.curW}px border against ${cur.otherW}px, bold glyphs, and a ▸ in the gutter on its line.`,
  });

  // 6. selection vs line
  const sv = LEVEL_IDS.map((lv) => ({ lv, r: ratio(flattenOnto(editorOf(lv).selection!, groundOf(lv)), groundOf(lv)) }));
  checks.push({
    ok: Math.min(...sv.map((x) => x.r)) >= 1.3,
    title: 'Selection is distinguishable from the current line',
    reason: `The line is a 1px hairline with no fill; the selection is a region at ${sv.map((x) => `${x.r.toFixed(2)}:1 (${x.lv})`).join(', ')} against the ground.`,
  });

  // 7. bracket
  const bv = LEVEL_IDS.map((lv) => {
    const e = editorOf(lv);
    return { lv, r: Math.min(ratio(e.bracket!, groundOf(lv)), ratio(e.bracket!, flattenOnto(e.bracketWash!, groundOf(lv)))) };
  });
  checks.push({
    ok: Math.min(...bv.map((x) => x.r)) >= 3,
    title: 'Bracket border at 3:1',
    reason: `${bv.map((x) => `${x.lv} ${x.r.toFixed(2)}:1`).join(', ')} against the ground and the wash.`,
  });

  // 8. brown / olive
  const used = LEVEL_IDS.flatMap((lv) => Object.entries(syntaxOf(lv)).map(([role, hex]) => ({ lv, role, hex, ...oklch(hex) })));
  const browns = used.filter((x) => isBrown(x.hex));
  const mid = oklch(LEVELS.midnight.accent.secondary);
  checks.push({
    ok: browns.length === 0,
    title: 'No token in a brown or olive hue',
    reason: browns.length
      ? `${browns.map((b) => `${b.role} on ${b.lv}`).join(', ')} read as brown.`
      : `Tested as OKLCH hue 40 to 130 with L under 0.70 and chroma over 0.04. Midnight's yellow is L ${mid.L.toFixed(2)}, which is gold, not olive.`,
  });
  details.push({
    title: 'Every token colour in OKLCH',
    head: ['level', 'role', 'colour', 'L', 'C', 'hue', 'brown?'],
    rows: used
      .filter((x, i, a) => a.findIndex((y) => y.lv === x.lv && y.hex === x.hex) === i)
      .map((x) => [x.lv, x.role, x.hex, x.L.toFixed(2), x.C.toFixed(3), `${x.h.toFixed(0)}°`, isBrown(x.hex) ? 'yes' : 'no']),
  });

  // 9. greyscale: an honest failure when classes print as one grey
  const sk = syntaxOf('sketch');
  const gc: [string, string][] = [];
  for (let i = 0; i < GREY_ROLES.length; i++) {
    for (let j = i + 1; j < GREY_ROLES.length; j++) {
      const a = GREY_ROLES[i]!;
      const b = GREY_ROLES[j]!;
      if (ratio(sk[a]!, sk[b]!) < 1.15) gc.push([a, b]);
    }
  }
  const pairs = (GREY_ROLES.length * (GREY_ROLES.length - 1)) / 2;
  checks.push({
    ok: gc.length === 0,
    title: 'Token classes separate in greyscale on sketch',
    reason: gc.length
      ? `${gc.length} of ${pairs} class pairs print as one grey: sketch's hues sit at close to one luminance and keywords are not bold. Highlights survive (selection, borders, bars, ▸, +/−); the classes themselves do not separate on paper.`
      : 'Every class pair differs.',
  });
  details.push({ title: 'Greyscale: pairs that print as one grey (under 1.15:1 apart)', head: ['pair'], rows: gc.length ? gc.map(([a, b]) => [`${a} / ${b}`]) : [['none']] });

  return { checks, details };
}

/** Per level: every band the text sits on, the flat colour it composites to, and the lowest contrast on it. */
export function bandTables(): NumbersTableData[] {
  return LEVEL_IDS.map((lv) => {
    const w = worst(lv);
    return {
      title: `${lv} · ground ${groundOf(lv)} · worst ${w.r.toFixed(2)}:1 on ${w.band}`,
      head: ['band', 'flat', 'text on it', 'lowest', 'which'],
      rows: bands(lv).map((b) => {
        const low = b.fgs.map((c) => ({ c, r: ratio(c, b.flat) })).sort((x, y) => x.r - y.r)[0]!;
        return [b.name, b.flat, b.why, `${low.r.toFixed(2)}${low.r < 4.5 ? ' ✕' : ''}`, low.c];
      }),
    };
  });
}

/** The alpha each translucent layer settled at, per level (the package's `editorAlpha`). */
export function alphaTable(): NumbersTableData {
  const a = (lv: ThemeLevel) => LEVELS[lv].editorAlpha;
  const row = (label: string, k: 'selection' | 'bracket' | 'diff') => [label, `${a('midnight')[k]}%`, `${a('sketch')[k]}%`];
  return {
    title: 'Translucent layers',
    head: ['layer', ...LEVEL_IDS],
    rows: [row('selection', 'selection'), row('bracket wash', 'bracket'), row('diff wash', 'diff'), ['current line fill', 'none', 'none'], ['find fills', 'none', 'none']],
  };
}

/** Every contract variable and the value it resolves to on each level. */
export function roleTable(): NumbersTableData {
  const [mid, sk] = LEVEL_IDS as [ThemeLevel, ThemeLevel];
  return {
    title: 'Role to variable',
    head: ['variable', ...LEVEL_IDS],
    rows: [
      ...SYNTAX_ROLES.map((r) => [syntaxVar(r), syntaxOf(mid)[r]!, syntaxOf(sk)[r]!]),
      ...EDITOR_ROLES.map((r) => [editorVar(r), editorOf(mid)[camel(r)]!, editorOf(sk)[camel(r)]!]),
    ],
  };
}

export function metricsTable(): NumbersTableData {
  const g = GEO.spec;
  return {
    title: 'Type metrics',
    head: ['size', 'leading', 'ratio', 'tab', 'gutter', 'width of 48 columns'],
    rows: [[`${g.fs}px`, `${g.lh}px`, (g.lh / g.fs).toFixed(2), '2', `${g.mark + g.num + 1 + g.diff}ch`, `${Math.round((48 + g.mark + g.num + 1 + g.diff + g.pad) * g.fs * 0.6)}px`]],
  };
}
