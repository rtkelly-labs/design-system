import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeTab, CodeTabs } from '../components/docs/CodeTabs';

const meta: Meta<typeof CodeTabs> = {
  title: 'Docs/CodeTabs',
  component: CodeTabs,
  tags: ['autodocs', 'stable'],
  argTypes: {
    variant: { control: 'select', options: ['merged', 'underline', 'segmented'] },
    accent: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeTabs>;

const install = (
  <>
    <CodeTab label="pnpm" language="bash">
      pnpm add @rtkelly13/design-system
    </CodeTab>
    <CodeTab label="npm" language="bash">
      npm install @rtkelly13/design-system
    </CodeTab>
    <CodeTab label="yarn" language="bash">
      yarn add @rtkelly13/design-system
    </CodeTab>
  </>
);

/** The default and the loudest: a solid accent tab standing on the block. */
export const Merged: Story = {
  args: { variant: 'merged', children: install },
};

/** The quietest: a 4px accent rule on the seam and a weight change. */
export const Underline: Story = {
  args: { variant: 'underline', accent: 'secondary', children: install },
};

/** A title bar with a filename slot; the tabs read as a segmented control. */
export const Segmented: Story = {
  args: { variant: 'segmented', label: 'install.sh', accent: 'tertiary', children: install },
};

/**
 * Two blocks sharing `group="pkg"` switch together; the third has no group and
 * keeps its own state. Pick `yarn` on the top block and watch the middle one
 * follow. The choice survives a reload.
 */
export const Grouped: Story = {
  render: () => (
    <div>
      <CodeTabs group="pkg">{install}</CodeTabs>
      <CodeTabs group="pkg" variant="underline">
        <CodeTab label="pnpm" language="bash">
          pnpm dlx storybook@latest init
        </CodeTab>
        <CodeTab label="npm" language="bash">
          npx storybook@latest init
        </CodeTab>
      </CodeTabs>
      <CodeTabs variant="segmented" label="ungrouped">
        {install}
      </CodeTabs>
    </div>
  ),
};
