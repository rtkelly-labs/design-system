import { describe, expect, it } from 'vitest';
import { LEVELS, THEME_LEVELS } from '../theme/levels';
import {
  flameNameHash,
  flamePackage,
  flameSwatch,
  PACKAGE_SWATCHES,
  SAME_SWATCHES,
  WARM_SWATCHES,
  type FlameRole,
  type FlameSwatch,
} from './flamePalette';

// ---- Colour arithmetic: CSS `color-mix(in oklch, …)`, computed -------------

type Rgb = [number, number, number];
const hexToRgb = (hex: string): Rgb => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as Rgb;
};
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklch([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

function oklchToRgb([L, C, H]: [number, number, number]): Rgb {
  const A = C * Math.cos((H * Math.PI) / 180);
  const B = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map((c) => Math.min(1, Math.max(0, fromLinear(c)))) as Rgb;
}

/** `color-mix(in oklch, a p%, b)`: L and C linear, hue along the shorter arc. */
function mixOklch(a: Rgb, p: number, b: Rgb): Rgb {
  const [la, ca, ha] = rgbToOklch(a);
  const [lb, cb, hb] = rgbToOklch(b);
  const t = 1 - p / 100;
  // An achromatic end has no hue to interpolate: it takes the other's.
  const h1 = ca < 1e-4 ? hb : ha;
  const h2 = cb < 1e-4 ? ha : hb;
  let delta = h2 - h1;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return oklchToRgb([la + (lb - la) * t, ca + (cb - ca) * t, (h1 + delta * t + 360) % 360]);
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
const contrast = (a: Rgb, b: Rgb) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

function role(level: (typeof THEME_LEVELS)[number], name: FlameRole): Rgb {
  const definition = LEVELS[level] as unknown as Record<string, Record<string, string>>;
  const [group, key] = name.split('.');
  return hexToRgb(definition[group][key]);
}

function swatchColour(level: (typeof THEME_LEVELS)[number], swatch: FlameSwatch): Rgb {
  const [a, p, b] = swatch.mix;
  return p === undefined || b === undefined ? role(level, a) : mixOklch(role(level, a), p, role(level, b));
}

/** The class a swatch's `mix` should be written as. */
function classFor(swatch: FlameSwatch): string {
  const variable = (name: FlameRole) => `var(--color-${name.replace('text.', 'content.').replace('.', '-')})`;
  const [a, p, b] = swatch.mix;
  if (p === undefined || b === undefined) return `fill-${a.replace('text.', 'content.').replace('.', '-')}`;
  return `fill-[color-mix(in_oklch,${variable(a)}_${p}%,${variable(b)})]`;
}

const ALL: Array<[string, FlameSwatch]> = [
  ...WARM_SWATCHES.map((swatch, index) => [`warm ${index}`, swatch] as [string, FlameSwatch]),
  ...Object.entries(PACKAGE_SWATCHES).flatMap(([name, list]) => list.map((swatch, index) => [`package ${name} ${index}`, swatch] as [string, FlameSwatch])),
  ...SAME_SWATCHES.map((swatch, index) => [`same ${index}`, swatch] as [string, FlameSwatch]),
];

describe('flame palettes', () => {
  it.each(ALL)('%s: the class says what the data says', (_, swatch) => {
    expect(swatch.fill).toBe(classFor(swatch));
  });

  it.each(THEME_LEVELS.flatMap((level) => ALL.map(([name, swatch]) => [level, name, swatch] as const)))('%s %s: its label clears 4.5:1', (level, _, swatch) => {
    const fill = swatchColour(level, swatch);
    const label = role(level, swatch.label === 'fill-content-inverse' ? ('text.inverse' as FlameRole) : 'text.primary');
    expect(contrast(fill, label)).toBeGreaterThanOrEqual(4.5);
  });

  it('warm steps run from danger to warning and differ from their neighbours', () => {
    for (const level of THEME_LEVELS) {
      const colours = WARM_SWATCHES.map((swatch) => swatchColour(level, swatch));
      for (let index = 1; index < colours.length; index += 1) expect(colours[index].join()).not.toBe(colours[index - 1].join());
    }
  });

  it('hashes names stably and sorts namespaces', () => {
    expect(flameNameHash('System.String.Concat')).toBe(flameNameHash('System.String.Concat'));
    expect(flameSwatch('warm', 'Shop.Api.OrderService.PlaceAsync')).toBe(flameSwatch('warm', 'Shop.Api.OrderService.PlaceAsync'));
    expect(flamePackage('System.Text.Json.Utf8JsonWriter.WriteStringValue')).toBe('system');
    expect(flamePackage('Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke')).toBe('microsoft');
    expect(flamePackage('Npgsql.NpgsqlCommand.ExecuteReader')).toBe('data');
    expect(flamePackage('Shop.Api.OrderService.PlaceAsync')).toBe('app');
    expect(flamePackage('[GC] gc_heap::mark_phase')).toBe('runtime');
    expect(flamePackage('main')).toBe('other');
    expect(flameSwatch('theme', 'anything')).toBeNull();
  });
});
