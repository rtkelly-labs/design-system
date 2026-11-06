import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './AlertDialog';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * These four cases predate the Base UI migration (#236) and are its
 * invariants: they describe what a modal dialog *does*, and #162 moved the
 * implementation underneath them without changing any of it.
 *
 * Three needed a new mechanism, and the distinction is worth keeping straight
 * — the claim is the same in each, the way the test reaches it is not:
 *
 *   1. **Locating the backdrop.** It used to be the dialog's parent, because
 *      one element was the dim, the centring container and the click target at
 *      once. Base UI splits those: `Backdrop` dims, `Viewport` centres and is
 *      the popup's parent. `data-slot="modal-backdrop"` names the backdrop, so
 *      the test queries for it rather than walking up from the dialog.
 *   2. **The scroll lock is `overflow-y`.** Base UI sets the longhand on
 *      `body` and adds `scrollbar-gutter: stable` to `html` — which is the fix
 *      for the layout shift the hand-rolled `body.style.overflow = 'hidden'`
 *      caused, so it is asserted rather than merely tolerated.
 *   3. **Outside press is a pointer sequence.** `mouseDown` alone no longer
 *      dismisses; Base UI listens for `pointerdown` and confirms on `click`.
 *      That is closer to what a browser actually sends.
 *
 * Focus restoration is also asynchronous now, so it is awaited rather than
 * asserted on the next line.
 */
describe('Modal', () => {
  it('portals an open dialog and exposes its accessible name', async () => {
    render(
      <main data-testid="page">
        <Modal isOpen onClose={vi.fn()} title="Settings">
          <p>Preferences</p>
        </Modal>
      </main>,
    );

    const dialog = await screen.findByRole('dialog', { name: '[\u00a0Settings\u00a0]' });

    expect(document.querySelector('[data-slot="modal-backdrop"]')).not.toBeNull();
    expect(dialog.parentElement?.getAttribute('data-slot')).toBe('modal-viewport');
    expect(screen.getByTestId('page').contains(dialog)).toBe(false);
    // `aria-modal` used to be asserted here. Base UI never emits it — by
    // choice, not omission: it marks the portal's siblings `aria-hidden`
    // instead, which is the mechanism `aria-modal` is a hint for and the one
    // screen readers actually implement consistently. The claim the attribute
    // stood for is asserted directly, below, and more strongly.
    expect(dialog.getAttribute('role')).toBe('dialog');
  });

  it('sends focus into the dialog on open, closes on Escape, and restores focus to the opener', async () => {
    const onClose = vi.fn();
    const modal = (isOpen: boolean) => (
      <>
        <button type="button">Open settings</button>
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
          Content
        </Modal>
      </>
    );

    const { rerender } = render(modal(false));

    const opener = screen.getByRole('button', { name: 'Open settings' });
    opener.focus();

    rerender(modal(true));

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement).toBe(dialog));

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();

    rerender(modal(false));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('locks body scrolling while open and restores the previous value on close', async () => {
    document.body.style.overflowY = 'auto';
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} title="Settings">
        Content
      </Modal>,
    );

    await screen.findByRole('dialog');
    expect(document.body.style.overflowY).toBe('hidden');
    // The scrollbar-gutter reservation is the whole point: removing the
    // scrollbar without it is what made the page jump by its width.
    expect(document.documentElement.style.scrollbarGutter).toBe('stable');

    rerender(
      <Modal isOpen={false} onClose={vi.fn()} title="Settings">
        Content
      </Modal>,
    );

    await waitFor(() => expect(document.body.style.overflowY).toBe('auto'));
  });

  it('closes when the backdrop itself is clicked, but not when the dialog is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Settings">
        Content
      </Modal>,
    );

    const dialog = await screen.findByRole('dialog');
    const backdrop = document.querySelector('[data-slot="modal-backdrop"]') as HTMLElement;

    press(dialog);
    expect(onClose).not.toHaveBeenCalled();

    press(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('leaves the backdrop inert when closeOnBackdropClick is off', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Draft" closeOnBackdropClick={false}>
        Content
      </Modal>,
    );

    await screen.findByRole('dialog');
    press(document.querySelector('[data-slot="modal-backdrop"]') as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the rest of the page from assistive technology while open', async () => {
    render(
      <main data-testid="page">
        <Modal isOpen onClose={vi.fn()} title="Settings">
          Content
        </Modal>
      </main>,
    );

    await screen.findByRole('dialog');

    // Base UI marks the portal's siblings, and the page sits inside one of
    // them. Walking up from the page is what makes this independent of how
    // deeply the test renderer nests its container.
    const page = screen.getByTestId('page');
    const hidden = page.closest('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    expect(hidden?.contains(page)).toBe(true);
  });
});

/**
 * The defect the hand-rolled implementation had, and the reason #162 came
 * before #166 and #241: two dialogs both listened on `document` in the capture
 * phase, so one Escape closed both. Every overlay added after this one
 * inherits the stack this asserts.
 */
describe('Modal and AlertDialog stacking', () => {
  function Stack({ onOuterClose }: { onOuterClose: () => void }) {
    const [confirming, setConfirming] = useState(false);
    return (
      <Modal isOpen onClose={onOuterClose} title="Settings">
        <Button onClick={() => setConfirming(true)}>Delete account</Button>
        <AlertDialog
          isOpen={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => setConfirming(false)}
          title="Delete account"
          confirmLabel="DELETE"
        >
          This cannot be undone.
        </AlertDialog>
      </Modal>
    );
  }

  it('closes only the topmost surface on Escape', async () => {
    const onOuterClose = vi.fn();
    render(<Stack onOuterClose={onOuterClose} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete account' }));

    const alert = await screen.findByRole('alertdialog');
    await waitFor(() => expect(alert.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(alert, { key: 'Escape' });

    // The alert goes; the modal underneath it stays, and its `onClose` is
    // never reached. One Escape, one surface.
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onOuterClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

/** Base UI dismisses on a pointer sequence, not a bare `mouseDown`. */
function press(target: HTMLElement) {
  fireEvent.pointerDown(target, { pointerType: 'mouse' });
  fireEvent.mouseDown(target);
  fireEvent.click(target);
}
