import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from '../components/Menu';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { cn } from '../lib/recipe';

const meta: Meta<typeof Menu> = {
  title: 'Components/Overlays/Menu',
  component: Menu,
  subcomponents: { MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator },
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    trigger: { control: false, description: 'The control that opens it — one element that forwards its ref.' },
    children: { control: false, description: '`MenuItem`, `MenuRadioGroup` and `MenuSeparator`, in order.' },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

/** The page a menu opens over. */
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

/** The four-action set every story shares, so each shows the same list. */
function RowActions() {
  return (
    <>
      <MenuItem>Rename</MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuItem disabled>Move to archive</MenuItem>
      <MenuSeparator />
      <MenuItem intent="danger">Delete</MenuItem>
    </>
  );
}

/**
 * Context actions, open on load — a menu asserted closed asserts nothing.
 * One disabled item, which the arrow keys still reach and announce as
 * unavailable, and which cannot be chosen; the destructive action
 * last, in the danger ink, after a separator. The story `tests/visual.spec.ts`
 * asserts.
 */
export const Actions: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Stage>
      <Menu {...args} trigger={<Button size="sm" bracketed>ACTIONS</Button>}>
        <RowActions />
      </Menu>
    </Stage>
  ),
};

/**
 * A setting rather than an action: a labelled radio group, the chosen item
 * checked. The shape `DocsHeader`'s level chooser uses — a choice the user can
 * see all of, instead of a button that cycled through them blind.
 */
export const Choice: Story = {
  render: () => <ChoiceExample />,
};

function ChoiceExample() {
  const [density, setDensity] = useState('comfortable');
  return (
    <Stage>
      <Menu defaultOpen trigger={<Button size="sm">DENSITY</Button>}>
        <MenuRadioGroup label="Row density" value={density} onValueChange={setDensity}>
          <MenuRadioItem value="compact">Compact</MenuRadioItem>
          <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
          <MenuRadioItem value="spacious">Spacious</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
    </Stage>
  );
}

/**
 * A trigger at the right edge, aligned to its start. At a phone's width there
 * is no room to open rightward, so the engine shifts the menu inside the
 * viewport. The row `MOBILE_CASES` asserts.
 */
export const AtTheViewportEdge: Story = {
  render: () => (
    <Stage className="justify-end px-2">
      <Menu defaultOpen trigger={<Button size="sm">ACTIONS</Button>}>
        <RowActions />
      </Menu>
    </Stage>
  ),
};

/**
 * Opened from inside a `Modal`. The menu paints above the dialog, and Escape
 * closes the menu alone — the stack #162 established.
 */
export const InsideAModal: Story = {
  render: () => (
    <Modal isOpen onClose={() => {}} title="Deployments">
      <p className="mb-4">Build 1482 failed on `check:visual`.</p>
      <Menu defaultOpen trigger={<Button size="sm">BUILD ACTIONS</Button>}>
        <MenuItem>Re-run failed gates</MenuItem>
        <MenuItem>Copy link</MenuItem>
        <MenuSeparator />
        <MenuItem intent="danger">Cancel deployment</MenuItem>
      </Menu>
    </Modal>
  ),
};
