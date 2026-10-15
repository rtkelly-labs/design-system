/**
 * Round 3, D11: ink density, as a computed estimate.
 *
 * "Ink" is any pixel that is not the row's background. The geometry of each
 * label (box, border, marker) is exact from the CSS the board writes; glyph
 * coverage is a per-character constant, calibrated by rasterising the real
 * font on a canvas (see GLYPH below). So the figures are estimates of the
 * rendered page, stable across renders, and they are stated as such.
 *
 *   coverage  = non-background pixels / nominal cell pixels. A filled label
 *               counts its whole box once; an unfilled one counts border,
 *               marker and glyph pixels.
 *   weighted  = each region's area times how far its colour is from the
 *               background, (contrast ratio - 1) / 20, over the same cell.
 *               A pale tint covers a lot and weighs little; a hairline covers
 *               little and weighs little; a solid fill does both.
 */
import { LV, ratio } from '../p2/Frame';
import type { Level } from '../p2/Frame';
import { role } from './model';
import type { RoleKey } from './model';
import { LABEL_ROLE, STATUS_ROLE } from './labels';
import type { LabelId, Opt, StatusId, StatusStyle } from './labels';

/** IBM Plex Mono advance, in em. */
const ADV = 0.6;
/** Ink pixels per character per em squared: regular and bold weight. Calibrated by rasterising the font on a canvas. */
export const GLYPH = { regular: 0.127, bold: 0.196 };

interface Prim {
  area: number;
  colour: string;
  /** What the region sits on: the row, or the label's own fill. */
  on: 'row' | 'fill';
  /** True when this region is already inside a fill's box and so adds no coverage of its own. */
  inside?: boolean;
}

interface Unit {
  w: number;
  h: number;
  prims: Prim[];
  fill?: { colour: string };
}

const edgeArea = (w: number, h: number, bw: number) => 2 * (w + h) * bw - 4 * bw * bw;
const text = (chars: number, fs: number, bold: boolean) => chars * fs * fs * (bold ? GLYPH.bold : GLYPH.regular);

function tintOf(level: Level, r: RoleKey): string {
  const d = LV[level];
  const [g, k] = r.split('.') as ['accent' | 'intent', string];
  return (d.tint[g] as Record<string, string>)[k]!;
}

function marker(level: Level, r: RoleKey, chars: number): Unit {
  const d = LV[level];
  const fs = 11;
  return {
    w: 6 + 4 + chars * ADV * fs,
    h: 16,
    prims: [
      { area: 36, colour: role(d, r), on: 'row' },
      { area: text(chars, fs, false), colour: d.text.secondary, on: 'row' },
    ],
  };
}

/** One label (or status) in one treatment, as regions with colours. */
export function unit(level: Level, opt: Opt | StatusStyle, name: string, r: RoleKey, ctx: 'inbox' | 'table' | 'card' | 'status'): Unit {
  const d = LV[level];
  const n = name.length;
  switch (opt) {
    case 'CUR':
    case 'badge': {
      if (opt === 'badge' || ctx === 'inbox') {
        // Badge sm: 1px border-strong, fill = surface.base (the row), bold text in the accent.
        const fs = 10.4;
        const w = n * ADV * fs + 12 + 2;
        const h = fs * 1.5 + 2;
        const ink = opt === 'badge' ? role(d, r) : d.accent.quiet;
        return {
          w,
          h,
          prims: [
            { area: edgeArea(w, h, 1), colour: d.border.strong, on: 'row' },
            { area: text(n, fs, true), colour: ink, on: 'row' },
          ],
        };
      }
      // Tag sm: solid accent fill, 1px border-strong, inverse bold text, `#` prefix.
      const fs = 10.4;
      const w = (n + 1) * ADV * fs + 12 + 2;
      const h = fs * 1.5 + 2;
      return {
        w,
        h,
        fill: { colour: role(d, r) },
        prims: [
          { area: edgeArea(w, h, 1), colour: d.border.strong, on: 'row' },
          { area: text(n + 1, fs, true), colour: d.text.inverse, on: 'fill', inside: true },
        ],
      };
    }
    case 'A':
    case 'E':
    case 'F':
      return marker(level, r, n);
    case 'B': {
      const fs = 11;
      return {
        w: (n + 2) * ADV * fs,
        h: 16,
        prims: [
          { area: text(n, fs, false), colour: d.text.secondary, on: 'row' },
          { area: text(2, fs, false), colour: role(d, r), on: 'row' },
        ],
      };
    }
    case 'C': {
      const fs = 10;
      const w = n * ADV * fs + 12 + 2;
      const h = 18;
      return {
        w,
        h,
        prims: [
          { area: edgeArea(w, h, 1), colour: d.border.subtle, on: 'row' },
          { area: text(n, fs, false), colour: d.text.secondary, on: 'row' },
        ],
      };
    }
    case 'D': {
      const fs = 11;
      const w = n * ADV * fs + 12;
      return {
        w,
        h: 16,
        fill: { colour: tintOf(level, r) },
        prims: [{ area: text(n, fs, false), colour: d.text.primary, on: 'fill', inside: true }],
      };
    }
    case 'glyph': {
      return { w: 16, h: 16, prims: [{ area: 12 * 12 * 0.45, colour: role(d, r), on: 'row' }] };
    }
  }
}

