import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog } from '../components/AlertDialog';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/Overlays/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

/**
 * Open on load, so the story shows the thing being documented — and because a
 * confirmation asserted closed asserts nothing.
 */
export const Destructive: Story = {
  args: {
    isOpen: true,
    title: 'Delete domain',
    confirmLabel: 'DELETE',
    onClose: () => {},
    onConfirm: () => {},
    children: 'Removing this domain unhosts the site immediately. There is no undo.',
  },
};

/** The labels are the answer, so they are worth writing per question. */
export const CustomLabels: Story = {
  args: {
    isOpen: true,
    title: 'Discard draft',
    confirmLabel: 'DISCARD',
    cancelLabel: 'KEEP EDITING',
    onClose: () => {},
    onConfirm: () => {},
    children: 'This draft has unsaved changes. Discarding returns to the last saved version.',
  },
};

/**
 * The overlay architecture, as a picture: a confirmation raised from inside a
 * `Modal`. Escape closes the alert and leaves the modal standing — the
 * invariant `Tooltip`, `Popover`, `Menu` and `Drawer` all inherit.
 */
export const OverAModal: Story = {
  render: () => <StackedExample />,
};

/**
 * A named component rather than a hook called inside `render`: the lint rule
 * is right that a bare `render` arrow is not a component, and the fixture is
 * easier to read with the state next to the markup it drives.
 */
function StackedExample() {
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal isOpen onClose={() => {}} title="Domain settings">
      <p style={{ marginBottom: '1rem' }}>ryankelly.dev is serving the production build.</p>
      <Button bracketed variant="danger" onClick={() => setConfirming(true)}>
        DELETE DOMAIN
      </Button>
      <AlertDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => setConfirming(false)}
        title="Delete domain"
        confirmLabel="DELETE"
      >
        Removing this domain unhosts the site immediately. There is no undo.
      </AlertDialog>
    </Modal>
  );
}

/**
 * Type-to-confirm: `confirmDisabled` holds the confirm until the reader has
 * typed the name of what they are destroying. Cancel is never disabled. Type
 * `acme/web` to enable the button. No custom footer is needed.
 */
export const TypeToConfirm: Story = {
  render: function TypeToConfirmExample() {
    const [typed, setTyped] = useState('');
    return (
      <AlertDialog
        isOpen
        title="Delete repository"
        confirmLabel="DELETE REPOSITORY"
        confirmDisabled={typed !== 'acme/web'}
        onClose={() => {}}
        onConfirm={() => {}}
      >
        <p>This permanently deletes acme/web and its issues. Type the name to confirm.</p>
        <input
          aria-label="Repository name"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-3 w-full border-2 border-edge-strong bg-surface-sunken px-3 py-2 font-mono text-sm text-content-primary"
        />
      </AlertDialog>
    );
  },
};

/**
 * A request in flight. `confirmPending` is Button's `pending`: the confirm
 * keeps focus and its width, shows a spinner and refuses a second activation,
 * where `disabled` would have dropped focus to the page behind. For a
 * consequential but harmless confirmation, `confirmVariant="primary"` replaces
 * the default `danger`.
 */
export const Pending: Story = {
  args: {
    isOpen: true,
    title: 'Publish release',
    confirmLabel: 'PUBLISH',
    confirmVariant: 'primary',
    confirmPending: true,
    confirmPendingLabel: 'Publishing',
    onClose: () => {},
    onConfirm: () => {},
    children: 'This tags the release and notifies every subscriber.',
  },
};
