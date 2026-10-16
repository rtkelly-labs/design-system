import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './AlertDialog';

function open(overrides: Partial<Parameters<typeof AlertDialog>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <main data-testid="page">
      <AlertDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete domain"
        confirmLabel="DELETE"
        {...overrides}
      >
        Removing this domain unhosts the site immediately.
      </AlertDialog>
    </main>,
  );
  return { onClose, onConfirm };
}

describe('AlertDialog', () => {
  it('announces as an alertdialog, named and described', async () => {
    open();

    const alert = await screen.findByRole('alertdialog', { name: 'Delete domain' });

    // The description is the reason this is not `Modal`: a confirmation that
    // does not say what it costs is a confirmation nobody can give.
    const describedBy = alert.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toContain(
      'unhosts the site immediately',
    );
  });

  /**
   * The defining difference from `Modal`, and the defect that shipping only
   * one of the two produces: a destructive confirmation must not be
   * dismissible by a stray click on the page behind it.
   */
  it('cannot be dismissed by pressing the backdrop', async () => {
    const { onClose, onConfirm } = open();
    await screen.findByRole('alertdialog');

    const backdrop = document.querySelector(
      '[data-slot="alert-dialog-backdrop"]',
    ) as HTMLElement;
    fireEvent.pointerDown(backdrop, { pointerType: 'mouse' });
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });

  it('closes on Escape, because trapping a keyboard user is the worse failure', async () => {
    const { onClose, onConfirm } = open();
    const alert = await screen.findByRole('alertdialog');

    fireEvent.keyDown(alert, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('separates the two answers: cancel closes, confirm acts', async () => {
    const { onClose, onConfirm } = open();
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /DELETE/ }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('offers no third dismissal affordance', async () => {
    open();
    await screen.findByRole('alertdialog');

    // A `×` in the corner alongside Cancel and Delete makes the safe answer
    // ambiguous — two of three controls would mean "no".
    expect(screen.queryByRole('button', { name: 'Close dialog' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('sends focus into the dialog and hides the page behind it', async () => {
    open();
    const alert = await screen.findByRole('alertdialog');

    await waitFor(() => expect(alert.contains(document.activeElement)).toBe(true));

    const page = screen.getByTestId('page');
    expect(page.closest('[aria-hidden="true"]')?.contains(page)).toBe(true);
  });
});