export interface Ink {
  /** Percent of the nominal cell that is not background. */
  coverage: number;
  /** Percent, weighted by distance from the background. */
  weighted: number;
}

function measure(level: Level, units: Unit[], cells: number, cellArea: number, raised = false): Ink {
  const d = LV[level];
  const bg = raised ? d.surface.raised : d.surface.base;
  let cov = 0;
  let wt = 0;
  for (const u of units) {
    if (u.fill) cov += u.w * u.h;
    for (const p of u.prims) {
      if (!u.fill) cov += p.area;
      const under = p.on === 'fill' && u.fill ? u.fill.colour : bg;
      wt += (p.area * (ratio(p.colour, under) - 1)) / 20;
    }
    if (u.fill) wt += (u.w * u.h * (ratio(u.fill.colour, bg) - 1)) / 20;
  }
  const total = cells * cellArea;
  return { coverage: (cov / total) * 100, weighted: (wt / total) * 100 };
}

/** Nominal cells: the labels column of the board's tables and a card's label row. */
export const CELL = { inbox: 176 * 32, status: 120 * 32, card: 208 * 22 };

export function labelInk(level: Level, opt: Opt, rows: LabelId[][], ctx: 'inbox' | 'table' | 'card'): Ink {
  const units: Unit[] = [];
  for (const ids of rows) {
    const shown = opt === 'E' ? ids.slice(0, 1) : ids;
    for (const id of shown) units.push(unit(level, opt, id, LABEL_ROLE[id], ctx));
    if (opt === 'E' && ids.length > 1) {
      const d = LV[level];
      const w = 2 * ADV * 10 + 8 + 2;
      units.push({
        w,
        h: 16,
        prims: [
          { area: edgeArea(w, 16, 1), colour: d.border.subtle, on: 'row' },
          { area: text(2, 10, false), colour: d.text.secondary, on: 'row' },
        ],
      });
    }
  }
  return measure(level, units, rows.length, ctx === 'card' ? CELL.card : CELL.inbox, ctx === 'card');
}

export function statusInk(level: Level, style: StatusStyle, rows: StatusId[]): Ink {
  const units = rows.map((s) => unit(level, style, s, STATUS_ROLE[s], 'status'));
  return measure(level, units, rows.length, CELL.status);
}

/** The 4px leading edge of D11-F's inbox rows, as ink in a 24px-wide column. */
export function edgeInk(level: Level, rows: StatusId[]): Ink {
  const d = LV[level];
  const bg = d.surface.base;
  let wt = 0;
  for (const s of rows) wt += (4 * 32 * (ratio(role(d, STATUS_ROLE[s]), bg) - 1)) / 20;
  const total = rows.length * 24 * 32;
  return { coverage: ((rows.length * 4 * 32) / total) * 100, weighted: (wt / total) * 100 };
}

export const pct = (n: number) => `${n.toFixed(1)}%`;
