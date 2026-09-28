'use client';

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { cn } from '../lib/recipe';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { SiteNav } from './SiteNav';
import { COLLAPSE_QUERY, SiteHeaderCollapseContext, SiteNavContext } from './siteNavContext';

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

// Whether the viewport is at or past `query`; false with no query, on the
// server, and where there is no `matchMedia`.
function useMatches(query: string | undefined): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!query || !canMatchMedia()) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => Boolean(query) && canMatchMedia() && window.matchMedia(query as string).matches,
    () => false,
  );
}

export interface MobileNavProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'className'> {
  /**
   * The `<nav>` landmark's accessible name inside the drawer. Give it the same
   * name as the desktop `SiteNav` it stands in for: at any one width only one
   * of the two is rendered, and it is the same navigation.
   */
  label: string;
  /** `SiteNavItem`s — normally the very same ones the desktop `SiteNav` gets. */
  children: ReactNode;
  /** The drawer's title, and so its accessible name. `Menu` by default. */
  title?: string;
  /** The trigger button's visible label, and so its accessible name. `MENU` by default. */
  triggerLabel?: string;
  /** Controlled open state. Leave unset and the component manages its own. */
  open?: boolean;
  /** Open on first render, uncontrolled — for a story or a walkthrough. */
  defaultOpen?: boolean;
  /** Called with the next open state, whatever caused the change. */
  onOpenChange?: (open: boolean) => void;
  /** Replaces the drawer's default close button — a theme control, a CTA. */
  footer?: ReactNode;
  /** Merged into the drawer panel's classes. */
  className?: string;
}

/**
 * The narrow-viewport navigation: a trigger button that opens the site's nav
 * in a {@link Drawer} from the left.
 *
 * It is `Drawer`, not a second off-canvas implementation. Focus moves into the
 * panel on open and back to the trigger on close; Escape, the backdrop and the
 * close control dismiss it; it sits on the dialog stack, so a group's `Menu`
 * opened inside it closes first on Escape; the page behind is scroll-locked
 * and hidden from assistive technology. All of that is inherited, and none of
 * it is written here.
 *
 * What is its own is small: the trigger, which says whether it is expanded;
 * the vertical `SiteNav` inside the panel; and closing the drawer when an item
 * is followed, because under a client-side router following a link does not
 * unload the page the drawer is open over.
 *
 * {@link SiteHeader} shows it below its `collapseAt` breakpoint and hides it
 * above, where the desktop `SiteNav` takes over. Like `SiteNav` it carries no
 * items and no current-page logic of its own.
 *
 * Forwards its ref, and any other props, to the drawer panel.
 *
 * @example
 * ```tsx
 * <MobileNav label="Primary">
 *   <SiteNavItem href="/writing">Writing</SiteNavItem>
 *   <SiteNavItem href="/projects">Projects</SiteNavItem>
 * </MobileNav>
 * ```
 */
export const MobileNav = forwardRef<HTMLDivElement, MobileNavProps>(function MobileNav(
  {
    label,
    children,
    title = 'Menu',
    triggerLabel = 'MENU',
    open,
    defaultOpen = false,
    onOpenChange,
    footer,
    className,
    ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  // Inside a `SiteHeader`, past its `collapseAt` the trigger is hidden by CSS
  // but the portalled drawer is not, so the drawer is kept shut there and an
  // open one is closed as the viewport widens past it.
  const collapseAt = useContext(SiteHeaderCollapseContext);
  const collapseQuery = collapseAt ? COLLAPSE_QUERY[collapseAt] : undefined;
  const collapsed = useMatches(collapseQuery);
  const drawerOpen = isOpen && !collapsed;

  // The latest callback, read at call time, so `setOpen` keeps one identity
  // and the effect below does not re-report a close on every render.
  const onChange = useRef(onOpenChange);
  useEffect(() => {
    onChange.current = onOpenChange;
  });
  const controlled = open !== undefined;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      onChange.current?.(next);
    },
    [controlled],
  );

  // Closed from the media query's own change event rather than from a render,
  // so a widening reports one close to the owner.
  useEffect(() => {
    if (!isOpen || !collapseQuery || !canMatchMedia()) return undefined;
    const list = window.matchMedia(collapseQuery);
    const onWiden = () => {
      if (list.matches) setOpen(false);
    };
    list.addEventListener('change', onWiden);
    return () => list.removeEventListener('change', onWiden);
  }, [isOpen, collapseQuery, setOpen]);

  const close = useCallback(() => setOpen(false), [setOpen]);
  const context = useMemo(
    () => ({ orientation: 'vertical' as const, inMenu: false, onNavigate: close }),
    [close],
  );

  return (
    <>
      <Button
        type="button"
        size="sm"
        data-slot="mobile-nav-trigger"
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={16} strokeWidth={3} aria-hidden="true" />
        {triggerLabel}
      </Button>
      <Drawer
        ref={ref}
        isOpen={drawerOpen}
        onClose={close}
        placement="left"
        title={title}
        footer={footer}
        {...props}
        className={cn(className)}
      >
        <SiteNavContext.Provider value={context}>
          <SiteNav label={label} orientation="vertical">
            {children}
          </SiteNav>
        </SiteNavContext.Provider>
      </Drawer>
    </>
  );
});
