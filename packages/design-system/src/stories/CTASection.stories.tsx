import type { Meta, StoryObj } from '@storybook/react-vite';
import { CTASection } from '../components/marketing/CTASection';
import { ctaActions, launchCta, projectCta } from './marketing/fixtures';

const meta: Meta<typeof CTASection> = {
  title: 'Components/Marketing/CTASection',
  component: CTASection,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    children: { control: 'text' },
    actions: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof CTASection>;

/**
 * The closing band of a product page: centred, two actions, the offset shadow
 * in the tertiary accent. The story `tests/visual.spec.ts` asserts.
 */
export const Default: Story = {
  args: {
    title: launchCta.title,
    children: launchCta.body,
    accent: launchCta.accent,
    actions: ctaActions(launchCta),
  },
};

/** Start-aligned, in the secondary accent — the band a project site puts mid-page. */
export const StartAligned: Story = {
  args: {
    title: projectCta.title,
    children: projectCta.body,
    accent: projectCta.accent,
    align: 'start',
    actions: ctaActions(projectCta),
  },
};

/**
 * The ask and nothing else. Without a body or actions the band is its
 * heading, and the default `primary` shadow.
 */
export const TitleOnly: Story = {
  args: {
    title: 'Questions? Write in.',
  },
};
