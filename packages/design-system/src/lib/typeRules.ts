/**
 * The rules that say type must be addressed by a step of the scale.
 *
 * The type counterpart of `tokenRules.ts`, and published for the same reason
 * (ADR 0008): two different things enforce them, and a copy of a rule is a rule
 * that silently stops matching the original.
 *
 *   - `scripts/check-type.mjs` runs them over `src/` as a **ratchet**. The
 *     components carry several hundred `text-sm`-shaped sites from before the
 *     scale existed, so each rule has a budget and CI fails only when one rises.
 *   - A consumer runs them over its own stylesheets and components at **budget
 *     zero**, through `scanTypeRules`. Its code is not this repository's debt.
 *
 * What passes: `text-caption` … `text-hero`, `font-regular` … `font-black`,
 * `var(--ds-type-*)`, `var(--ds-weight-*)`, `inherit`, and `0` (the hidden-text
 * idiom). What fails is a size or weight written as a value.
 */

import { scanRules, type Finding } from './tokenRules.ts';

export interface TypeRule {
  id: 'tailwindSize' | 'tailwindWeight' | 'arbitraryType' | 'cssSize' | 'cssWeight' | 'cssShorthand' | 'inlineStyle';
  label: string;
  /** Global, so callers must use `match`/`matchAll`, which reset `lastIndex`. */
  pattern: RegExp;
  fix: string;
}

export const TYPE_RULES: readonly TypeRule[] = [
  {
    id: 'tailwindSize',
    label: "Tailwind's default type sizes",
    pattern: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b(?![\w-])/g,
    fix: 'Use a step: text-caption, text-ui, text-body, text-lead, text-heading, text-title, text-display, text-hero.',
  },
  {
    id: 'tailwindWeight',
    label: "Tailwind's weights outside the scale",
    pattern: /\bfont-(?:thin|extralight|light|normal|medium|extrabold)\b(?![\w-])/g,
    fix: 'Use font-regular, font-semibold, font-bold or font-black. An 800 is drawn as 700 by most of our faces anyway.',
  },
  {
    id: 'arbitraryType',
    label: 'Arbitrary type sizes and weights',
    pattern: /\b(?:text-\[(?:\d|\.\d|length:|calc|clamp|min\(|max\()[^\]]*\]|font-\[\d[^\]]*\]|leading-\[[^\]]+\])/g,
    fix: 'Use a step of the scale. If none fits the job, that is a design-system change, not a local value.',
  },
  {
    id: 'cssSize',
    label: 'font-size written as a value',
    pattern: /\bfont-size:(?!\s*(?:var\(--ds-|inherit\b|0\s*(?:!important\s*)?(?:[;}]|$)))\s*[^;}]+/g,
    fix: 'Use font-size: var(--ds-type-<step>) with line-height: var(--ds-leading-<step>).',
  },
  {
    id: 'cssWeight',
    label: 'font-weight written as a value',
    pattern: /\bfont-weight:(?!\s*(?:var\(--ds-|inherit\b))\s*[^;}]+/g,
    fix: 'Use font-weight: var(--ds-weight-<regular|semibold|bold|black>).',
  },
  {
    id: 'cssShorthand',
    label: 'font shorthand with a written size or weight',
    pattern: /\bfont:\s*(?:[^;}]*?\d(?:\.\d+)?(?:px|rem|em|pt|%)|\s*\d{3}\b|\s*(?:bold|bolder|lighter)\b)[^;}]*/g,
    fix: 'Write font: var(--ds-weight-*) var(--ds-type-*)/var(--ds-leading-*) var(--ds-font-*).',
  },
  {
    id: 'inlineStyle',
    label: 'Inline fontSize or fontWeight',
    pattern: /\bfont(?:Size|Weight)\s*[:=]\s*\{?\s*['"`]?\d[\w.%]*/g,
    fix: "Use a class from the scale, or 'var(--ds-type-<step>)' when the value must be inline.",
  },
];

/**
 * A line containing this marker is an exception, written at the site with its
 * reason after the colon. `scanTypeRules` skips it and `typeExceptions` lists it,
 * so an exception is visible rather than a silenced rule.
 */
export const TYPE_EXCEPTION_MARKER = 'ds-allow-type:';

/**
 * `@font-face` declares what a face *can* draw, not what text uses, so its
 * `font-weight` range and any `font-size` descriptor are not findings. The block
 * is blanked rather than removed so line numbers still point at the source.
 */
function withoutFontFaces(source: string): string {
  return source.replace(/@font-face\s*\{[^}]*\}/g, (block) => block.replace(/[^\n]/g, ''));
}

/** Every type-by-value violation in one file's source, exceptions excluded. */
export function scanTypeRules(source: string): Finding<TypeRule['id']>[] {
  return scanRules(withoutFontFaces(source), TYPE_RULES).filter(
    (finding) => !finding.text.includes(TYPE_EXCEPTION_MARKER),
  );
}

/** Every line that claims an exception, with the reason it gives. */
export function typeExceptions(source: string): { line: number; reason: string }[] {
  return source.split('\n').flatMap((text, index) => {
    const at = text.indexOf(TYPE_EXCEPTION_MARKER);
    if (at < 0) return [];
    const reason = text.slice(at + TYPE_EXCEPTION_MARKER.length).replace(/\*\/.*$|-->.*$/, '').trim();
    return [{ line: index + 1, reason }];
  });
}
