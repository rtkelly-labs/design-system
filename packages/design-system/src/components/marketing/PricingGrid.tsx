import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { recipe } from '../../lib/recipe';
import { accentTextClass } from '../../lib/accentClasses';
import { Card } from '../Card';
import { SectionGrid } from './SectionGrid';
import type { SectionAlign, SectionColumns } from './SectionGrid';

export interface PricingGridProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className'> {
  /**
   * The section's heading, rendered as its `<h2>`. When present the section is
   * named by it, so it becomes a landmark a screen reader can list.
   */
  title?: ReactNode;
  /** A line under the heading — billing terms, a trial, a guarantee. */
  description?: ReactNode;
  /**
   * How many columns at desktop widths: `2`, `3` (the default) or `4`. Match
   * it to the number of tiers. Below `md` the tiers stack in one column.
   */
  columns?: SectionColumns;
  /** Where the heading block sits — `center` (the default) or `start`. */
  align?: SectionAlign;
  /** The tiers — normally `PricingTier`s. Every cell in a row stretches to the tallest. */
  children?: ReactNode;
  /** Merged into the `<section>`'s classes. Spacing between sections is the page's to set. */
  className?: string;
}

/**
 * A marketing section of price plans: an optional heading and line, over a
 * grid of {@link PricingTier} cells stretched to one height so their actions
 * line up.
 *
 * Holds no prices, plan names or currency. The same grid is a SaaS plan table,
 * a consulting rate card or a donation ladder.
 *
 * @example
 * ```tsx
 * <PricingGrid title="Pricing" columns={2}>
 *   <PricingTier name="Solo" price="$0" period="/month" features={['One workspace']} />
 *   <PricingTier name="Team" price="$12" period="/seat" badge="POPULAR" accent="tertiary" />
 * </PricingGrid>
 * ```
 */
export const PricingGrid = forwardRef<HTMLElement, PricingGridProps>(function PricingGrid(props, ref) {
  return <SectionGrid ref={ref} slot="pricing-grid" {...props} />;
});

/**
 * The roles a tier's accent may take. The emphasis roles less `quiet`, because
 * the accent colours the price and is the natural `variant` for the tier's
 * `Button`, and `Button` omits `quiet`: inverse text on a quiet fill is not a
 * gated pair.
 */
export type PricingTierAccent = 'primary' | 'secondary' | 'tertiary';

/**
 * One tier as data — the shape `SaasLandingPage`'s `pricingTiers` takes.
 *
 * It shares the component's name because it was public under that name before
 * the component existed: the type `PricingTier` is this record, the value
 * `PricingTier` is the component. `highlighted` and `ctaText` are the landing
 * page's own vocabulary; the component takes a `badge` and an `action` instead,
 * so that no label is decided on the caller's behalf.
 */
export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  /**
   * The tier's accent, used three ways — `Card accent`, the price, and
   * `Button variant` for the CTA. See {@link PricingTierAccent}.
   */
  accent: PricingTierAccent;
  highlighted?: boolean;
  ctaText?: string;
}

export interface PricingTierProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The plan's name, set as the tier's `<h3>`. */
  name: ReactNode;
  /** The price as displayed — currency and all, since only the caller knows the locale. */
  price: ReactNode;
  /** What the price is per — `/month`, `/seat`, `one-off`. Set small, in the muted ink. */
  period?: ReactNode;
  /** A line on who the plan is for. */
  description?: ReactNode;
  /** What the plan includes, one entry per line, each ticked. */
  features?: readonly ReactNode[];
  /**
   * The semantic accent for the stripe and the price. `primary` by default.
   * Pass the same role as the action `Button`'s `variant` so the tier reads as
   * one colour.
   */
  accent?: PricingTierAccent;
  /**
   * A label in the tier's header strip — `POPULAR`, `BEST VALUE`. None by
   * default: which tier is recommended, and what that is called, is the page's
   * decision.
   */
  badge?: string;
  /**
   * The call to action, pinned to the bottom of the tier below a rule — a
   * `Button`, normally in the tier's accent and full width. Omit it for a
   * tier with nothing to choose.
   */
  action?: ReactNode;
  /** Merged into the tier's classes. */
  className?: string;
}

const pricingTier = recipe({
  slots: {
    root: 'flex flex-col justify-between',
    name: 'mb-2 font-display text-[1.1rem] font-extrabold uppercase text-content-primary',
    priceRow: 'mb-4',
    price: 'font-display text-[3rem] font-black',
    period: 'font-mono text-[0.85rem] text-content-muted',
    description: 'mb-6 font-mono text-[0.75rem] leading-[1.5] text-content-primary opacity-80',
    features: 'm-0 mb-6 list-none p-0',
    feature: 'mb-[0.6rem] flex items-start gap-2 font-mono text-[0.8rem] text-content-primary opacity-90',
    tick: 'mt-[2px] shrink-0 text-intent-success',
    action: 'mt-auto border-t border-edge-strong pt-4',
  },
});

/**
 * One plan in a {@link PricingGrid}: name, price, a line about it, a ticked
 * feature list, and an action pinned to the bottom.
 *
 * A `Card` panel in a column, so the action sits on the tier's floor however
 * long its list is, and tiers of different lengths in one row keep their
 * actions level. Holds no labels of its own: the badge, the action's text and
 * whether there is one at all come from the caller.
 *
 * @example
 * ```tsx
 * <PricingTier
 *   name="Team"
 *   price="$12"
 *   period="/seat"
 *   description="For a team that ships together."
 *   features={['Shared workspaces', 'Audit log']}
 *   accent="tertiary"
 *   badge="POPULAR"
 *   action={<Button variant="tertiary" bracketed className="w-full justify-center">START</Button>}
 * />
 * ```
 */
export const PricingTier = forwardRef<HTMLDivElement, PricingTierProps>(function PricingTier(
  { name, price, period, description, features, accent = 'primary', badge, action, className, ...props },
  ref,
) {
  const styles = pricingTier();
  return (
    <Card
      ref={ref}
      variant="panel"
      accent={accent}
      badge={badge}
      data-slot="pricing-tier"
      {...props}
      className={styles.root({ class: className })}
    >
      <div data-slot="pricing-tier-body">
        <h3 className={styles.name()}>{name}</h3>
        <div data-slot="pricing-tier-price" className={styles.priceRow()}>
          <span className={styles.price({ class: accentTextClass(accent) })}>{price}</span>
          {period ? <span className={styles.period()}>{period}</span> : null}
        </div>
        {description ? <p className={styles.description()}>{description}</p> : null}
        {features && features.length > 0 ? (
          <ul data-slot="pricing-tier-features" className={styles.features()}>
            {features.map((item, i) => (
              <li key={typeof item === 'string' ? item : i} className={styles.feature()}>
                <Check size={14} aria-hidden="true" className={styles.tick()} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {action ? (
        <div data-slot="pricing-tier-action" className={styles.action()}>
          {action}
        </div>
      ) : null}
    </Card>
  );
});
