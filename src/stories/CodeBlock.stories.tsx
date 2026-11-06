import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from '../components/docs/CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'Docs/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {
  args: {
    children: `import { Badge } from '@rtkelly13/design-system';

<Badge accent="success">HEALTHY</Badge>`,
  },
};

export const WithTitleAndLanguage: Story = {
  args: {
    title: '.storybook/main.ts',
    language: 'ts',
    children: `const config: StorybookConfig = {
  addons: ['@storybook/addon-docs'],
  refs: REFS,
};`,
  },
};

/** Output samples are not worth copying, so the affordance can be turned off. */
export const NotCopyable: Story = {
  args: {
    title: 'terminal',
    copyable: false,
    children: `Resources:
    + 1 created
    13 unchanged`,
  },
};
