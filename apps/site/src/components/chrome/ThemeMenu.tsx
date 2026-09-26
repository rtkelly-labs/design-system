'use client';

import { Palette } from 'lucide-react';
import { LEVELS, Menu, MenuRadioGroup, MenuRadioItem, useTheme } from '@/ds';
import type { ThemeLevel } from '@/ds';

/**
 * The level picker for the marketing header.
 *
 * `DocsHeader` has exactly this control built in, and nothing else in the
 * package exposes it — so a `SiteHeader` consumer rebuilds it from `Menu`. It
 * is the same composition, not a variation on it (issue 310).
 */
export function ThemeMenu() {
  const theme = useTheme();
  return (
    <Menu
      align="end"
      trigger={
        <button
          type="button"
          className="inline-flex size-11 cursor-pointer items-center justify-center border-2 border-edge-strong bg-surface-base text-content-primary hover:text-accent-primary"
          aria-label={`Theme level (current: ${LEVELS[theme.level].label})`}
        >
          <Palette size={18} aria-hidden="true" />
        </button>
      }
    >
      <MenuRadioGroup
        label="Level"
        value={theme.level}
        onValueChange={(next) => theme.setLevel(next as ThemeLevel)}
      >
        {theme.levels.map((level) => (
          <MenuRadioItem key={level} value={level} closeOnClick>
            {LEVELS[level].label}
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </Menu>
  );
}
