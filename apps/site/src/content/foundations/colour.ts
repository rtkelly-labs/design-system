/**
 * The one colour helper the package does not export: OKLCH, for the brown/olive
 * check. Everything else (contrast, compositing, deltaE) is the package's own.
 */
import { parseColor } from '@rtkelly13/design-system';

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** OKLCH of a colour: lightness 0..1, chroma, hue in degrees. */
export function oklch(value: string) {
  const { r, g, b } = parseColor(value);
  const [R, G, B] = [lin(r), lin(g), lin(b)] as const;
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

/** Brown or olive: an orange-to-yellow-green hue that is dark and coloured. Gold and yellow are light; neutrals have no chroma. */
export const isBrown = (value: string) => {
  const { L, C, h } = oklch(value);
  return C > 0.04 && h >= 40 && h <= 130 && L < 0.7;
};
