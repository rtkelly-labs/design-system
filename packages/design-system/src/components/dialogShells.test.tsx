import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './AlertDialog';
import { Drawer } from './Drawer';
import { Modal } from './Modal';

/**
 * The shell options added for roll-up row 10: `initialFocus`, a headerless
 * mode, an optional footer, and AlertDialog's gated, pending, re-coloured
 * confirm. Kept apart from the per-component files, which assert the dialog
 * contract these options must not change.
 */

describe('Modal: initialFocus', () => {
  it('focuses the dialog itself by default, so its title is announced', async () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Palette">
        <input aria-label="Query" />
      </Modal>,
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement).toBe(dialog));
  });

  it('passes a ref through, landing on the field the dialog exists for', async () => {
    const field = createRef<HTMLInputElement>();
    render(
      <Modal isOpen onClose={vi.fn()} title="Palette" initialFocus={field}>
        <input ref={field} aria-label="Query" />
      </Modal>,
    );
    await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Query')));
  });

  it('passes a function through, read at focus time', async () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
        title="Palette"
        initialFocus={() => document.getElementById('late')}
      >
        <input id="late" aria-label="Query" />
      </Modal>,
    );
    await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement?.id).toBe('late'));
  });
});

describe('Modal: headerless and footerless', () => {
  it('drops the header bar but keeps the name and a visible close', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Command palette" headerless footer={false}>
        body
      </Modal>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' });
    expect(document.querySelector('[data-slot="modal-header"]')).toBeNull();
    expect(document.querySelector('[data-slot="modal-footer"]')).toBeNull();
    // The title is hidden visually, not removed: it is the accessible name.
    expect(document.querySelector('[data-slot="modal-title"]')?.className).toContain('sr-only');
    const close = screen.getByRole('button', { name: 'Close dialog' });
    expect(dialog.contains(close)).toBe(true);
    fireEvent.click(close);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the default header and CLOSE footer otherwise', async () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Settings">
        body
      </Modal>,
    );
    await screen.findByRole('dialog');
    expect(document.querySelector('[data-slot="modal-header"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /CLOSE/ })).toBeTruthy();
  });
});

describe('Drawer: headerless and footerless', () => {
  it('renders its title once, hidden, with a corner close', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="DS-1144" headerless footer={false}>
        <h2>DS-1144 detail</h2>
      </Drawer>,
    );
    await screen.findByRole('dialog', { name: 'DS-1144' });
    expect(document.querySelector('[data-slot="drawer-header"]')).toBeNull();
    expect(document.querySelector('[data-slot="drawer-footer"]')).toBeNull();
    expect(document.querySelector('[data-slot="drawer-title"]')?.className).toContain('sr-only');
    expect(screen.getByRole('button', { name: 'Close drawer' })).toBeTruthy();
  });

  it('passes initialFocus through', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="Filters" initialFocus={() => document.getElementById('q')}>
        <input id="q" aria-label="Query" />
      </Drawer>,
    );
    await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement?.id).toBe('q'));
  });
});

describe('AlertDialog: confirm options', () => {
  function open(props: Partial<Parameters<typeof AlertDialog>[0]> = {}) {
    const onConfirm = vi.fn();
    render(
      <AlertDialog isOpen onClose={vi.fn()} onConfirm={onConfirm} title="Delete" confirmLabel="DELETE" {...props}>
        Gone for good.
      </AlertDialog>,
    );
    return { onConfirm };
  }

  it('confirms in danger by default', async () => {
    open();
    const confirm = await screen.findByRole('button', { name: /DELETE/ });
    expect(confirm.className).toContain('text-intent-danger');
  });

  it('takes another confirm variant', async () => {
    open({ confirmVariant: 'primary' });
    const confirm = await screen.findByRole('button', { name: /DELETE/ });
    expect(confirm.className).toContain('bg-accent-primary');
    expect(confirm.className).not.toContain('text-intent-danger');
  });

  it('withholds the confirm while confirmDisabled, and never the cancel', async () => {
    const { onConfirm } = open({ confirmDisabled: true });
    const confirm = (await screen.findByRole('button', { name: /DELETE/ })) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'CANCEL' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('pends the confirm without dropping its focus or running it twice', async () => {
    const { onConfirm } = open({ confirmPending: true, confirmPendingLabel: 'Deleting' });
    const confirm = (await screen.findByRole('button', { name: /DELETE/ })) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot="button-status"]')?.textContent).toBe('Deleting');
  });
});
