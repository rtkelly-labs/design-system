import { forwardRef } from 'react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
  Ref,
} from 'react';
import { recipe } from '../lib/recipe';
import { SiteLink } from './LinkProvider';

export interface InlineActionOwnProps {
  /**
   * The words, in the case the surrounding text is written in. Unlike
   * `Button`'s label this is read as part of a sentence or a cell, so it is
   * not written in caps — `view output`, `retry`, `all alerts →`.
   */
  children: ReactNode;
  /**
   * How loudly it reads against the text around it. `accent` is the primary
   * accent ink with a solid underline — the one to reach for, and what a link
   * in a row of data looks like. `quiet` is secondary ink with a dotted
   * underline, for a housekeeping action beside the content it acts on —
   * `clear`, `reset`, `show all` — that should not compete with it.
   * Omitted, the tone is `accent`.
   */
  tone?: InlineActionTone;
  /**
   * Merged into the recipe's own classes. Reach for it to set the typeface or
   * size where the surrounding text does not — `font-mono` in a table of ids —
   * rather than to recolour it.
   */
  className?: string;
}

/** The inks an `InlineAction` may take. Named for emphasis, not for a hue. */
export type InlineActionTone = 'accent' | 'quiet';

/**
 * The `<button>` form: an action on the current page. `href?: never` is what
 * lets the union below discriminate, exactly as it does on `Button`.
 */
export type InlineActionButtonProps = InlineActionOwnProps &
  Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'children'> & {
    href?: never;
  };

/**
 * The `<a>` form: the same ink on something that navigates. Rendered through
 * `LinkProvider`, so an app's router handles an internal href.
 */
export type InlineActionLinkProps = InlineActionOwnProps &
  Omit<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, 'children'> & {
    /**
     * Where it navigates — and the discriminant. Supplying it renders a link
     * through the `LinkProvider`'s component; omit it for anything that acts
     * on the current page.
     */
    href: string;
    /**
     * Not offered on the anchor form. `disabled` does nothing on an `<a>`, and
     * a link that cannot be followed is text, not a link.
     */
    disabled?: never;
  };

export type InlineActionProps = InlineActionButtonProps | InlineActionLinkProps;

/**
 * No box, no padding, no case or weight of its own: the type is the
 * surrounding text's, so it sits in a sentence or a table cell without
 * changing the line. Preflight already gives a `<button>` the inherited font
 * and a transparent ground; this adds the underline that says it can be used.
 *
 * Hover is gated on `not-disabled:` so a disabled action does not respond to
 * the pointer; `not-disabled` rather than `enabled`, because `:enabled` matches
 * form elements only and the anchor form would lose its hover. The change is
 * instant, not animated: a colour change this small does not need easing, and
 * every animated property is one more thing `docs/deterministic-rendering.md`
 * has to switch off.
 *
 * Focus is the global `:focus-visible` outline, untouched — see
 * `src/focus-ring.test.ts`.
 */
const inlineAction = recipe({
  base:
    'cursor-pointer text-left underline underline-offset-2 ' +
    'disabled:cursor-not-allowed disabled:text-content-muted disabled:no-underline',
  variants: {
    tone: {
      accent: 'text-accent-primary decoration-1 not-disabled:hover:decoration-2',
      quiet:
        'text-content-secondary decoration-dotted not-disabled:hover:text-content-primary ' +
        'not-disabled:hover:decoration-solid',
    },
  },
  defaultVariants: {
    tone: 'accent',
  },
});

/**
 * An action that reads as a link: underlined text inside a sentence or a table
 * cell, with no box, padding or press of its own.
 *
 * `Button` is the control a screen is built around — bordered, filled, caps,
 * a 44px hit area. In a table row that is too much: one per row is a column of
 * buttons, and the row's data is lost behind them. This is the same decision
 * in the weight of the text around it, and like `Button` the element follows
 * the job rather than the look: without `href` it is a `<button type="button">`
 * that runs `onClick`; with `href` it is a link, through `LinkProvider`.
 *
 * It takes the surrounding font and size, so it is mono in a mono cell and
 * prose in a paragraph; there is no `size`. An inline target is exempt from
 * the WCAG 2.5.8 target-size minimum because its size is set by the line it
 * sits in — which is also why it belongs inline, not standing on its own as a
 * page's action.
 *
 * ```tsx
 * <InlineAction onClick={() => openRun(run.id)}>view output</InlineAction>
 * <InlineAction href={`/runs/${run.id}`}>open run</InlineAction>
 * <InlineAction tone="quiet" onClick={clear}>clear</InlineAction>
 * ```
 */
export const InlineAction = forwardRef<HTMLButtonElement | HTMLAnchorElement, InlineActionProps>(
  function InlineAction(props, ref) {
    const { children, tone = 'accent', className, ...rest } = props;
    const classes = inlineAction({ tone, class: className });

    if (typeof props.href === 'string') {
      const {
        href,
        disabled: _disabled,
        ...anchorProps
      } = rest as Omit<InlineActionLinkProps, keyof InlineActionOwnProps>;
      return (
        <SiteLink
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          data-slot="inline-action"
          {...anchorProps}
          className={classes}
        >
          {children}
        </SiteLink>
      );
    }

    const buttonProps = rest as Omit<InlineActionButtonProps, keyof InlineActionOwnProps>;
    return (
      <button
        // A bare `<button>` inside a form is a submit button. This one acts on
        // its row, so it says so unless the caller asks for a submit.
        type="button"
        data-slot="inline-action"
        ref={ref as Ref<HTMLButtonElement>}
        {...buttonProps}
        className={classes}
      >
        {children}
      </button>
    );
  },
);

InlineAction.displayName = 'InlineAction';
