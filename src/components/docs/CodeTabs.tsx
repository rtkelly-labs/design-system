import { Children, Fragment, isValidElement, useId, useRef } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { recipe } from '../../lib/recipe';
import { accentVar } from '../../lib/theme';
import type { AccentToken } from '../../lib/theme';
import { CodeBlock, CodeBlockAttachment } from './CodeBlock';
import { useTabGroup } from './codeTabsStore';

/**
 * The code-block language switcher every developer documentation portal has:
 * a strip of tabs standing on a code block, one panel of the same content in
 * another form per tab.
 *
 * This is a **content switcher, not navigation** — a real `tablist` with
 * roving focus and arrow-key traversal, whose panels hold the same snippet in
 * another language or tool. That is why it is not a sidebar rotated: the
 * contract is different.
 *
 * ## `group` is what earns it
 *
 * Blocks sharing a group switch together, and the choice persists across
 * pages: a reader picks a package manager once, not once per snippet. A block
 * whose tab set does not include the group's choice falls back to its own first
 * tab rather than showing nothing.
 *
 * ## The state rule
 *
 * The selected tab is marked with an accent **fill** or a 4px accent **edge**,
 * never by swapping one surface for another. `surface.raised` against
 * `surface.base` is a few percent of lightness on the light rungs of the
 * ladder — enough to layer a strip over a page, not enough to tell a reader
 * which tab they are on. `pnpm check:contrast` asserts both devices clear 3:1
 * on every level, and reports the surface pair so nobody has to rediscover
 * why it is not an option.
 *
 * ## Usage in MDX
 *
 * ```mdx
 * <CodeTabs group="pkg">
 *   <CodeTab label="pnpm">
 *
 *     ```bash
 *     pnpm add @rtkelly13/design-system
 *     ```
 *
 *   </CodeTab>
 *   <CodeTab label="npm">
 *
 *     ```bash
 *     npm install @rtkelly13/design-system
 *     ```
 *
 *   </CodeTab>
 * </CodeTabs>
 * ```
 *
 * Blank lines around the fences are load-bearing — MDX only parses markdown
 * inside a JSX block that opens and closes on its own lines. The fences compile
 * to `CodeBlock`, which reads {@link CodeBlockAttachment} and drops its own top
 * rule so the seam between strip and block is one line. A `CodeTab` whose
 * children are a plain string is wrapped in a `CodeBlock` here, for `.tsx`
 * callers with no MDX pipeline.
 */

export type CodeTabsVariant = 'merged' | 'underline' | 'segmented';

/**
 * `Children.toArray` stops at a `<>…</>`, so a set of tabs an author keeps in
 * a fragment — the natural way to reuse one set across several blocks — would
 * read as a single tab called "Tab 1". Unwrap fragments to any depth.
 */
function flattenFragments(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenFragments(child.props.children)
      : [child],
  );
}

const styles = recipe({
  slots: {
    root: 'my-6',
    strip: 'relative z-10 flex border-2 border-edge-strong',
    caption:
      'truncate font-mono text-xs font-bold uppercase tracking-widest text-content-secondary',
    list: 'flex items-end',
    tab: 'shrink-0 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-[var(--tabs-accent)] focus-visible:ring-inset',
  },
  variants: {
    variant: {
      // The loudest: a solid accent tab standing on the block, its bottom rule
      // dropped so the fill runs into the code.
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
      // A title bar with a filename slot; the tabs are a segmented control.
      segmented: {
        strip: 'items-center justify-between gap-4 bg-surface-raised px-3 py-2.5',
        list: 'gap-0 border-2 border-edge-strong',
        tab: 'border-r-2 border-edge-strong px-4 py-2 last:border-r-0',
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
  ],
  defaultVariants: {
    variant: 'merged',
    selected: false,
  },
});

export interface CodeTabProps {
  /** Tab text: the language, tool or filename. Read by {@link CodeTabs}. */
  label: string;
  /**
   * Language tag for the block, when `children` is a plain string and this
   * component wraps it in a `CodeBlock` itself. Fenced MDX carries its own.
   */
  language?: string;
  children: ReactNode;
}

/**
 * One tab inside a {@link CodeTabs}. A marker component: `CodeTabs` reads its
 * `label` and renders its children into a panel. Rendered on its own it is
 * just its children, so a tab that ends up outside a `CodeTabs` still shows
 * its code rather than vanishing.
 */
export function CodeTab({ children }: CodeTabProps) {
  return <>{children}</>;
}

export interface CodeTabsProps {
  /** `CodeTab` children. Anything else is ignored. */
  children: ReactNode;
  /** Blocks sharing a group switch together, and the choice persists. */
  group?: string;
  variant?: CodeTabsVariant;
  /**
   * Semantic accent for the selected tab. Accepts an `Emphasis` or an
   * `Intent`; the legacy hue names still resolve to the same values.
   */
  accent?: AccentToken;
  /**
   * Caption for the `segmented` variant — a filename or a title. Also the
   * accessible name of the tab list, ahead of `group`.
   */
  label?: string;
  className?: string;
}

export function CodeTabs({
  children,
  group,
  variant = 'merged',
  accent = 'primary',
  label,
  className = '',
}: CodeTabsProps) {
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = flattenFragments(children)
    .filter(isValidElement<CodeTabProps>)
    .map((child, index) => ({
      label: child.props.label || `Tab ${index + 1}`,
      language: child.props.language,
      body: child.props.children,
    }));

  const [selected, select] = useTabGroup(group, tabs[0]?.label ?? '');

  // A group can be shared by blocks with different tab sets — `pnpm | npm` in
  // one and `pnpm | npm | yarn` in another. Fall back rather than showing an
  // empty block when the group's choice is not on offer here.
  const activeLabel = tabs.some((tab) => tab.label === selected)
    ? selected
    : (tabs[0]?.label ?? '');

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
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
    const target = tabs[next];
    if (!target) return;
    select(target.label);
    tabRefs.current[next]?.focus();
  };

  // The accent is a runtime value, so it travels as a custom property that the
  // fill and edge utilities read — a utility cannot be assembled at build time
  // from a prop.
  const accentStyle = { '--tabs-accent': accentVar(accent) } as CSSProperties;

  const slots = styles({ variant });

  return (
    <div className={slots.root({ class: className })} style={accentStyle}>
      <div className={slots.strip()}>
        {variant === 'segmented' && (
          <span className={slots.caption()}>{label ?? group ?? 'source'}</span>
        )}
        <div
          role="tablist"
          aria-label={label ?? group ?? 'Code variants'}
          className={slots.list()}
        >
          {tabs.map((tab, index) => {
            const active = tab.label === activeLabel;
            return (
              <button
                key={tab.label}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={active}
                aria-controls={`${id}-panel-${index}`}
                tabIndex={active ? 0 : -1}
                onClick={() => select(tab.label)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={styles({ variant, selected: active }).tab()}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <CodeBlockAttachment value={true}>
        {tabs.map((tab, index) => (
          <div
            key={tab.label}
            role="tabpanel"
            id={`${id}-panel-${index}`}
            aria-labelledby={`${id}-tab-${index}`}
            // Hidden panels stay in the document rather than unmounting, so
            // every variant of a snippet is in the HTML for a crawler and a
            // switch costs no re-render of the code.
            hidden={tab.label !== activeLabel}
          >
            {typeof tab.body === 'string' ? (
              <CodeBlock language={tab.language}>{tab.body}</CodeBlock>
            ) : (
              tab.body
            )}
          </div>
        ))}
      </CodeBlockAttachment>
    </div>
  );
}
