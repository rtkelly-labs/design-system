import type { CSSProperties, ReactNode } from 'react';
import { DIFF_LINES, PAGINATE_SOURCE, findAll, tokenizeLine } from '@/examples/editor/data';
import type { Look, Cls } from './look';

/**
 * One editor frame, drawn from a `Look`. Text is ordinary inline spans; every
 * fill, border, guide and wash is an absolutely positioned layer placed by
 * column in `ch`, so a border can sit 2px clear of the glyphs and never moves
 * the text or changes the row height.
 */

export interface Geo {
  fs: number;
  lh: number;
  /** Gutter columns in ch: marks, numbers, the diff bar and sign. */
  mark: number;
  num: number;
  diff: number;
  pad: number;
}
export const GEO: Record<'r5' | 'today', Geo> = {
  r5: { fs: 14, lh: 21, mark: 2, num: 3, diff: 2, pad: 1 },
  today: { fs: 13, lh: 20, mark: 0, num: 4, diff: 0, pad: 1 },
};
/** Space between a border and the glyphs it surrounds, and between a border and the row edge. */
const PAD_X = 2;
const PAD_Y = 2;

export interface CTok {
  text: string;
  cls: Cls;
  col: number;
  /** For brackets: nesting level, 1 for the outermost. */
  depth?: number;
}

const DECL = new Set(['const', 'let', 'function', 'interface', 'type']);
const BRACKETS = '()[]{}';
const SEPS = ',;.:';

/** The editor sample's tokenizer, with punctuation split into brackets, separators and operators, and keywords into declarations and control flow. */
export function classify(text: string, depth0 = 0): { toks: CTok[]; depth: number } {
  let depth = depth0;
  let col = 0;
  const toks: CTok[] = [];
  for (const t of tokenizeLine(text)) {
    let cls: Cls;
    let d: number | undefined;
    if (t.kind === 'keyword') cls = DECL.has(t.text) ? 'keyword' : 'control';
    else if (t.kind === 'punct') {
      if (BRACKETS.includes(t.text)) {
        cls = 'bracket';
        if ('([{'.includes(t.text)) {
          depth += 1;
          d = depth;
        } else {
          d = depth;
          depth = Math.max(0, depth - 1);
        }
      } else cls = SEPS.includes(t.text) ? 'sep' : 'op';
    } else cls = t.kind as Cls;
    toks.push({ text: t.text, cls, col, depth: d });
    col += t.text.length;
  }
  return { toks, depth };
}

/* ---------------------------------------------------------------- the file */

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

export interface RowSpec {
  key: string;
  no?: number;
  text: string;
  toks: CTok[];
  gap?: string;
  diff?: 'add' | 'del';
  cur?: boolean;
  sel?: { from: number; to: number };
  finds?: { from: number; to: number; current: boolean }[];
  brackets?: number[];
  err?: [number, number];
  warn?: [number, number];
  info?: [number, number];
  mark?: '×' | '!' | 'i' | '▸';
  /** Which indent guide is the active one. */
  activeGuide?: number;
}

export const spec = (key: string, text: string, extra: Partial<RowSpec> = {}): RowSpec => ({ key, text, toks: classify(text).toks, ...extra });

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

export function plainRows(from: number, to: number): RowSpec[] {
  return SOURCE.slice(from - 1, to).map((text, i) => ({ key: `p${from + i}`, no: from + i, text, toks: FILE_TOKS[from - 1 + i]! }));
}

/* --------------------------------------------------------------- one row */

const layer = (extra: CSSProperties): CSSProperties => ({ position: 'absolute', pointerEvents: 'none', ...extra });

