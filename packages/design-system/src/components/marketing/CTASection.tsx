import { forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../../lib/recipe';
import type { SectionAlign } from './SectionGrid';

/** The roles a call-to-action band's offset shadow may take. */
export type CTASectionAccent = 'primary' | 'secondary' | 'tertiary';

export interface CTASectionProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {
  /** The ask, rendered as the band's `<h2>` — and the name of the section. */
  title: ReactNode;
  /** A sentence under the ask: what happens next, what it costs. */
  children?: ReactNode;
  /** The buttons — normally one primary action and at most one alternative. */
  actions?: ReactNode;
  /** The role of the band's offset shadow. `primary` by default. */
  accent?: CTASectionAccent;
  /** Where the text and actions sit — `center` (the default) or `start`. */
  align?: SectionAlign;
  /** Merged into the `<section>`'s classes. */
  className?: string;
}

const ctaSection = recipe({
  slots: {
    root: 'my-12 border-4 border-edge-strong bg-surface-raised px-6 py-12 md:px-12',
    heading: 'font-display text-[2rem] font-black uppercase leading-tight text-content-primary',
    body: 'mt-4 max-w-2xl font-mono text-sm leading-relaxed text-content-secondary',
    actions: 'mt-8 flex flex-wrap gap-4',
  },
  variants: {
    accent: {
      primary: { root: 'shadow-hard-accent-primary' },
      secondary: { root: 'shadow-hard-accent-secondary' },
      tertiary: { root: 'shadow-hard-accent-tertiary' },
    },
    align: {
      center: { root: 'text-center', body: 'mx-auto', actions: 'justify-center' },
      start: { root: 'text-left', actions: 'justify-start' },
    },
  },
  defaultVariants: { accent: 'primary', align: 'center' },
});

/**
 * A closing call to action: a bordered band with the ask, a line under it and
 * the buttons, set apart from the sections around it by a hard offset shadow.
 *
 * It holds no copy and no buttons of its own — `Start free`, `Read the docs`
 * and `Book a call` are the page's words — so the same band ends a product
 * page, sits between two sections of a project site, or closes a post.
 *
 * @example
 * ```tsx
 * <CTASection
 *   title="Ready when you are"
 *   actions={<Button href="/start" variant="primary" bracketed>START</Button>}
 * >
 *   No card required.
 * </CTASection>
 * ```
 */
export const CTASection = forwardRef<HTMLElement, CTASectionProps>(function CTASection(
  { title, children, actions, accent = 'primary', align = 'center', className, ...props },
  ref,
) {
  const styles = ctaSection({ accent, align });
  const titleId = useId();

  return (
    <section
      ref={ref}
      data-slot="cta-section"
      aria-labelledby={titleId}
      {...props}
      className={styles.root({ class: className })}
    >
      <h2 id={titleId} className={styles.heading()}>
        {title}
      </h2>
      {children ? (
        <div data-slot="cta-section-body" className={styles.body()}>
          {children}
        </div>
      ) : null}
      {actions ? (
        <div data-slot="cta-section-actions" className={styles.actions()}>
          {actions}
        </div>
      ) : null}
    </section>
  );
});
