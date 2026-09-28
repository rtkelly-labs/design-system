import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

const meta: Meta<typeof Drawer> = {
  title: 'Components/Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

/**
 * The default placement, open on load — a drawer asserted closed asserts
 * nothing. A panel raised from a control on the page: filters, settings, a
 * detail view beside the row it belongs to.
 */
export const FromTheRight: Story = {
  args: {
    isOpen: true,
    title: 'Filters',
    onClose: () => {},
    children: (
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li>Status — failing</li>
        <li>Level — midnight</li>
        <li>Updated — last 7 days</li>
      </ul>
    ),
  },
};

/**
 * The navigation placement, and the reason this component exists: at a narrow
 * viewport, a site's whole nav lives off-canvas to the left until it is asked
 * for. This is the story `tests/visual.spec.ts` asserts in `MOBILE_CASES`.
 */
export const FromTheLeft: Story = {
  args: {
    isOpen: true,
    placement: 'left',
    title: 'Navigation',
    onClose: () => {},
    children: (
      <nav>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Writing</li>
          <li>Projects</li>
          <li>Design system</li>
          <li>Colophon</li>
        </ul>
      </nav>
    ),
  },
};

/**
 * Interactive — the slide, the backdrop and the focus return only mean
 * something with state behind them. Open it with the keyboard and Escape it:
 * focus comes back to the button that opened it.
 */
export const Toggleable: Story = {
  render: () => <ToggleableExample />,
};

/**
 * The overlay architecture, as a picture: a drawer raised from inside a
 * `Modal`. Escape closes the drawer and leaves the modal standing — the same
 * stack `AlertDialog` resolves through, and the invariant every surface added
 * after these inherits.
 */
export const OverAModal: Story = {
  render: () => <StackedExample />,
};

/**
 * A named component rather than a hook called inside `render`: the lint rule
 * is right that a bare `render` arrow is not a component.
 */
function ToggleableExample() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ padding: '2rem' }}>
      <Button bracketed onClick={() => setIsOpen(true)}>OPEN DRAWER</Button>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="left"
        title="Navigation"
      >
        Escape, the backdrop and the close control all dismiss it.
      </Drawer>
    </div>
  );
}

function StackedExample() {
  const [filtering, setFiltering] = useState(false);
  return (
    <Modal isOpen onClose={() => {}} title="Deployments">
      <p style={{ marginBottom: '1rem' }}>Twelve deployments in the last seven days.</p>
      <Button bracketed variant="tertiary" onClick={() => setFiltering(true)}>
        FILTER RESULTS
      </Button>
      <Drawer isOpen={filtering} onClose={() => setFiltering(false)} title="Filters">
        Narrowing the list leaves the deployments dialog underneath it open.
      </Drawer>
    </Modal>
  );
}
