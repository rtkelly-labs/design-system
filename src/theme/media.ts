/**
 * The Medium axis — the single place a spatial or temporal value is written.
 *
 * Companion to `levels.ts`, and deliberately its mirror image. A Level varies
 * *colour* and is selected at runtime by `data-theme`; a Medium varies
 * *geometry and time* and is selected at build time by which artifact is being
 * emitted. No token varies on both, and a token that varies on neither is
 * invariant and lives in `FIXED_COLOURS`. See
 * `docs/adr/0004-two-axes-level-and-medium.md`.
 *
 * ## What a Medium is
 *
 * A unit system and a time base. Not a format — that is a Target, and the two
 * do not correspond: four Targets (VS Code, Zed, Shiki, a terminal) share one
 * host geometry and declare no scale at all, while `graphic` is emitted to
 * several formats. **Developer themes are not a Medium**; a theme may not set
 * an editor's line height or a terminal's cell size.
 *
 * ## Why this file exists at all
 *
 * Everything the token layer declared before this varied by Level, so #49 —
 * spacing, type scale, motion, z-index — had nowhere to land. It kept having to
 * guess whether its values were fields on `LevelDefinition` or a flat sibling
 * record, and both answers are wrong: a Level-keyed scale authors every spacing
 * value twice for two Levels that must agree, and a single flat record forces a
 * 1080p frame and a 16px page to share a type scale, which they cannot.
 */

/**
 * Every Medium, in the order they are emitted.
 *
 * Adding one is a compile error at every `Record<Medium, T>` until each answers
 * it — the same guarantee `THEME_LEVELS` provides on the other axis, and the
 * reason the enumeration is reversible at a known cost rather than a guess.
 */
export const MEDIA = ['web', 'video', 'graphic'] as const;

export type Medium = (typeof MEDIA)[number];

/** The Medium `theme.css` and the `@theme` block carry. Exactly one, per ADR 0004. */
export const CSS_MEDIUM: Medium = 'web';

/**
 * A type step. `size` and `lineHeight` travel together because pinning a font
 * size without its leading is what let a badge inherit an article's unitless
 * 1.5 — recorded in `Button.tsx` and the reason `text-[0.75rem]` appears there
 * rather than `text-xs`.
 *
 * Units are the Medium's own: CSS `rem` on `web`, frame-relative `px` on
 * `video`, `viewBox` units on `graphic`. A number here means "in this Medium's
 * unit", which is why the field is a number and not a string.
 */
export interface TypeStep {
  readonly size: number;
  readonly lineHeight: number;
}

/** The type scale's steps, smallest first. Named, not indexed, so a step can be removed. */
export type TypeStepName = 'caption' | 'body' | 'lead' | 'title' | 'display' | 'hero';

/** Motion. `graphic` has no time base, so its durations are zero rather than absent. */
export interface Motion {
  /** Milliseconds on `web` (wall clock); frames on `video` (frame clock). */
  readonly instant: number;
  readonly quick: number;
  readonly considered: number;
  /** A CSS easing function on `web`; the same curve as a name elsewhere. */
  readonly easing: string;
}

/**
 * Every geometric and temporal value a Medium must answer.
 *
 * Adding a field here is a compile error in all three Media until each one
 * answers it — the property a bare record cannot provide, and the same
 * discipline `LevelDefinition` keeps for colour.
 */
export interface MediumDefinition {
  readonly label: string;
  readonly description: string;

  /**
   * The unit a number in this definition is measured in. Documentation rather
   * than arithmetic: nothing multiplies by it, but a reader of an emitted
   * artifact needs to know whether `4` is a CSS pixel or a frame pixel.
   */
  readonly unit: 'rem' | 'px' | 'viewBox';

  /** Spacing scale, in this Medium's unit. The brutalist grid is a 4-step. */
  readonly spacing: readonly number[];

  readonly type: Readonly<Record<TypeStepName, TypeStep>>;

  /** Font weights this Medium uses. Brutalism leans on 700/900, not 400/500. */
  readonly weight: Readonly<Record<'regular' | 'bold' | 'black', number>>;

  /**
   * Border width. The load-bearing weight is 2 on `web` — edges are drawn, not
   * implied — and a video frame needs more to survive compression.
   */
  readonly borderWidth: Readonly<Record<'hairline' | 'edge' | 'heavy', number>>;

  /**
   * Hard offset shadows. Three steps, and no blur field: a blurred shadow is a
   * different design language, so its absence is the decision.
   */
  readonly shadowOffset: Readonly<Record<'sm' | 'md' | 'lg', number>>;

  /**
   * Radius. Zero is a value on this scale, not the absence of one — which is
   * what makes `src/styles.css`'s `border-radius: 0px !important` a reset that
   * reaches the whole consumer document (#54) rather than a token.
   */
  readonly radius: Readonly<Record<'none' | 'soft', number>>;

  readonly motion: Motion;

  /** Stacking layers. A `graphic` has no stacking context to speak of. */
  readonly layer: Readonly<Record<'base' | 'raised' | 'overlay' | 'top', number>>;

  /** Focus-ring geometry. The colour is a Level's business, the width is this one's. */
  readonly focusRing: Readonly<Record<'width' | 'offset', number>>;

