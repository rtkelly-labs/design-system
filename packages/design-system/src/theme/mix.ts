/**
 * Colour mixing, for deriving the tints `levels.ts` declares as literals.
 *
 * Nothing at runtime calls this. A tint is a literal opaque hex in `levels.ts`
 * (rule 4 there: `color-mix()` percentages do not hold on both grounds), and
 * `levels.test.ts` calls {@link mixOklab} to assert each literal still equals
 * its role mixed into `surface.base` at the level's declared strength, so a
 * palette edit that forgets to re-derive a tint fails a test instead of drifting.
 */

import { parseColor } from './contrast';

type V3 = readonly [number, number, number];

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l: number) => {
  const c = Math.min(1, Math.max(0, l));
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
};

function toOklab(hex: string): V3 {
  const { r, g, b } = parseColor(hex);
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: V3): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const hex = (n: number) => fromLinear(n).toString(16).padStart(2, '0');
  return `#${hex(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${hex(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  )}${hex(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
}

/**
 * `percent` of `foreground` mixed into `background`, in OKLab — the space
 * Tailwind's `/15` and `color-mix(in oklab)` use. Returns an opaque `#rrggbb`.
 */
export function mixOklab(foreground: string, background: string, percent: number): string {
  const f = toOklab(foreground);
  const g = toOklab(background);
  const t = percent / 100;
  return fromOklab([g[0] + (f[0] - g[0]) * t, g[1] + (f[1] - g[1]) * t, g[2] + (f[2] - g[2]) * t]);
}
