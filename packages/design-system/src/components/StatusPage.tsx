import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { recipe } from '../lib/recipe';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

/**
 * The page frame around an `EmptyState`, and nothing more.
 *
 * `standalone` is the one real variant: inside the site chrome the page is a
 * region of the consumer's `<main>`; outside it — a 500 served because the
 * shell itself failed, a maintenance page from the edge — it has to be the
 * `<main>` and fill the viewport on its own ground.
 *
 * The title is resized through its `data-slot` rather than a second recipe,
 * because it is `EmptyState`'s title: one element, sized for a page here.
 */
const statusPage = recipe({
  slots: {
    root: 'flex w-full justify-center px-4 py-16 md:py-24',
    state:
      'w-full max-w-2xl '
      + '[&_[data-slot=empty-state-title]]:text-2xl md:[&_[data-slot=empty-state-title]]:text-3xl',
    /**
     * The status code: large, and in the muted role like `EmptyState`'s own
     * glyph, because the title carries the status in words and this only
     * repeats it. Large text is gated at 3:1, which muted clears on every Level.
     */
    code: 'font-display text-6xl font-black leading-none tracking-tight md:text-8xl',
  },
  variants: {
    standalone: {
      true: { root: 'min-h-dvh items-center bg-surface-base text-content-primary' },
      false: {},
    },
  },
  defaultVariants: { standalone: false },
});

export interface StatusPageProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {
  /**
   * The page's `<h1>` — the status, in words: "Page not found", "Down for
   * maintenance". This is what a screen reader and a search result read, so it
   * must say the state on its own, without the `code` beside it.
   */
  title: string;
  /**
   * A short code shown large above the title — `404`, `503`. Rendered as text,
   * so it is read out before the heading. A decorative glyph can go here too;
   * give that node `aria-hidden` so it is not read as a word.
   */
  code?: ReactNode;
  /** What happened, and whether it is the reader's to fix. */
  description?: ReactNode;
  /**
   * The route back to somewhere useful — normally a `Button` with an `href`.
   * Links rather than handlers, so the way out works when the page is served
   * without its JavaScript.
   */
  action?: ReactNode;
  /** Anything else: a reference id to quote to support, a status-page link. */
  children?: ReactNode;
  /**
   * Render as the page's `<main>`, filling the viewport on `bg-surface-base`,
   * for a page served without the site chrome. Off by default, when the page is
   * placed inside the consumer's own `<main>` between `SiteHeader` and
   * `SiteFooter` and renders a plain `<div>`.
   */
  standalone?: boolean;
  /** Merged into the root's classes. */
  className?: string;
}

/**
 * A whole-page system state — not found, server error, maintenance, offline,
 * unauthorized — composed from `EmptyState`.
 *
 * It adds three things to the empty state and no more: the title becomes the
 * page's single `<h1>`, an optional status `code` sits above it, and the frame
 * either sits inside the site chrome or, with `standalone`, stands in for it.
 * `NotFoundPage` and `ServerErrorPage` are this with their copy filled in;
 * maintenance, offline and unauthorized pages are written with it directly,
 * because their copy is different on every product.
 *
 * @example
 * ```tsx
 * <StatusPage
 *   standalone
 *   code="503"
 *   title="Down for maintenance"
 *   description="Back by 09:00 UTC."
 *   action={<Button href="https://status.example.com">STATUS PAGE</Button>}
 * />
 * ```
 */
export const StatusPage = forwardRef<HTMLElement, StatusPageProps>(function StatusPage(
  { title, code, description, action, children, standalone = false, className, ...props },
  ref,
) {
  const styles = statusPage({ standalone });
  const rootProps = {
    'data-slot': 'status-page',
    ...props,
    className: styles.root({ class: className }),
  };
  const state = (
    <EmptyState
      className={styles.state()}
      headingLevel={1}
      icon={
        code ? (
          <p data-slot="status-page-code" className={styles.code()}>
            {code}
          </p>
        ) : undefined
      }
      title={title}
      description={description}
      action={action}
    >
      {children}
    </EmptyState>
  );

  // Two elements, not an `as` prop: a `<main>` is a landmark with rules (one
  // per page), and the choice is the one thing `standalone` means.
  return standalone ? (
    <main ref={ref} {...rootProps}>
      {state}
    </main>
  ) : (
    <div ref={ref as Ref<HTMLDivElement>} {...rootProps}>
      {state}
    </div>
  );
});

/** Shared by the two presets: every `StatusPage` prop, with the copy optional. */
interface StatusPagePresetProps extends Omit<StatusPageProps, 'title'> {
  /** Where the default action goes. The site root, `/`, by default. */
  homeHref?: string;
  /** The default action's label. `GO HOME` by default. */
  homeLabel?: string;
}

function homeAction(homeHref: string, homeLabel: string) {
  return (
    <Button href={homeHref} variant="primary" bracketed>
      {homeLabel}
    </Button>
  );
}

export interface NotFoundPageProps extends StatusPagePresetProps {
  /** The page's `<h1>`. "Page not found" by default; `code` is `404`. */
  title?: string;
}

/**
 * The 404 page: `StatusPage` with the copy every site writes identically.
 *
 * Code `404`, the title "Page not found", a sentence that does not blame the
 * reader, and a link home. Every one of them is a prop, so a site that wants
 * search in the page or a different way out passes `action` or `children`
 * rather than rebuilding the page.
 *
 * @example
 * ```tsx
 * <main id="main-content"><NotFoundPage /></main>
 * ```
 */
export const NotFoundPage = forwardRef<HTMLElement, NotFoundPageProps>(function NotFoundPage(
  {
    title = 'Page not found',
    code = '404',
    description = 'Nothing lives at this address. It may have moved, or the link that brought you here may be wrong.',
    homeHref = '/',
    homeLabel = 'GO HOME',
    action,
    ...props
  },
  ref,
) {
  return (
    <StatusPage
      ref={ref}
      title={title}
      code={code}
      description={description}
      action={action ?? homeAction(homeHref, homeLabel)}
      {...props}
    />
  );
});

export interface ServerErrorPageProps extends StatusPagePresetProps {
  /** The page's `<h1>`. "Something went wrong" by default; `code` is `500`. */
  title?: string;
}

/**
 * The 500 page: `StatusPage` with the copy every site writes identically.
 *
 * Code `500`, the title "Something went wrong", a sentence saying it is not
 * the reader's fault, and a link home. Pass `standalone` when the page is
 * served because the application failed — the shell that would have framed it
 * is the thing that may not render. A request or incident id to quote to
 * support belongs in `children`.
 *
 * @example
 * ```tsx
 * <ServerErrorPage standalone>
 *   <p>Reference: {requestId}</p>
 * </ServerErrorPage>
 * ```
 */
export const ServerErrorPage = forwardRef<HTMLElement, ServerErrorPageProps>(function ServerErrorPage(
  {
    title = 'Something went wrong',
    code = '500',
    description = 'The server hit an error it could not recover from. It is not something you did — try again in a moment.',
    homeHref = '/',
    homeLabel = 'GO HOME',
    action,
    ...props
  },
  ref,
) {
  return (
    <StatusPage
      ref={ref}
      title={title}
      code={code}
      description={description}
      action={action ?? homeAction(homeHref, homeLabel)}
      {...props}
    />
  );
});
