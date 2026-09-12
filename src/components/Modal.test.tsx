import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

/**
 * jsdom never lays anything out, so `offsetParent` is `null` on every element
 * including visible ones. The trap filters its candidate list on exactly that
 * property to skip hidden controls, so without this shim the list is empty and
 * every wrap assertion below passes for the wrong reason — the trap does
 * nothing because it believes the dialog contains nothing focusable.
 *
 * This stands in for layout, it does not stand in for the component: it makes
 * jsdom report what a browser would, and says nothing about how the trap uses
 * it.
 */
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      return this.parentElement;
    },
  });
});

/**
 * `Modal` hand-rolls three browser behaviours that a primitive library owns:
 * a focus trap, a scroll lock and an Escape handler. #162 proposes replacing
 * all three with Base UI's `Dialog`.
 *
 * That is exactly why these tests exist now rather than after. Each one states
 * a behaviour in terms a user could describe — "Tab from the last control goes
 * back to the first" — and none of them names `document.addEventListener`, the
 * `keydown` capture phase or `body.style.overflow` as the mechanism. So the
 * migration can delete every line of the implementation and this file still
 * says whether the behaviour survived. A test that asserted on the mechanism
 * would have to be deleted alongside it, and would have proved nothing.
 */
function open(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  return render(
    <Modal isOpen title="Scoped themes" onClose={props.onClose ?? vi.fn()} {...props}>
      <button type="button">First</button>
      <button type="button">Second</button>
    </Modal>,
  );
}

afterEach(() => {
  // The scroll lock writes to a node that outlives the component tree, so a
  // leak here would surface as an unrelated test failing much later.
  document.body.style.overflow = '';
});

describe('dismissal', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on a backdrop press', () => {
    const onClose = vi.fn();
    const { container } = open({ onClose });
    const backdrop = container.ownerDocument.querySelector('[data-slot="modal-backdrop"]')!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores a press that starts inside the dialog and ends on the backdrop', () => {
    const onClose = vi.fn();
    open({ onClose });
    // Selecting text from inside the dialog and releasing outside it is the
    // real-world version of this, and losing the dialog mid-selection is the
    // defect. `mousedown` on the dialog must not reach the backdrop handler.
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the backdrop inert when closeOnBackdropClick is off', () => {
    const onClose = vi.fn();
    const { container } = open({ onClose, closeOnBackdropClick: false });
    fireEvent.mouseDown(container.ownerDocument.querySelector('[data-slot="modal-backdrop"]')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('offers a labelled close control', () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('the focus trap', () => {
  it('moves focus into the dialog on open', () => {
    open();
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('wraps Tab from the last control back to the first', () => {
    open();
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'CLOSE' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });

  it('wraps Shift+Tab from the first control back to the last', () => {
    open();
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'CLOSE' });
    close.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = open();
    expect(document.activeElement).not.toBe(opener);

    unmount();
    // Without this, dismissing drops focus onto `<body>` and the next Tab
    // restarts from the top of the page rather than where the user was.
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});

describe('the scroll lock', () => {
  it('locks the page while open', () => {
    open();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores whatever the page had, not a hardcoded default', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = open();
    unmount();
    // A consumer that deliberately set `overflow` gets it back. Resetting to
    // `visible` or `''` would silently undo their choice.
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('does not lock the page when closed', () => {
    render(
      <Modal isOpen={false} title="Scoped themes" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});

describe('accessible structure', () => {
  it('names the dialog from its own title', () => {
    open();
    const dialog = screen.getByRole('dialog');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toBe('[ Scoped themes ]');
  });

  it('marks the dialog modal so a screen reader ignores the page behind it', () => {
    open();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('renders nothing at all when closed', () => {
    const { container } = render(
      <Modal isOpen={false} title="Scoped themes" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
