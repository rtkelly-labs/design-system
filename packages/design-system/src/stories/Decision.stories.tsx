import type { Meta, StoryObj } from '@storybook/react-vite';
import { Decision, Option } from '../components/docs/figures/Decision';

const meta: Meta<typeof Decision> = {
  title: 'Docs/Figures/Decision',
  component: Decision,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A standalone documentation block, not a figure renderer: a decision laid out as options with costs, with the recommended one marked. Write `<Option>` children in MDX, or pass `options` as data.' } } },
};

export default meta;
type Story = StoryObj<typeof Decision>;

/** Two options as MDX children, the picked one marked and the recommendation beneath. */
export const Default: Story = {
  render: () => (
    <Decision question="Which contrast floor for hues?" context="Hues sit on every surface, so the floor is a hard limit." recommendation={<p>Take 5.5:1. The three moves are invisible in use.</p>}>
      <Option title="4.5:1" cost="no editor headroom">Keeps every colour.</Option>
      <Option title="5.5:1" picked cost="three invisible moves">Buys the editor.</Option>
    </Decision>
  ),
};

/** Options as data, for a decision that comes from application state. */
export const ThreeOptions: Story = {
  args: {
    question: 'How should the figures ship?',
    options: [
      { title: 'One package', cost: 'larger bundle', children: 'Everything under one import.' },
      { title: 'Subpath export', picked: true, cost: 'one more entry point', children: 'Figures load only where a page uses them.' },
      { title: 'Separate package', cost: 'a second release train', children: 'Versioned apart from the system.' },
    ],
    recommendation: <p>Use the subpath export.</p>,
  },
  render: (args) => <Decision {...args} />,
};

/** The page level is sketch here, and the frame follows it. */
export const SketchTheme: Story = { ...ThreeOptions, globals: { level: 'sketch' } };
