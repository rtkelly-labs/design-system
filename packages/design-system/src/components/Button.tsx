import { forwardRef } from 'react';
import type { Ref } from 'react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
} from 'react';
import { recipe } from '../lib/recipe';

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
 */
const PRESS =
  'shadow-hard-md not-disabled:hover:shadow-hard-lg not-disabled:active:translate-x-1 ' +
  'not-disabled:active:translate-y-1 not-disabled:active:shadow-none';

/**
 * The disabled treatment, the one `Select`'s trigger and the text fields wear:
 * a sunken ground, the subtle edge, muted ink and no shadow. Before #252 a
 * disabled button rendered exactly like an enabled one — a pending submit
 * looked pressable and did nothing. `disabled:` matches the `<button>` form
 * only, which is right: an anchor cannot be disabled.
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

  const content = bracketed ? (
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
    const anchorProps = rest as Omit<ButtonLinkProps, keyof ButtonOwnProps>;
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
        {content}
      </a>
    );
  }

  const buttonProps = rest as Omit<ButtonElementProps, keyof ButtonOwnProps>;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      {...buttonProps}
      className={button({ variant, size, class: className })}
    >
      {content}
    </button>
  );
});
