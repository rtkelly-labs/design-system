import type { CSSProperties } from 'react';
import {
  DIFF_LINES,
  PAGINATE_SOURCE,
  at,
  findAll,
  tokenizeLine,
} from '@/examples/editor/data';
import type { Decoration, DecorationKind, TokenKind } from '@/examples/editor/data';
import { LV } from '../p2/Frame';
import { looksFor, tokenStyle } from './model';
import type { Cfg, Level, Look } from './model';

/* The sample's own source, tokenizer, find and diff data. The only thing redone here is splitting a line into pieces, which the
 * workbench keeps private inside a client component. */

const LINES = PAGINATE_SOURCE.replace(/\n$/, '').split('\n');
const FIRST = 9;
const LAST = 22;
export const CURRENT_LINE = 13;
/** The match the sample marks as current: the fourth. */
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
    at(PAGINATE_SOURCE, 10, '{', 'bracket'),
    at(PAGINATE_SOURCE, 22, '}', 'bracket'),
  ];
  MATCHES.forEach((m, i) => out.push({ ...m, kind: i === CURRENT_MATCH ? 'findCurrent' : 'find' }));
  return out;
}

const DECOS = decorations();

interface Piece {
  text: string;
  kind: TokenKind;
  decos: Set<DecorationKind>;
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
    out.push({
      text: text.slice(from, to),
      kind: kindAt(from),
      decos: new Set(mine.filter((d) => d.from <= from && d.to >= to).map((d) => d.kind)),
    });
  }
  return out;
}

const layer = (c: string) => `linear-gradient(${c}, ${c})`;

function pieceStyle(cfg: Cfg, level: Level, piece: Piece): CSSProperties {
  const d = LV[level];
  const looks = looksFor(cfg, level);
  const ts = tokenStyle(cfg, d, piece.kind);
  const has = (k: DecorationKind) => piece.decos.has(k);

  const picks: Look[] = [];
  const isCur = has('findCurrent');
  if (isCur) picks.push(looks.cur);
  else if (has('find')) picks.push(looks.find);
  if (has('bracket')) picks.push(looks.bracket);
  if (has('selection')) picks.push(looks.sel);

  const style: CSSProperties = {
    color: ts.colour,
    fontWeight: ts.bold ? 700 : undefined,
    fontStyle: ts.italic ? 'italic' : undefined,
  };
  const fills = picks.filter((p) => p.fill).map((p) => layer(p.fill!));
  if (fills.length) style.backgroundImage = fills.join(', ');
  const shadows: string[] = [];
  for (const p of picks) {
    if (p.edge) shadows.push(`inset 0 0 0 ${p.edge.w}px ${p.edge.colour}`);
    if (p.under) shadows.push(`inset 0 -2px 0 ${p.under}`);
  }
  if (shadows.length) style.boxShadow = shadows.join(', ');
  const fg = picks.find((p) => p.fg)?.fg;
  if (fg) style.color = fg;
  const outline = picks.find((p) => p.outline)?.outline;
  if (outline) {
    style.outline = `${outline.w}px solid ${outline.colour}`;
    style.outlineOffset = outline.gap;
  }
  if (has('error')) {
    style.textDecoration = `underline wavy ${d.intent.danger}`;
    style.textDecorationThickness = 2;
    style.textUnderlineOffset = 3;
  } else if (has('warning')) {
    style.textDecoration = `underline wavy ${d.intent.warning}`;
    style.textDecorationThickness = 1;
    style.textUnderlineOffset = 3;
  } else if (ts.underline) {
    style.textDecoration = 'underline';
    style.textUnderlineOffset = 3;
  }
  return style;
}

export function Editor({ cfg, level, grey }: { cfg: Cfg; level: Level; grey?: boolean }) {
  const d = LV[level];
  const looks = looksFor(cfg, level);
  const shown = LINES.slice(FIRST - 1, LAST);
  return (
    <div
      className="overflow-x-auto border-2 border-edge-strong"
      style={{ background: d.surface.sunken, filter: grey ? 'grayscale(1)' : undefined }}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">
        <span>paginate.ts · lines {FIRST}-{LAST}</span>
        <span>{grey ? '[ greyscale ]' : `find "items": ${CURRENT_MATCH + 1} of ${MATCHES.length}`}</span>
      </div>
      <pre className="m-0 min-w-[34rem] py-1 font-mono text-[11px] leading-[18px]">
        {shown.map((text, i) => {
          const no = FIRST + i;
          const cur = no === CURRENT_LINE;
          return (
            <div key={no} className="flex" style={cur ? { background: looks.line.fill } : undefined}>
              <span
                aria-hidden="true"
                className={`w-8 shrink-0 select-none pr-2 text-right ${cur ? 'font-bold text-content-primary' : 'text-content-muted'}`}
              >
                {no}
              </span>
              <code className="whitespace-pre pl-1">
                {piecesOf(text, no).map((p, j) => (
                  <span key={j} style={pieceStyle(cfg, level, p)}>
                    {p.text}
                  </span>
                ))}
              </code>
            </div>
          );
        })}
      </pre>
      <Diff cfg={cfg} level={level} />
    </div>
  );
}

function Diff({ cfg, level }: { cfg: Cfg; level: Level }) {
  const d = LV[level];
  const looks = looksFor(cfg, level);
  const addColour = cfg.diff === 'X3' ? d.intent.info : d.intent.success;
  const delColour = cfg.diff === 'X3' ? d.intent.warning : d.intent.danger;
  return (
    <div className="border-t-2 border-edge-subtle">
      <p className="m-0 border-b border-edge-subtle px-2 py-0.5 font-mono text-[10px] text-content-muted">diff · HEAD to working</p>
      <pre className="m-0 min-w-[34rem] py-1 font-mono text-[11px] leading-[18px]">
        {DIFF_LINES.map((l, i) => {
          const bg = l.sign === 'add' ? looks.add.fill : l.sign === 'remove' ? looks.del.fill : undefined;
          const mark = l.sign === 'add' ? '+' : l.sign === 'remove' ? '−' : ' ';
          const markColour = l.sign === 'add' ? addColour : l.sign === 'remove' ? delColour : undefined;
          return (
            <div key={i} className="flex" style={{ background: bg }}>
              <span aria-hidden="true" className="w-8 shrink-0 select-none pr-2 text-right text-content-muted">
                {l.newNo ?? l.oldNo}
              </span>
              <span aria-hidden="true" className="w-3 shrink-0 select-none text-center font-bold" style={{ color: markColour }}>
                {mark}
              </span>
              <code className="whitespace-pre pl-1">
                {tokenizeLine(l.text).map((t, j) => {
                  const ts = tokenStyle(cfg, d, t.kind);
                  return (
                    <span
                      key={j}
                      style={{
                        color: ts.colour,
                        fontWeight: ts.bold ? 700 : undefined,
                        fontStyle: ts.italic ? 'italic' : undefined,
                        textDecoration: ts.underline ? 'underline' : undefined,
                        textUnderlineOffset: 3,
                      }}
                    >
                      {t.text}
                    </span>
                  );
                })}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
