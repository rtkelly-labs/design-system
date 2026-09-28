import { forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../../lib/recipe';
import { PageTitle } from '../PageTitle';
import type { SectionAlign } from './SectionGrid';

export interface HeroProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {
  /** The page's headline, rendered as its one `<h1>` through `PageTitle`. */
  title: ReactNode;
  /** A line under the headline, in the primary accent. */
  subtitle?: string;
  /**
   * A short marker above the headline — normally a `Badge`: a release, a
   * category, a status.
   */
  eyebrow?: ReactNode;
  /**
   * The calls to action, in a row under the headline that wraps on a narrow
   * screen — normally one or two `Button`s, the first the one you want pressed.
   */
  actions?: ReactNode;
  /**
   * The hero's media, below the actions — a screenshot, a terminal, a code
   * sample. Give it its own width; the hero does not constrain it.
   */
  children?: ReactNode;
  /** Draw the headline's brackets. On by default, as `PageTitle` does. */
  bracketed?: boolean;
  /** Where the headline and actions sit — `center` (the default) or `start`. */
  align?: SectionAlign;
  /** Merged into the `<section>`'s classes. */
  className?: string;
}

const hero = recipe({
  slots: {
    root: 'mb-16',
    eyebrow: 'mb-6 inline-block',
    actions: 'mt-10 flex flex-wrap gap-5',
    media: 'mt-14',
  },
  variants: {
    align: {
      center: { root: 'text-center', actions: 'justify-center' },
      start: { root: 'text-left', actions: 'justify-start' },
    },
  },
  defaultVariants: { align: 'center' },
});

/**
 * The opening section of a marketing page: an eyebrow, the headline, a line
 * under it, the calls to action and an optional piece of media.
 *
 * Every slot is the caller's. The hero holds no copy, no product name and no
 * default buttons, so one component opens a product launch and a project site
 * without either knowing about the other. The headline is the page's `<h1>`,
 * and it names the section.
 *
 * @example
 * ```tsx
 * <Hero
 *   eyebrow={<Badge accent="primary">NEW</Badge>}
 *   title="Ship the thing"
 *   subtitle="One line on why."
 *   actions={<Button href="/start" variant="tertiary" bracketed size="lg">START</Button>}
 * />
 * ```
 */
export const Hero = forwardRef<HTMLElement, HeroProps>(function Hero(
  { title, subtitle, eyebrow, actions, children, bracketed = true, align = 'center', className, ...props },
  ref,
) {
  const styles = hero({ align });
  const titleId = useId();

  return (
    <section
      ref={ref}
      data-slot="hero"
      aria-labelledby={titleId}
      {...props}
      className={styles.root({ class: className })}
    >
      {eyebrow ? (
        <span data-slot="hero-eyebrow" className={styles.eyebrow()}>
          {eyebrow}
        </span>
      ) : null}
      <PageTitle id={titleId} subtitle={subtitle} bracketed={bracketed}>
        {title}
      </PageTitle>
      {actions ? (
        <div data-slot="hero-actions" className={styles.actions()}>
          {actions}
        </div>
      ) : null}
      {children ? (
        <div data-slot="hero-media" className={styles.media()}>
          {children}
        </div>
      ) : null}
    </section>
  );
});
