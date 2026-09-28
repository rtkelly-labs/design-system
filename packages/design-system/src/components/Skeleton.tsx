import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';

/**
 * A sunken box with a hard edge, in the shape of the thing that is coming.
 *
 * `bg-surface-sunken` inside `border-edge-subtle`, and no radius: a skeleton
 * that does not look like this system's boxes is a grey pill borrowed from
 * another system, which is the drift this component exists to stop.
 *
 * The pulse is opacity only. A shimmer sweeping a gradient across the box is
 * the canonical vestibular trigger, and it also needs a second surface colour
 * to sweep *with* — two reasons not to have one.
 */
const skeleton = recipe({
  slots: {
    /*
     * `motion-reduce:animate-none` — the rule the issue names, and the one case
     * in this package where the preference removes the animation rather than
     * slowing it. Nothing is lost: a skeleton says "content of this shape is
     * coming" by its geometry, and the pulse only ever said "still coming".
     * `Spinner` slows instead of stopping, because there the motion *is* the
     * message.
     */
    root: 'block animate-ds-pulse border border-edge-subtle bg-surface-sunken motion-reduce:animate-none',
  },
  variants: {
    /**
     * The shape of the content, not a size. Each is a placeholder for a thing
     * the system already renders, which is why there is no `width` prop: a
     * caller sizes it with `className`, in the layout the real content will
     * land in.
     */
    shape: {
      text: { root: 'h-4 w-full' },
      heading: { root: 'h-7 w-2/3' },
      block: { root: 'h-24 w-full' },
      avatar: { root: 'size-12' },
    },
  },
  defaultVariants: {
    shape: 'text',
  },
});

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /**
   * Which piece of content this stands in for — a line of prose, a heading, a
   * block of media, an avatar. It sets the default height and width only;
   * `className` overrides either, and is how a skeleton is fitted to the
   * layout it is holding open.
   */
  shape?: 'text' | 'heading' | 'block' | 'avatar';
  /**
   * Merged onto the box. Sizing belongs here — `w-40`, `h-64` — because the
   * measurement that matters is the one the real content will have.
   */
  className?: string;
}

/**
 * A placeholder in the shape of the content that has not arrived.
 *
 * One skeleton is one piece of content: a line, a heading, a thumbnail. A
 * loading card is several of them in the layout the real card will use, which
 * is the point — the page does not move when the data lands, because the
 * skeleton already held the space. That is also why there is no `lines` prop:
 * a stack of three with the last one short is composition the caller can see,
 * and a prop that renders a paragraph for you cannot match a layout it has
 * never been shown.
 *
 * Reach for it when the shape of what is coming is known and the wait is long
 * enough to leave a hole. For a short wait in a small space, `Spinner` is
 * honest and cheaper; for a wait whose fraction is known, `Progress`.
 *
 * ## It is hidden from assistive technology
 *
 * `aria-hidden="true"` by default. A skeleton is a drawing of absent content,
 * and a screen reader reading out a scaffold of empty boxes is worse than
 * silence. What a screen reader user needs is the *state*, once, from the
 * region that is loading: put `aria-busy="true"` on the container and a
 * `Spinner`'s label inside it, and let the skeletons be decoration. The
 * attribute spreads like any other prop, so a caller who has a reason can set
 * it back.
 *
 * ## Reduced motion
 *
 * The pulse stops entirely under `prefers-reduced-motion`, leaving the sunken
 * box. See the note on the recipe for why this component stops and `Spinner`
 * only slows.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'text', className, ...props },
  ref,
) {
  const styles = skeleton({ shape });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="skeleton"
      className={styles.root({ class: className })}
      {...props}
    />
  );
});
