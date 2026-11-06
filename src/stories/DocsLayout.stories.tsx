import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocsLayout } from '../components/docs/DocsLayout';
import { DocsHeader } from '../components/docs/DocsHeader';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { TableOfContents } from '../components/docs/TableOfContents';
import { Prose } from '../components/docs/Prose';
import { Button } from '../components/Button';

const nav = [
  { label: 'Getting started', href: '/docs' },
  {
    label: 'Foundations',
    items: [
      { label: 'Colour', href: '/docs/colour' },
      { label: 'Semantic tokens', href: '/docs/semantic-tokens' },
    ],
  },
];

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'usage', title: 'Usage', depth: 2 },
];

const body = (
  <Prose>
    <h2 id="overview">Overview</h2>
    <p>The layout owns the rails; the header, sidebar and table of contents are passed in.</p>
    <h2 id="usage">Usage</h2>
    <p>The right rail is hidden below xl, and the left rail becomes a drawer below lg.</p>
  </Prose>
);

const meta: Meta<typeof DocsLayout> = {
  title: 'Docs/DocsLayout',
  component: DocsLayout,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DocsLayout>;

/** Assembled from the parts it is meant to compose. */
export const Default: Story = {
  render: () => (
    <DocsLayout
      header={<DocsHeader title="Design System" nav={[{ label: 'Docs', href: '/docs', active: true }]} />}
      sidebar={<DocsSidebar nav={nav} currentPath="/docs/semantic-tokens" />}
      toc={<TableOfContents toc={toc} spy={false} />}
    >
      {body}
    </DocsLayout>
  ),
};

/** No right rail — pages without headings should not leave a gap. */
export const WithoutToc: Story = {
  render: () => (
    <DocsLayout
      header={<DocsHeader title="Design System" />}
      sidebar={<DocsSidebar nav={nav} currentPath="/docs" />}
    >
      {body}
    </DocsLayout>
  ),
};

/**
 * The mobile drawer. `sidebarOpen` is ignored at lg and up, so narrow the
 * viewport to see this do anything.
 */
export const MobileDrawer: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <DocsLayout
        header={
          <div style={{ padding: '0.75rem' }}>
            <Button bracketed onClick={() => setOpen((v) => !v)}>TOGGLE NAV</Button>
          </div>
        }
        sidebar={<DocsSidebar nav={nav} currentPath="/docs" onNavigate={() => setOpen(false)} />}
        sidebarOpen={open}
        onCloseSidebar={() => setOpen(false)}
      >
        {body}
      </DocsLayout>
    );
  },
};
