import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectOnTop, expectClosed, pressAt, settled } from './play';

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
  // `pnpm test:interactions`: opened from the keyboard, the panel comes to
  // rest against the left edge, a press on the page beside it closes it, and
  // focus returns to the opener. Ends closed, as the story starts.
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: /open drawer/i });

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await page.findByRole('dialog', { name: /navigation/i });
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    await settled(drawer);
    await expectOnTop(drawer);
    const box = drawer.getBoundingClientRect();
    await expect(box.left).toBe(0);
    await expect(box.height).toBe(window.innerHeight);

    // The page to the right of the panel is the backdrop's.
    await pressAt(box.right + (window.innerWidth - box.right) / 2, window.innerHeight / 2, drawer);
    await expectClosed(drawer);
    await waitFor(() => expect(trigger).toHaveFocus());
  },
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
      <Button bracketed onClick={() => setFiltering(true)}>
        FILTER RESULTS
      </Button>
      <Drawer isOpen={filtering} onClose={() => setFiltering(false)} title="Filters">
        Narrowing the list leaves the deployments dialog underneath it open.
      </Drawer>
    </Modal>
  );
}
