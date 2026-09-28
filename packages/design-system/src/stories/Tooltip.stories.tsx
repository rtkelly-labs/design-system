import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, FileText, Maximize2, Trash2 } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';
import { Button } from '../components/Button';
import { cn } from '../lib/recipe';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: false, description: 'The trigger — one element that forwards its ref.' },
    content: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/** The page a tooltip sits over, with room on every side for it to open into. */
function Stage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-64 items-center gap-4 bg-surface-base p-16 font-mono text-sm text-content-primary',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The case `title=""` used to cover, open on load — a tooltip asserted closed
 * asserts nothing. An icon-only control keeps its `aria-label` as its name;
 * the tooltip restates it for sighted users and adds the shortcut. This is
 * the story `tests/visual.spec.ts` asserts.
 */
export const OnAnIconButton: Story = {
  args: { content: 'Speaker notes (N)', defaultOpen: true },
  render: (args) => (
    <Stage className="justify-center">
      <Tooltip {...args}>
        <Button aria-label="Show speaker notes" size="sm">
          <FileText size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
    </Stage>
  ),
};

/**
 * The four preferred sides, all open. A side is a preference: each one flips
 * to the opposite edge when the viewport has no room on the side it asked for.
 */
export const Sides: Story = {
  render: () => (
    <Stage className="justify-center gap-24 py-24">
      <Tooltip content="Top" side="top" defaultOpen>
        <Button size="sm" aria-label="Copy">
          <Copy size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Right" side="right" defaultOpen>
        <Button size="sm" aria-label="Fullscreen">
          <Maximize2 size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom" defaultOpen>
        <Button size="sm" aria-label="Notes">
          <FileText size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Left" side="left" defaultOpen>
        <Button size="sm" aria-label="Delete">
          <Trash2 size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
    </Stage>
  ),
};

/**
 * A trigger hard against the right edge, asking for the right side. There is
 * no room there, so it flips left; at a phone's width it is shifted inside the
 * viewport rather than clipped. The row `MOBILE_CASES` asserts.
 */
export const AtTheViewportEdge: Story = {
  render: () => (
    <Stage className="justify-end px-2">
      <Tooltip content="Copy a link to this section" side="right" defaultOpen>
        <Button size="sm" aria-label="Copy link">
          <Copy size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
    </Stage>
  ),
};

/**
 * Interactive, closed. Hover for the delay, or Tab to a control and the hint
 * opens at once; Escape closes it and leaves focus where it was.
 */
export const Interactive: Story = {
  render: () => (
    <Stage>
      <Tooltip content="Copy (C)">
        <Button size="sm" aria-label="Copy">
          <Copy size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Fullscreen (F)">
        <Button size="sm" aria-label="Enter fullscreen">
          <Maximize2 size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete">
        <Button size="sm" variant="secondary" aria-label="Delete">
          <Trash2 size={16} aria-hidden="true" />
        </Button>
      </Tooltip>
    </Stage>
  ),
};
