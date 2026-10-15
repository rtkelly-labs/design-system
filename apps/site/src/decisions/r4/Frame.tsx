import type { CSSProperties } from 'react';
import { DIFF_LINES, GIT_GUTTER, PAGINATE_SOURCE, at, findAll, tokenizeLine } from '@/examples/editor/data';
import type { Decoration, DecorationKind, TokenKind } from '@/examples/editor/data';
import { LV } from '../p2/Frame';
import { METRICS, build } from './model';
import type { Built, DirId, Level, Mark, Metrics } from './model';

/* The editor sample's own source, tokenizer, find and diff data. Only the splitting of a line into pieces is redone here;
 * the workbench keeps its own private inside a client component. */

const LINES = PAGINATE_SOURCE.replace(/\n$/, '').split('\n');
export const FIRST = 11;
export const LAST = 20;
export const CURRENT_LINE = 14;
export const CURRENT_MATCH = 3;
export const MATCHES = findAll(PAGINATE_SOURCE, 'items');

function decorations(): Decoration[] {
  const l11 = LINES[10]!;
  const l12 = LINES[11]!;
  const s12 = l12.indexOf('items.slice') + 'items.slice'.length;
  const out: Decoration[] = [
    { line: 11, from: l11.indexOf('const'), to: l11.length, kind: 'selection' },
    { line: 12, from: 0, to: s12, kind: 'selection' },
    at(PAGINATE_SOURCE, 13, 'lenght', 'error'),
    at(PAGINATE_SOURCE, 13, 'total', 'warning'),
    at(PAGINATE_SOURCE, 14, '{', 'bracket'),
    at(PAGINATE_SOURCE, 16, '}', 'bracket'),
  ];
  MATCHES.forEach((m, i) => out.push({ ...m, kind: i === CURRENT_MATCH ? 'findCurrent' : 'find' }));
  return out;
}
const DECOS = decorations();

interface Span {
  start: boolean;
  end: boolean;
}
interface Piece {
  text: string;
  kind: TokenKind;
  decos: Map<DecorationKind, Span>;
}

function piecesOf(text: string, lineNo: number): Piece[] {
  const tokens = tokenizeLine(text);
  const mine = DECOS.filter((d) => d.line === lineNo);
  const cuts = new Set<number>([0, text.length]);
  let pos = 0;
  for (const t of tokens) {
    pos += t.text.length;
    cuts.add(pos);
  }
  for (const d of mine) {
    cuts.add(d.from);
    cuts.add(Math.min(d.to, text.length));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const kindAt = (i: number): TokenKind => {
    let p = 0;
    for (const t of tokens) {
      if (i < p + t.text.length) return t.kind;
      p += t.text.length;
    }
    return 'plain';
  };
  const out: Piece[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]!;
    const to = points[i + 1]!;
    if (to <= from) continue;
    const decos = new Map<DecorationKind, Span>();
    for (const d of mine) {
      if (d.from <= from && d.to >= to) decos.set(d.kind, { start: from === d.from, end: to === Math.min(d.to, text.length) });
    }
    out.push({ text: text.slice(from, to), kind: kindAt(from), decos });
  }
  return out;
}

const layerOf = (c: string) => `linear-gradient(${c}, ${c})`;

function pieceStyle(b: Built, m: Metrics, kind: TokenKind, decos: Map<DecorationKind, Span>): CSSProperties {
  const ts = b.tokens[kind];
  let colour = ts.colour;
  let bold = ts.bold;
  let strike = false;
  const layers: string[] = [];
  let ul: Mark['ul'];
  let edge: { m: Mark; span: Span } | undefined;

  const apply = (mk: Mark, span: Span | undefined, opaque = false) => {
    if (mk.inv) {
      layers.push(ts.colour);
      colour = b.ground;
    }
    if (mk.bg) {
      if (opaque) layers.length = 0;
      layers.push(mk.bg);
    }
    if (mk.fg) colour = mk.fg;
    if (mk.bold) bold = true;
    if (mk.strike) strike = true;
    if (mk.ul) ul = mk.ul;
    if (mk.edge && span) edge = { m: mk, span };
  };
  // Weakest to strongest.
  if (decos.has('find')) apply(b.find, decos.get('find'));
  if (decos.has('selection')) apply(b.sel, decos.get('selection'));
  if (decos.has('bracket')) apply(b.bracket, decos.get('bracket'));
  if (decos.has('findCurrent')) apply(b.cur, decos.get('findCurrent'), true);
  // An underline sitting on a reversed block takes the block's text colour.
  if (ul && ul.colour === b.ink && colour === b.ground) ul = { ...ul, colour: b.ground };
  if (decos.has('error')) ul = b.err.ul;
  else if (decos.has('warning')) ul = b.warn.ul;
  else if (decos.has('info')) ul = b.info.ul;

  const style: CSSProperties = {
    display: 'inline-block',
    height: m.lh,
    lineHeight: `${m.lh}px`,
    verticalAlign: 'top',
    color: colour,
    fontWeight: bold ? 700 : undefined,
    fontStyle: ts.italic ? 'italic' : undefined,
  };
  if (layers.length) style.backgroundImage = [...layers].reverse().map(layerOf).join(', ');
  const e = edge as { m: Mark; span: Span } | undefined;
  if (e?.m.edge) {
    const { w, colour: c } = e.m.edge;
    const sh = [`inset 0 ${w}px 0 0 ${c}`, `inset 0 -${w}px 0 0 ${c}`];
    if (e.span.start) sh.push(`inset ${w}px 0 0 0 ${c}`);
    if (e.span.end) sh.push(`inset -${w}px 0 0 0 ${c}`);
    style.boxShadow = sh.join(', ');
  }
  const u = ul as Mark['ul'];
  if (u || strike) {
    style.textDecorationLine = [u ? 'underline' : '', strike ? 'line-through' : ''].filter(Boolean).join(' ');
    if (u) {
      style.textDecorationStyle = u.style;
      style.textDecorationColor = u.colour;
      style.textDecorationThickness = u.w;
      style.textUnderlineOffset = 3;
    } else {
      style.textDecorationColor = colour;
    }
  }
  return style;
}

