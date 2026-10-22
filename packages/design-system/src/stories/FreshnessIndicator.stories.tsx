import type { Meta, StoryObj } from '@storybook/react-vite';
import { FreshnessIndicator } from '../components/FreshnessIndicator';

const now = Date.UTC(2026, 9, 22, 14, 0);

const meta: Meta<typeof FreshnessIndicator> = {
  title: 'Components/Feedback/FreshnessIndicator',
  component: FreshnessIndicator,
  tags: ['autodocs', 'preview'],
  args: { now },
  parameters: {
    docs: {
      description: {
        component:
          'How old the data on screen is — `Updated 12s ago` — turning to the warning role as `Stale · updated 5m ago` once it passes `staleAfter` (60s by default), and reading `Paused` when refreshing is suspended. `now` is a prop, so the indicator follows the page clock and renders identically in a story. `live` adds a dot that pulses while fresh and stops under reduced motion.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof FreshnessIndicator>;

/** Recently refreshed: secondary ink, seconds precision. */
export const Fresh: Story = {
  args: { updatedAt: now - 12_000 },
  parameters: { docs: { description: { story: 'Twelve seconds old, under the one-minute default. Static: the baseline for the fresh state.' } } },
};

/** Past `staleAfter`: the warning role, and the age in minutes. */
export const Stale: Story = {
  args: { updatedAt: now - 5 * 60_000, live: true },
  parameters: { docs: { description: { story: 'Five minutes without a refresh on a live view. The dot stops pulsing and takes the warning role with the text.' } } },
};

/** A live view with fresh data: the dot pulses. */
export const Live: Story = {
  args: { updatedAt: now - 3_000, live: true },
  parameters: { docs: { description: { story: 'Use `live` when the view refreshes itself. The pulse is decoration; `prefers-reduced-motion` stops it and the words still carry the state.' } } },
};

/** Refreshing is suspended. */
export const Paused: Story = {
  args: { updatedAt: now - 3 * 60_000, live: true, paused: true },
  parameters: { docs: { description: { story: '`paused` wins over age: a view the reader paused is not stale, it is holding still on purpose.' } } },
};
