import React, { useEffect, useState } from 'react';
import type { Preview } from '@storybook/react';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { create } from 'storybook/theming';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { THEME_ATTRIBUTE } from '../src/components/themeInitScript';
import { DEFAULT_LEVEL, LEVELS, THEME_LEVELS, isThemeLevel, type ThemeLevel } from '../src/theme/levels';
import '../src/styles.css';
import './docs.css';

/**
 * Storybook Emotion theme for Docs blocks matching the `midnight` level.
 */
const midnightDocsTheme = create({
  base: 'dark',
  colorPrimary: LEVELS.midnight.accent.primary,
  colorSecondary: LEVELS.midnight.accent.secondary,
  appBg: LEVELS.midnight.surface.base,
  appContentBg: LEVELS.midnight.surface.base,
  appPreviewBg: LEVELS.midnight.surface.base,
  appBorderColor: LEVELS.midnight.border.strong,
  appBorderRadius: 0,
  textColor: LEVELS.midnight.text.primary,
  textInverseColor: LEVELS.midnight.surface.base,
  textMutedColor: LEVELS.midnight.text.muted,
  barBg: LEVELS.midnight.surface.raised,
  barTextColor: LEVELS.midnight.text.secondary,
  barSelectedColor: LEVELS.midnight.accent.primary,
  barHoverColor: LEVELS.midnight.accent.secondary,
  buttonBg: LEVELS.midnight.surface.raised,
  buttonBorder: LEVELS.midnight.border.strong,
  inputBg: LEVELS.midnight.surface.raised,
  inputBorder: LEVELS.midnight.border.strong,
  inputTextColor: LEVELS.midnight.text.primary,
  inputBorderRadius: 0,
  fontBase: 'var(--ds-font-body)',
  fontCode: 'var(--ds-font-mono)',
});

/**
 * Storybook Emotion theme for Docs blocks matching the `sketch` level.
 */
const sketchDocsTheme = create({
  base: 'light',
  colorPrimary: LEVELS.sketch.accent.primary,
  colorSecondary: LEVELS.sketch.accent.secondary,
  appBg: LEVELS.sketch.surface.base,
  appContentBg: LEVELS.sketch.surface.base,
  appPreviewBg: LEVELS.sketch.surface.base,
  appBorderColor: LEVELS.sketch.border.strong,
  appBorderRadius: 0,
  textColor: LEVELS.sketch.text.primary,
  textInverseColor: LEVELS.sketch.surface.base,
  textMutedColor: LEVELS.sketch.text.muted,
  barBg: LEVELS.sketch.surface.raised,
  barTextColor: LEVELS.sketch.text.secondary,
  barSelectedColor: LEVELS.sketch.accent.primary,
  barHoverColor: LEVELS.sketch.accent.secondary,
  buttonBg: LEVELS.sketch.surface.raised,
  buttonBorder: LEVELS.sketch.border.strong,
  inputBg: LEVELS.sketch.surface.raised,
  inputBorder: LEVELS.sketch.border.strong,
  inputTextColor: LEVELS.sketch.text.primary,
  inputBorderRadius: 0,
  fontBase: 'var(--ds-font-body)',
  fontCode: 'var(--ds-font-mono)',
});

/**
 * Custom global DocsContainer ensuring every Docs view (both Autodocs and MDX guides)
 * renders with the proper theme level, background, typography, and brutalist chrome.
 */
