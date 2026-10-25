import type { Meta, StoryObj } from '@storybook/react-vite';
import { variantAxes } from './chartLab/axes';
import { BIMODAL_CASE, NOISE_CASE, REGRESSION_CASE, SMALL_CASE } from './chartLab/benchmarks';
import { DISTRIBUTION_COMPARE_VARIANTS, DistributionCompare } from '../components/DistributionCompare';

const meta: Meta<typeof DistributionCompare> = {
  title: 'Components/Data/DistributionCompare',
  component: DistributionCompare,
  tags: ['autodocs', 'experimental'],
  args: { baseline: REGRESSION_CASE.baseline!, candidate: REGRESSION_CASE.candidate!, unit: 'ns', title: REGRESSION_CASE.name },
  argTypes: {
    variant: { control: 'inline-radio', options: [...DISTRIBUTION_COMPARE_VARIANTS.variant] },
    scale: { control: 'inline-radio', options: [...DISTRIBUTION_COMPARE_VARIANTS.scale] },
    density: { control: 'inline-radio', options: [...DISTRIBUTION_COMPARE_VARIANTS.density] },
    level: { control: { type: 'number', min: 0.5, max: 0.999, step: 0.01 } },
    baseline: { control: false },
    candidate: { control: false },
    comparison: { control: false },
    options: { control: 'object' },
    labels: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One benchmark\'s two sample distributions on one axis — every sample as a dot in its lane by default, or mirrored densities with `variant="violin"` — with each side\'s median as a heavy tick and its distribution-free interval bracketed beneath. The ratio, its interval and the classification are printed under the chart. Baseline and candidate take the diff\'s `delta-removed` and `delta-added` roles, and are labelled, so colour only repeats the lane. Every drawing choice is listed in `DISTRIBUTION_COMPARE_VARIANTS`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof DistributionCompare>;

/** A clean 18% regression: the two clouds do not overlap. */
export const Regression: Story = {
  parameters: { docs: { description: { story: 'Thirty iterations a side. The candidate\'s cloud sits wholly right of the baseline\'s, both median brackets are narrow, and the classification is `slower`.' } } },
};

/** A bimodal candidate: 40% of iterations in a slow mode the median does not see. */
export const Bimodal: Story = {
  args: { baseline: BIMODAL_CASE.baseline!, candidate: BIMODAL_CASE.candidate!, title: BIMODAL_CASE.name },
  parameters: { docs: { description: { story: 'The candidate alternates between ~42 µs and ~58 µs. Its median sits in the fast mode, so the ratio of medians barely moves — but the bootstrap interval reaches 1.35× and the row is `inconclusive`. The strip makes the two modes obvious; a single number never would.' } } },
};

/** Three iterations a side: too few to call. */
export const TooFewSamples: Story = {
  args: { baseline: SMALL_CASE.baseline!, candidate: SMALL_CASE.candidate!, title: SMALL_CASE.name },
  parameters: { docs: { description: { story: 'n = 3. Each median bracket is the full range and admits only 75% coverage, which the readout says. The shift looks large, and the classification is still `inconclusive` — too few samples.' } } },
};

/** The bimodal run as mirrored densities. */
export const Violin: Story = {
  args: { baseline: BIMODAL_CASE.baseline!, candidate: BIMODAL_CASE.candidate!, title: BIMODAL_CASE.name, variant: 'violin' },
  parameters: { docs: { description: { story: '`variant="violin"`: Gaussian kernel densities (Silverman bandwidth), baseline above the centre line and candidate below. A side with fewer than 8 samples keeps its dots — a density from three values is a picture of the kernel.' } } },
};

/** Noise only: the clouds sit on top of each other. */
export const NoiseOnly: Story = {
  args: { baseline: NOISE_CASE.baseline!, candidate: NOISE_CASE.candidate!, title: NOISE_CASE.name },
  parameters: { docs: { description: { story: 'A 0.2% difference in medians with an interval wholly inside ±5%: `unchanged`.' } } },
};

const AXES = variantAxes(DISTRIBUTION_COMPARE_VARIANTS);

/** Every variant value as small multiples over the bimodal case. Not snapshotted: it is for evaluation. */
export const VariationMatrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {AXES.map(([axis, values]) => (
        <section key={axis} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-wide text-content-secondary">{axis}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(values as readonly string[]).map((value) => (
              <figure key={value} className="m-0 flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="font-mono text-xs text-content-muted">{`${axis}=${value}`}</figcaption>
                <DistributionCompare {...args} baseline={BIMODAL_CASE.baseline!} candidate={BIMODAL_CASE.candidate!} {...{ [axis]: value }} title={`${axis} ${value}`} />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'One row per prop in `DISTRIBUTION_COMPARE_VARIANTS`, one labelled cell per value, all over the bimodal Parquet case.' } } },
};
