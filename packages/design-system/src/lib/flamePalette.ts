/**
 * How a flame graph paints its frames, built from theme roles only.
 *
 * A flame graph with one fill is a wall: stacks only separate when
 * neighbouring frames differ. Three palettes:
 *
 * - `warm` — the classic look. A frame's name hashes into one of eight steps
 *   between `intent.danger` and `intent.warning`, mixed in OKLCH, so a
 *   function is the same colour wherever it appears and neighbours differ.
 *   On midnight that runs pink → coral → amber → yellow; on sketch, red →
 *   rust → brown.
 * - `package` — one role per namespace (`System.*`, `Microsoft.*`, `Npgsql.*`,
 *   app code, the runtime's `[GC]`/`[JIT]`/`[Native]` frames), as speedscope
 *   colours by module, with a lighter or darker second step by name hash.
 * - `theme` — the system's own surfaces, for a page that wants the graph quiet.
 *
 * Every fill names its label colour, and `flamePalette.test.ts` computes the
 * mix on every Level and asserts that label clears 4.5:1 — so a palette change
 * that breaks contrast fails a test rather than a reader.
 *
 * The class strings are literals because Tailwind reads source text; `mix`
 * restates each one as data so the test can compute it.
 */

/** A theme role a swatch is mixed from, as `levels.ts` names it. */
export type FlameRole =
  | 'intent.danger'
  | 'intent.warning'
  | 'intent.success'
  | 'accent.primary'
  | 'accent.tertiary'
  | 'accent.quiet'
  | 'surface.base'
  | 'surface.raised'
  | 'text.primary'
  | 'text.muted';

/** One fill and the label drawn on it. */
export interface FlameSwatch {
  /** The Tailwind fill class. */
  fill: string;
  /** The label class: whichever of the two text roles clears 4.5:1 on this fill on every Level. */
  label: 'fill-content-inverse' | 'fill-content-primary';
  /** The fill as data: one role, or `[a, percent of a, b]` mixed in OKLCH. */
  mix: readonly [FlameRole] | readonly [FlameRole, number, FlameRole];
  /**
   * A different fill on the dark Level, where the light one's would sink into
   * the ground. Classes carry the `dark:` variant; `mix` and `label` restate
   * them for the contrast test.
   */
  dark?: {
    fill: string;
    label: 'dark:fill-content-inverse' | 'dark:fill-content-primary';
    mix: readonly [FlameRole] | readonly [FlameRole, number, FlameRole];
  };
}

/** `palette` values. */
export type FlamePalette = 'warm' | 'package' | 'theme';

/** Eight steps from `intent.danger` to `intent.warning`. */
export const WARM_SWATCHES: readonly FlameSwatch[] = [
  { fill: 'fill-intent-danger', label: 'fill-content-inverse', mix: ['intent.danger'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_86%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 86, 'intent.warning'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_71%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 71, 'intent.warning'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_57%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 57, 'intent.warning'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_43%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 43, 'intent.warning'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_29%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 29, 'intent.warning'] },
  { fill: 'fill-[color-mix(in_oklch,var(--color-intent-danger)_14%,var(--color-intent-warning))]', label: 'fill-content-inverse', mix: ['intent.danger', 14, 'intent.warning'] },
  { fill: 'fill-intent-warning', label: 'fill-content-inverse', mix: ['intent.warning'] },
];

/** The namespaces `package` tells apart. */
export type FlamePackage = 'app' | 'system' | 'microsoft' | 'data' | 'runtime' | 'other';

/**
 * Two steps per namespace: the role, and the role eased 15% toward the ink —
 * lighter on a dark Level, darker on a light one, so the label keeps its side.
 */