function ThemedDocsContainer(props: React.PropsWithChildren<DocsContainerProps>) {
  const context = props.context as any;
  const initialSelected = context?.globals?.level ?? context?.store?.userGlobals?.globals?.level;
  const [level, setLevel] = useState<ThemeLevel>(isThemeLevel(initialSelected) ? initialSelected : DEFAULT_LEVEL);

  useEffect(() => {
    const channel = context?.channel;
    if (!channel) return;

    const handleGlobalsUpdate = ({ globals }: { globals?: { level?: string } }) => {
      if (globals?.level && isThemeLevel(globals.level)) {
        setLevel(globals.level);
      }
    };

    channel.on('globalsUpdated', handleGlobalsUpdate);
    channel.on('GLOBALS_UPDATED', handleGlobalsUpdate);

    return () => {
      channel.off('globalsUpdated', handleGlobalsUpdate);
      channel.off('GLOBALS_UPDATED', handleGlobalsUpdate);
    };
  }, [context?.channel]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, level);
      document.documentElement.classList.remove(...THEME_LEVELS);
      document.documentElement.classList.add(level);
    }
  }, [level]);

  const docsTheme = level === 'midnight' ? midnightDocsTheme : sketchDocsTheme;

  return React.createElement(
    DocsContainer,
    { ...props, theme: docsTheme },
    React.createElement(
      ThemeProvider,
      { defaultLevel: level, persist: false, followSystem: false },
      React.createElement(
        'div',
        {
          className: 'sbdocs-themed-root min-h-screen bg-surface-base text-content-primary',
          'data-theme': level,
        },
        props.children,
      ),
    ),
  );
}

/**
 * The toolbar is built from `THEME_LEVELS`, so a new rung of the ladder appears
 * here without this file being edited. The old setup pinned `defaultTheme` to
 * one level and offered a `backgrounds` picker instead — which painted a colour
 * *behind* an unchanged component, so it looked like a theme switch while
 * changing nothing about the component under it.
 */
const preview: Preview = {
  globalTypes: {
    level: {
      description: 'Theme level',
      toolbar: {
        title: 'Level',
        icon: 'contrast',
        dynamicTitle: true,
        items: THEME_LEVELS.map((level) => ({
          value: level,
          title: LEVELS[level].label,
          right: LEVELS[level].polarity,
        })),
      },
    },
  },

  initialGlobals: {
    level: DEFAULT_LEVEL,
  },

  decorators: [
    (Story, context) => {
      const selected = context.globals.level;
      const level = isThemeLevel(selected) ? selected : DEFAULT_LEVEL;

      // The preview iframe's own <html> carries the attribute so that the page
      // chrome — body background, scrollbars via color-scheme — follows the
      // level too, not just the story subtree.
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, level);
        document.documentElement.classList.remove(...THEME_LEVELS);
        document.documentElement.classList.add(level);
      }

      return React.createElement(
        ThemeProvider,
        // `persist` off: a preview surface should not write the host page's
        // stored preference. The toolbar global is the source of truth here.
        { defaultLevel: level, persist: false, followSystem: false },
        React.createElement(Story),
      );
    },
  ],

  parameters: {
    docs: {
      container: ThemedDocsContainer,
    },

    /**
     * The sidebar order is an argument, not a filing choice.
     *
     * The landing page is whichever entry sorts first, so the manifesto is
     * pinned rather than left to the alphabet. Before this, Storybook opened on
     * `SaaS/AdminDashboardLayout` — first by title, and the least
     * system-shaped thing in the sidebar.
     *
     * The rest reads outward from the system to its applications: the token
     * surfaces a consumer adopts, then the docs chrome built on them, then the
     * product mockups that only demonstrate. Left to the alphabet, `Blog/`
     * landed first — so a consumer's first impression of a token system was a
     * lorem-ipsum blog post, and two mockups at ~20-25% readiness sat at the
     * same visual weight as `Docs/*` at ~90% (`docs/surface-readiness.md`).
     *
     * The vocabulary lives in `sidebar.ts`, which `check:story-conventions`
     * also reads, so a group or category cannot arrive here without a decision
     * about what this system claims to be.
     */
    options: {
      storySort: {
        // A literal because Storybook reads `storySort` statically; it must equal
        // `storySortOrder()` in `sidebar.ts`, and `check:story-conventions` fails if not.
        order: [
          'Manifesto',
          'Guides',
          'Foundations',
          'Components',
          ['Actions & Forms', 'Content', 'Feedback', 'Overlays', 'Navigation', 'Layout', 'Icons', 'Data', 'Marketing', 'Reports', '*'],
          'Docs',
          ['Layout', 'Content', 'Figures', '*'],
          'Blog',
          'Presentation',
          'SaaS',
          'Showcase',
          '*',
        ],
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
