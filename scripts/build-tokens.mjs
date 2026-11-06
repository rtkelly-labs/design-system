#!/usr/bin/env node
/**
 * Emit `src/theme.css` from `src/theme/levels.ts`.
 *
 * TypeScript gives exhaustiveness on the TS side of the ladder and nothing at
 * all on the CSS side — which is exactly where the drift lived: nine files
 * hand-listing three theme names, none of them connected, a missed one failing
 * silently by falling back to the root theme. Generating the CSS from the same
 * module closes that, and `--check` turns it into a CI gate rather than a habit.
 *
 *   node scripts/build-tokens.mjs           write the file
 *   node scripts/build-tokens.mjs --check   fail if the file is stale
 *
 * No build dependency: Node 22 strips TypeScript types natively, so this
 * imports the source module directly.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEVELS, THEME_LEVELS, FIXED_COLOURS } from '../src/theme/levels.ts';
import { CSS_MEDIUM, MEDIA_DEFINITIONS } from '../src/theme/media.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Generated straight into the file consumers already import, rather than into a
// second file behind an @import — one fewer thing to copy at build time and one
// fewer way for the two to disagree.
const OUTPUT = path.join(ROOT, 'src', 'theme.css');

const BANNER = `/* GENERATED FILE — DO NOT EDIT.
 *
 * Source: src/theme/levels.ts   (edit that, not this)
 * Regenerate: pnpm tokens:build   ·   Verify: pnpm tokens:check
 *
 * Import order in a consumer's entrypoint:
 *
 *   @import "tailwindcss";
 *   @import "@rtkelly13/design-system/theme.css";
 *
 * ============================================================================
 * How the cascade works here, because it is not obvious
 * ============================================================================
 *
 * Every level block below declares LITERAL colours. That matters: a custom
 * property containing a var() reference is substituted where it is DECLARED,
 * not where it is used, so a token defined once on :root as var(--something)
 * inherits into descendants already resolved to the root theme's value — and a
 * nested theme panel keeps the outer theme's colours. The previous hand-written
 * token layer worked around that by re-declaring the indirected tokens on every
 * mode class. With literals the problem does not arise at all, and nesting to
 * any depth resolves by ordinary CSS inheritance.
 *
 * The Tailwind --color-* aliases DO indirect through --ds-*, so that a consumer
 * can override a role and have the utilities follow. Those are therefore
 * re-declared inside each level block, which is free in a generated file.
 */`;

/** `--ds-*` custom properties for one level, in a stable order. */
function levelVariables(definition) {
  const lines = [];
  const push = (name, value) => lines.push(`  --ds-${name}: ${value};`);

  for (const [key, value] of Object.entries(definition.surface)) push(`surface-${key}`, value);
  for (const [key, value] of Object.entries(definition.text)) push(`text-${key}`, value);
  for (const [key, value] of Object.entries(definition.border)) push(`border-${key}`, value);
  for (const [key, value] of Object.entries(definition.accent)) push(`accent-${key}`, value);
  for (const [key, value] of Object.entries(definition.intent)) push(`intent-${key}`, value);
  // The Hue vocabulary, declared below the Roles above. A component may not
  // read these — see `docs/adr/0001-hues-declared-below-roles.md`. They exist
  // for Targets with no notion of jobs: ANSI's sixteen slots, a diagram
  // needing N distinguishable colours, half a JetBrains scheme.
  for (const [key, value] of Object.entries(definition.palette)) push(`palette-${key}`, value);
  for (const [key, value] of Object.entries(definition.paletteBright))
    push(`palette-bright-${key}`, value);
  push('shadow-color', definition.shadow);
  push('polarity', definition.polarity);

  return lines.join('\n');
}

/**
 * The eight accent/intent roles, in the order the token tables list them.
 *
 * Only used to generate the role-named hard shadows below. Written once here
 * rather than eight times inline, for the same reason the level list lives in
 * `levels.ts`: a ninth role should not be addable in one place and missable in
 * another.
 */
const ACCENT_ROLES = [
  'accent-primary',
  'accent-secondary',
  'accent-tertiary',
  'accent-quiet',
  'intent-info',
  'intent-success',
  'intent-warning',
  'intent-danger',
];

/**
 * Hard shadows that offset in a *role's* colour.
 *
 * `--shadow-hard-md` offsets in `--ds-shadow-color`, which is the right default
 * and the wrong thing for a card that lifts in its own accent — that previously
 * forced a component back onto `shadow-hard-cyan`, i.e. back onto a hue name.
 * Deliberately 4px, matching `hard-md`: the palette-named three are 4px too, so
 * swapping one for the other cannot move a layout.
 */
/**
 * A glow per accent/intent role, matching `ROLE_SHADOWS`.
 *
 * There used to be exactly one glow (`--shadow-glow-accent`, pinned to
 * `accent.primary`) plus three hue-named ones in the compat layer —
 * `glow-cyan`, `glow-pink`, `glow-orange`. Removing the compat layer left a
 * consumer with a pink glow and nowhere to put it, which is a gap rather than a
 * migration: the asymmetry between hard shadows (role-named, complete) and
 * glows (one role, three hues) was itself a symptom of the hue layer.
 */
const ROLE_GLOWS = ACCENT_ROLES.map(
  (role) =>
    `  --shadow-glow-${role}: 0 0 10px color-mix(in oklab, var(--ds-${role}) 50%, transparent), 0 0 20px color-mix(in oklab, var(--ds-${role}) 30%, transparent);`,
).join('\n');

const ROLE_SHADOWS = ACCENT_ROLES.map(
  (role) => `  --shadow-hard-${role}: 4px 4px 0px 0px var(--ds-${role});`,
).join('\n');

/**
 * The Tailwind-facing aliases and the shadow utilities, repeated per level so
 * that var() substitution re-runs at the themed element. See the banner.
 */
const TAILWIND_ALIASES = `  --color-surface-base: var(--ds-surface-base);
  --color-surface-raised: var(--ds-surface-raised);
  --color-surface-sunken: var(--ds-surface-sunken);
  --color-surface-overlay: var(--ds-surface-overlay);
  --color-content-primary: var(--ds-text-primary);
  --color-content-secondary: var(--ds-text-secondary);
  --color-content-muted: var(--ds-text-muted);
  --color-content-inverse: var(--ds-text-inverse);
  --color-edge-strong: var(--ds-border-strong);
  --color-edge-default: var(--ds-border-default);
  --color-edge-subtle: var(--ds-border-subtle);
  --color-accent-primary: var(--ds-accent-primary);
  --color-accent-secondary: var(--ds-accent-secondary);
  --color-accent-tertiary: var(--ds-accent-tertiary);
  --color-accent-quiet: var(--ds-accent-quiet);
  --color-intent-info: var(--ds-intent-info);
  --color-intent-success: var(--ds-intent-success);
  --color-intent-warning: var(--ds-intent-warning);
  --color-intent-danger: var(--ds-intent-danger);
  --color-palette-red: var(--ds-palette-red);
  --color-palette-orange: var(--ds-palette-orange);
  --color-palette-yellow: var(--ds-palette-yellow);
  --color-palette-green: var(--ds-palette-green);
  --color-palette-teal: var(--ds-palette-teal);
  --color-palette-cyan: var(--ds-palette-cyan);
  --color-palette-blue: var(--ds-palette-blue);
  --color-palette-violet: var(--ds-palette-violet);
  --color-palette-magenta: var(--ds-palette-magenta);
  --color-palette-pink: var(--ds-palette-pink);
  --color-palette-bright-red: var(--ds-palette-bright-red);
  --color-palette-bright-orange: var(--ds-palette-bright-orange);
  --color-palette-bright-yellow: var(--ds-palette-bright-yellow);
  --color-palette-bright-green: var(--ds-palette-bright-green);
  --color-palette-bright-teal: var(--ds-palette-bright-teal);
  --color-palette-bright-cyan: var(--ds-palette-bright-cyan);
  --color-palette-bright-blue: var(--ds-palette-bright-blue);
  --color-palette-bright-violet: var(--ds-palette-bright-violet);
  --color-palette-bright-magenta: var(--ds-palette-bright-magenta);
  --color-palette-bright-pink: var(--ds-palette-bright-pink);
  --shadow-hard-sm: var(--ds-elev-sm) var(--ds-shadow-color);
  --shadow-hard-md: var(--ds-elev-md) var(--ds-shadow-color);
  --shadow-hard-lg: var(--ds-elev-lg) var(--ds-shadow-color);
