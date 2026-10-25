import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaValue } from '../components/review/DeltaValue';

const meta: Meta<typeof DeltaValue> = {
  title: 'Components/Reports/DeltaValue',
  component: DeltaValue,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'A measured change, `before → after +n`. Direction is a fact about the metric, not a verdict, so it changes emphasis and never colour: a move against the preferred direction is drawn heavier with ▲ or ▼. New, missing and unchanged values say so in words.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeltaValue>;

/** Cyclomatic complexity rising, where lower is better. */
export const Default: Story = { args: { before: 1328, after: 1346, direction: 'lower-is-better' } };

/** Every state a numeric Delta can be in, one per row. */
export const States: Story = {
  render: () => (
    <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3 text-sm">
      <dt className="text-content-muted">against</dt><dd className="m-0"><DeltaValue before={21} after={24} direction="lower-is-better" /></dd>
      <dt className="text-content-muted">with</dt><dd className="m-0"><DeltaValue before={8418} after={8398} direction="lower-is-better" /></dd>
      <dt className="text-content-muted">no direction</dt><dd className="m-0"><DeltaValue before={231} after={233} /></dd>
      <dt className="text-content-muted">unchanged</dt><dd className="m-0"><DeltaValue before={88} after={88} /></dd>
      <dt className="text-content-muted">new</dt><dd className="m-0"><DeltaValue after={8} /></dd>
      <dt className="text-content-muted">gone</dt><dd className="m-0"><DeltaValue before={5} /></dd>
      <dt className="text-content-muted">relative</dt><dd className="m-0"><DeltaValue before={312} after={331} unit="kB" relative direction="lower-is-better" /></dd>
      <dt className="text-content-muted">from zero</dt><dd className="m-0"><DeltaValue before={0} after={3} relative /></dd>
    </dl>
  ),
};

/** The states on `sketch`. */
export const SketchTheme: Story = { ...States, globals: { level: 'sketch' } };
