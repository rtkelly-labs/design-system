import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteHeader } from '../components/SiteHeader';
import { SitePage, blog, marketing, portfolio, projectSite } from './siteChrome/fixtures';

const meta: Meta<typeof SiteHeader> = {
  title: 'Components/Navigation/SiteHeader',
  component: SiteHeader,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brand: { control: false },
    nav: { control: false },
    mobileNav: { control: false },
    actions: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof SiteHeader>;

/**
 * The four sites issue 246 names, and the test it sets: `SiteHeader`,
 * `SiteNav`, `MobileNav` and `SiteFooter`, unmodified, build every one of
 * them. Each story is a whole page from `./siteChrome/fixtures`, where every
 * name and link lives — the components hold none.
 *
 * A simple portfolio: four links, one of them external, and a one-line
 * footer. The current item is `Work`, told to the chrome by the
 * `LinkProvider`'s `isCurrent` standing in for a router — no item says so
 * itself. Narrow the viewport and the row becomes a `MENU` button.
 */
export const Portfolio: Story = {
  render: () => <SitePage site={portfolio} />,
};

/**
 * A blog: the posts index is current, and the footer carries a labelled
 * `Elsewhere` column beside the licence line — a second navigation landmark,
 * named apart from the header's `Primary`.
 */
export const Blog: Story = {
  render: () => <SitePage site={blog} />,
};

/**
 * A marketing site: a `Resources` group whose links open in a `Menu`, a CTA in
 * `actions`, a lead line and three footer columns. It collapses at `lg`
 * rather than `md`, because four items and a button do not fit a tablet row.
 */
export const Marketing: Story = {
  render: () => <SitePage site={marketing} />,
};

/**
 * A documentation-adjacent project site: docs, components, a changelog and the
 * repository. The `INSTALL` action is the consumer's own `Button`, hidden below
 * `sm` by its own `className` — the header gives the slot, the page decides
 * what fits in it.
 */
export const ProjectSite: Story = {
  render: () => <SitePage site={projectSite} />,
};
