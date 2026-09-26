import { forwardRef, useCallback, useEffect, useId, useRef } from 'react';
import type { ForwardedRef, HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { recipe } from '../lib/recipe';

// The danger edge and its hard shadow are the whole signal that this box is
// about a failure; the heading stays in the primary ink so it reads as a
// heading, and the links carry the danger role, as a field's own error does.
const errorSummary = recipe({
  slots: {
    root:
      'flex flex-col gap-3 border-2 border-intent-danger bg-surface-base p-5 font-mono ' +
      'shadow-hard-intent-danger',
    title: 'm-0 font-display text-lg font-bold uppercase tracking-wider text-content-primary',
    description: 'max-w-prose font-sans text-sm leading-relaxed text-content-secondary',
    list: 'm-0 flex list-none flex-col gap-2 p-0',
    item: 'flex gap-2 text-sm',
    marker: 'font-bold text-intent-danger',
    link: 'font-bold text-intent-danger underline underline-offset-4 hover:no-underline',
  },
});

/** One entry in the summary: which control is wrong, and what is wrong with it. */
export interface ErrorSummaryError {
  /**
   * The `id` of the invalid control, without the `#`. The entry links to
   * `#id`, and following the link focuses that control. Give the field the
   * same `id` you list here — `Input`, `TextArea`, `Select`, `Checkbox`,
   * `Switch` and `RadioGroup` all take one.
   */
  id: string;
  /**
   * What is wrong and how to put it right, as the link text. Usually the same
   * words as the field's own `error`, so the reader recognises the field when
   * they arrive at it.
   */
  message: string;
}

export interface ErrorSummaryProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'className' | 'children'
> {
  /**
   * The form's current errors, in the order the fields appear. Empty renders
   * nothing at all — there is no "all clear" state to announce.
   */
  errors: readonly ErrorSummaryError[];
  /**
   * The heading, which is also the region's accessible name. Say that
   * something is wrong, not what: the list says what.
   */
  title?: string;
  /**
   * The heading's level. `2` suits the usual place — the top of a form under
   * the page's `h1`. Set it where the form sits deeper in the outline.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * Move focus to the summary when it appears — when `errors` goes from empty
   * to non-empty, including on mount. On by default, because focus is how the
   * summary is announced (see the component notes). Turn it off only where
   * errors appear while the reader is still typing, and focus it from the
   * submit handler through the ref instead. Not `autoFocus`: that is the
   * HTML attribute, which fires once on insertion, and this is a different
   * rule.
   */
  focusOnAppear?: boolean;
  /**
   * Optional prose between the heading and the list — a sentence about the
   * errors as a whole. The list is still rendered from `errors`.
   */
  children?: ReactNode;
  /** Merged onto the root. For placement — margins, width — not colour. */
  className?: string;
}

// The wrapper each field frame renders. A control found inside it is the one
// the link is for, and the wrapper — label included — is what scrolls into
// view, so the reader lands on the question and not just the box.
const FIELD = '[data-slot="field"], [data-slot="fieldset-field"]';

const FOCUSABLE = [
  'input:not([type="hidden"]):not([aria-hidden="true"])',
  'select',
  'textarea',
  'button',
  'a[href]',
  '[tabindex]',
].join(', ');

function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE) && element.tabIndex >= 0 && !element.matches(':disabled');
}

// The element an id names is not always the one that takes focus. A
// `Checkbox` or `Switch` puts its id on Base UI's hidden input, which is
// `aria-hidden` and out of the tab order, so the visible control beside it is
// the target; a `RadioGroup`'s id is on the group, and the target is the radio
// its roving focus would give Tab.
function focusTargetFor(element: HTMLElement): HTMLElement | null {
  if (isFocusable(element)) return element;
  const scopes: (Element | null)[] = [element, element.closest(FIELD)];
  for (const scope of scopes) {
    if (!scope) continue;
    const found = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).find(isFocusable);
    if (found) return found;
  }
  return null;
}

// Module scope, as in `dialogPopupRef.ts`: written inline, the assignment
// reads to the compiler lint as a component mutating a captured value.
function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref) {
    ref.current = node;
  }
}