  /**
   * The contrast floor a Gate enforces *for this Medium*.
   *
   * The asymmetry ADR 0004 says is most likely to be got wrong later: colour
   * values do not vary by Medium, but the floors they must clear do. A
   * projected frame, a compression-damaged video and an unantialiased terminal
   * cell are not the browser's legibility problem.
   *
   * `web` restates the numbers already in `MINIMUM_RATIO`, so nothing moves on
   * merge; the other two are stricter because they have to be.
   */
  readonly contrastFloor: Readonly<Record<'role' | 'hue' | 'hueBright', number>>;
}

/**
 * The three Media.
 *
 * `web`'s values are the ones already shipping — the 4px grid, the 2px edge,
 * the 2/4/6 offset shadows, zero radius — read out of the components rather
 * than chosen here, so declaring them changes no rendering.
 */
export const MEDIA_DEFINITIONS: Readonly<Record<Medium, MediumDefinition>> = {
  web: {
    label: 'Web',
    description: 'CSS pixels, reflowing, user-zoomable. Wall clock.',
    unit: 'rem',
    spacing: [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8],
    type: {
      caption: { size: 0.75, lineHeight: 1.4 },
      body: { size: 1, lineHeight: 1.6 },
      lead: { size: 1.125, lineHeight: 1.55 },
      title: { size: 1.5, lineHeight: 1.2 },
      display: { size: 2.25, lineHeight: 1.05 },
      hero: { size: 3, lineHeight: 0.95 },
    },
    weight: { regular: 400, bold: 700, black: 900 },
    borderWidth: { hairline: 1, edge: 2, heavy: 4 },
    shadowOffset: { sm: 2, md: 4, lg: 6 },
    radius: { none: 0, soft: 0 },
    motion: { instant: 0, quick: 150, considered: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    layer: { base: 0, raised: 10, overlay: 100, top: 1000 },
    focusRing: { width: 2, offset: 2 },
    contrastFloor: { role: 4.5, hue: 5.5, hueBright: 4.5 },
  },

  video: {
    label: 'Video',
    description: 'A fixed 1920×1080 frame. No reflow, no zoom. Frame clock.',
    unit: 'px',
    // A 1080p frame is read at distance and often at half scale in a PR player,
    // so the grid is coarser and the smallest step is larger than the web's.
    spacing: [0, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256],
    // The evaluation's note, in numbers: "the type scale a 1080p frame needs
    // and a 16px web page does not". Nothing here is the web's scale scaled.
    type: {
      caption: { size: 24, lineHeight: 1.35 },
      body: { size: 32, lineHeight: 1.5 },
      lead: { size: 40, lineHeight: 1.45 },
      title: { size: 56, lineHeight: 1.15 },
      display: { size: 88, lineHeight: 1.05 },
      hero: { size: 128, lineHeight: 0.95 },
    },
    weight: { regular: 500, bold: 700, black: 900 },
    // Compression eats a 2px edge. 4 is the thinnest line that survives a
    // re-encode intact, which is why this is not the web's number.
    borderWidth: { hairline: 2, edge: 4, heavy: 8 },
    shadowOffset: { sm: 6, md: 12, lg: 18 },
    radius: { none: 0, soft: 0 },
    // Frames, not milliseconds. At 30fps `quick` is 5 frames. Durations must be
    // whole frames or a render lands mid-transition and the still is a smear —
    // which is the failure `remotion-evaluation.md` measured for the web's
    // wall-clock transitions.
    motion: { instant: 0, quick: 5, considered: 12, easing: 'easeInOutCubic' },
    layer: { base: 0, raised: 10, overlay: 100, top: 1000 },
    focusRing: { width: 4, offset: 4 },
    // A projected or compressed frame loses local contrast, so every floor
    // rises. This is the per-Medium indexing ADR 0004 calls for.
    contrastFloor: { role: 5.5, hue: 7, hueBright: 5.5 },
  },

  graphic: {
    label: 'Graphic',
    description: 'A fixed viewBox. No reflow. No time base at all.',
    unit: 'viewBox',
    spacing: [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96],
    type: {
      caption: { size: 8, lineHeight: 1.3 },
      body: { size: 12, lineHeight: 1.4 },
      lead: { size: 14, lineHeight: 1.4 },
      title: { size: 20, lineHeight: 1.2 },
      display: { size: 32, lineHeight: 1.05 },
      hero: { size: 48, lineHeight: 1 },
    },
    weight: { regular: 400, bold: 700, black: 900 },
    // A stroke in viewBox units scales with the drawing, so 1 is a real
    // hairline here rather than a sub-pixel risk.
    borderWidth: { hairline: 0.5, edge: 1, heavy: 2 },
    shadowOffset: { sm: 1, md: 2, lg: 3 },
    radius: { none: 0, soft: 0 },
    // No time base. Zero rather than absent, so `Record<Medium, T>` stays
    // total and a caller cannot forget to handle this Medium.
    motion: { instant: 0, quick: 0, considered: 0, easing: 'none' },
    layer: { base: 0, raised: 1, overlay: 2, top: 3 },
    focusRing: { width: 1, offset: 1 },
    // A diagram is often reproduced in print or at thumbnail size, and unlike
    // a video it cannot rely on motion to carry meaning.
    contrastFloor: { role: 5.5, hue: 7, hueBright: 5.5 },
  },
};

/** Type guard for a Medium arriving from an emitter flag or an env var. */
export function isMedium(value: unknown): value is Medium {
  return typeof value === 'string' && (MEDIA as readonly string[]).includes(value);
}
