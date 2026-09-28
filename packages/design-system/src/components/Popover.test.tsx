import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Modal } from './Modal';
import { Popover } from './Popover';

/** Every focusable descendant of `root`. */
function focusables(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

/** Base UI dismisses on a pointer sequence, not a bare `mouseDown`. */
function press(target: HTMLElement) {
  fireEvent.pointerDown(target, { pointerType: 'mouse' });
  fireEvent.mouseDown(target);
  fireEvent.pointerUp(target, { pointerType: 'mouse' });
  fireEvent.mouseUp(target);
  fireEvent.click(target);
}

describe('Popover', () => {
  it('opens from its trigger, names the dialog by its title, and moves focus inside', async () => {
    render(
      <Popover title="Build 1482" trigger={<Button>DETAILS</Button>}>
        <p>Passed 41 of 42 gates.</p>
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'DETAILS' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Build 1482' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    // The first control, which with text-only content is the close button.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onOpenChange = vi.fn();
    render(
      <Popover title="Build 1482" trigger={<Button>DETAILS</Button>} onOpenChange={onOpenChange}>
        Detail
      </Popover>,
    );

    const trigger = screen.getByRole('button', { name: 'DETAILS' });
    act(() => trigger.focus());
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('closes from its close button, and on a press outside', async () => {
    render(
      <>
        <p data-testid="outside">Page</p>
        <Popover title="Filters" trigger={<Button>FILTERS</Button>}>
          Detail
        </Popover>
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'FILTERS' });
    fireEvent.click(trigger);
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(trigger);
    await screen.findByRole('dialog');
    press(screen.getByTestId('outside'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('is non-modal: nothing outside it is hidden, and nothing inside it is either', async () => {
    render(
      <main data-testid="page">
        <Popover defaultOpen title="Build 1482" trigger={<Button>DETAILS</Button>}>
          <a href="#log">Open the log</a>
        </Popover>
      </main>,
    );

    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('page').closest('[aria-hidden="true"]')).toBeNull();
    for (const el of focusables(dialog)) {
      expect(el.closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  describe('inside a Modal', () => {
    function Stacked({ onModalClose }: { onModalClose: () => void }) {
      return (
        <Modal isOpen onClose={onModalClose} title="Settings">
          <Popover title="About levels" trigger={<Button>WHAT IS A LEVEL?</Button>}>
            <a href="#levels">Read the ladder</a>
          </Popover>
        </Modal>
      );
    }

    it('closes only the popover on Escape, and leaves the modal standing', async () => {
      const onModalClose = vi.fn();
      render(<Stacked onModalClose={onModalClose} />);

      const trigger = await screen.findByRole('button', { name: 'WHAT IS A LEVEL?' });
      act(() => trigger.focus());
      fireEvent.click(trigger);
      const popover = await screen.findByRole('dialog', { name: 'About levels' });
      await waitFor(() => expect(popover.contains(document.activeElement)).toBe(true));

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });

      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'About levels' })).toBeNull());
      expect(onModalClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: '[ Settings ]' })).toBeTruthy();
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    });

    it('paints above the modal and leaves none of its controls under an aria-hidden ancestor', async () => {
      render(<Stacked onModalClose={vi.fn()} />);

      fireEvent.click(await screen.findByRole('button', { name: 'WHAT IS A LEVEL?' }));
      const popover = await screen.findByRole('dialog', { name: 'About levels' });

      // Same layer as the dialogs, later in the DOM: portalled after the
      // modal, so it paints over it.
      expect((popover.parentElement as HTMLElement).className).toContain('z-top');
      const modal = screen.getByRole('dialog', { name: '[ Settings ]' });
      expect(modal.compareDocumentPosition(popover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const controls = focusables(popover);
      expect(controls.length).toBeGreaterThan(0);
      for (const el of controls) {
        expect(el.closest('[aria-hidden="true"]')).toBeNull();
      }
    });
  });

  it('forwards its ref to the popup, spreads props, and merges a caller’s class and style', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover
        ref={ref}
        defaultOpen
        title="Wide"
        trigger={<Button>OPEN</Button>}
        data-testid="pop"
        className="w-96"
        style={{ minHeight: '4rem' }}
      >
        Body
      </Popover>,
    );

    const popup = await screen.findByTestId('pop');
    expect(ref.current).toBe(popup);
    expect(popup.getAttribute('role')).toBe('dialog');
    expect(popup.className).toContain('w-96');
    expect(popup.className).not.toContain('w-80');
    expect(popup.style.minHeight).toBe('4rem');
    expect(popup.className).toContain('motion-reduce:transition-none');
  });
});