${ROLE_SHADOWS}
${ROLE_GLOWS}
  --shadow-glow-accent: 0 0 10px color-mix(in oklab, var(--ds-accent-primary) 50%, transparent), 0 0 20px color-mix(in oklab, var(--ds-accent-primary) 30%, transparent);`;



/**
 * Match elements whose NEAREST themed ancestor-or-self is `level`.
 *
 * Reads as: inside this level (or being it), and neither inside nor being any
 * differently-themed element. That handles a themed panel nested in a
 * differently-themed page at any depth. It does not handle re-entering the same
 * level after leaving it (midnight > bright > midnight), where the innermost
 * subtree is excluded — the variables themselves still resolve correctly there,
 * so only the variant escape hatch is affected.
 */
function levelVariant(level) {
  const other = `[data-theme]:not([data-theme="${level}"])`;
  return `&:where([data-theme="${level}"], [data-theme="${level}"] *):not(:where(${other}, ${other} *))`;
}

/** The same test, for a set of levels — used for the polarity variants. */
function polarityVariant(levels) {
  const inside = levels
    .flatMap((level) => [`[data-theme="${level}"]`, `[data-theme="${level}"] *`])
    .join(', ');
  const other = levels.map((level) => `:not([data-theme="${level}"])`).join('');
  const outside = `[data-theme]${other}`;
  return `&:where(${inside}):not(:where(${outside}, ${outside} *))`;
}

/**
 * The web Medium's geometry and time, as `--ds-*` custom properties.
 *
 * On `:root` and **not** inside a level block, which is the whole point of the
 * second axis: these do not vary by Level, so repeating them per level would
 * author the same number twice for two Levels that must agree. Colour is the
 * only thing the level blocks carry.
 *
 * Exactly one Medium reaches CSS, per ADR 0004. `video` and `graphic` are
 * emitted to their own artifacts by their own Emitters — a Medium must never be
 * selectable by an attribute the way a Level is.
 */
function mediumVariables(medium) {
  const def = MEDIA_DEFINITIONS[medium];
  const lines = [];
  const push = (name, value) => lines.push(`  --ds-${name}: ${value};`);
  const u = def.unit === 'rem' ? 'rem' : 'px';

  def.spacing.forEach((step, i) => push(`space-${i}`, step === 0 ? '0' : `${step}${u}`));
  for (const [name, step] of Object.entries(def.type)) {
    // `type-`, not `text-`: `--ds-text-primary` is already a *colour* on the
    // Level axis. Two axes sharing a prefix is exactly the conflation ADR 0004
    // exists to prevent, and a reader seeing `--ds-text-body` next to
    // `--ds-text-muted` has no way to tell a size from an ink.
    push(`type-${name}`, `${step.size}${u}`);
    push(`leading-${name}`, `${step.lineHeight}`);
  }
  for (const [name, value] of Object.entries(def.weight)) push(`weight-${name}`, `${value}`);
  // `stroke-`, not `border-`: `--ds-border-strong` is a colour. Same reason.
  for (const [name, value] of Object.entries(def.borderWidth)) push(`stroke-${name}`, `${value}px`);
  for (const [name, value] of Object.entries(def.shadowOffset)) {
    push(`elev-${name}`, `${value}px ${value}px 0px 0px`);
  }
  for (const [name, value] of Object.entries(def.radius)) push(`radius-${name}`, `${value}px`);
  push('duration-instant', `${def.motion.instant}ms`);
  push('duration-quick', `${def.motion.quick}ms`);
  push('duration-considered', `${def.motion.considered}ms`);
  push('ease', def.motion.easing);
  for (const [name, value] of Object.entries(def.layer)) push(`layer-${name}`, `${value}`);
  push('focus-width', `${def.focusRing.width}px`);
  push('focus-offset', `${def.focusRing.offset}px`);

  return lines.join('\n');
}

/** The same values under the names Tailwind emits utilities from. */
function mediumTheme(medium) {
  const def = MEDIA_DEFINITIONS[medium];
  const lines = [];
  for (const name of Object.keys(def.type)) {
    lines.push(`  --text-${name}: var(--ds-type-${name});`);
    lines.push(`  --text-${name}--line-height: var(--ds-leading-${name});`);
  }
  for (const name of Object.keys(def.weight)) {
    lines.push(`  --font-weight-${name}: var(--ds-weight-${name});`);
  }
  for (const name of Object.keys(def.radius)) {
    lines.push(`  --radius-${name}: var(--ds-radius-${name});`);
  }
  // Tailwind's own radius scale, overridden to this Medium's value.
  //
  // This is what replaces `*, *::before, *::after { border-radius: 0 !important }`
  // (#54). That rule reached every element in a consumer's document, including
  // markup this package has never heard of, and the only way out of it was a
  // second `!important`. Redefining the scale instead means every `rounded-*`
  // utility resolves to the Medium's radius while a consumer's own CSS is
  // untouched — which is the difference between a token and a reset.
  //
  // `rounded-full` is deliberately not here: it does not read `--radius-*`, and
  // a pill is a shape a caller asks for explicitly rather than one they inherit.
  for (const name of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']) {
    lines.push(`  --radius-${name}: var(--ds-radius-none);`);
  }

  // Tailwind's `--spacing` is deliberately NOT mapped, and this is the
  // interesting one.
  //
  // It is a single multiplier: `p-N` resolves to N x the step. The Medium's
  // scale is not linear — web runs 0, .25, .5, .75, 1, 1.5, 2, 3, 4, 6, 8 —
  // so setting `--spacing: 0.25rem` makes `p-4` agree with `--ds-space-4` at
  // 1rem and then diverge at every rung above it: `p-5` is 1.25rem where
  // `--ds-space-5` is 1.5rem. Two meanings for the same number, and the sort
  // of thing that reads as correct in review because the first five agree.
  //
  // Video's scale settles it — 0, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256 is
  // not a multiple of anything, so no multiplier could carry it even if the
  // web's happened to be linear.
  //
  // So `--ds-space-*` stays a vocabulary a caller reads by name, Tailwind keeps
  // its own scale for utilities, and the two are not pretended to be the same
  // thing. The index naming invites the confusion and is worth revisiting.

  // Motion, so `duration-quick` and `ease-brutalist` exist as utilities. The
  // 19 wall-clock transitions the Remotion evaluation measured are exactly what
  // these are for — a component naming a duration rather than a number is what
  // lets the `video` Medium give it frames instead of milliseconds.
  for (const name of ['instant', 'quick', 'considered']) {
    lines.push(`  --duration-${name}: var(--ds-duration-${name});`);
  }

  // Stacking, so `z-overlay` is a name rather than a magic number.
  for (const name of Object.keys(def.layer)) {
    lines.push(`  --z-index-${name}: var(--ds-layer-${name});`);
  }
  lines.push('  --ease-brutalist: var(--ds-ease);');
  return lines.join('\n');
}

function render() {
  const [firstLevel] = THEME_LEVELS;
  const byPolarity = (polarity) => THEME_LEVELS.filter((l) => LEVELS[l].polarity === polarity);

  const sections = [];

  sections.push(BANNER);
  sections.push(`
