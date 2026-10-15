'use client';

import { Fragment, forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Accessibility } from 'lucide-react';
import { cn } from '../lib/recipe';
import { Menu, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from './Menu';
import { useA11yPreferences } from './A11yPreferencesProvider';
import { isA11yChoice } from './a11yInitScript';
import type { A11yAxis, A11yChoice } from './a11yInitScript';

/**
 * Each axis: its group heading, and what `system`, `on` and `off` mean for it in
 * words a person recognises. The order is the order the groups appear in.
 *
 * `system` is spelled out where it has no signal to follow, because "System" on
 * an axis the OS knows nothing about reads as a promise the page cannot keep.
 */
const AXES: ReadonlyArray<{
  axis: A11yAxis;
  label: string;
  choices: Readonly<Record<A11yChoice, string>>;
}> = [
  { axis: 'motion', label: 'Motion', choices: { system: 'System', on: 'Reduce', off: 'Full' } },
  { axis: 'contrast', label: 'Contrast', choices: { system: 'System', on: 'More', off: 'Standard' } },
  {
    axis: 'cvd',
    label: 'Colour vision',
    choices: { system: 'System (off)', on: 'Patterns', off: 'Off' },
  },
  {
    axis: 'links',
    label: 'Links',
    choices: { system: 'System (off)', on: 'Underlined', off: 'Off' },
  },
];

/** Order the radios the same way on every axis, so the position of "On" is learnable. */
const CHOICES: readonly A11yChoice[] = ['system', 'on', 'off'];

export interface A11yMenuProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'type'> {
  /**
   * Classes for the trigger button. The default is the square bordered icon
   * button the site's own theme picker uses; `DocsHeader` passes its icon-button
   * class so the two sit as a pair.
   */
  triggerClassName?: string;
  /** Which side of the trigger the menu opens towards. `end` by default, for a trailing header control. */
  align?: 'start' | 'center' | 'end';
  /** Open on first render, uncontrolled — for a story or a walkthrough. */
  defaultOpen?: boolean;
}

const DEFAULT_TRIGGER =
  'inline-flex size-11 cursor-pointer items-center justify-center border-2 border-edge-strong bg-surface-base text-content-primary hover:text-accent-primary';

/**
 * A menu of the accessibility preferences, for beside the theme picker.
 *
 * Four groups — motion, contrast, colour vision, links — each a choice between
 * `system`, `on` and `off`, and one item that returns every group to the system.
 * It stays open while a group is adjusted, because a person turning on two
 * preferences should not have to reopen it. Needs an `A11yPreferencesProvider`;
 * `DocsHeader` mounts it only when one is present.
 *
 * @example
 * ```tsx
 * <A11yPreferencesProvider>
 *   <SiteHeader brand="RTK" actions={<><A11yMenu /><ThemeMenu /></>} />
 * </A11yPreferencesProvider>
 * ```
 */
export const A11yMenu = forwardRef<HTMLButtonElement, A11yMenuProps>(function A11yMenu(
  { triggerClassName, align = 'end', defaultOpen, ...props },
  ref,
) {
  const prefs = useA11yPreferences();
  return (
    <Menu
      align={align}
      defaultOpen={defaultOpen}
      trigger={
        <button
          ref={ref}
          type="button"
          data-slot="a11y-menu"
          className={cn(triggerClassName ?? DEFAULT_TRIGGER)}
          aria-label="Accessibility preferences"
          {...props}
        >
          <Accessibility size={18} aria-hidden="true" />
        </button>
      }
    >
      {AXES.map(({ axis, label, choices }, index) => (
        <Fragment key={axis}>
          {index > 0 ? <MenuSeparator /> : null}
          <MenuRadioGroup
            label={label}
            value={prefs[axis]}
            onValueChange={(next) => {
              if (isA11yChoice(next)) prefs.set(axis, next);
            }}
          >
            {CHOICES.map((choice) => (
              <MenuRadioItem key={choice} value={choice}>
                {choices[choice]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </Fragment>
      ))}
      <MenuSeparator />
      <MenuItem onClick={prefs.reset}>Reset to system</MenuItem>
    </Menu>
  );
});

A11yMenu.displayName = 'A11yMenu';