function Row({ look: l, geo, row }: { look: Look; geo: Geo; row: RowSpec }) {
  const text = row.text;
  const len = text.length;
  const rowStyle: CSSProperties = { position: 'relative', display: 'flex', height: geo.lh, minWidth: '100%' };
  const raise: CSSProperties = { position: 'relative', zIndex: 1, flexShrink: 0 };
  const colL = (c: number) => `calc(${geo.pad}ch + ${c}ch)`;

  if (row.gap) {
    return (
      <div style={{ ...rowStyle, color: l.line.num }}>
        <span aria-hidden="true" style={{ ...raise, width: `${geo.mark + geo.num + 1}ch`, textAlign: 'center' }}>⋯</span>
        <span style={{ ...raise, paddingLeft: `${geo.diff + geo.pad}ch` }}>{row.gap}</span>
      </div>
    );
  }

  // Cut the line into segments wherever any decoration or token starts or stops.
  const cuts = new Set<number>([0, len]);
  for (const t of row.toks) {
    cuts.add(t.col);
    cuts.add(t.col + t.text.length);
  }
  const range = (a: number, b: number) => {
    cuts.add(Math.max(0, Math.min(a, len)));
    cuts.add(Math.max(0, Math.min(b, len)));
  };
  if (row.sel) range(row.sel.from, row.sel.to);
  row.finds?.forEach((f) => range(f.from, f.to));
  row.brackets?.forEach((c) => range(c, c + 1));
  if (row.err) range(...row.err);
  if (row.warn) range(...row.warn);
  if (row.info) range(...row.info);
  const pts = [...cuts].sort((a, b) => a - b);

  const tokAt = (i: number) => row.toks.find((t) => i >= t.col && i < t.col + t.text.length);
  const within = (i: number, a: number, b: number) => i >= a && i < b;
  const pieces: ReactNode[] = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k]!;
    const b = pts[k + 1]!;
    if (b <= a) continue;
    const t = tokAt(a);
    const cls: Cls = t?.cls ?? 'plain';
    let colour = cls === 'bracket' ? l.rot[((t?.depth ?? 1) - 1) % l.rot.length]! : l.tok[cls];
    let bold = !!l.bold[cls];
    const italic = !!l.italic[cls];
    const f = row.finds?.find((x) => within(a, x.from, x.to));
    if (f && !f.current) colour = l.find.otherFg;
    if (f?.current && l.find.curFg) colour = l.find.curFg;
    if (f?.current && l.find.curBold) bold = true;
    if (row.brackets?.some((c) => c === a)) {
      colour = l.bracket.fg;
      bold = bold || l.bracket.bold;
    }
    if (row.sel && within(a, row.sel.from, row.sel.to)) colour = l.sel.fg;
    const style: CSSProperties = { color: colour, fontWeight: bold ? 700 : undefined, fontStyle: italic ? 'italic' : undefined };
    const sev = row.err && within(a, ...row.err) ? 'err' : row.warn && within(a, ...row.warn) ? 'warn' : row.info && within(a, ...row.info) ? 'info' : undefined;
    const diag = sev === 'err' ? l.err.fg : sev === 'warn' ? l.warn.fg : sev === 'info' ? l.info?.fg : undefined;
    if (diag && sev) {
      style.textDecorationLine = 'underline';
      style.textDecorationStyle = l.diagStyle?.[sev] ?? 'wavy';
      style.textDecorationColor = diag;
      style.textDecorationThickness = '1.5px';
      style.textUnderlineOffset = 3;
    }
    pieces.push(
      <span key={k} style={style}>
        {text.slice(a, b)}
      </span>,
    );
  }

  // Row-wide layers: diff wash, diagnostic wash, current line.
  const rowLayers: ReactNode[] = [];
  if (row.diff) rowLayers.push(<div key="diff" aria-hidden="true" style={layer({ inset: 0, background: row.diff === 'add' ? l.add.wash : l.del.wash })} />);
  if (row.err) rowLayers.push(<div key="err" aria-hidden="true" style={layer({ inset: 0, background: l.err.wash })} />);
  if (row.cur) {
    rowLayers.push(
      <div
        key="line"
        aria-hidden="true"
        style={layer({ inset: 0, background: l.line.fill, boxShadow: `inset 0 1px 0 0 ${l.line.border}, inset 0 -1px 0 0 ${l.line.border}` })}
      />,
    );
  }

  // Code layers, by column.
  const codeLayers: ReactNode[] = [];
  const lead = text.match(/^ */)![0].length;
  for (let k = 0; k < Math.floor(lead / 2); k++) {
    const active = row.activeGuide === k;
    const set = active ? l.guide.active : l.guide.rot;
    codeLayers.push(<div key={`g${k}`} aria-hidden="true" style={layer({ left: colL(k * 2), top: 0, bottom: 0, width: 1, background: set[k % set.length]! })} />);
  }
  const box = (c0: number, c1: number, key: string, style: CSSProperties) => (
    <div
      key={key}
      aria-hidden="true"
      style={layer({ left: `calc(${geo.pad}ch + ${c0}ch - ${PAD_X}px)`, width: `calc(${c1 - c0}ch + ${PAD_X * 2}px)`, top: PAD_Y, height: geo.lh - PAD_Y * 2, ...style })}
    />
  );
  row.finds?.forEach((f, i) => {
    if (f.current) {
      codeLayers.push(box(f.from, f.to, `fc${i}`, { background: l.find.curFill }));
    } else if (l.find.otherFill) codeLayers.push(box(f.from, f.to, `fo${i}`, { background: l.find.otherFill }));
  });
  if (row.sel) {
    codeLayers.push(
      <div key="sel" aria-hidden="true" style={layer({ left: colL(row.sel.from), width: `${row.sel.to - row.sel.from}ch`, top: 0, bottom: 0, background: l.sel.fill })} />,
    );
  }
  row.finds?.forEach((f, i) => {
    const w = f.current ? l.find.curW : l.find.otherW;
    const c = f.current ? l.find.curBorder : l.find.otherBorder;
    codeLayers.push(box(f.from, f.to, `fb${i}`, { boxShadow: `inset 0 0 0 ${w}px ${c}` }));
  });
  row.brackets?.forEach((c, i) => {
    codeLayers.push(box(c, c + 1, `br${i}`, { background: l.bracket.fill, boxShadow: `inset 0 0 0 1px ${l.bracket.border}` }));
  });

  const glyphColour = row.mark === '×' ? l.err.fg : row.mark === '!' ? l.warn.fg : row.mark === 'i' ? (l.info?.fg ?? l.marker.cur) : l.marker.cur;
  const numColour = row.cur ? l.line.numActive : l.line.num;
  return (
    <div style={rowStyle}>
      {rowLayers}
      {geo.mark > 0 && (
        <span aria-hidden="true" style={{ ...raise, width: `${geo.mark}ch`, textAlign: 'center', fontWeight: 700, color: glyphColour }}>
          <span style={{ fontSize: row.mark === '▸' ? '1.25em' : undefined }}>{row.mark ?? ''}</span>
        </span>
      )}
      <span aria-hidden="true" style={{ ...raise, boxSizing: 'border-box', width: `${geo.num + 1}ch`, paddingRight: '1ch', textAlign: 'right', color: numColour, fontWeight: row.cur ? 700 : undefined, userSelect: 'none' }}>
        {row.no ?? ''}
      </span>
      {geo.diff > 0 && (
        <span aria-hidden="true" style={{ ...raise, width: `${geo.diff}ch`, textAlign: 'center', fontWeight: 700, color: row.diff === 'add' ? l.add.bar : row.diff === 'del' ? l.del.bar : undefined }}>
          {row.diff && <span style={layer({ left: 0, top: 0, bottom: 0, width: 3, background: row.diff === 'add' ? l.add.bar : l.del.bar })} />}
          {row.diff === 'add' ? '+' : row.diff === 'del' ? '−' : ''}
        </span>
      )}
      <code style={{ position: 'relative', flex: '1 0 auto', whiteSpace: 'pre', fontFamily: 'inherit', paddingLeft: `${geo.pad}ch`, paddingRight: '2ch' }}>
        {codeLayers}
        <span style={{ position: 'relative', zIndex: 1 }}>{pieces}</span>
      </code>
    </div>
  );
}

