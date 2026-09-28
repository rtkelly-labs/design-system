import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileNav } from '../components/MobileNav';
import { SiteNavItem } from '../components/SiteNav';
import { SitePage, marketing, portfolio } from './siteChrome/fixtures';

const meta: Meta<typeof MobileNav> = {
  title: 'Components/Navigation/MobileNav',
  component: MobileNav,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: false },
    footer: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof MobileNav>;

/**
 * The portfolio page with its drawer open on load — the narrow-viewport
 * navigation as it ships, and the case `MOBILE_CASES` asserts. The same items
 * the desktop `SiteNav` renders, in a column, inside a `Drawer` from the left,
 * with `Work` current from the `LinkProvider`.
 */
export const Open: Story = {
  render: () => <SitePage site={portfolio} mobileNavOpen />,
};

/**
 * The marketing page with its drawer open: the `Resources` group is a `Menu`
 * trigger inside the drawer, so its links open over the drawer on the same
 * dialog stack, and Escape closes the menu before the drawer.
 */
export const WithGroup: Story = {
  render: () => <SitePage site={marketing} mobileNavOpen />,
};

/**
 * On its own and closed: the trigger, which says `aria-expanded="false"` and
 * `aria-haspopup="dialog"`. Press it, follow a link, and the drawer closes —
 * under a client-side router the page would not unload to close it.
 */
export const Closed: Story = {
  render: () => (
    <div className="min-h-64 bg-surface-base p-6">
      <MobileNav label="Primary" title="Navigation">
        <SiteNavItem href="#work">Work</SiteNavItem>
        <SiteNavItem href="#writing">Writing</SiteNavItem>
        <SiteNavItem href="#about">About</SiteNavItem>
      </MobileNav>
    </div>
  ),
};
