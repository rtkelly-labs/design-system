import { forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../../lib/recipe';

/** How many columns a marketing grid settles into at desktop widths. */
export type SectionColumns = 2 | 3 | 4;

/** Where a section's heading block sits. */
export type SectionAlign = 'center' | 'start';

export interface SectionGridProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className'> {
  /** The section's `<h2>`. When present it also names the section. */
  title?: ReactNode;
  /** A line under the heading. */
  description?: ReactNode;
  /** Desktop column count. The grid is a single column below `md` whatever this says. */
  columns?: SectionColumns;
  /** Where the heading and description sit. Centred by default. */
  align?: SectionAlign;
  /** The grid's cells. */
  children?: ReactNode;
  /** Merged into the `<section>`'s classes. */
  className?: string;
  /** The `data-slot` prefix, so each public section keeps its own names. */
  slot: string;
}

// Shared by `FeatureGrid` and `PricingGrid`: one heading block over one grid.
// The column strings are written out in full because Tailwind's scanner reads
// source text, and a template such as `md:grid-cols-${n}` generates no CSS.
const sectionGrid = recipe({
  slots: {
    root: 'my-12',
    header: 'mb-12',
    heading: 'font-display text-[2rem] font-black uppercase text-content-primary',
    description: 'mt-4 max-w-2xl font-mono text-sm leading-relaxed text-content-secondary',
    grid: 'grid grid-cols-1 items-stretch gap-8',
  },
  variants: {
    align: {
      center: { header: 'text-center', description: 'mx-auto' },
      start: { header: 'text-left' },
    },
    columns: {
      2: { grid: 'md:grid-cols-2' },
      3: { grid: 'md:grid-cols-3' },
      4: { grid: 'md:grid-cols-2 lg:grid-cols-4' },
    },
  },
  defaultVariants: { align: 'center', columns: 3 },
});

/**
 * The layout `FeatureGrid` and `PricingGrid` share: an optional heading block
 * over a responsive grid. Internal — the two public sections differ only in
 * what they put in the cells, so they are one implementation with two names.
 */
export const SectionGrid = forwardRef<HTMLElement, SectionGridProps>(function SectionGrid(
  { title, description, columns = 3, align = 'center', children, className, slot, ...props },
  ref,
) {
  const styles = sectionGrid({ align, columns });
  const headingId = useId();
  const hasHeader = Boolean(title) || Boolean(description);

  return (
    <section
      ref={ref}
      data-slot={slot}
      aria-labelledby={title ? headingId : undefined}
      {...props}
      className={styles.root({ class: className })}
    >
      {hasHeader ? (
        <div data-slot={`${slot}-header`} className={styles.header()}>
          {title ? (
            <h2 id={headingId} className={styles.heading()}>
              {title}
            </h2>
          ) : null}
          {description ? <p className={styles.description()}>{description}</p> : null}
        </div>
      ) : null}
      <div data-slot={`${slot}-items`} className={styles.grid()}>
        {children}
      </div>
    </section>
  );
});
