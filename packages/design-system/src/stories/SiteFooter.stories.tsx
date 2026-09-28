import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteFooter } from '../components/SiteFooter';
import { footerNav, marketing, portfolio } from './siteChrome/fixtures';

const meta: Meta<typeof SiteFooter> = {
  title: 'Components/Navigation/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: false },
    nav: { control: false },
    meta: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof SiteFooter>;

/** The portfolio's footer: the bottom strip and nothing else. */
export const Minimal: Story = {
  args: { meta: portfolio.footerMeta },
};

/**
 * The marketing footer: a lead line, three named link columns — each a
 * vertical `SiteNav`, so each is a navigation landmark with its own name —
 * and the strip below a rule. The story `tests/visual.spec.ts` asserts.
 */
export const Columns: Story = {
  render: () => (
    <SiteFooter
      meta={marketing.footerMeta}
      nav={footerNav(marketing.footerColumns ?? [])}
    >
      {marketing.footerLead}
    </SiteFooter>
  ),
};

/** A lead block and a strip, no columns — a newsletter line over the licence. */
export const LeadAndMeta: Story = {
  args: {
    children: 'Notes on building a design system in public. New posts roughly monthly.',
    meta: '© 2026 Ryan Kelly · Text CC BY 4.0',
  },
};
