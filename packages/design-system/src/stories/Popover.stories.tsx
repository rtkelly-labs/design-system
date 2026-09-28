import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from '../components/Popover';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { cn } from '../lib/recipe';

const meta: Meta<typeof Popover> = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    trigger: { control: false, description: 'The control that opens it — one element that forwards its ref.' },
    children: { control: false, description: 'The content.' },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

/** The page a popover opens over. */
function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-96 items-start gap-4 bg-surface-base p-16 font-mono text-sm text-content-primary',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A build's gate summary — the kind of detail a status badge has no room for. */
function BuildDetail() {
  return (
    <>
      <p>Passed 41 of 42 gates. `check:visual` is still running on the mobile project.</p>
      <p className="mt-2">
        <a href="#build-1482" className="text-accent-primary underline">
          Open the run log
        </a>
      </p>
    </>
  );
}

/**
 * Open on load — a popover asserted closed asserts nothing. Content worth
 * reading, with a link in it: what a tooltip cannot carry, and what a touch
 * user can reach. The story `tests/visual.spec.ts` asserts.
 */
export const Open: Story = {
  args: { title: 'Build 1482', defaultOpen: true },
  render: (args) => (
    <Stage>
      <Popover {...args} trigger={<Button size="sm" bracketed>BUILD 1482</Button>}>
        <BuildDetail />
      </Popover>
    </Stage>
  ),
};

/**
 * A trigger at the right edge, aligned to its start. At a phone's width the
 * popover cannot extend right from there, so it is shifted inside the
 * viewport — and it narrows to the room there is rather than overflowing. The
 * row `MOBILE_CASES` asserts.
 */
export const AtTheViewportEdge: Story = {
  render: () => (
    <Stage className="justify-end px-2">
      <Popover defaultOpen title="Build 1482" trigger={<Button size="sm">DETAILS</Button>}>
        <BuildDetail />
      </Popover>
    </Stage>
  ),
};

/**
 * Opened from inside a `Modal`. It paints above the dialog it came from, and
 * Escape closes the popover alone — the modal stays, as it does under an
 * `AlertDialog` (#162).
 */
export const InsideAModal: Story = {
  render: () => (
    <Modal isOpen onClose={() => {}} title="Deployments">
      <p className="mb-4">Twelve deployments in the last seven days.</p>
      <Popover defaultOpen title="Build 1482" trigger={<Button size="sm">WHY DID 1482 FAIL?</Button>}>
        <BuildDetail />
      </Popover>
    </Modal>
  ),
};

/**
 * Interactive, closed. Press to open; focus moves in. Escape, a press outside
 * or the close control dismisses it, and focus returns to the trigger.
 */
export const Interactive: Story = {
  render: () => (
    <Stage>
      <Popover title="About levels" trigger={<Button size="sm">WHAT IS A LEVEL?</Button>}>
        A Level is a whole colour world — ground, ink, accents — chosen at runtime.
      </Popover>
    </Stage>
  ),
};
