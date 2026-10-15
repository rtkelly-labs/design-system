import type { CSSProperties, ReactNode } from 'react';
import { tokenizeLine } from '@/examples/editor/data';
import type { Cls, CodeLook } from './look';

/**
 * One editor frame, drawn from a `CodeLook`. Text is ordinary inline spans; every
 * fill, border, guide and wash is an absolutely positioned layer placed by
 * column in `ch`, so a border can sit 2px clear of the glyphs and never moves
 * the text or changes the row height.
 *
 * Colours are written straight into `style`, so a look may hold literals or
 * `var(--ds-*)` references. The frame does no colour arithmetic.
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
export const GEO: Record<'spec' | 'today', Geo> = {
  /** The shipped metrics: 14px on 21px, a 2ch mark column, 3ch numbers, a 2ch diff bar and sign. */
  spec: { fs: 14, lh: 21, mark: 2, num: 3, diff: 2, pad: 1 },
  today: { fs: 13, lh: 20, mark: 0, num: 4, diff: 0, pad: 1 },
};
/** The same type with no gutter: what a `CodeBlock` prints. */
export const NO_GUTTER: Geo = { fs: 14, lh: 21, mark: 0, num: 3, diff: 0, pad: 1 };
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

/* ------------------------------------------------------------------- rows */

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

/** One run of text and the class it is coloured as. */
export type Seg = [text: string, cls: Cls];

/** A row built from coloured segments, for languages the editor sample's tokenizer does not know. */
export function seg(no: number, ...segs: Seg[]): RowSpec {
  let col = 0;
  const toks = segs.map(([text, cls]) => {
    const t = { text, cls, col };
    col += text.length;
    return t;
  });
  return { key: `s${no}`, no, text: segs.map((s) => s[0]).join(''), toks };
}

/* --------------------------------------------------------------- one row */

const layer = (extra: CSSProperties): CSSProperties => ({ position: 'absolute', pointerEvents: 'none', ...extra });

function Row({ look: l, geo, row }: { look: CodeLook; geo: Geo; row: RowSpec }) {
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

export function CodeFrame({
  look,
  rows,
  geo = GEO.spec,
  title,
  status,
  grey,
  frameId,
}: {
  look: CodeLook;
  rows: RowSpec[];
  geo?: Geo;
  /** A title bar above the code: file name and range on the left, `status` on the right. */
  title?: string;
  status?: ReactNode;
  /** Draw in greyscale, to show what a paper print keeps. */
  grey?: boolean;
  frameId?: string;
}) {
  return (
    <div
      data-code-frame={frameId}
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

