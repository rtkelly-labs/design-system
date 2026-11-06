import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

const meta: Meta<typeof Modal> = {
  title: 'Foundations/Modal',
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
        <Button variant="default">CANCEL</Button>
        <Button bracketed variant="tertiary">DELETE</Button>
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
};
