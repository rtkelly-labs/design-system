/**
 * The style recipe builder every component uses.
 *
 * A *recipe* is the set of class strings one component needs: a base, one entry
 * per element it renders (a "slot"), and the variants that switch between them.
 * `src/components/Input.tsx` is the worked example.
 *
 * ## Why a builder at all
 *
 * Components used to compose classes by appending the consumer's `className` to
 * the end of a template string. That does nothing. Tailwind decides which of two
 * conflicting utilities wins by **CSS source order**, not by the order they
 * appear in the class attribute — so a consumer passing `bg-surface-raised` to a
 * component whose base is `bg-surface-base` got whichever the stylesheet
 * happened to emit later. Every `className` prop in this package was unreliable
 * in exactly that way.
 *
 * A recipe resolves conflicts before the class string reaches the DOM, so the
 * caller's value genuinely wins. That is a correctness fix, not an ergonomic one.
 *
 * ## The engine is an implementation detail
 *
 * `tailwind-variants` is what currently builds these, chosen because most
 * components here style more than one element — a field is a label, a control
 * and a message — and the alternatives model one element per recipe. It is not
 * part of this package's vocabulary or its public types: components import
 * `recipe` from here, and nothing downstream names the library. Swapping it is
 * then an edit to this file rather than to thirty components.
 */

import { createTV, cn as merge } from 'tailwind-variants';

/**
 * Almost nothing needs declaring here, which is worth knowing before anyone
 * adds to it: the class merger classifies our semantic tokens correctly with no
 * configuration at all. `bg-surface-raised` beats `bg-surface-base`,
 * `text-accent-primary` beats `text-content-primary`, and — the case that
 * actually matters — a colour and a size in the same `text-*` position are
 * recognised as different properties, so `text-content-primary text-sm`
 * survives intact.
 *
 * The hard shadows are the exception. `shadow-hard-md` is read as a custom
 * shadow value while `shadow-none` is read as box-shadow, so without this the
 * two would both survive and the CSS would arbitrate — meaning `shadow-none`
 * could not reliably clear a hard shadow. Declaring the scale puts them in one
 * group.
 *
 * Not exported from the package: it describes the merger's config format, which
 * is exactly the detail this module exists to contain.
 */
const mergeConfig = {
  extend: {
    theme: {
      shadow: [
        'hard-sm',
        'hard-md',
        'hard-lg',
        // The role-named hard shadows belong in the same group: a card that
        // sets `shadow-hard-accent-primary` on hover still needs
        // `shadow-none` to be able to clear it.
        'hard-accent-primary',
        'hard-accent-secondary',
        'hard-accent-tertiary',
        'hard-accent-quiet',
        'hard-intent-info',
        'hard-intent-success',
        'hard-intent-warning',
        'hard-intent-danger',
      ],
    },
  },
} as const;

/**
 * Build a component's styles.
 *
 * ```ts
 * const field = recipe({
 *   slots: { root: 'flex flex-col', label: 'text-xs uppercase' },
 *   variants: { invalid: { true: { label: 'text-intent-danger' } } },
 * });
 *
 * const styles = field({ invalid: true });
 * <label className={styles.label({ class: className })} />
 * ```
 *
 * Deliberately not re-exported from the package entrypoint. Its type comes from
 * the underlying library, so exporting it would put that library back into the
 * published `.d.ts` and make it a breaking change to replace.
 */
export const recipe = createTV({ twMergeConfig: mergeConfig });

/** Anything accepted as a class: strings, falsy values, arrays, or nested ones. */
export type ClassInput = string | number | null | undefined | false | ClassInput[];

/**
 * Join class names, resolving Tailwind conflicts so the last value wins.
 *
 * For one-off composition outside a recipe — and for consumers building their
 * own components on this system, which is why the signature is written out here
 * rather than inherited from the library.
 */
export function cn(...inputs: ClassInput[]): string {
  // The underlying merger returns `undefined` when everything is filtered out.
  // A `className` of `undefined` is legal in React but awkward to compose with,
  // so this narrows to a string — which is also why the signature is written
  // here rather than inherited.
  return merge(...(inputs as Parameters<typeof merge>)) ?? '';
}
