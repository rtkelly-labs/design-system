import type { Meta, StoryObj } from '@storybook/react-vite';
import { SwatchCompare } from '../components/docs/figures/SwatchCompare';
import { FigureFrame } from '../components/docs/figures/FigureFrame';
import { LEVELS, PALETTE_HUES } from '../theme/levels';

const meta: Meta<typeof SwatchCompare> = {
  title: 'Docs/Figures/SwatchCompare',
  component: SwatchCompare,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'Rows of colour across named columns, with a verdict per column. Colours arrive as data and are drawn by `Swatch`, so a page renders `LEVELS` rather than copying hex values.' } } },
};

export default meta;
type Story = StoryObj<typeof SwatchCompare>;

const hues = PALETTE_HUES.slice(0, 5);

/** The light palette and its bright half, painted on sketch's own sunken ground. */
export const Default: Story = {
  args: {
    label: 'Sketch palette',
    level: 'sketch',
    columns: hues.map((h) => ({ name: h })),
    rows: [
      { label: 'Base', values: hues.map((h) => LEVELS.sketch.palette[h]) },
      { label: 'Bright', values: hues.map((h) => LEVELS.sketch.paletteBright[h]) },
    ],
  },
  render: (args) => <FigureFrame title="PALETTE"><SwatchCompare {...args} /></FigureFrame>,
};

/** Verdicts say what happened to each column; a hatched cell means no value existed. */
export const Verdicts: Story = {
  args: {
    label: 'Midnight palette, one hue new',
    columns: hues.map((h, i) => ({ name: h, verdict: i === 0 ? 'new' : 'kept', tone: i === 0 ? 'info' : 'success' })),
    rows: [
      { label: 'Before', values: hues.map((h, i) => (i === 0 ? null : LEVELS.midnight.palette[h])) },
      { label: 'After', values: hues.map((h) => LEVELS.midnight.palette[h]) },
    ],
  },
  render: (args) => <FigureFrame title="VERDICTS"><SwatchCompare {...args} /></FigureFrame>,
};

/** The page level is sketch here, and the figure follows it when no level is set. */
export const SketchTheme: Story = { ...Verdicts, globals: { level: 'sketch' } };
