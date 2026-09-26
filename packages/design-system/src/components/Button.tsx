import { forwardRef } from 'react';
import type { Ref } from 'react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  MouseEvent,
  ReactNode,
} from 'react';
import { recipe } from '../lib/recipe';
import { Spinner } from './Spinner';

interface ButtonOwnProps {
  /**
   * The label. Written in caps at the call site rather than upper-cased in
   * CSS, so a screen reader is given the words rather than the shouting, and
   * so an acronym that is already caps does not read as emphasis.
   */
  children: ReactNode;
  /**
   * Named for the colour it is on `midnight`, not for a colour it guarantees.
   * All four resolve through the accent roles, so they remap with the theme
   * level: `cyan` is `#22d3ee` on `midnight` and `#1d4ed8` on `white`.
   *
   * `white` follows the same rule — it is the inverted maximum-contrast button,
   * so it is a white button with near-black text on `midnight` and inverts to
   * dark-on-paper at the light end. Before 0.3.0 it alone was pinned to a
   * literal `bg-white text-black`, which stayed white on a white page.
   *
   * The names are the honest complaint here, and they mislead for all four
   * equally. Renaming them to the roles they resolve to is a breaking API
   * change and is deliberately not bundled with the token migration.
   */
  variant?: ButtonVariant;
  /**
   * Padding and type scale, not a semantic weight. `md` is the default and the
   * one to reach for; `sm` is for dense rows such as a table's row actions,
   * and `lg` for a page's single primary action. Hit area is the constraint
   * that decides — `sm` is still 44px tall at the `web` Medium.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Wraps the label in `[ ]`. The brutalist cue for "this one does something"
   * — worth it for a form's submit or a destructive confirm, noise on every
   * button in a toolbar. It is punctuation in the label, not a border.
   */
  bracketed?: boolean;
  /**
   * Merged into the recipe's own classes. Reach for it to place the button —
   * `w-full`, a grid slot — rather than to restyle it; a colour set here is
   * what `pnpm check:tokens` exists to find.
   */
  className?: string;
}

/**
 * The accents a filled Button may take.
 *
 * Narrower than `AccentToken` on purpose: `quiet` is missing because
 * `check:contrast` gates `text.inverse` against `accent.primary`, `secondary`
 * and `tertiary` only. A quiet fill with inverse text on it is not measured, so
 * it is not offered.
 */
export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'inverse'
    | 'default';

/**
 * The `<button>` form. `href?: never` is what makes the union below
 * discriminate: without it TypeScript would accept `href` here and silently
 * drop it onto an element that ignores it.
 */
export type ButtonElementProps = ButtonOwnProps &
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    href?: never;
    /**
     * The request this button started is in flight. Reach for it instead of
     * `disabled` while a submit is being sent.
     *
     * `disabled` removes a focused button from the tab order and drops focus
     * to `<body>`, so a keyboard user is thrown back to the top of the page
     * at the moment they need to hear what happened. A pending button keeps
     * focus and its tab stop, reports `aria-disabled="true"` instead of the
     * `disabled` attribute, and ignores activation: a click, Enter, Space,
     * or Enter in one of its form's fields does not run `onClick` and does
     * not submit the form again.
     *
     * It shows a spinner in place of the label, over the label's own box, so
     * the button keeps its width; the label stays in the accessibility tree,
     * so the accessible name does not change while it has focus. The fill is
     * kept and the button sits sunk into its press — the same offset and no
     * shadow as `:active` — which is distinct from the sunken, muted
     * `disabled` treatment.
     *
     * Pass it from the first render — `pending={saving}`, not
     * `pending={saving || undefined}` — so the live region that announces
     * `pendingLabel` is in the page before it has anything to say. `disabled`
     * wins over `pending` when both are set.
     */
    pending?: boolean;
    /**
     * What is being waited for, as a screen reader hears it when `pending`
     * turns on — "Signing in", not "Loading". It is written into a visually
     * hidden `role="status"` region beside the button, which exists whenever
     * `pending` is passed at all and is empty until it is `true`.
     */
    pendingLabel?: string;
  };

/** The `<a>` form. Passing `href` selects it; there is no `as` prop to remember. */
export type ButtonLinkProps = ButtonOwnProps &
  DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
    /**
     * Where it navigates — and the discriminant. Supplying it renders an `<a>`
     * wearing the button's styling, which is what a keyboard user, a screen
     * reader and a middle click all need from something that navigates. Omit
     * it for anything that acts on the current page.
     */
    href: string;
    /**
     * Not offered on the anchor form. A link's work is the browser's
     * navigation, which the page cannot hold open, and `aria-disabled` on a
     * link is a link that still navigates. A control that starts a request
     * is a `<button>`.
     */
    pending?: never;
    /** Not offered on the anchor form; see `pending`. */
    pendingLabel?: never;
  };

