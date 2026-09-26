'use client';

import { forwardRef, useMemo } from 'react';
import type { AnchorHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ChevronDown } from 'lucide-react';
import { cn, recipe } from '../lib/recipe';
import { SiteLink } from './LinkProvider';
import { Menu } from './Menu';
import { floatingParts } from './floatingSurface';
import { SiteNavContext, useSiteNavContext } from './siteNavContext';

/**
 * Which way a `SiteNav` lays its items out: a row, for a header, or a column,
 * for a drawer, a footer or a sidebar. A plain string union, so no library's
 * type reaches the published `.d.ts`.
 */
export type SiteNavOrientation = 'horizontal' | 'vertical';

export interface SiteNavProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'aria-label'> {
  /**
   * The navigation landmark's accessible name — `Primary`, `Footer`,
   * `Resources`. Required: a page with two `<nav>`s and no names gives a
   * screen reader two landmarks called "navigation" and no way to tell them
   * apart. It lands on the `<nav>` itself.
   */
  label: string;
  /** `SiteNavItem`s, in order. The component supplies none of its own. */
  children: ReactNode;
  /** A row (`horizontal`, the default) or a column (`vertical`). */
  orientation?: SiteNavOrientation;
  /** Merged into the `<nav>`'s classes. For placement, not colour. */
  className?: string;
}

