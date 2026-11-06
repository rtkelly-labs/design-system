import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExperimentsView } from '../components/experiments/ExperimentsView';

const meta: Meta<typeof ExperimentsView> = {
  title: 'Showcase/ExperimentsView',
  component: ExperimentsView,
  tags: ['autodocs', 'experimental'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ExperimentsView>;

/** Renders its own catalogue; `onSelectExperiment` is the only input. */
export const Default: Story = {};

export const WithSelectionHandler: Story = {
  args: { onSelectExperiment: () => {} },
};

/**
 * The catalogue is not configurable, so the axis this component actually varies
 * on is what a selection does. Here the handler reports back into the page, the
 * way a host router would.
 */
export const Interactive: Story = {
  render: function Render() {
    const [selected, setSelected] = React.useState<string | null>(null);
    return (
      <div>
        <p style={{ padding: '1rem', fontFamily: 'var(--ds-font-mono)' }}>
          Selected: {selected ?? '(none yet)'}
        </p>
        <ExperimentsView onSelectExperiment={setSelected} />
      </div>
    );
  },
};

/**
 * A custom catalogue, and the only place the three `status` values appear
 * together — every entry in `DEFAULT_EXPERIMENTS` is `active`, so the default
 * page shows one badge colour and says nothing about the other two.
 *
 * That is how the bug fixed in #96 survived: a ternary collapsed `archived`
 * and `experimental` into one colour, and no story rendered either of them.
 * `active` is now `success`, `experimental` is `info`, and `archived` is
 * `quiet` — receding rather than signalling, because it is the absence of a
 * state to act on.
 */
export const CustomCatalogue: Story = {
  args: {
    experiments: [
      {
        id: 'contrast-audit',
        name: 'Contrast Audit',
        description: 'Every role pair on every rung, with the margin each one actually has',
        status: 'active',
        componentCount: 3,
      },
      {
        id: 'pencil-rules',
        name: 'Pencil Rules',
        description: 'Polarity-aware dividers drawn in characters rather than pixels',
        status: 'experimental',
        componentCount: 1,
      },
      {
        id: 'preset-bridge',
        name: 'Tailwind Preset Bridge',
        description: 'Superseded by the theme.css @theme contract; kept for the write-up',
        status: 'archived',
        componentCount: 0,
      },
    ],
  },
};
