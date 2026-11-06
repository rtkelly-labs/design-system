import { LEVELS, PALETTE_HUES } from './levels.ts';
import type { LevelDefinition, ThemeLevel } from './levels.ts';

/**
 * The sixteen ANSI slots, and the fan-out that fills them from ten Hues.
 *
 * ## Why a terminal is the cheapest Target on the list
 *
 * Sixteen Slots, a foreground, a background, a cursor and a selection. No
 * chrome, no scopes, no semantic map. And four encodings — iTerm2, Windows
 * Terminal, Alacritty, Ghostty — are the same sixteen values written four
 * ways, so one fan-out unlocks all of them.
 *
 * It was also, until `palette` existed, completely impossible. A terminal has
 * sixteen positions *named by colour* and no concept of a keyword, so a Role
 * vocabulary could not address it at all. Measured before the Hue layer
 * landed: 5 of 16 slots fillable, with `accent.tertiary` stretched across both
 * `red` and `magenta` — 30° from each — and `blue` uncovered at 52°.
 *
 * ## Why the map lives here and not in a Level
 *
 * ADR 0001: *"Slot maps are Derived, and their fan-out lives in the Emitter."*
 * It is data, so it is unit-testable, and keeping it out of the Levels means
 * adding a Target can never change a colour. `SLOTS` below is the whole of the
 * decision; the values are the Level's.
 *
 * ## The one honest compromise
 *
 * `blue` resolves to `palette.blue`, which sits at **233°** — a sky blue, not
 * a true blue — because that is where six years of authored colour put the
 * dark Level's primary accent. `violet` is at 295°, leaving a 62° gap where a
 * true blue would be. Recorded rather than papered over: an eleventh Hue would
 * close it, and ten is already the ceiling, with `teal`/`cyan` on the light
 * Level at ΔE 0.049.
 */

/**
 * The four achromatic slots, resolved by *lightness* rather than by name.
 *
 * The first version of this map read `surface.sunken` for `black` and
 * `text.secondary` for `white` — correct on a dark Level and wrong on a light
 * one, where it gave the terminal a `black` of `#efeadf` (nearly white) and
 * collided `brightBlack` and `brightWhite` on `#ffffff`. A terminal's ramp runs
 * dark to light regardless of which way the theme runs, so the slots have to
 * ask about lightness, not about which Group a value lives in.
 *
 * `fixed.white` is deliberately not used for `lightest`. A terminal cell
 * painted pure white inside a `#f5f3ec` window reads as a hole in the same way
 * true black does inside `#121316` — the extreme should be the theme's own
 * extreme, and on the dark Level `text.primary` already is.
 */
function achromatic(
  level: LevelDefinition,
  step: 'darkest' | 'dark' | 'light' | 'lightest',
): string {
  const dark = level.polarity === 'dark';
  switch (step) {
    // The terminal's own black: the theme's deepest ground on a dark Level, its
    // ink on a light one.
    case 'darkest':
      return dark ? level.surface.sunken : level.text.primary;
    case 'dark':
      return dark ? level.surface.raised : level.text.secondary;
    case 'light':
      return dark ? level.text.secondary : level.surface.sunken;
    case 'lightest':
      return dark ? level.text.primary : level.surface.raised;
  }
}

/** The sixteen slots, in the order every terminal format lists them. */
export const ANSI_SLOTS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
] as const;

export type AnsiSlot = (typeof ANSI_SLOTS)[number];

/**
 * What fills each slot.
 *
 * `hue` reads `palette` (or `paletteBright` when `bright`); `role` reads a
 * named Role path for the four achromatic slots, which are grounds and inks
 * rather than hues. A slot is never a literal — that would be a second origin,
 * which ADR 0002 forbids.
 */
type SlotSource =
  | { readonly kind: 'hue'; readonly hue: (typeof PALETTE_HUES)[number]; readonly bright: boolean }
  | { readonly kind: 'role'; readonly read: (level: LevelDefinition) => string }
  | { readonly kind: 'fixed'; readonly read: () => string };

/**
 * The fan-out map. **This is the whole decision**, and it is data.
 *
 * The four achromatic slots are the interesting ones. A terminal's `black` is
 * not `fixed.black` — it is the darkest ground the theme *has*, because a
 * terminal cell painted true black inside a `#121316` window reads as a hole.
 * Likewise `white` is the theme's ink, not `#ffffff`. Only `brightWhite`
 * reaches for the invariant, because "brighter than the ink" has nowhere else
 * to go.
 */
export const SLOTS: Readonly<Record<AnsiSlot, SlotSource>> = {
  black: { kind: 'role', read: (l) => achromatic(l, 'darkest') },
  red: { kind: 'hue', hue: 'red', bright: false },
  green: { kind: 'hue', hue: 'green', bright: false },
  yellow: { kind: 'hue', hue: 'yellow', bright: false },
  blue: { kind: 'hue', hue: 'blue', bright: false },
  magenta: { kind: 'hue', hue: 'magenta', bright: false },
  cyan: { kind: 'hue', hue: 'cyan', bright: false },
  white: { kind: 'role', read: (l) => achromatic(l, 'light') },

  brightBlack: { kind: 'role', read: (l) => achromatic(l, 'dark') },
  brightRed: { kind: 'hue', hue: 'red', bright: true },
  brightGreen: { kind: 'hue', hue: 'green', bright: true },
  brightYellow: { kind: 'hue', hue: 'yellow', bright: true },
  brightBlue: { kind: 'hue', hue: 'blue', bright: true },
  brightMagenta: { kind: 'hue', hue: 'magenta', bright: true },
  brightCyan: { kind: 'hue', hue: 'cyan', bright: true },
  brightWhite: { kind: 'role', read: (l) => achromatic(l, 'lightest') },
};

/**
 * The four values a terminal needs beyond the sixteen.
 *
 * `selectionBackground` is the one that would be wrong to derive. A terminal
 * has no alpha, so a selection band must be an opaque colour that every
 * foreground still reads against — which is why it is `surface.raised` and not
 * a tinted `surface.base`. Composited contrast, resolved at declaration time
 * because the Target cannot resolve it at paint time.
 */
export interface AnsiChrome {
  readonly background: string;
  readonly foreground: string;
  readonly cursor: string;
  readonly selectionBackground: string;
}

export interface AnsiScheme {
  readonly level: ThemeLevel;
  readonly slots: Readonly<Record<AnsiSlot, string>>;
  readonly chrome: AnsiChrome;
}

/** Resolve one Level into a complete sixteen-colour scheme. */
export function ansiScheme(level: ThemeLevel): AnsiScheme {
  const def = LEVELS[level];
  const slots = {} as Record<AnsiSlot, string>;

  for (const slot of ANSI_SLOTS) {
    const source = SLOTS[slot];
    slots[slot] =
      source.kind === 'hue'
        ? (source.bright ? def.paletteBright : def.palette)[source.hue]
        : source.kind === 'role'
          ? source.read(def)
          : source.read();
  }

  return {
    level,
    slots,
    chrome: {
      background: def.surface.base,
      foreground: def.text.primary,
      cursor: def.accent.primary,
      selectionBackground: def.surface.raised,
    },
  };
}
