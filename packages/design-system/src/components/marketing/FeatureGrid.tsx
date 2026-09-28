import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../../lib/recipe';
import { accentTextClass } from '../../lib/accentClasses';
import type { AccentToken } from '../../lib/theme';
import { Card } from '../Card';
import { SectionGrid } from './SectionGrid';
import type { SectionAlign, SectionColumns } from './SectionGrid';

export type { SectionAlign, SectionColumns };

export interface FeatureGridProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className'> {
  /**
   * The section's heading, rendered as its `<h2>`. When present the section is
   * named by it, so it becomes a landmark a screen reader can list.
   */
  title?: ReactNode;
  /** A line under the heading — what the features add up to. */
  description?: ReactNode;
  /**
   * How many columns at desktop widths: `2`, `3` (the default) or `4`. Below
   * `md` the grid is always one column, so a phone never gets three cramped
   * cards side by side.
   */
  columns?: SectionColumns;
  /** Where the heading block sits — `center` (the default) or `start`. */
  align?: SectionAlign;
  /** The cells — normally `Feature`s. */
  children?: ReactNode;
  /** Merged into the `<section>`'s classes. Spacing between sections is the page's to set. */
  className?: string;
}

/**
 * A marketing section of features: an optional heading and line, over a grid
 * of {@link Feature} cells.
 *
 * A layout, not content. It holds no copy, no icons and no product name — the
 * page passes all of them — so the same section is a product's feature list, a
 * project's principles, or a service's "how it works".
 *
 * The grid is one column below `md` and `columns` wide above it. Vertical
 * margin is `my-12`, which collapses with a neighbouring section's, so a page
 * of sections stacked in a column spaces itself.
 *
 * @example
 * ```tsx
 * <FeatureGrid title="Built for control" columns={3}>
 *   <Feature title="Sync" icon={<Cpu size={28} />} accent="primary">
 *     Changes land everywhere at once.
 *   </Feature>
 * </FeatureGrid>
 * ```
 */
export const FeatureGrid = forwardRef<HTMLElement, FeatureGridProps>(function FeatureGrid(props, ref) {
  return <SectionGrid ref={ref} slot="feature-grid" {...props} />;
});

export interface FeatureProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The feature's name, set as the cell's `<h3>` in the accent. */
  title: string;
  /**
   * A decorative icon above the text — a `lucide-react` icon at about 28px.
   * Coloured by `accent`, and hidden from assistive technology: the title
   * already names the feature.
   */
  icon?: ReactNode;
  /** The semantic accent for the stripe, the title and the icon. None by default. */
  accent?: AccentToken;
  /** The description — a sentence or two. */
  children?: ReactNode;
  /** Merged into the cell's classes. */
  className?: string;
}

const feature = recipe({
  slots: {
    body: 'mt-2',
    icon: 'block',
    description: 'mt-3 font-mono text-[0.85rem] leading-[1.6] text-content-primary opacity-90',
  },
});

/**
 * One cell of a {@link FeatureGrid}: a titled `Card` panel with an optional
 * icon and a short description.
 *
 * The accent is the whole colour budget — the panel's stripe, its title and
 * the icon all take it — so choose it by role, and let neighbouring cells
 * differ to tell them apart.
 *
 * @example
 * ```tsx
 * <Feature title="Backups" icon={<Shield size={28} />} accent="secondary">
 *   Written on a schedule, restored in one step.
 * </Feature>
 * ```
 */
export const Feature = forwardRef<HTMLDivElement, FeatureProps>(function Feature(
  { title, icon, accent, children, className, ...props },
  ref,
) {
  const styles = feature();
  return (
    <Card
      ref={ref}
      variant="panel"
      accent={accent}
      title={title}
      data-slot="feature"
      {...props}
      className={className}
    >
      <div data-slot="feature-body" className={styles.body()}>
        {icon ? (
          <span
            data-slot="feature-icon"
            aria-hidden="true"
            className={styles.icon({ class: accent ? accentTextClass(accent) : undefined })}
          >
            {icon}
          </span>
        ) : null}
        {children ? (
          <div data-slot="feature-description" className={styles.description()}>
            {children}
          </div>
        ) : null}
      </div>
    </Card>
  );
});