export type ButtonProps = ButtonElementProps | ButtonLinkProps;

/**
 * The press affordance — offset shadow that collapses as the control moves into
 * it. Shared rather than repeated so the four accents cannot drift apart.
 *
 * Hover and press are gated on `not-disabled:` so a disabled button does not
 * lift under the pointer or sink when clicked: it would be promising an action
 * it will not take. `not-disabled` rather than `enabled`, because `:enabled`
 * matches form elements only and the anchor form would lose its hover.
 *
 * `not-aria-disabled:` is the same gate for a pending button, which is
 * `aria-disabled` rather than `:disabled` so that it keeps focus. Spelled out
 * in full rather than built from a constant: Tailwind reads the source text,
 * and a template literal emits no CSS.
 */
const PRESS =
  'shadow-hard-md not-disabled:not-aria-disabled:hover:shadow-hard-lg ' +
  'not-disabled:not-aria-disabled:active:translate-x-1 ' +
  'not-disabled:not-aria-disabled:active:translate-y-1 ' +
  'not-disabled:not-aria-disabled:active:shadow-none';

/**
 * The disabled treatment, the one `Select`'s trigger and the text fields wear:
 * a sunken ground, the subtle edge, muted ink and no shadow. Before #252 a
 * disabled button rendered exactly like an enabled one — it looked pressable
 * and did nothing. A request in flight is `pending`, not this. `disabled:`
 * matches the `<button>` form only, which is right: an anchor cannot be
 * disabled.
 */
const DISABLED =
  'disabled:cursor-not-allowed disabled:border-edge-subtle disabled:bg-surface-sunken ' +
  'disabled:text-content-muted disabled:shadow-none';

/**
 * One constant per rendered form, aliased by every name that resolves to it.
 *
 * `default`, `primary` and the deprecated `cyan` are the same button. Sharing
 * the constant is what makes "resolves identically" true rather than a comment
 * — a divergence would be a code change, not a drift.
 *
 * The hue names are deprecated because they mislead, not merely because they
 * are old: on `sketch`, `variant="primary"` paints `bg-accent-primary`, which is
 * `#1450d7`. Blue. It was never asking for cyan.
 */
const PRIMARY = `bg-accent-primary text-content-inverse border-edge-strong ${PRESS}`;
const SECONDARY = `bg-accent-secondary text-content-inverse border-edge-strong ${PRESS}`;
const TERTIARY = `bg-accent-tertiary text-content-inverse border-edge-strong ${PRESS}`;
const INVERSE = `bg-content-primary text-content-inverse border-content-primary ${PRESS}`;

const button = recipe({
  base: `font-mono font-bold uppercase border-2 transition-all duration-200 ${DISABLED}`,
  variants: {
    size: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    },
    variant: {
      primary: PRIMARY,
      secondary: SECONDARY,
      tertiary: TERTIARY,
      inverse: INVERSE,
      default: PRIMARY,
    },
    /**
     * An anchor is not `inline-flex` by default and carries an underline, so the
     * two forms would otherwise lay out and read differently from identical
     * props. A variant rather than a prepended string so a caller's own
     * `className` still resolves against it.
     */
    asLink: {
      true: 'inline-flex items-center justify-center no-underline',
    },
    /**
     * Held in its press: the `:active` offset with the shadow gone, over the
     * variant's own fill. Enabled is raised, disabled is sunken and muted, and
     * pending is the one in between — this button was pressed and has not let
     * go. `relative` is the box the spinner is centred in.
     */
    pending: {
      true: 'relative cursor-progress translate-x-1 translate-y-1 shadow-none',
    },
  },
  defaultVariants: {
    variant: 'tertiary',
    size: 'md',
  },
});