// The two layouts, and the item each one wears.
//
// A row's current item is marked by an accent edge under it; a column's by an
// accent edge beside it and the page ground behind it — the tab and sidebar
// selection devices `check:contrast` already audits, so the current item is
// told apart by a shape as well as a colour. Both are keyed off
// `aria-current`, so the styling and the announcement read one attribute.
//
// A column's items are `min-h-11`, 44px at the `web` Medium: in a drawer they
// are touch targets.
const siteNav = recipe({
  slots: {
    root: 'font-mono',
    list: 'm-0 flex list-none p-0',
    link: 'border-transparent font-bold uppercase text-content-secondary no-underline '
      + 'hover:text-accent-primary aria-[current=page]:border-accent-primary '
      + 'aria-[current=page]:text-accent-primary',
    trigger: 'inline-flex cursor-pointer items-center gap-1 border-transparent bg-transparent '
      + 'font-mono font-bold uppercase text-content-secondary hover:text-accent-primary '
      + 'data-[popup-open]:text-accent-primary',
  },
  variants: {
    orientation: {
      horizontal: {
        list: 'flex-wrap items-center gap-x-6 gap-y-2',
        link: 'inline-block border-b-2 py-1 text-sm tracking-wide',
        trigger: 'border-b-2 py-1 text-sm tracking-wide',
      },
      vertical: {
        list: 'flex-col gap-1',
        link: 'block min-h-11 border-l-4 px-3 py-3 text-sm aria-[current=page]:bg-surface-base',
        trigger: 'min-h-11 w-full border-l-4 px-3 py-3 text-left text-sm',
      },
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

/**
 * A site's primary navigation: a named `<nav>` landmark around a list of
 * {@link SiteNavItem}s.
 *
 * It owns the landmark, the list semantics and the two layouts, and nothing
 * else. It holds no items of its own and no default ones — every link comes
 * from the caller — and it does not decide which item is current: that is
 * each item's `current`, or the `isCurrent` a {@link LinkProvider} was given
 * from the consumer's router. Nothing here reads `window.location`.
 *
 * In a {@link SiteHeader} it is the desktop navigation; the same items passed
 * to a {@link MobileNav} become the narrow-viewport one. In a
 * {@link SiteFooter} it is a column (`orientation="vertical"`) with a name of
 * its own.
 *
 * @example
 * ```tsx
 * <SiteNav label="Primary">
 *   <SiteNavItem href="/writing">Writing</SiteNavItem>
 *   <SiteNavItem href="/projects">Projects</SiteNavItem>
 * </SiteNav>
 * ```
 */
export const SiteNav = forwardRef<HTMLElement, SiteNavProps>(function SiteNav(
  { label, children, orientation = 'horizontal', className, ...props },
  ref,
) {
  const parent = useSiteNavContext();
  const styles = siteNav({ orientation });
  const onNavigate = parent.onNavigate;
  const context = useMemo(
    () => ({ orientation, inMenu: false, onNavigate }),
    [orientation, onNavigate],
  );

  return (
    <nav
      ref={ref}
      data-slot="site-nav"
      data-orientation={orientation}
      {...props}
      aria-label={label}
      className={styles.root({ class: className })}
    >
      <ul data-slot="site-nav-list" className={styles.list()}>
        <SiteNavContext.Provider value={context}>{children}</SiteNavContext.Provider>
      </ul>
    </nav>
  );
});

/** A link item — `href` and a label. */
export interface SiteNavLinkItemProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'> {
  /** Where it goes. Rendered through the `LinkProvider`'s link component. */
  href: string;
  /** The visible label, which is also the link's accessible name. */
  children: ReactNode;
  /**
   * Marks this item as the current page. Leave it unset to let the
   * `LinkProvider`'s `isCurrent` decide from the consumer's route.
   */
  current?: boolean;
  /** Merged into the link's classes. */
  className?: string;
  label?: never;
  defaultOpen?: never;
}

/** A group item — a `label` and nested link items, opened as a `Menu`. */
export interface SiteNavGroupItemProps {
  /**
   * The group's visible label. It names the trigger, and so the menu: Base UI
   * labels the `role="menu"` popup by its trigger.
   */
  label: string;
  /** Link `SiteNavItem`s. One level: a group inside a group is not supported. */
  children: ReactNode;
  /** Open on first render — for a story or a walkthrough. */
  defaultOpen?: boolean;
  /** Merged into the trigger's classes. */
  className?: string;
  href?: never;
  current?: never;
}

export type SiteNavItemProps = SiteNavLinkItemProps | SiteNavGroupItemProps;

/**
 * One entry in a {@link SiteNav} or a {@link MobileNav}.
 *
 * Two shapes, chosen by the props rather than by a second component: an item
 * with an `href` is a link, and an item with a `label` and child items is a
 * group whose children open in a {@link Menu}. The group is `Menu`, not a
 * disclosure written here, so its keyboard model — arrow keys, typeahead,
 * Escape back to the trigger — is the one every other menu in the package has.
 *
 * The current link carries `aria-current="page"` on the anchor itself, and
 * its styling is keyed off that attribute rather than a second flag.
 *
 * Forwards its ref to the element it renders: the anchor for a link, the
 * trigger button for a group.
 */
export const SiteNavItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SiteNavItemProps>(
  function SiteNavItem(props, ref) {
    const context = useSiteNavContext();
    const styles = siteNav({ orientation: context.orientation });

    if (typeof props.href !== 'string') {
      const { label, children, defaultOpen, className } = props as SiteNavGroupItemProps;
      return (
        <li data-slot="site-nav-item">
          <Menu
            defaultOpen={defaultOpen}
            trigger={
              <button
                ref={ref as Ref<HTMLButtonElement>}
                type="button"
                data-slot="site-nav-group"
                className={styles.trigger({ class: className })}
              >
                {label}
                <ChevronDown size={14} strokeWidth={3} aria-hidden="true" />
              </button>
            }
          >
            <SiteNavContext.Provider value={{ ...context, inMenu: true }}>
              {children}
            </SiteNavContext.Provider>
          </Menu>
        </li>
      );
    }

    const { href, children, current, className, onClick, ...rest } = props as SiteNavLinkItemProps;
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      // A consumer that cancels the click has kept the reader on this page,
      // so the drawer they navigated from stays open.
      if (!event.defaultPrevented) context.onNavigate?.();
    };

    if (context.inMenu) {
      return (
        <MenuLink
          ref={ref as Ref<HTMLAnchorElement>}
          {...rest}
          href={href}
          current={current}
          className={className}
          onClick={handleClick}
        >
          {children}
        </MenuLink>
      );
    }

    return (
      <li data-slot="site-nav-item">
        <SiteLink
          ref={ref as Ref<HTMLAnchorElement>}
          {...rest}
          href={href}
          current={current}
          onClick={handleClick}
          data-slot="site-nav-link"
          className={styles.link({ class: className })}
        >
          {children}
        </SiteLink>
      </li>
    );
  },
);

// A link inside a group's menu: Base UI's menu link item, which keeps the
// arrow keys and typeahead of the menu, rendered through `SiteLink` so it goes
// through the consumer's router and carries `aria-current` like any other item.
// It closes the menu when followed — the page it opened over is going away.
type MenuLinkProps = Omit<SiteNavLinkItemProps, 'onClick'> & {
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const MenuLink = forwardRef<HTMLAnchorElement, MenuLinkProps>(function MenuLink(
  { href, current, className, children, ...rest },
  ref,
) {
  const parts = floatingParts();
  return (
    <BaseMenu.LinkItem
      ref={ref}
      closeOnClick
      data-slot="site-nav-menu-link"
      className={cn(
        parts.item(),
        'no-underline aria-[current=page]:font-bold aria-[current=page]:underline',
        className,
      )}
      render={(renderProps) => <SiteLink {...renderProps} href={href} current={current} />}
      {...rest}
    >
      {children}
    </BaseMenu.LinkItem>
  );
});