/* Tailwind v4 skips node_modules during automatic content detection, so the
 * utilities used inside the compiled components would never be generated in a
 * consumer's build without this. */
@source "./";`);

  sections.push(`
/* ==========================================================================
   Variants — one per level, plus the two polarity groups
   ==========================================================================

   Prefer a role token over a variant: a component written against
   --ds-surface-raised needs no variant at all and picks up a fifth level for
   free. Reach for these only for what tokens genuinely cannot express, such as
   a different border weight on one level. */

${THEME_LEVELS.map((level) => `@custom-variant ${level} (${levelVariant(level)});`).join('\n')}

/* Polarity is a declared property of a level, so these are derived rather than
 * being the axis the system hangs off. Use them for non-colour utilities that
 * genuinely depend on light-vs-dark — a shadow spread, an image filter — never
 * for colour, which the tokens already handle. */
${(['dark', 'light'])
  .filter((polarity) => {
    // A level may be *named* for its polarity, in which case the per-level
    // variant above has already emitted this exact rule and emitting it again
    // is a duplicate declaration — harmless while that polarity has one level,
    // and silently divergent the moment it has two, with the later definition
    // winning.
    //
    // Inert as it stands: the levels are `midnight` and `sketch`, so neither
    // takes `dark` or `light`. Kept because it costs one array filter and the
    // alternative is a footgun armed by a rename.
    const clash = THEME_LEVELS.includes(polarity);
    return !clash;
  })
  .map((polarity) => `@custom-variant ${polarity} (${polarityVariant(byPolarity(polarity))});`)
  .join('\n')}

