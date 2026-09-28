import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { CodeBlock } from '../components/docs/CodeBlock';
import { Hero } from '../components/marketing/Hero';
import { installSnippet } from './marketing/fixtures';

const meta: Meta<typeof Hero> = {
  title: 'Components/Marketing/Hero',
  component: Hero,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'padded' },
  argTypes: {
    eyebrow: { control: false },
    actions: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Hero>;

/**
 * The product-launch hero: an eyebrow badge, the bracketed headline, a line
 * under it and two calls to action, all centred. The story
 * `tests/visual.spec.ts` asserts.
 */
export const Default: Story = {
  args: {
    eyebrow: <Badge accent="tertiary">NOW IN BETA</Badge>,
    title: 'Themes you can audit',
    subtitle: 'A contrast-checked palette, two levels and every export, from one source file.',
    actions: (
      <>
        <Button href="/signup" variant="tertiary" bracketed size="lg">
          START FREE
        </Button>
        <Button href="/features" variant="inverse" bracketed size="lg">
          TOUR
        </Button>
      </>
    ),
  },
};

/**
 * Start-aligned, unbracketed, with media: a project site's hero, where the
 * install command is the thing to show. The media slot takes any node and
 * sets no width of its own.
 */
export const WithMedia: Story = {
  args: {
    align: 'start',
    bracketed: false,
    eyebrow: <Badge accent="success">v0.9 · MIT</Badge>,
    title: 'A brutalist design system',
    subtitle: 'Tokens, components and the gates that hold them.',
    actions: (
      <Button href="/docs" variant="primary" bracketed>
        READ THE DOCS
      </Button>
    ),
    children: (
      <CodeBlock language="bash" title="Install">
        {installSnippet}
      </CodeBlock>
    ),
  },
};

/**
 * The headline alone. Every other slot is optional, and an empty one renders
 * no wrapper — there is no gap where the actions would have been.
 */
export const TitleOnly: Story = {
  args: {
    title: 'Pricing',
  },
};
