import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenTable } from '../components/docs/figures/TokenTable';
import { FigureFrame } from '../components/docs/figures/FigureFrame';
import { contrastRatio } from '../theme/contrast';
import { LEVELS } from '../theme/levels';

const meta: Meta<typeof TokenTable> = {
  title: 'Docs/Figures/TokenTable',
  component: TokenTable,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'Tokens with their values and measurements side by side, so a change is read as numbers, not taste. Colours are drawn by `Swatch`; measurements arrive already formatted.' } } },
};

export default meta;
type Story = StoryObj<typeof TokenTable>;

const tones = ['primary', 'secondary', 'muted'] as const;

/** Text tones on midnight, each with its contrast ratio against the base surface. */
export const Default: Story = {
  args: {
    label: 'Midnight text tones',
    measures: ['WCAG on base'],
    rows: tones.map((tone) => ({
      token: `text.${tone}`,
      after: LEVELS.midnight.text[tone],
      values: [`${contrastRatio(LEVELS.midnight.text[tone], LEVELS.midnight.surface.base).toFixed(2)}:1`],
    })),
  },
  render: (args) => <FigureFrame title="TEXT TONES"><TokenTable {...args} /></FigureFrame>,
};

/** A before column and a note appear only when some row supplies them. */
export const BeforeAndAfter: Story = {
  args: {
    label: 'Sketch muted text',
    rows: [
      {
        token: 'text.muted',
        before: LEVELS.sketch.accent.quiet,
        after: LEVELS.sketch.text.muted,
        note: 'Moved off the quiet accent so muted text keeps its own value.',
      },
    ],
  },
  render: (args) => <FigureFrame title="CHANGE"><TokenTable {...args} /></FigureFrame>,
};

/** The page level is sketch here, and the table follows it. */
export const SketchTheme: Story = { ...Default, globals: { level: 'sketch' } };
