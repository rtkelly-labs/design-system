/**
 * Site-local colour maths for the Phase 2 board. NOT the package's helpers:
 * `@rtkelly13/design-system` exports parseColor, composite, contrastRatio and
 * the level data, but no OKLab, deltaE, mixing or CVD code (the 0.04 gate lives
 * in scripts, not in dist). This file replicates it so the board can print the
 * numbers. Scale matches the docs: OKLab L in 0..1, Euclidean deltaE.
 */
import { composite, parseColor } from '@rtkelly13/design-system';

type V3 = [number, number, number];

const toLin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLin = (l: number) => {
  const c = Math.min(1, Math.max(0, l));
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
};

export function toLinear(hex: string): V3 {
  const { r, g, b } = parseColor(hex);
  return [toLin(r), toLin(g), toLin(b)];
}

export function linearToHex([r, g, b]: V3): string {
  const h = (n: number) => fromLin(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function toOklab(hex: string): V3 {
  const [r, g, b] = toLinear(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function fromOklab([L, a, b]: V3): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return linearToHex([
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]);
}

export function deltaE(a: string, b: string): number {
  const x = toOklab(a);
  const y = toOklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** `pct` of `fg` into `bg`, mixed in OKLab: what Tailwind's `/15` and color-mix(in oklab) do. */
export function mixOklab(fg: string, bg: string, pct: number): string {
  const f = toOklab(fg);
  const g = toOklab(bg);
  const t = pct / 100;
  return fromOklab([g[0] + (f[0] - g[0]) * t, g[1] + (f[1] - g[1]) * t, g[2] + (f[2] - g[2]) * t]);
}

/** Six-digit hex for an opaque colour, from any parseable input. */
export function toHex(value: string): string {
  const { r, g, b } = parseColor(value);
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Eight-digit hex literal for a colour at an alpha. */
export function withAlpha(hex: string, alpha: number): string {
  return `${toHex(hex)}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

/** Flatten a translucent eight-digit hex onto an opaque ground, as a six-digit hex. */
export function flatten(over: string, ground: string): string {
  const c = composite(parseColor(over), parseColor(ground));
  return toHex(`rgb(${c.r}, ${c.g}, ${c.b})`);
}

/** Machado, Oliveira and Fernandes 2009, severity 1.0, applied in linear RGB. */
export const CVD_MATRIX = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
} as const;

export type Vision = 'normal' | keyof typeof CVD_MATRIX;
export const VISIONS: readonly Vision[] = ['normal', 'deuteranopia', 'protanopia'];

export function simulate(hex: string, vision: Vision): string {
  if (vision === 'normal') return hex;
  const m = CVD_MATRIX[vision];
  const [r, g, b] = toLinear(hex);
  return linearToHex([
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ]);
}

export interface Pair {
  min: number;
  a: number;
  b: number;
}

/** The smallest pairwise deltaE in a colour set, and which pair it is. */
export function minPair(colours: readonly string[], vision: Vision = 'normal'): Pair {
  const sim = colours.map((c) => simulate(c, vision));
  let best: Pair = { min: Infinity, a: 0, b: 0 };
  for (let i = 0; i < sim.length; i++) {
    for (let j = i + 1; j < sim.length; j++) {
      const d = deltaE(sim[i]!, sim[j]!);
      if (d < best.min) best = { min: d, a: i, b: j };
    }
  }
  return best;
}

/** All k-subsets of an array, in order. */
export function subsets<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const walk = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      acc.push(items[i]!);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return out;
}

export const fmt = (n: number, d = 2) => n.toFixed(d);