/* \`light:\` is not declared here: a level named \`light\` already declares it
 * above, and the two would be the same rule. \`dark:\` still spans polarity
 * rather than naming a level, which is why it survives the collapse. */`);

  sections.push(`
/* ==========================================================================
   Utility surface
   ==========================================================================

   Declaring the token here is what makes Tailwind emit \`bg-surface-raised\`,
   \`text-accent-primary\`, \`border-edge-subtle\` and friends. The values are
   references; the literals live in the level blocks below. */

@theme {
${TAILWIND_ALIASES}

  --font-sans: var(--ds-font-body);
  --font-display: var(--ds-font-display);
  --font-mono: var(--ds-font-mono);
  --font-pixel: var(--ds-font-pixel);
}`);

  sections.push(`
/* ==========================================================================
   Fixed colours — level-independent, and that is the point
   ==========================================================================

   These three do not swap with the level. \`--color-black\` and
   \`--color-white\` below DO — they are compat aliases tracking
   \`surface.base\` and \`text.primary\`, which is why \`--color-black\`
   resolves to #ffffff on the \`white\` level. Use these when true black or
   true white is meant; use \`surface.base\` for a page ground. */

:root {
${Object.entries(FIXED_COLOURS)
  .map(([key, value]) => `  --ds-fixed-${key}: ${value};`)
  .join('\n')}
}

