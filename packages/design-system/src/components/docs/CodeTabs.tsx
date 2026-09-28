'use client';

import { Children, Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/recipe';
import type { AccentToken } from '../../lib/theme';
import { Tabs, TabsList, TabsPanel, TabsTab } from '../Tabs';
import type { TabsVariant } from '../Tabs';
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
 * ## It is a `Tabs` now
 *
 * The tablist this component used to hand-roll is {@link Tabs}, the public
 * primitive, and it was extracted from here rather than rewritten — same
 * markup, same classes, same keyboard model, same tests. What stays here is
 * the part that is documentation-specific and does not belong in a primitive:
 * the group store, the `CodeBlock` attachment, and reading tabs out of
 * children.
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

/**
 * The strip's shape. The same three the primitive declares — this alias is
 * kept because it is what existing call sites import.
 */
export type CodeTabsVariant = TabsVariant;

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

  const name = label ?? group;

  return (
    // Controlled, because the selection lives in the group store rather than
    // in the strip: two blocks sharing a group have one selection between them.
    <Tabs
      value={activeLabel}
      onValueChange={select}
      variant={variant}
      accent={accent}
      className={cn('my-6', className)}
    >
      <TabsList
        label={name ?? 'Code variants'}
        caption={variant === 'segmented' ? (name ?? 'source') : undefined}
      >
        {tabs.map((tab) => (
          <TabsTab key={tab.label} value={tab.label}>
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>

      <CodeBlockAttachment value={true}>
        {tabs.map((tab) => (
          // Hidden panels stay in the document rather than unmounting, so
          // every variant of a snippet is in the HTML for a crawler and a
          // switch costs no re-render of the code. That is what `keepMounted`
          // is for, and it is why this did not become a Base UI tablist.
          <TabsPanel key={tab.label} value={tab.label} keepMounted>
            {typeof tab.body === 'string' ? (
              <CodeBlock language={tab.language}>{tab.body}</CodeBlock>
            ) : (
              tab.body
            )}
          </TabsPanel>
        ))}
      </CodeBlockAttachment>
    </Tabs>
  );
}
