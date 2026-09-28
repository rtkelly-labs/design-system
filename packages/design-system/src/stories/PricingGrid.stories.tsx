import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { PricingGrid, PricingTier } from '../components/marketing/PricingGrid';
import { launchTiers, tiers } from './marketing/fixtures';

const meta: Meta<typeof PricingGrid> = {
  title: 'Components/Marketing/PricingGrid',
  component: PricingGrid,
  subcomponents: { PricingTier },
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof PricingGrid>;

/**
 * Three tiers, the middle one badged. Their feature lists differ in length
 * and their actions still line up, because every tier stretches to the row
 * and pins its action to the floor. The story `tests/visual.spec.ts` asserts.
 */
export const Default: Story = {
  args: {
    title: 'Pricing',
    description: 'Billed monthly. Cancel from the dashboard.',
    children: tiers(launchTiers),
  },
};

/** Two tiers in two columns, start-aligned — a rate card rather than a plan table. */
export const TwoTiers: Story = {
  args: {
    title: 'Rates',
    align: 'start',
    columns: 2,
    children: tiers(launchTiers.slice(0, 2)),
  },
};

/**
 * A tier with nothing to choose: no badge, no features, no action. The rule
 * above the action is not drawn when there is no action under it.
 */
export const Minimal: Story = {
  args: {
    columns: 2,
    children: (
      <>
        <PricingTier name="Community" price="Free" description="Issues and discussions, answered in public." />
        <PricingTier
          name="Sponsor"
          price="$5"
          period="/month"
          accent="tertiary"
          action={
            <Button href="/sponsor" variant="tertiary" bracketed className="flex w-full">
              SPONSOR
            </Button>
          }
        />
      </>
    ),
  },
};