/** A frame's own geometry, as CSS: type metrics and tab width. */
const preStyle = (m: Metrics): CSSProperties => ({
  margin: 0,
  fontSize: m.fs,
  lineHeight: `${m.lh}px`,
  letterSpacing: m.tracking === '0' ? undefined : m.tracking,
  tabSize: m.tab,
  fontFamily: 'var(--ds-font-mono)',
  minWidth: 'max-content',
});

const gutterStyle = (m: Metrics, muted: string): CSSProperties => ({
  display: 'inline-block',
  flexShrink: 0,
  width: `${m.gutterCh}ch`,
  textAlign: 'right',
  userSelect: 'none',
  color: muted,
});

function Tokens({ b, m, text }: { b: Built; m: Metrics; text: string }) {
  return tokenizeLine(text).map((t, i) => (
    <span key={i} style={pieceStyle(b, m, t.kind, new Map())}>
      {t.text}
    </span>
  ));
}

/** One editor frame: ten lines of paginate.ts with every decoration, then the diff. */
export function EditorFrame({ dir, level, grey, showDiff = true }: { dir: DirId; level: Level; grey?: boolean; showDiff?: boolean }) {
  const b = build(dir, level);
  const d = LV[level];
  const m = METRICS[dir];
  const shown = LINES.slice(FIRST - 1, LAST);
  const muted = d.text.muted;
  const ruleStyle: CSSProperties = m.rule ? { borderLeft: `1px solid ${d.border.subtle}` } : {};
  const codePad = { paddingLeft: `${m.padCh}ch` };
  return (
    <div
      data-r4-frame={`${dir}-${level}`}
      className="overflow-x-auto border-2 border-edge-strong"
      style={{ background: b.ground, filter: grey ? 'grayscale(1)' : undefined }}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">
        <span>paginate.ts · lines {FIRST}-{LAST}</span>
        <span>{grey ? '[ greyscale ]' : `find "items" ${CURRENT_MATCH + 1}/${MATCHES.length}`}</span>
      </div>
      <pre style={{ ...preStyle(m), padding: '6px 0' }}>
        {shown.map((text, i) => {
          const no = FIRST + i;
          const cur = no === CURRENT_LINE;
          const git = GIT_GUTTER[no];
          const hasErr = DECOS.some((x) => x.line === no && x.kind === 'error');
          const rowStyle: CSSProperties = { display: 'flex', minHeight: m.lh };
          if (cur && b.line.bg) rowStyle.backgroundImage = layerOf(b.line.bg);
          if (cur && b.line.edge) rowStyle.boxShadow = `inset 0 -${b.line.edge.w}px 0 0 ${b.line.edge.colour}`;
          const nStyle: CSSProperties = cur
            ? { ...gutterStyle(m, b.numCur.fg), background: b.numCur.bg, fontWeight: b.numCur.bold ? 700 : undefined }
            : gutterStyle(m, muted);
          return (
            <div key={no} style={rowStyle}>
              <span aria-hidden="true" style={nStyle}>{no}</span>
              {m.markerCh > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    flexShrink: 0,
                    width: `${m.markerCh}ch`,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: hasErr ? b.err.ul!.colour : undefined,
                    boxShadow: git ? `inset 2px 0 0 0 ${git === 'added' ? b.signAdd : git === 'removed' ? b.signDel : b.tokens.function.colour}` : undefined,
                  }}
                >
                  {hasErr ? '×' : ' '}
                </span>
              )}
              <code style={{ whiteSpace: 'pre', ...codePad, ...ruleStyle, marginLeft: m.rule ? '1ch' : 0, fontFamily: 'inherit' }}>
                {piecesOf(text, no).map((p, j) => (
                  <span key={j} style={pieceStyle(b, m, p.kind, p.decos)}>
                    {p.text}
                  </span>
                ))}
              </code>
            </div>
          );
        })}
      </pre>
      {showDiff && (
        <div className="border-t-2 border-edge-subtle">
          <p className="m-0 border-b border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">diff · HEAD to working</p>
          <pre style={{ ...preStyle(m), padding: '6px 0' }}>
            {DIFF_LINES.map((l, i) => {
              const mk = l.sign === 'add' ? b.add : l.sign === 'remove' ? b.del : undefined;
              const rowStyle: CSSProperties = { display: 'flex', minHeight: m.lh };
              if (mk?.bg) rowStyle.backgroundImage = layerOf(mk.bg);
              const sign = l.sign === 'add' ? '+' : l.sign === 'remove' ? '−' : ' ';
              const signColour = l.sign === 'add' ? b.signAdd : l.sign === 'remove' ? b.signDel : undefined;
              return (
                <div key={i} style={rowStyle}>
                  <span aria-hidden="true" style={gutterStyle(m, muted)}>{l.newNo ?? l.oldNo}</span>
                  <span aria-hidden="true" style={{ display: 'inline-block', width: '2ch', flexShrink: 0, textAlign: 'center', fontWeight: 700, color: signColour }}>
                    {sign}
                  </span>
                  <code
                    style={{
                      whiteSpace: 'pre',
                      fontFamily: 'inherit',
                      textDecorationLine: mk?.strike ? 'line-through' : undefined,
                      textDecorationColor: mk?.strike ? muted : undefined,
                    }}
                  >
                    <Tokens b={b} m={m} text={l.text} />
                  </code>
                </div>
              );
            })}
          </pre>
        </div>
      )}
      <MarksKey b={b} m={m} />
    </div>
  );
}