function followError(event: MouseEvent<HTMLAnchorElement>, id: string) {
  // A modified or secondary click is the reader asking the browser for
  // something else; leave it to the browser.
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const element = event.currentTarget.ownerDocument.getElementById(id);
  const target = element && focusTargetFor(element);
  // Nothing focusable under that id: the plain fragment jump still scrolls
  // to it, which is better than a link that does nothing.
  if (!element || !target) return;

  event.preventDefault();
  target.focus({ preventScroll: true });
  // Optional because not every DOM implements it; jsdom does not.
  (element.closest(FIELD) ?? target).scrollIntoView?.({ block: 'start' });
}

/**
 * The form's errors, gathered in one place at the top of the form, each a
 * link to the field it is about.
 *
 * Field-level `error` says what is wrong with *this* field, where the reader
 * already is. After a failed submit the reader is at the button, and a long
 * form's errors are scattered above them, some off-screen. This is the list
 * they start from: one heading saying that something is wrong, one line per
 * error, and each line takes them to the control — focus moves to it, and its
 * label scrolls into view.
 *
 * ## How it is announced: focus, not `role="alert"`
 *
 * When the summary appears it moves focus to itself (`tabIndex={-1}`), and it
 * is a `section` named by its heading, so a screen reader announces "There is
 * a problem, region" and reads on into the list. That is one deliberate
 * choice, made instead of a live region:
 *
 * - Focus puts the reader *where the fixes are*. The next Tab is the first
 *   error's link. An alert is read out and leaves the reader at the submit
 *   button with the list somewhere above them.
 * - Doing both double-announces: the alert fires and the focus change reads
 *   the same content again.
 *
 * The fields keep to the same rule. A field's `error` is not a live region
 * either: it describes its control through `aria-describedby`, so it is read
 * when a link here moves focus to the field, and not at the moment the
 * summary appears. Before #299 every field error was `role="alert"`, and a
 * failed submit read each one on top of the summary.
 *
 * So there is no `role="alert"` here, and `focusOnAppear` is on by default. It
 * fires when `errors` goes from empty to non-empty. A second failed submit
 * while errors are still listed does not re-fire it; remount the summary with
 * a `key` that changes per submit attempt, or call `focus()` on its ref.
 *
 * It holds no copy of its own beyond the default heading, and renders nothing
 * when `errors` is empty.
 *
 * ```tsx
 * <ErrorSummary
 *   key={attempt}
 *   errors={[
 *     { id: 'display-name', message: 'Enter a display name' },
 *     { id: 'terms', message: 'Accept the terms to continue' },
 *   ]}
 * />
 * ```
 */
export const ErrorSummary = forwardRef<HTMLElement, ErrorSummaryProps>(function ErrorSummary(
  {
    errors,
    title = 'There is a problem',
    headingLevel = 2,
    focusOnAppear = true,
    children,
    className,
    ...props
  },
  ref,
) {
  const styles = errorSummary();
  const titleId = useId();
  const root = useRef<HTMLElement | null>(null);
  const hasErrors = errors.length > 0;

  const attach = useCallback(
    (node: HTMLElement | null) => {
      root.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    if (hasErrors && focusOnAppear) {
      root.current?.focus();
    }
  }, [hasErrors, focusOnAppear]);

  if (!hasErrors) return null;

  const Heading = `h${headingLevel}` as const;

  return (
    <section
      tabIndex={-1}
      aria-labelledby={titleId}
      data-slot="error-summary"
      {...props}
      ref={attach}
      className={styles.root({ class: className })}
    >
      <Heading id={titleId} data-slot="error-summary-title" className={styles.title()}>
        {title}
      </Heading>
      {children && (
        // A `div`, not a `p`, for the reason `EmptyState` gives: the slot takes
        // arbitrary nodes, and a block inside a paragraph is repaired by the
        // parser into markup that is not what was written.
        <div data-slot="error-summary-description" className={styles.description()}>
          {children}
        </div>
      )}
      <ul data-slot="error-summary-list" className={styles.list()}>
        {errors.map((error, index) => (
          <li key={`${error.id}-${index}`} data-slot="error-summary-item" className={styles.item()}>
            <span aria-hidden="true" className={styles.marker()}>
              &gt;
            </span>
            <a
              href={`#${error.id}`}
              data-slot="error-summary-link"
              className={styles.link()}
              onClick={(event) => followError(event, error.id)}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
});
