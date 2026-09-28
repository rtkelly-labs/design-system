import type { Meta, StoryObj } from '@storybook/react-vite';
import { Feature, FeatureGrid } from '../components/marketing/FeatureGrid';
import { features, launchFeatures, projectContents, projectPrinciples } from './marketing/fixtures';

const meta: Meta<typeof FeatureGrid> = {
  title: 'Components/Marketing/FeatureGrid',
  component: FeatureGrid,
  subcomponents: { Feature },
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof FeatureGrid>;

/**
 * Three features under a centred heading, each `Feature` in its own accent —
 * the stripe, the title and the icon take it together. The story
 * `tests/visual.spec.ts` asserts.
 */
export const Default: Story = {
  args: {
    title: 'Why Ladder',
    description: 'Three things a theme should never make you check by hand.',
    children: features(launchFeatures),
  },
};

/**
 * Four columns, start-aligned: a project's principles. At `lg` and wider the
 * four sit in one row; between `md` and `lg` they wrap to two by two.
 */
export const FourColumns: Story = {
  args: {
    title: 'Principles',
    align: 'start',
    columns: 4,
    children: features(projectPrinciples),
  },
};

/**
 * Two columns and no heading — the grid on its own, for a page whose section
 * is introduced by the copy above it.
 */
export const Untitled: Story = {
  args: {
    columns: 2,
    children: features(projectContents),
  },
};