const KEY: { label: string; kind: DecorationKind | 'addRow' | 'delRow' | 'word' | 'line'; text: string }[] = [
  { label: 'select', kind: 'selection', text: 'sel' },
  { label: 'find', kind: 'find', text: 'items' },
  { label: 'current', kind: 'findCurrent', text: 'items' },
  { label: 'bracket', kind: 'bracket', text: '{' },
  { label: 'word', kind: 'word', text: 'start' },
  { label: 'error', kind: 'error', text: 'lenght' },
  { label: 'warning', kind: 'warning', text: 'total' },
  { label: 'info', kind: 'info', text: 'LABEL' },
];

/** Every mark once, on a plain word, so the ones the sample does not exercise (word highlight, info) are still shown. */
function MarksKey({ b, m }: { b: Built; m: Metrics }) {
  return (
    <div className="border-t-2 border-edge-subtle">
      <p className="m-0 border-b border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">marks</p>
      <div style={{ ...preStyle(m), minWidth: 0, padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '4px 2ch' }}>
        {KEY.map((k) => {
          const decos = new Map<DecorationKind, Span>();
          let style: CSSProperties;
          if (k.kind === 'word') {
            style = pieceStyle(b, m, 'plain', decos);
            if (b.word.bg) style.backgroundImage = layerOf(b.word.bg);
            if (b.word.ul) {
              style.textDecorationLine = 'underline';
              style.textDecorationStyle = b.word.ul.style;
              style.textDecorationColor = b.word.ul.colour;
              style.textDecorationThickness = b.word.ul.w;
              style.textUnderlineOffset = 3;
            }
          } else {
            decos.set(k.kind as DecorationKind, { start: true, end: true });
            style = pieceStyle(b, m, 'plain', decos);
          }
          return (
            <span key={k.label} className="inline-flex items-baseline gap-1">
              <span style={style}>{k.text}</span>
              <span className="font-mono text-[10px] text-content-muted">{k.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The ten lines with tokens only, at a given set of metrics, for the type-metrics strip. */
export function PlainTen({ tokensFrom, metrics, level = 'midnight', numbers = true }: { tokensFrom: DirId; metrics: Metrics; level?: Level; numbers?: boolean }) {
  const b = build(tokensFrom, level);
  const d = LV[level];
  const shown = LINES.slice(FIRST - 1, LAST);
  const m = metrics;
  return (
    <div className="overflow-x-auto border-2 border-edge-strong" style={{ background: b.ground }}>
      <pre style={{ ...preStyle(m), padding: '6px 0' }}>
        {shown.map((text, i) => (
          <div key={i} style={{ display: 'flex', minHeight: m.lh }}>
            {numbers && m.gutterCh > 0 && <span aria-hidden="true" style={gutterStyle(m, d.text.muted)}>{FIRST + i}</span>}
            {m.markerCh > 0 && <span aria-hidden="true" style={{ display: 'inline-block', width: `${m.markerCh}ch`, flexShrink: 0 }} />}
            <code
              style={{
                whiteSpace: 'pre',
                fontFamily: 'inherit',
                paddingLeft: numbers && m.gutterCh > 0 ? `${m.padCh}ch` : '1rem',
                borderLeft: m.rule ? `1px solid ${d.border.subtle}` : undefined,
                marginLeft: m.rule ? '1ch' : 0,
              }}
            >
              <Tokens b={b} m={m} text={text} />
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

export const MAX_COLS = Math.max(...LINES.slice(FIRST - 1, LAST).map((l) => l.length));
