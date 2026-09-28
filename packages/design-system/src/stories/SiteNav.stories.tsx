import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkProvider } from '../components/LinkProvider';
import { SiteNav, SiteNavItem } from '../components/SiteNav';
import { marketing, navItems, portfolio } from './siteChrome/fixtures';

const meta: Meta<typeof SiteNav> = {
  title: 'Components/Navigation/SiteNav',
  component: SiteNav,
  subcomponents: { SiteNavItem },
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof SiteNav>;

/** The ground a nav sits on — the header's raised surface. */
function Bar({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-64 border-b-4 border-edge-strong bg-surface-raised p-6 text-content-primary">
      {children}
    </div>
  );
}

/**
 * A row, with the current item marked by `current` on the item itself — the
 * shape for a statically rendered page that knows where it is. The mark is an
 * accent edge under the label as well as the accent ink, and it rides on
 * `aria-current="page"` on the anchor.
 */
export const Default: Story = {
  render: () => (
    <Bar>
      <SiteNav label="Primary">
        <SiteNavItem href="/work" current>
          Work
        </SiteNavItem>
        <SiteNavItem href="/writing">Writing</SiteNavItem>
        <SiteNavItem href="/about">About</SiteNavItem>
      </SiteNav>
    </Bar>
  ),
};

/**
 * An item with children, open on load — a group asserted closed asserts
 * nothing. Its links open in `Menu`, so the arrow keys, typeahead and Escape
 * back to the trigger are the package's one menu model, and each link still
 * goes through the `LinkProvider`. The story `tests/visual.spec.ts` asserts.
 */
export const WithChildren: Story = {
  render: () => (
    <LinkProvider isCurrent={(href) => href === marketing.currentPath}>
      <Bar>
        <SiteNav label="Primary">
          <SiteNavItem href="/features">Features</SiteNavItem>
          <SiteNavItem href="/pricing">Pricing</SiteNavItem>
          <SiteNavItem label="Resources" defaultOpen>
            <SiteNavItem href="/guides">Guides</SiteNavItem>
            <SiteNavItem href="/changelog">Changelog</SiteNavItem>
            <SiteNavItem href="/status">Status</SiteNavItem>
          </SiteNavItem>
        </SiteNav>
      </Bar>
    </LinkProvider>
  ),
};

/**
 * A column — the layout `MobileNav` puts in its drawer and a footer puts in a
 * link column. The current item takes an accent edge beside it and the page
 * ground behind it. Current here comes from the `LinkProvider`, the way a
 * routed app supplies it.
 */
export const Vertical: Story = {
  render: () => (
    <LinkProvider isCurrent={(href) => href === portfolio.currentPath}>
      <Bar>
        <div className="max-w-xs">
          <SiteNav label="Primary" orientation="vertical">
            {navItems(portfolio.nav)}
          </SiteNav>
        </div>
      </Bar>
    </LinkProvider>
  ),
};
