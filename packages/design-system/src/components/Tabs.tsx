'use client';

import { createContext, forwardRef, useCallback, useContext, useId, useMemo, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from 'react';
import { cn, recipe } from '../lib/recipe';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';

/**
 * The tab model this package has proven, promoted out of the one component
 * that had it.
 *
 * `CodeTabs` carried a hand-rolled tablist — roving `tabIndex`, arrow keys with
 * wrapping, `Home`/`End`, `aria-controls`/`aria-labelledby` pairing and the
 * three ARIA roles — behind ten tests, and none of it was reachable by a
 * consumer. This is that implementation, extracted rather than rewritten, so
 * the behaviour a consumer gets is the behaviour that was already asserted.
 *
 * It is deliberately **not** a wrapper over `@base-ui/react/tabs`: #163
 * proposed that migration and was closed as rejected, because Base UI does not
 * implement typeahead either and the move would have cost the `keepMounted`
 * behaviour that puts every panel in the HTML. There is one tablist in this
 * tree, and this is it.
 *
 * Typeahead is still the one genuine gap, still out of scope here, and still
 * cheapest as an addition to `moveBetweenTabs` below.
 */

/** Which way the strip runs, and therefore which arrow keys traverse it. */
export type TabsOrientation = 'horizontal' | 'vertical';

/**
 * The three tab-strip shapes, loudest first. Named for the part rather than
 * the colour, because the accent is a separate axis.
 */
export type TabsVariant = 'merged' | 'underline' | 'segmented';

const tabs_ = recipe({
  slots: {
    // The root owns no spacing: a page margin is the caller's decision, and
    // `CodeTabs` supplies its own `my-6`.
    root: '',
    strip: 'relative z-10 flex border-2 border-edge-strong',
    caption:
      'truncate font-mono text-xs font-bold uppercase tracking-widest text-content-secondary',
    list: 'flex items-end',
    tab: 'shrink-0 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-[var(--tabs-accent)] focus-visible:ring-inset',
  },
  variants: {
    variant: {
      // The loudest: a solid accent tab standing on the panel, its bottom rule
      // dropped so the fill runs into what it labels.
      merged: {
        strip: 'items-end overflow-x-auto bg-surface-raised px-1.5 pt-1.5',
        list: 'gap-1',
        tab: '-mb-0.5 border-2 px-4 py-2',
      },
      // The quietest: no tab shapes, a 4px accent rule on the seam.
      underline: {
        strip: 'items-end overflow-x-auto bg-surface-base px-3 pt-2',
        list: 'gap-1',
        tab: '-mb-0.5 border-b-4 px-4 py-2.5',
      },
      // A title bar with a caption slot; the tabs are a segmented control.
      segmented: {
        strip: 'items-center justify-between gap-4 bg-surface-raised px-3 py-2.5',
        list: 'gap-0 border-2 border-edge-strong',
        tab: 'border-r-2 border-edge-strong px-4 py-2 last:border-r-0',
      },
    },
    /*
     * `horizontal` adds nothing on purpose.
     *
     * Every class the horizontal strip renders is the class `CodeTabs` rendered
     * before the extraction, which is what lets its committed baselines stay
     * valid. The vertical set turns the strip on its side and moves each
     * variant's edge treatment from the bottom of a tab to its trailing side.
     */
    orientation: {
      horizontal: {},
      vertical: {
        root: 'flex items-start',
        strip: 'flex-col items-stretch self-stretch overflow-x-visible',
        list: 'flex-col items-stretch',
        tab: 'w-full text-left',
      },
    },
    selected: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variant: 'merged',
      selected: true,
      class: {
        tab: 'relative z-10 border-edge-strong border-b-0 bg-[var(--tabs-accent)] text-content-inverse',
      },
    },
    {
      variant: 'merged',
      selected: false,
      class: {
        tab: 'border-transparent text-content-muted hover:border-edge-strong hover:text-content-primary',
      },
    },
    {
      variant: 'underline',
      selected: true,
      class: { tab: 'border-b-[var(--tabs-accent)] text-content-primary' },
    },
    {
      variant: 'underline',
      selected: false,
      class: { tab: 'border-b-transparent text-content-muted hover:text-content-primary' },
    },
    {
      variant: 'segmented',
      selected: true,
      class: { tab: 'bg-[var(--tabs-accent)] text-content-inverse' },
    },
    {
      variant: 'segmented',
      selected: false,
      class: { tab: 'bg-surface-base text-content-muted hover:text-content-primary' },
    },

    // Vertical: the seam a variant draws along the bottom of a tab moves to its
    // trailing edge, so the strip reads as a column rather than a row that has
    // been rotated and left with a dangling rule.
    { variant: 'merged', orientation: 'vertical', class: { tab: 'mb-0 -mr-0.5' } },
    {
      variant: 'merged',
      orientation: 'vertical',
      selected: true,
      class: { tab: 'border-b-2 border-r-0' },
    },
    {
      variant: 'underline',
      orientation: 'vertical',
      class: { tab: 'mb-0 border-b-0 border-r-4' },
    },
    {
      variant: 'underline',
      orientation: 'vertical',
      selected: true,
      class: { tab: 'border-r-[var(--tabs-accent)]' },
    },
    {
      variant: 'underline',
      orientation: 'vertical',
      selected: false,
      class: { tab: 'border-r-transparent' },
    },
    {
      variant: 'segmented',
      orientation: 'vertical',
      class: { tab: 'border-b-2 border-r-0 last:border-b-0' },
    },
  ],
  defaultVariants: {
    variant: 'merged',
    orientation: 'horizontal',
    selected: false,
  },
});

interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  tabId: (value: string) => string;
  panelId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<${part}> must be rendered inside <Tabs>.`);
  }
  return context;
}

/**
 * A value can be any string a caller finds natural — `"pnpm"`, `"Billing"` —
 * and it has to become part of an `id` that `aria-controls` can reference.
 * HTML5 allows anything but whitespace in an id, but the mapping must also be
 * injective: replacing whitespace with `-` would give `"billing info"` and
 * `"billing-info"` the same id, and two tabs one `aria-controls` target.
 * `encodeURIComponent` escapes whitespace and is reversible, so distinct
 * values always get distinct ids.
 */
function idPart(value: string): string {
  return encodeURIComponent(value);
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * The selected tab's `value`, when the caller owns the selection. Supplying
   * it makes the component controlled: it renders what it is given and never
   * changes on its own, so pair it with `onValueChange`.
   */
  value?: string;
  /**
   * The tab selected on first render, when the component owns the selection.
   * There is no "first tab by default" — a tab's value is known to the tab,
   * not to the root, and inferring it would mean the root reaching into its
   * own children.
   */
  defaultValue?: string;
  /**
   * Called with the newly selected tab's `value`, whichever device selected it
   * — a click, an arrow key, `Home` or `End`. Fires in both the controlled and
   * the uncontrolled case.
   */
  onValueChange?: (value: string) => void;
  /**
   * Which way the strip runs. It decides the arrow keys as well as the layout:
   * `horizontal` traverses with `ArrowLeft`/`ArrowRight`, `vertical` with
   * `ArrowUp`/`ArrowDown`. `Home` and `End` work in both.
   */
  orientation?: TabsOrientation;
  /** The strip's shape. See {@link TabsVariant}. */
  variant?: TabsVariant;
  /**
   * Semantic accent for the selected tab, as an `Emphasis` or an `Intent`.
   * Selection is marked by a fill or a 4px edge in this colour, never by
   * swapping one surface for another — the surfaces are a few percent of
   * lightness apart on the light rungs of the ladder, which is not enough to
   * tell a reader which tab they are on.
   */
  accent?: AccentToken;
  /** A `TabsList` and the `TabsPanel`s it controls, in any arrangement. */
  children: ReactNode;
  /** Merged onto the root. For placement — a margin, a width, a grid cell. */
  className?: string;
}

/**
 * A tab set: one strip of tabs, one panel visible at a time.
 *
 * This is a **content switcher, not navigation**. The panels hold alternative
 * views of the same thing — a settings section, a dashboard slice, a snippet in
 * another language — and the browser's history is not involved. Links that
 * change the page are a nav, and they look like tabs in far too many systems.
 *
 * The keyboard model is the whole reason this is a component rather than a
 * pair of `div`s: arrow keys traverse the strip and wrap at its ends, `Home`
 * and `End` jump to the first and last tab, and only the selected tab is in the
 * tab order, so `Tab` moves past the strip rather than through it. Selection
 * follows focus, which is what the ARIA practices recommend for panels that are
 * cheap to render.
 *
 * ```tsx
 * <Tabs defaultValue="profile" accent="primary">
 *   <TabsList label="Account settings">
 *     <TabsTab value="profile">Profile</TabsTab>
 *     <TabsTab value="billing">Billing</TabsTab>
 *   </TabsList>
 *   <TabsPanel value="profile">…</TabsPanel>
 *   <TabsPanel value="billing">…</TabsPanel>
 * </Tabs>
 * ```
 *
 * Selection is uncontrolled with `defaultValue` and controlled with
 * `value` + `onValueChange`; `CodeTabs` is the worked example of the
 * controlled form, driving the strip from a store shared across the page.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    variant = 'merged',
    accent = 'primary',
    children,
    className,
    style,
    ...props
  },
  ref,
) {
  const uid = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const selected = value ?? uncontrolled;

  const select = useCallback(
    (next: string) => {
      // A controlled set never moves on its own: the caller's `value` is the
      // answer, and writing to local state as well would make the two disagree
      // the moment the caller declines a change.
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const context = useMemo<TabsContextValue>(
    () => ({
      value: selected,
      select,
      orientation,
      variant,
      tabId: (v) => `${uid}-tab-${idPart(v)}`,
      panelId: (v) => `${uid}-panel-${idPart(v)}`,
    }),
    [selected, select, orientation, variant, uid],
  );

  const styles = tabs_({ variant, orientation });

  // The accent is a runtime value, so it travels as a custom property that the
  // fill and edge utilities read — a utility cannot be assembled at build time
  // from a prop, because Tailwind's scanner reads source text.
  const accented = { '--tabs-accent': accentVar(accent), ...style } as CSSProperties;

  return (
    <TabsContext.Provider value={context}>
      <div
        ref={ref}
        {...props}
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(styles.root(), className)}
        style={accented}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The tab list's accessible name, read before the selected tab. Name the set
   * — "Account settings" — rather than repeating the tabs.
   */
  label?: string;
  /**
   * Shown in the strip beside the tabs, for the `segmented` variant's title
   * bar: a filename, a section name. Omit for none.
   */
  caption?: ReactNode;
  /** The `TabsTab`s. Anything else in here is not in the tab order. */
  children: ReactNode;
  /** Merged onto the strip — the bordered bar, not the `tablist` inside it. */
  className?: string;
}

/**
 * Arrow-key traversal for one tab set.
 *
 * Bound on each tab rather than on the `tablist`: a tablist is not itself
 * focusable, and a key handler on an element that never takes focus is what
 * `jsx-a11y/interactive-supports-focus` rejects. It is still one function, and
 * it walks the DOM from the tab's own tablist, so the traversal order is the
 * DOM order a reader actually sees, with no registry to fall out of step.
 * Disabled tabs are skipped: a native disabled button cannot take focus, so
 * landing on one would select it and leave no tab with `tabIndex={0}`. Which
 * keys traverse follows the orientation set on `Tabs`; `Home` and `End` always
 * work.
 */
function moveBetweenTabs(
  event: KeyboardEvent<HTMLButtonElement>,
  orientation: TabsOrientation,
  select: (value: string) => void,
) {
  const current = event.currentTarget;
  const tablist = current.closest('[role="tablist"]');
  if (!tablist) return;

  const strip = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)');
  const list = Array.from(strip);
  const index = list.indexOf(current);
  if (index === -1) return;

  const [back, forward] =
    orientation === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
  const last = list.length - 1;
  const next =
    event.key === forward
      ? index === last
        ? 0
        : index + 1
      : event.key === back
        ? index === 0
          ? last
          : index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : null;

  if (next === null) return;
  event.preventDefault();
  const target = list[next];
  if (!target) return;
  const value = target.dataset.value;
  if (value !== undefined) select(value);
  target.focus();
}

/**
 * The strip a tab set's tabs stand in, holding the `tablist` whose DOM order is
 * the keyboard traversal order (see `moveBetweenTabs`).
 *
 * The tablist's name comes from `label`, or from `aria-label` /
 * `aria-labelledby` passed here: those two are forwarded to the element that
 * carries `role="tablist"`, not left on the wrapper, where they would name
 * nothing a screen reader announces.
 */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  {
    label,
    caption,
    children,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
  },
  ref,
) {
  const { orientation, variant } = useTabsContext('TabsList');
  const styles = tabs_({ variant, orientation });

  return (
    <div
      ref={ref}
      {...props}
      data-slot="tabs-list"
      className={cn(styles.strip(), className)}
    >
      {caption ? (
        <span data-slot="tabs-caption" className={styles.caption()}>
          {caption}
        </span>
      ) : null}
      <div
        role="tablist"
        aria-label={label ?? ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // Only stated when it is not the default: an `aria-orientation` of
        // `horizontal` on a tablist says nothing a screen reader did not
        // already assume.
        aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
        data-orientation={orientation}
        className={styles.list()}
      >
        {children}
      </div>
    </div>
  );
});

export interface TabsTabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /**
   * Identifies the tab, and pairs it with the `TabsPanel` carrying the same
   * value. Unique within one tab set; it also becomes part of the element ids
   * the ARIA pairing is built from.
   */
  value: string;
  /** The tab's label. Short — the strip scrolls rather than wraps. */
  children: ReactNode;
  /** Merged onto the tab. */
  className?: string;
}

/**
 * One tab in a {@link TabsList}.
 *
 * Only the selected tab is in the tab order — a roving `tabIndex`, so `Tab`
 * enters the strip once and leaves it, and the arrow keys move within it. The
 * selected tab is marked by the accent fill or edge its variant declares, and
 * never by a surface swap: `pnpm check:contrast` asserts both devices clear 3:1
 * on every rung of the ladder and reports the surface pair that does not.
 */
export const TabsTab = forwardRef<HTMLButtonElement, TabsTabProps>(function TabsTab(
  { value, children, className, onClick, onKeyDown, ...props },
  ref,
) {
  const context = useTabsContext('TabsTab');
  const selected = context.value === value;
  const styles = tabs_({
    variant: context.variant,
    orientation: context.orientation,
    selected,
  });

  return (
    <button
      ref={ref}
      {...props}
      type="button"
      role="tab"
      id={context.tabId(value)}
      data-slot="tabs-tab"
      // Read back by `moveBetweenTabs`, which walks the DOM
      // rather than a registry: the tabs a reader can arrow between are exactly
      // the ones rendered, with no bookkeeping to fall out of step.
      data-value={value}
      aria-selected={selected}
      aria-controls={context.panelId(value)}
      tabIndex={selected ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        context.select(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        moveBetweenTabs(event, context.orientation, context.select);
      }}
      className={cn(styles.tab(), className)}
    >
      {children}
    </button>
  );
});

export interface TabsPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** The {@link TabsTab} value this panel belongs to. */
  value: string;
  /**
   * Keep the panel in the document when another tab is selected, `hidden`
   * rather than unmounted.
   *
   * Off by default, because a panel that is expensive to render should not be
   * rendered while nobody is looking at it. `CodeTabs` turns it on deliberately
   * — every variant of a snippet is then in the HTML for a crawler, and a
   * switch costs no re-render of the code.
   */
  keepMounted?: boolean;
  /** The panel's content. */
  children: ReactNode;
  /** Merged onto the panel. */
  className?: string;
}

/**
 * The content one tab selects.
 *
 * Paired with its tab by `aria-controls` and `aria-labelledby`, so a screen
 * reader moving into the panel is told which tab it belongs to. It carries no
 * styling of its own: what a panel looks like is the surface it holds, and a
 * primitive that padded it would be wrong for half its uses.
 */
export const TabsPanel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { value, keepMounted = false, children, className, ...props },
  ref,
) {
  const context = useTabsContext('TabsPanel');
  const selected = context.value === value;

  if (!selected && !keepMounted) return null;

  const classes = cn(className);

  return (
    <div
      ref={ref}
      {...props}
      role="tabpanel"
      id={context.panelId(value)}
      data-slot="tabs-panel"
      aria-labelledby={context.tabId(value)}
      hidden={!selected}
      className={classes || undefined}
    >
      {children}
    </div>
  );
});
