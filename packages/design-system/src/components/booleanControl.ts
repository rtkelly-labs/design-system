import { recipe } from '../lib/recipe';

/**
 * The surface a boolean control wears, in its two presentations.
 *
 * `Checkbox` and `Switch` are one capability — a boolean — drawn twice (and
 * `Radio` is one option of a set, drawn a third time), so the
 * border weight, the checked fill, the disabled treatment and the invalid
 * border are declared **once** and selected by `shape`. Two recipes would
 * drift, and the drift would show up as a switch that disagrees with the
 * checkbox beside it about what "disabled" looks like.
 *
 * A module of its own for the reason `dialogSurface.ts` gives: `src/index.ts`
 * re-exports the component files wholesale, and a `recipe` in the published
 * surface puts `tailwind-variants`' types back into the `.d.ts`.
 *
 * Every state here is a Base UI data attribute — `data-checked`,
 * `data-indeterminate`, `data-disabled`, `data-invalid` — so nothing in the
 * components computes a class from a prop. `data-invalid` in particular is
 * inherited from the enclosing `Field.Root`, which is what makes an error on
 * the field visible on the control without either being told about the other.
 *
 * No focus class. The global `:focus-visible` outline in `styles.css` is the
 * ring, and a component-level override is exactly the #44 regression that rule
 * exists to prevent.
 */
export const booleanControl = recipe({
  slots: {
    control:
      'flex shrink-0 border-2 border-edge-strong bg-surface-base transition-colors duration-quick ease-brutalist '
      + 'data-[disabled]:cursor-not-allowed data-[disabled]:border-edge-subtle data-[disabled]:bg-surface-sunken '
      + 'data-[invalid]:border-intent-danger motion-reduce:transition-none',
    mark: 'pointer-events-none',
  },
  variants: {
    shape: {
      // A square box with a mark in it: the checkbox.
      //
      // Disabled and checked are both attribute variants, so which background
      // won used to be CSS source order — and it was the disabled one, leaving
      // `text-content-inverse`, an ink chosen for the accent fill, nearly
      // invisible on `surface-sunken` (#270). The compound selectors below make
      // the disabled surface win on purpose, and the mark drops to
      // `text-content-muted`, the pair `check:contrast` verifies on every
      // surface. That is how `dot` already handles it: the state stays legible,
      // only the emphasis goes.
      box: {
        control:
          'size-6 cursor-pointer items-center justify-center '
          + 'data-[checked]:bg-[var(--field-accent)] data-[indeterminate]:bg-[var(--field-accent)] '
          + 'data-[checked]:data-[disabled]:bg-surface-sunken '
          + 'data-[indeterminate]:data-[disabled]:bg-surface-sunken',
        mark:
          'font-mono text-sm font-bold leading-none text-content-inverse '
          + 'data-[disabled]:text-content-muted',
      },
      /**
       * The same box holding a solid square: the radio. One option of a set
       * is a boolean too — selected or not — so it wears this surface rather
       * than a third one.
       *
       * Square, not round, because the radius is zero everywhere (DESIGN.md)
       * and a circle would be the one exception. What tells it from a checkbox
       * is the mark instead: a checkbox *fills* with the accent and carries an
       * `X`; a radio stays on the base surface and carries a smaller solid
       * square, so a set of them never reads as a set of ticks.
       */
      dot: {
        control: 'size-6 cursor-pointer items-center justify-center',
        mark: 'size-2.5 bg-[var(--field-accent)] data-[disabled]:bg-content-muted',
      },
      /** A track the thumb travels along: the switch. */
      track: {
        control:
          'h-6 w-12 cursor-pointer items-center p-0.5 '
          + 'data-[checked]:bg-[var(--field-accent)]',
        mark:
          'size-4 bg-content-primary transition-transform duration-quick ease-brutalist '
          + 'data-[checked]:translate-x-6 data-[checked]:bg-content-inverse '
          + 'data-[disabled]:bg-content-muted motion-reduce:transition-none',
      },
    },
  },
});