export const PACKAGE_SWATCHES: Readonly<Record<FlamePackage, readonly FlameSwatch[]>> = {
  app: [
    { fill: 'fill-intent-success', label: 'fill-content-inverse', mix: ['intent.success'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-intent-success)_85%,var(--color-content-primary))]', label: 'fill-content-inverse', mix: ['intent.success', 85, 'text.primary'] },
  ],
  system: [
    { fill: 'fill-accent-primary', label: 'fill-content-inverse', mix: ['accent.primary'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-accent-primary)_85%,var(--color-content-primary))]', label: 'fill-content-inverse', mix: ['accent.primary', 85, 'text.primary'] },
  ],
  microsoft: [
    { fill: 'fill-[color-mix(in_oklch,var(--color-accent-primary)_50%,var(--color-accent-tertiary))]', label: 'fill-content-inverse', mix: ['accent.primary', 50, 'accent.tertiary'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-accent-primary)_38%,var(--color-accent-tertiary))]', label: 'fill-content-inverse', mix: ['accent.primary', 38, 'accent.tertiary'] },
  ],
  data: [
    { fill: 'fill-intent-warning', label: 'fill-content-inverse', mix: ['intent.warning'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-intent-warning)_85%,var(--color-content-primary))]', label: 'fill-content-inverse', mix: ['intent.warning', 85, 'text.primary'] },
  ],
  runtime: [
    { fill: 'fill-accent-tertiary', label: 'fill-content-inverse', mix: ['accent.tertiary'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-accent-tertiary)_85%,var(--color-content-primary))]', label: 'fill-content-inverse', mix: ['accent.tertiary', 85, 'text.primary'] },
  ],
  other: [
    { fill: 'fill-accent-quiet', label: 'fill-content-inverse', mix: ['accent.quiet'] },
    { fill: 'fill-[color-mix(in_oklch,var(--color-accent-quiet)_85%,var(--color-content-primary))]', label: 'fill-content-inverse', mix: ['accent.quiet', 85, 'text.primary'] },
  ],
};

/**
 * A diff's unchanged frames, three steps by name hash so neighbours separate:
 * on a light Level the raised sheet eased toward the ink; on the dark one a
 * mid-grey ramp from the muted ink, so the unchanged bulk of the graph is
 * visible rather than one shade off the ground.
 */
export const SAME_SWATCHES: readonly FlameSwatch[] = [
  {
    fill: 'fill-surface-raised', label: 'fill-content-primary', mix: ['surface.raised'],
    dark: { fill: 'dark:fill-content-muted', label: 'dark:fill-content-inverse', mix: ['text.muted'] },
  },
  {
    fill: 'fill-[color-mix(in_oklch,var(--color-surface-raised)_92%,var(--color-content-primary))]', label: 'fill-content-primary', mix: ['surface.raised', 92, 'text.primary'],
    dark: { fill: 'dark:fill-[color-mix(in_oklch,var(--color-content-muted)_88%,var(--color-surface-raised))]', label: 'dark:fill-content-inverse', mix: ['text.muted', 88, 'surface.raised'] },
  },
  {
    fill: 'fill-[color-mix(in_oklch,var(--color-surface-raised)_85%,var(--color-content-primary))]', label: 'fill-content-primary', mix: ['surface.raised', 85, 'text.primary'],
    dark: { fill: 'dark:fill-[color-mix(in_oklch,var(--color-content-muted)_88%,var(--color-content-primary))]', label: 'dark:fill-content-inverse', mix: ['text.muted', 88, 'text.primary'] },
  },
];

/** FNV-1a: a stable 32-bit hash of a frame name, so a function keeps its colour across renders and profiles. */
export function flameNameHash(name: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The namespace a .NET (or similar) frame belongs to. */
export function flamePackage(name: string): FlamePackage {
  if (name.startsWith('[')) return 'runtime';
  const head = name.split('.')[0];
  if (head === 'System') return 'system';
  if (head === 'Microsoft') return 'microsoft';
  if (head === 'Npgsql') return 'data';
  if (/^[A-Z][A-Za-z0-9]*$/.test(head) && name.includes('.')) return 'app';
  return 'other';
}

/** The swatch for a frame; `null` for `theme`, which draws with the surfaces. */
export function flameSwatch(palette: FlamePalette, name: string): FlameSwatch | null {
  const hash = flameNameHash(name);
  if (palette === 'warm') return WARM_SWATCHES[hash % WARM_SWATCHES.length];
  if (palette === 'package') {
    const swatches = PACKAGE_SWATCHES[flamePackage(name)];
    return swatches[hash % swatches.length];
  }
  return null;
}

/** An unchanged frame's swatch in a diff, varied by name hash. */
export function flameSameSwatch(name: string): FlameSwatch {
  return SAME_SWATCHES[flameNameHash(name) % SAME_SWATCHES.length];
}
