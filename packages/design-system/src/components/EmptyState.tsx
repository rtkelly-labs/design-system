import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../lib/recipe';

/**
 * A dashed well. The border is the one place this component departs from the
 * system's solid `border-edge-strong` edges, and the departure is the message:
 * a solid box is a container with something in it, a dashed one is a container
 * waiting for something. `Card` keeps the solid edge, so the two are not
 * mistakable at a glance.
 */
const emptyState = recipe({
  slots: {
    root:
      'flex flex-col items-center gap-3 border-2 border-dashed border-edge-default '
      + 'bg-surface-raised px-6 py-10 text-center font-mono',
    /** The glyph sits in the muted role: it is the least load-bearing thing here. */
    icon: 'flex items-center justify-center text-content-muted',
    title: 'font-display text-lg font-bold uppercase tracking-wider text-content-primary',
    /** `max-w-prose` because a description that runs the width of a table is unreadable. */
    description: 'max-w-prose font-sans text-sm leading-relaxed text-content-secondary',
    /** A margin rather than the root's gap: the action is a step away from the prose. */
    action: 'mt-2 flex flex-wrap items-center justify-center gap-3',
  },
});

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'className'> {
  /**
   * An optional glyph above the title — a `NerdIcon`, a `Glyph`, or ASCII.
   * Decorative by default, so give it `aria-hidden` unless it carries meaning
   * the title does not.
   */
  icon?: ReactNode;
  /**
   * The state, in as few words as possible — "No results", "Nothing here yet".
   * The one required slot: a box with no title is a hole in the layout.
   */
  title: string;
  /**
   * Render the title as a heading at this level instead of a paragraph. Leave
   * it unset inside a card, table or panel — the right level there depends on
   * the page around it. Set it where the empty state *is* the section or the
   * page: `StatusPage` passes `1`, because its title is the page's only `<h1>`.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Why it is empty, and what would change that. This is where the difference
   * between "your filter matched nothing" and "you have not created anything
   * yet" is actually said, and it is the difference that decides what the
   * reader does next.
   */
  description?: ReactNode;
  /**
   * The way out — a `Button` that clears the filter, creates the first record,
   * or links to the import. Takes nodes rather than a label and a handler so
   * that two actions, or a link beside a button, need no new prop.
   */
  action?: ReactNode;
  /**
   * Anything else the state needs: a hint list, a keyboard shortcut, a second
   * paragraph. Rendered between the description and the action.
   */
  children?: ReactNode;
  /** Merged onto the box. Sizing and placement belong to the caller's layout. */
  className?: string;
}

/**
 * Nothing to show, and what to do about it.
 *
 * The fourth state every application has — loading, loaded, empty, failed —
 * and the one most often left as a bare sentence in a table body. It is
 * compositional on purpose: an icon, a title, a description, an action slot,
 * all optional but the title. A fixed "No results found" component is one
 * product's empty state with its copy hoisted into a prop, and it is wrong for
 * the second consumer on the day they install it.
 *
 * ## The two empties are not the same state
 *
 * A search that matched nothing and an application with nothing in it look
 * alike and read completely differently. The first is *your query*, and the
 * action is to widen or clear it; the second is *the beginning*, and the action
 * is to create the first thing. Same component, different copy and a different
 * action — which is the argument for the slots.
 *
 * ## The title is a paragraph unless you say otherwise
 *
 * By default. This drops into a card body, a table, a panel, a dialog; the
 * right heading level is different in each and the component cannot know it.
 * A wrong level is worse than none — it breaks the document outline a screen
 * reader user navigates by. Where the empty state *is* the section or the page,
 * say so with `headingLevel`, and the title becomes that heading.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, headingLevel, description, action, children, className, ...props },
  ref,
) {
  const styles = emptyState();
  const Title = headingLevel ? (`h${headingLevel}` as const) : 'p';

  return (
    <div ref={ref} data-slot="empty-state" className={styles.root({ class: className })} {...props}>
      {icon && (
        <div data-slot="empty-state-icon" className={styles.icon()}>
          {icon}
        </div>
      )}
      <Title data-slot="empty-state-title" className={styles.title()}>
        [ {title} ]
      </Title>
      {description && (
        // A `div`, not a `p`, for the reason `AlertDialog`'s body gives: the
        // slot takes arbitrary nodes, and a block element inside a paragraph is
        // invalid HTML that the parser repairs by closing the paragraph early —
        // which silently moves the rest of the description out of the box.
        <div data-slot="empty-state-description" className={styles.description()}>
          {description}
        </div>
      )}
      {children}
      {action && (
        <div data-slot="empty-state-action" className={styles.action()}>
          {action}
        </div>
      )}
    </div>
  );
});