/* ---------------------------------------------------------------- a frame */

export function Frame({
  look,
  rows,
  geo = GEO.r5,
  title,
  status,
  grey,
  frameId,
}: {
  look: Look;
  rows: RowSpec[];
  geo?: Geo;
  title?: string;
  status?: ReactNode;
  grey?: boolean;
  frameId?: string;
}) {
  return (
    <div
      data-r5-frame={frameId}
      className="overflow-x-auto border-2 border-edge-strong"
      style={{ background: look.ground, color: look.ink, filter: grey ? 'grayscale(1)' : undefined }}
    >
      {title && (
        <div className="flex items-center justify-between gap-2 border-b-2 px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: look.line.border, color: look.line.num }}>
          <span>{title}</span>
          <span>{status}</span>
        </div>
      )}
      <div style={{ fontFamily: 'var(--ds-font-mono)', fontSize: geo.fs, lineHeight: `${geo.lh}px`, tabSize: 2, padding: '6px 0', width: 'max-content', minWidth: '100%' }}>
        {rows.map((r) => (
          <Row key={r.key} look={look} geo={geo} row={r} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ legend */

export interface LegendItem {
  label: string;
  rows: RowSpec[];
}

/** A subset of the frame's rows, by key, for the small comparisons. */
export const pickRows = (keys: string[]) => frameRows().filter((r) => keys.includes(r.key));

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
