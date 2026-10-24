import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { A11yMenu } from '../components/A11yMenu';
import { A11yPreferencesProvider } from '../components/A11yPreferencesProvider';
import { DocsHeader } from '../components/docs/DocsHeader';
import { ThemeProvider } from '../components/ThemeProvider';
import { cn } from '../lib/recipe';

const meta: Meta<typeof A11yMenu> = {
  title: 'Components/Overlays/A11yMenu',
  component: A11yMenu,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    triggerClassName: { control: false, description: 'Classes for the trigger button.' },
    align: { control: { type: 'inline-radio' }, options: ['start', 'center', 'end'], description: 'Which edge of the trigger the menu aligns to.' },
    defaultOpen: { description: 'Open on first render, for a story or a walkthrough.' },
  },
};

export default meta;
type Story = StoryObj<typeof A11yMenu>;

/**
 * The page a menu opens over. `persist={false}`: a preview must not write the
 * host page's storage, and the choices in it would otherwise outlive the story.
 */
function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <A11yPreferencesProvider persist={false}>
      <div
        className={cn(
          'flex min-h-[28rem] items-start justify-end bg-surface-base p-8 font-mono text-sm text-content-primary',
          className,
        )}
      >
        {children}
      </div>
    </A11yPreferencesProvider>
  );
}

/**
 * Open on load — a menu asserted closed asserts nothing. Four radio groups
 * (motion, contrast, colour vision, links), each `System`, on or off, with
 * `System` checked until the person chooses; and the item that returns all four
 * to the system. This is the story `tests/visual.spec.ts` asserts.
 */
export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Stage>
      <A11yMenu {...args} />
    </Stage>
  ),
};

/**
 * Closed: the one control that sits beside the theme picker. A square icon
 * button named "Accessibility preferences", opening the menu with Enter, Space
 * or the arrow keys.
 */
export const Trigger: Story = {
  render: () => (
    <Stage className="min-h-24">
      <A11yMenu />
    </Stage>
  ),
};

/**
 * Where it lives: beside the level picker, in the docs header. `DocsHeader`
 * mounts the menu itself when an `A11yPreferencesProvider` is above it, and
 * renders without one when there is none, as it does for the level picker. A
 * marketing `SiteHeader` has no built-in picker, so there the menu goes in its
 * `actions` next to the site's own.
 */
export const BesideThePicker: Story = {
  render: () => (
    <ThemeProvider persist={false} followSystem={false}>
      <A11yPreferencesProvider persist={false}>
        <DocsHeader title="Design system" />
      </A11yPreferencesProvider>
    </ThemeProvider>
  ),
};
