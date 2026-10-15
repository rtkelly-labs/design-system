/**
 * Seeded fixtures for the code-and-syntax specimen: the file the editor frame
 * draws, the legend's one-line examples, a CSS sample for `CodeBlock`, a
 * terminal transcript and a snippet for Shiki. The editor's own sample file
 * (`examples/editor/data.ts`) is the single source for the paginate.ts text, so
 * the frame, the editor example and the decision board never disagree about it.
 * Nothing is random, dated or locale-formatted.
 */
import { classify, spec } from '@/components/specimen';
import type { CTok, LegendItem, RowSpec, Run, Seg } from '@/components/specimen';
import { DIFF_LINES, PAGINATE_SOURCE, findAll } from '@/examples/editor/data';

/* ------------------------------------------------------------ paginate.ts */

const SOURCE = PAGINATE_SOURCE.replace(/\n$/, '').split('\n');
const FILE_TOKS: CTok[][] = (() => {
  let depth = 0;
  return SOURCE.map((l) => {
    const r = classify(l, depth);
    depth = r.depth;
    return r.toks;
  });
})();

export const MATCHES = findAll(PAGINATE_SOURCE, 'items');
export const CURRENT_MATCH = 3;
export const CURRENT_LINE = 14;

const at = (line: number, needle: string, nth = 0) => {
  const t = SOURCE[line - 1]!;
  let from = -1;
  for (let i = 0; i <= nth; i++) from = t.indexOf(needle, from + 1);
  return from;
};

function lineSpec(no: number): RowSpec {
  const text = SOURCE[no - 1]!;
  const finds = MATCHES.map((m, i) => ({ m, i }))
    .filter(({ m }) => m.line === no)
    .map(({ m, i }) => ({ from: m.from, to: m.to, current: i === CURRENT_MATCH }));
  const s: RowSpec = { key: `l${no}`, no, text, toks: FILE_TOKS[no - 1]!, finds };
  if (finds.some((f) => f.current)) s.mark = '▸';
  if (no === CURRENT_LINE) s.cur = true;
  if (no === 17) s.sel = { from: at(17, 'return'), to: text.length + 1 };
  if (no === 18) s.sel = { from: 0, to: at(18, 'slice') + 'slice'.length };
  if (no === 13) {
    s.err = [at(13, 'lenght'), at(13, 'lenght') + 'lenght'.length];
    s.warn = [at(13, 'total'), at(13, 'total') + 'total'.length];
    s.mark = '×';
    s.diff = 'add';
  }
  if (no === 15) s.diff = 'add';
  if (no === 14) s.brackets = [text.lastIndexOf('{')];
  if (no === 16) s.brackets = [text.lastIndexOf('}')];
  if (no === 15) s.activeGuide = 1;
  return s;
}

/** The frame's rows: lines 1 and 9, then 11 to 22, with gaps between, with the diff's removed lines spliced in above the lines that replace them. */
export function frameRows(): RowSpec[] {
  const removedBefore = new Map<number, string>();
  DIFF_LINES.forEach((l, i) => {
    const next = DIFF_LINES[i + 1];
    if (l.sign === 'remove' && next?.sign === 'add' && next.newNo) removedBefore.set(next.newNo, l.text);
  });
  const out: RowSpec[] = [];
  const push = (no: number) => {
    const old = removedBefore.get(no);
    if (old !== undefined) {
      const oldNo = DIFF_LINES.find((x) => x.sign === 'remove' && x.text === old)?.oldNo;
      out.push(spec(`r${no}`, old, { no: oldNo, diff: 'del' }));
    }
    out.push(lineSpec(no));
  };
  push(1);
  out.push({ key: 'gap1', text: '', toks: [], gap: 'lines 2 to 8 not shown' });
  push(9);
  out.push({ key: 'gap2', text: '', toks: [], gap: 'line 10 not shown' });
  for (let n = 11; n <= 22; n++) push(n);
  return out;
}

export const FRAME_TITLE = 'paginate.ts · lines 1, 9, 11 to 22';
export const FRAME_STATUS = `find "items" ${CURRENT_MATCH + 1}/${MATCHES.length} · ln ${CURRENT_LINE}`;

export function plainRows(from: number, to: number): RowSpec[] {
  return SOURCE.slice(from - 1, to).map((text, i) => ({ key: `p${from + i}`, no: from + i, text, toks: FILE_TOKS[from - 1 + i]! }));
}

/** A subset of the frame's rows, by key, for the small comparisons. */
export const pickRows = (keys: string[]) => frameRows().filter((r) => keys.includes(r.key));

/* ------------------------------------------------------------------ legend */

export const LEGEND: LegendItem[] = [
  { label: 'selection', rows: [spec('s', '  return total;', { no: 7, sel: { from: 2, to: 14 } })] },
  { label: 'other match', rows: [spec('o', '  items.slice()', { no: 7, finds: [{ from: 2, to: 7, current: false }] })] },
  { label: 'current match 4/8', rows: [spec('c', '  items.slice()', { no: 7, mark: '▸', finds: [{ from: 2, to: 7, current: true }] })] },
  { label: 'current line', rows: [spec('l', '  const total = 0;', { no: 7, cur: true })] },
  { label: 'bracket pair', rows: [spec('b', '  clamp(start, 0)', { no: 7, brackets: [7, 16] })] },
  { label: 'error', rows: [spec('e', '  items.lenght;', { no: 7, mark: '×', err: [8, 14] })] },
  { label: 'warning', rows: [spec('w', '  total: number;', { no: 7, mark: '!', warn: [2, 7] })] },
  { label: 'diff', rows: [spec('d1', '  total = 1;', { no: 7, diff: 'del' }), spec('d2', '  total = 2;', { no: 7, diff: 'add' })] },
];