@theme {
${Object.keys(FIXED_COLOURS)
  .map((key) => `  --color-fixed-${key}: var(--ds-fixed-${key});`)
  .join('\n')}
}`);

  sections.push(`
/* ==========================================================================
   The web Medium — geometry and time, level-independent
   ==========================================================================

   The second axis. A Level varies colour and is selected at runtime; a Medium
   varies geometry and time and is selected at build time by which artifact is
   being emitted. Neither varies on the other's axis, so none of this appears
   inside a level block. See \`docs/adr/0004-two-axes-level-and-medium.md\`.

   \`video\` and \`graphic\` are real Media with their own numbers — a 1080p
   frame's type scale is not this one scaled — and they are emitted to their own
   artifacts rather than to a selector here. */

:root {
${mediumVariables(CSS_MEDIUM)}
}

@theme {
${mediumTheme(CSS_MEDIUM)}
}`);

  sections.push(`
/* ==========================================================================
   Typography roles — level-independent
   ========================================================================== */

:root {
  /* Fallback chains matter as much as the first choice: when the web font has
   * not loaded — a blocked CDN, a slow connection, the first paint — the next
   * entry decides the metrics, and a different fallback reflows the page. These
   * chains are the ones the global rules in styles.css have always used, so the
   * tokens and the globals now agree instead of quietly disagreeing. */
  --ds-font-display: var(--font-space-grotesk, "Space Grotesk Variable", "Space Grotesk"), var(--font-inter, "Inter Variable", "Inter"), sans-serif;
  --ds-font-body: var(--font-inter, "Inter Variable", "Inter"), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ds-font-mono: var(--font-ibm-plex-mono, "IBM Plex Mono"), "Symbols Nerd Font Mono", "Courier New", monospace;
  --ds-font-pixel: var(--font-vt323, "VT323"), monospace;
}`);

  sections.push(`
/* ==========================================================================
   The ladder
   ========================================================================== */
`);

  for (const level of THEME_LEVELS) {
    const definition = LEVELS[level];
    // The first level doubles as the unthemed default so a consumer who forgets
    // to set data-theme gets a complete, legible palette rather than a
    // half-painted page.
    const selector =
      level === firstLevel ? `:root, [data-theme="${level}"]` : `[data-theme="${level}"]`;

    sections.push(`/* ${definition.label} — ${definition.description} */
${selector} {
  color-scheme: ${definition.polarity};

${levelVariables(definition)}

${TAILWIND_ALIASES}

}
`);
  }

  sections.push(`/* Native form controls, scrollbars and the caret follow \`color-scheme\`, which
 * each level declares above. Without it a light level renders dark scrollbars
 * and an unreadable date picker while every styled element looks correct. */
`);

  return `${sections.join('\n')}`.replace(/\n{3,}/g, '\n\n').trimStart() + '\n';
}

const css = render();
const check = process.argv.includes('--check');

if (check) {
  let existing = '';
  try {
    existing = readFileSync(OUTPUT, 'utf8');
  } catch {
    console.error(`${path.basename(OUTPUT)} is missing. Run \`pnpm tokens:build\`.`);
    process.exit(1);
  }
  if (existing !== css) {
    console.error(
      `${path.basename(OUTPUT)} is out of date with src/theme/levels.ts.\nRun \`pnpm tokens:build\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log(`${path.basename(OUTPUT)} is up to date (${THEME_LEVELS.length} levels).`);
} else {
  writeFileSync(OUTPUT, css, 'utf8');
  console.log(
    `Wrote src/${path.basename(OUTPUT)} — ${THEME_LEVELS.length} levels: ${THEME_LEVELS.join(', ')}`,
  );
}
