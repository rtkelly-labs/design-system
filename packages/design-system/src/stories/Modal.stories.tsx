import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectOnTop, expectClosed, pressAt } from './play';

const meta: Meta<typeof Modal> = {
  title: 'Components/Overlays/Modal',
  component: Modal,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/** Open on load, so the story shows the thing being documented. */
export const Open: Story = {
  args: {
    isOpen: true,
    title: 'Confirm deploy',
    onClose: () => {},
    children: 'This promotes the current build to production. The previous build stays reachable.',
  },
};

export const WithFooter: Story = {
  args: {
    isOpen: true,
    title: 'Delete domain',
    onClose: () => {},
    children: 'Removing this domain unhosts the site immediately. There is no undo.',
    footer: (
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button>CANCEL</Button>
        <Button bracketed variant="danger">DELETE</Button>
      </div>
    ),
  },
};

/** Interactive — the close affordance and backdrop only mean something with state. */
export const Toggleable: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ padding: '2rem' }}>
        <Button bracketed onClick={() => setIsOpen(true)}>OPEN MODAL</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Session expired">
          Re-authenticate to continue. Unsaved changes are kept.
        </Modal>
      </div>
    );
  },
  // `pnpm test:interactions`: the focus trap, both dismissals and the focus
  // return, in a real browser, ending closed as the story starts.
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: /open modal/i });

    await userEvent.click(trigger);
    const dialog = await page.findByRole('dialog', { name: /session expired/i });
    await waitFor(() => expect(dialog).toHaveFocus());
    await expectOnTop(dialog);

    // Two stops inside — the corner close and the footer's CLOSE — and Tab
    // cycles between them in both directions without reaching the page.
    const corner = within(dialog).getByRole('button', { name: 'Close dialog' });
    const footer = within(dialog).getByRole('button', { name: /^\W*close\W*$/i });
    // Past either end, Tab lands on one of Base UI's focus guards, which hands
    // focus on in a later task — hence `waitFor` on the wrap.
    await userEvent.tab();
    await expect(corner).toHaveFocus();
    await userEvent.tab();
    await expect(footer).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(corner).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(footer).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    await expectClosed(dialog);
    await waitFor(() => expect(trigger).toHaveFocus());

    // Whatever is painted in the corner is the backdrop, not the dialog.
    await userEvent.click(trigger);
    const again = await page.findByRole('dialog', { name: /session expired/i });
    await expectOnTop(again);
    await pressAt(4, 4, again);
    await expectClosed(again);
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
