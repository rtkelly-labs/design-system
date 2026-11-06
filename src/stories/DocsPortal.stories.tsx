import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen } from 'lucide-react';
import { AnchorHeading } from '../components/docs/AnchorHeading';
import { Breadcrumbs } from '../components/docs/Breadcrumbs';
import { CodeBlock } from '../components/docs/CodeBlock';
import { DocPager } from '../components/docs/DocPager';
import { DocsHeader } from '../components/docs/DocsHeader';
import { DocsLayout } from '../components/docs/DocsLayout';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { Prose } from '../components/docs/Prose';
import { TableOfContents } from '../components/docs/TableOfContents';
import type { DocsNavNode } from '../components/docs/DocsSidebar';
import type { TocEntry } from '../components/docs/TableOfContents';
import { NoteBlock } from '../components/NoteBlock';
import { Button } from '../components/Button';
import { CodeTab, CodeTabs } from '../components/docs/CodeTabs';
import {
  INIT_SOURCE,
  MOUNT_SOURCE,
  MountedApp,
  STYLES_SOURCE,
  TAILWIND_SOURCE,
} from './portal/integration';

const meta: Meta = {
  title: 'Docs/Portal',
  tags: ['stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const NAV: DocsNavNode[] = [
  { label: 'Overview', href: '/docs' },
  {
    label: 'Getting started',
    href: '/docs/start',
    items: [
      { label: 'Install', href: '/docs/start/install' },
      { label: 'Mount the provider', href: '/docs/start/provider' },
      { label: 'Guard the first paint', href: '/docs/start/flash' },
      { label: 'Point Tailwind at dist', href: '/docs/start/tailwind' },
    ],
  },
  {
    label: 'Foundations',
    items: [
      { label: 'Levels', href: '/docs/foundations/levels' },
      { label: 'Roles, not hues', href: '/docs/foundations/roles' },
      { label: 'The Medium axis', href: '/docs/foundations/medium' },
    ],
  },
  { label: 'Changelog', href: '/docs/changelog', defaultCollapsed: true },
];

const TOC: TocEntry[] = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'install', title: 'Install', depth: 2 },
  { id: 'provider', title: 'Mount the provider', depth: 2 },
  { id: 'flash', title: 'Guard the first paint', depth: 3 },
  { id: 'tailwind', title: 'Point Tailwind at dist', depth: 3 },
  { id: 'payoff', title: 'The payoff', depth: 2 },
];

function SampleBody() {
  return (
    <Prose>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Getting started', href: '/docs/start' },
          { label: 'Install' },
        ]}
      />

      <AnchorHeading level={1} id="getting-started" anchor={false}>
        Getting started
      </AnchorHeading>

      <p>
        The portal you are reading is built from this package&rsquo;s own chrome, and the
        page it is showing is this package&rsquo;s own integration. Both halves matter: a
        docs kit whose author documents elsewhere is an untested claim.
      </p>

      <AnchorHeading level={2} id="overview">
        Overview
      </AnchorHeading>
      <p>
        Four files, each touched once, and the order matters &mdash; step three is
        meaningless if step two chose a different level.
      </p>

      <AnchorHeading level={2} id="install">
        Install
      </AnchorHeading>
      <CodeTabs group="pkg">
        <CodeTab label="pnpm">pnpm add @rtkelly13/design-system</CodeTab>
        <CodeTab label="npm">npm install @rtkelly13/design-system</CodeTab>
      </CodeTabs>
      <CodeBlock title="main.tsx" language="tsx">
        {STYLES_SOURCE}
      </CodeBlock>

      <AnchorHeading level={2} id="provider">
        Mount the provider
      </AnchorHeading>
      <CodeBlock title="App.tsx" language="tsx">
        {MOUNT_SOURCE}
      </CodeBlock>
      <NoteBlock type="tip" title="This is live">
        The buttons below are mounted by exactly that expression. A unit test asserts the
        snippet above and the preview below name the same level, so this page cannot drift
        the way the README did.
      </NoteBlock>
      <MountedApp>
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem' }}>
          <Button variant="primary">EXECUTE</Button>
          <Button variant="tertiary" bracketed>
            CANCEL
          </Button>
        </div>
      </MountedApp>

      <AnchorHeading level={3} id="flash">
        Guard the first paint
      </AnchorHeading>
      <p>
        Without this the first painted frame uses the default level and the second uses the
        stored one, which reads as the page changing its mind.
      </p>
      <CodeBlock title="index.html" language="tsx">
        {INIT_SOURCE}
      </CodeBlock>

      <AnchorHeading level={3} id="tailwind">
        Point Tailwind at dist
      </AnchorHeading>
      <NoteBlock type="warning" title="Load-bearing, not optional">
        Tailwind v4 does not scan <code>node_modules</code>. Without the{' '}
        <code>@source</code> directive every utility these components name is absent from
        your generated CSS, and they render unstyled.
      </NoteBlock>
      <CodeBlock title="tailwind.css" language="css">
        {TAILWIND_SOURCE}
      </CodeBlock>

      <AnchorHeading level={2} id="payoff">
        The payoff
      </AnchorHeading>
      <p>
        Colours are addressed by role and never by hue, so a retheme is a change to one
        file rather than a find-and-replace. <code>accent.primary</code> is cyan on{' '}
        <code>midnight</code> and blue on <code>sketch</code>; the component asked for the
        primary accent, not for cyan.
      </p>
      <DocPager
        prev={{ label: 'Overview', href: '/docs' }}
        next={{ label: 'Levels', href: '/docs/foundations/levels' }}
      />
    </Prose>
  );
}

export const FullPortal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <DocsLayout
        sidebarOpen={open}
        onCloseSidebar={() => setOpen(false)}
        header={
          <DocsHeader
            title="TVS Docs"
            icon={BookOpen}
            nav={[
              { label: 'Docs', href: '/docs', active: true },
              { label: 'CLI', href: '/docs/cli' },
              { label: 'GitHub', href: 'https://github.com' },
            ]}
            onSearch={() => undefined}
            onToggleSidebar={() => setOpen((v) => !v)}
            sidebarOpen={open}
          />
        }
        sidebar={
          <DocsSidebar
            nav={NAV}
            currentPath="/docs/cli/introspection"
            onNavigate={() => setOpen(false)}
          />
        }
        toc={<TableOfContents toc={TOC} spy={false} />}
      >
        <SampleBody />
      </DocsLayout>
    );
  },
};

export const ProseOnly: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <SampleBody />
    </div>
  ),
};

export const Navigation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      <DocsSidebar nav={NAV} currentPath="/docs/architecture/scraping/browser" />
      <TableOfContents toc={TOC} spy={false} />
    </div>
  ),
};