/**
 * A button, or a link that looks like one.
 *
 * The distinction is not cosmetic and is not the caller's styling preference:
 * a control that *navigates* must be an `<a>`, or it loses middle-click,
 * open-in-new-tab, the status-bar URL preview, and its announcement as a link
 * to a screen reader. Marketing CTAs are overwhelmingly navigation — "Get
 * started" goes somewhere — so a button-only component pushes every landing
 * page into either nesting an anchor inside a button (invalid HTML) or
 * re-styling the whole thing by hand.
 *
 * Passing `href` selects the anchor form, and TypeScript then offers anchor
 * attributes (`target`, `rel`, `download`) and withdraws button-only ones
 * (`disabled`, `type`) — the latter being the point, since `disabled` does
 * nothing whatsoever on an anchor.
 *
 * ```tsx
 * <Button onClick={save}>SAVE</Button>
 * <Button href="/pricing" variant="tertiary" bracketed size="lg">SEE PRICING</Button>
 * ```
 */
/**
 * Forwards its ref to whichever element it renders.
 *
 * `ButtonProps` is a union, so the ref's type is the union of both targets —
 * `HTMLButtonElement | HTMLAnchorElement`. A caller who knows which form they
 * asked for can narrow it; one who does not is told the truth, which is that it
 * depends on `href`.
 *
 * This is what `<Tooltip.Trigger render={<Button />} />` needs: Base UI's
 * composition merges props *and a ref* onto the element it is given, and a
 * component that drops the ref silently breaks positioning, focus return and
 * outside-click detection in every primitive that wraps it.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
  const {
    children,
    variant = 'tertiary',
    size = 'md',
    bracketed = false,
    className,
    ...rest
  } = props;

  const label = bracketed ? (
    <span className="inline-flex items-center justify-center gap-2">
      <span className="select-none" aria-hidden="true">
        [
      </span>
      <span className="inline-flex items-center gap-2">{children}</span>
      <span className="select-none" aria-hidden="true">
        ]
      </span>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center gap-2">{children}</span>
  );

  if (typeof props.href === 'string') {
    // `pending` is `never` here; taken out so a stray `undefined` is not spread.
    const {
      pending: _pending,
      pendingLabel: _pendingLabel,
      ...anchorProps
    } = rest as Omit<ButtonLinkProps, keyof ButtonOwnProps>;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        {...anchorProps}
        // A `target="_blank"` document can reach back through `window.opener`
        // unless told otherwise. Modern browsers imply `noopener`, but not
        // every renderer this package ships into is a modern browser, and an
        // explicit `rel` costs nothing. An explicit `rel` from the caller wins.
        rel={
          anchorProps.rel ??
          (anchorProps.target === '_blank' ? 'noopener noreferrer' : undefined)
        }
        className={button({ variant, size, asLink: true, class: className })}
      >
        {label}
      </a>
    );
  }

  const {
    pending,
    pendingLabel = 'Working',
    ...buttonProps
  } = rest as Omit<ButtonElementProps, keyof ButtonOwnProps>;
  const isPending = pending === true && !buttonProps.disabled;

  const element = (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      {...buttonProps}
      // The `disabled` attribute is what drops focus, so a pending button says
      // it is unavailable through ARIA and refuses activation here instead.
      // Enter and Space on a focused button, and Enter in a text field of its
      // form (implicit submission), all reach a button as a `click`; cancelling
      // it cancels the submit it would have sent. Base UI's Button does the
      // same under `focusableWhenDisabled`.
      aria-disabled={isPending ? true : buttonProps['aria-disabled']}
      onClick={isPending ? preventActivation : buttonProps.onClick}
      data-pending={isPending ? '' : undefined}
      className={button({ variant, size, pending: isPending, class: className })}
    >
      {isPending ? (
        <>
          {/* Transparent, not removed: it holds the width and the name. */}
          <span className="inline-flex opacity-0">{label}</span>
          <Spinner
            // Sized to the label's line box: `sm` in a small button, `md` —
            // about a capital's height and a half — in the others.
            size={size === 'sm' ? 'sm' : 'md'}
            accent="current"
            // The status region beside the button announces the wait. This is
            // the drawing only; a second live region inside a button, whose
            // children are presentational, would be read unreliably or twice.
            role={undefined}
            aria-hidden="true"
            className="absolute inset-0"
          />
        </>
      ) : (
        label
      )}
    </button>
  );

  if (pending === undefined) return element;

  return (
    <>
      {element}
      {/*
       * Outside the button because a button's children are presentational: a
       * live region inside one is flattened into its name. Present from the
       * first render and filled only while pending, which is what makes the
       * insertion an announcement rather than a region appearing already full.
       */}
      <span role="status" className="sr-only" data-slot="button-status">
        {isPending ? pendingLabel : ''}
      </span>
    </>
  );
});

/** A pending button's click: cancelled, so neither `onClick` nor a submit runs. */
function preventActivation(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}
