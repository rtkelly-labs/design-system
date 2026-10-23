/**
 * The variation axes of a `*_VARIANTS` constant: its array-valued entries only.
 *
 * Not `Object.entries` directly. Storybook's docgen plugin mistakes an
 * upper-case exported object for a component and assigns it a `__docgenInfo`
 * property in the Storybook build — and only there, so vitest never sees it.
 * Iterating that key as an axis calls `.map` on an object and the story renders
 * nothing (the walkthrough caught it on #419).
 */
export function variantAxes<T extends Record<string, readonly unknown[]>>(variants: T): Array<[keyof T & string, T[keyof T]]> {
  return Object.entries(variants).filter((entry): entry is [keyof T & string, T[keyof T]] => Array.isArray(entry[1]));
}

/** The axis names alone, for a Storybook select control. */
export function variantAxisNames<T extends Record<string, readonly unknown[]>>(variants: T): Array<keyof T & string> {
  return variantAxes(variants).map(([name]) => name);
}