/** The shipped legend: round 5's, with an info row, in the order a reader meets them. */
const LEGEND_INFO: LegendItem = { label: 'info', rows: [spec('i', '  export const LABEL;', { no: 7, mark: 'i', info: [15, 20] })] };
const LEGEND_ORDER = ['selection', 'other match', 'current match 4/8', 'current line', 'bracket pair', 'error', 'warning', 'info', 'diff'];
export const LEGEND_FULL: LegendItem[] = LEGEND_ORDER.map((l) => [...LEGEND, LEGEND_INFO].find((i) => i.label === l)!);

/** What each diagnostic row's underline and gutter mark look like, in words. */
export const LEGEND_NOTES: Record<string, string> = {
  error: 'wavy underline, × in the gutter',
  warning: 'dashed underline, ! in the gutter',
  info: 'dotted underline, i in the gutter',
};

/* --------------------------------------------------------------- page.css */

export const CSS_TITLE = 'page.css';
export const CSS_SEGS: Seg[][] = [
  [['/* One page of results. */', 'comment']],
  [['@media', 'keyword'], [' ', 'plain'], ['(min-width: ', 'op'], ['40rem', 'number'], [')', 'op'], [' ', 'plain'], ['{', 'op']],
  [['  ', 'plain'], ['.page', 'type'], [' ', 'plain'], ['{', 'op']],
  [['    ', 'plain'], ['display', 'plain'], [': ', 'op'], ['grid', 'plain'], [';', 'op']],
  [['    ', 'plain'], ['gap', 'plain'], [': ', 'op'], ['12px', 'number'], [';', 'op']],
  [['    ', 'plain'], ['color', 'plain'], [': ', 'op'], ['var', 'function'], ['(', 'op'], ['--text-primary', 'plain'], [')', 'op'], [';', 'op']],
  [['    ', 'plain'], ['content', 'plain'], [': ', 'op'], ['"next"', 'string'], [';', 'op']],
  [['    ', 'plain'], ['padding', 'plain'], [': ', 'op'], ['4px 16px', 'number'], [';', 'op']],
  [['  ', 'plain'], ['}', 'op']],
  [['}', 'op']],
];

/* -------------------------------------------------------------- transcript */

/**
 * The eight ANSI slots a terminal has, by the job each does here. A transcript
 * line is runs of text, each with a slot (or none, for default ink) and a bold flag.
 */
export interface AnsiSlot {
  slot: string;
  role: string;
}
export const ANSI_SLOTS: AnsiSlot[] = [
  { slot: '1 red', role: 'error' },
  { slot: '2 green', role: 'pass, strings' },
  { slot: '3 yellow', role: 'numbers (violet on sketch)' },
  { slot: '4 blue', role: 'prompt, commands' },
  { slot: '5 magenta', role: 'keywords (pink on midnight, red on sketch)' },
  { slot: '6 cyan', role: 'hints (intent.info)' },
  { slot: '7 white', role: 'text.primary' },
  { slot: '8 bright black', role: 'text.muted' },
];

export const TRANSCRIPT_LABEL = 'Terminal transcript: a test run with two passes and one failure';
export const TRANSCRIPT: Run[][] = [
  [['~/paginate', 4, true], [' '], ['$', 8], [' vitest run paginate']],
  [],
  [[' '], ['✓', 2], [' clamp keeps the cursor in range '], ['3ms', 8]],
  [[' '], ['✓', 2], [' returns one page of items '], ['5ms', 8]],
  [[' '], ['✕', 1, true], [' counts the total '], ['2ms', 8]],
  [['   '], ['TypeError: items.lenght is not a function', 1]],
  [['   expected '], ['25', 3], [' received '], ['0', 3]],
  [],
  [[' Tests  '], ['1 failed', 1], [' '], ['|', 8], [' '], ['2 passed', 2], [' '], ['(3)', 8]],
  [[' '], ['hint:', 6], [' '], ['rerun with', 8], [' '], ['--update', 5], [' '], ['to rewrite snapshots', 8]],
];

/* ------------------------------------------------------------------- roles */

/** How the theme is structured: each role and the one job it does. */
export const ROLES: [role: string, job: string][] = [
  ['Selection', 'accent.primary as a translucent region; every token inside it is forced to text.primary, so it reads as one block.'],
  ['Find', 'accent.secondary borders only, no fills. Other matches are 1px; the current one is 2px with bold glyphs and a ▸ in the gutter.'],
  ['Current line', 'a 1px border.subtle hairline and nothing else; the line number turns accent.primary. Nothing competes with the selection.'],
  ['Tokens', 'one job per colour: keyword the loudest accent, function accent.primary, string green, number, constant and type one quiet accent. Punctuation steps back to text.secondary, comments to text.muted.'],
  ['Bracket match', 'a 1px border and 10% wash in the keyword hue, so it stays off the find and selection colours.'],
  ['Diagnostics', 'underline shape first (wavy, dashed, dotted), colour second, with a mark in the gutter. Error uses the red hue because pink is a keyword on midnight.'],
  ['Diff', 'green and red behind the line at a lowered alpha, plus a 3px bar and a + or − in a column of their own.'],
];

/* ------------------------------------------------------------------ shiki */

/** A short TypeScript module for the Shiki-highlighted `CodeBlock`. */
export const SHIKI_TITLE = 'cursor.ts';
export const SHIKI_SOURCE = `import { clamp } from './math';

export interface Cursor {
  offset: number;
  size: number;
}

// Move forward one page, stopping at the last item.
export function advance(cursor: Cursor, total: number): Cursor {
  const offset = clamp(cursor.offset + cursor.size, 0, total);
  return { ...cursor, offset };
}

export const FIRST_PAGE: Cursor = { offset: 0, size: 25 };
export const LABEL = 'page one';
`;
