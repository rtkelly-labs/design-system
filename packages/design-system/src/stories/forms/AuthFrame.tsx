import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Card } from '../../components/Card';

// The frame the three signed-out flows share: one narrow column, a panel, a
// heading and an optional line under the panel. Composed from `Card` and
// layout utilities. Two things in here are not a system answer; #252
// records both as findings, filed as #300, rather than inventing them:
//
// - The heading. `PageTitle` is a double-bordered display title and
//   `PageHeader` a raised band; neither fits the top of a form panel, so the
//   heading is typography utilities over roles, as `AccountSettingsForm`'s is.
// - `TEXT_LINK`. A link outside `Prose` has no styling of its own, so the
//   "forgotten your password?" line spells one out. It matches the link
//   `ErrorSummary` draws, over the accent rather than the danger role.

/** An inline text link, outside `Prose`. See the note above. */
export const TEXT_LINK =
  'font-bold text-accent-primary underline underline-offset-4 hover:no-underline';

export interface AuthFrameProps {
  /** The page's `h1`. */
  title: string;
  /** One sentence under the heading: what this screen is for. */
  lede?: ReactNode;
  /** The panel's contents: the summary, the form, a confirmation. */
  children: ReactNode;
  /** A line under the panel — the way to the neighbouring flow. */
  footer?: ReactNode;
}

/**
 * The signed-out page frame. The heading takes a ref and `tabIndex={-1}` so a
 * multi-step flow can move focus to it when the step changes — the new
 * heading is then the first thing read, rather than the reader being left on
 * a button that no longer exists.
 */
export const AuthFrame = forwardRef<HTMLHeadingElement, AuthFrameProps>(function AuthFrame(
  { title, lede, children, footer },
  ref,
) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Card variant="panel" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1
            ref={ref}
            tabIndex={-1}
            className="font-display text-2xl font-bold uppercase text-content-primary"
          >
            {title}
          </h1>
          {lede && <p className="font-sans text-sm text-content-secondary">{lede}</p>}
        </div>
        {children}
      </Card>
      {footer && <p className="font-mono text-sm text-content-secondary">{footer}</p>}
    </div>
  );
});

/** A pause standing in for the network, so the pending state is visible. */
export function respondAfter<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** The format check every flow here shares. Not a policy: a typo catcher. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
