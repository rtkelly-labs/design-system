import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './AlertDialog';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { Modal } from './Modal';

/**
 * `Drawer` claims to be `Modal` with a different position, so these are
 * deliberately `Modal.test.tsx`'s cases asked of a drawer — same claims, same
 * mechanisms, same idiom. Where they pass for a reason other than the drawer's
 * own code, that is the result: the behaviour is inherited from the dialog
 * primitive rather than reimplemented, and a test that fails here would mean
 * the inheritance had been broken.
 *
 * What is genuinely this component's own is placement, and it is asserted
 * twice over — as the `data-placement` contract, and as the edge the panel is
 * actually anchored to.
 */
describe('Drawer', () => {
  it('portals an open drawer and exposes its accessible name', async () => {
    render(
      <main data-testid="page">
        <Drawer isOpen onClose={vi.fn()} title="Navigation">
          <p>Links</p>
        </Drawer>
      </main>,
    );

    const drawer = await screen.findByRole('dialog', { name: '[ Navigation ]' });

    expect(document.querySelector('[data-slot="drawer-backdrop"]')).not.toBeNull();
    expect(drawer.parentElement?.getAttribute('data-slot')).toBe('drawer-viewport');
    expect(screen.getByTestId('page').contains(drawer)).toBe(false);
    expect(drawer.getAttribute('role')).toBe('dialog');
  });

  /*
   * Placement, as the two things it has to be: the contract a consumer reads,
   * and the geometry a reader sees. Asserting only the `data-` attribute would
   * pass on a drawer that rendered centred like a modal.
   */
  it('anchors to the right by default, bordered on its inner edge', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="Filters">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    const viewport = drawer.parentElement as HTMLElement;

    expect(drawer.getAttribute('data-placement')).toBe('right');
    expect(viewport.className).toContain('justify-end');
    // The inner edge is the left one, and the outer edges carry no border:
    // a drawer flush with three sides of the viewport has three edges nobody
    // can see.
    expect(drawer.className).toContain('border-l-4');
    expect(drawer.className).toContain('border-r-0');
    // Full height, not the modal's `max-h-[90vh]` — the centring allowance has
    // to be gone or the panel floats off both ends.
    expect(drawer.className).toContain('h-full');
    expect(drawer.className).not.toContain('max-h-[90vh]');
  });

  it('anchors to the left when asked, mirrored', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} placement="left" title="Navigation">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    const viewport = drawer.parentElement as HTMLElement;

    expect(drawer.getAttribute('data-placement')).toBe('left');
    expect(viewport.className).toContain('justify-start');
    expect(drawer.className).toContain('border-r-4');
    expect(drawer.className).toContain('border-l-0');
  });

  /*
   * The enter and exit transition, asserted as classes because that is where
   * it lives: Base UI sets `data-starting-style` / `data-ending-style` for one
   * frame either side, and jsdom computes no transitions to observe. The
   * `motion-reduce` clause is the part worth pinning — a panel crossing the
   * viewport is exactly the motion `prefers-reduced-motion` asks not to see.
   */
  it('slides in from its edge, and not at all under prefers-reduced-motion', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} placement="left" title="Navigation">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');

    expect(drawer.className).toContain('data-[starting-style]:-translate-x-full');
    expect(drawer.className).toContain('data-[ending-style]:-translate-x-full');
    expect(drawer.className).toContain('duration-quick');
    expect(drawer.className).toContain('ease-brutalist');
    expect(drawer.className).toContain('motion-reduce:transition-none');
  });

  /* The `--ds-layer-*` scale, never a literal `z-` value. */
  it('takes its stacking value from the layer scale', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="Filters">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    const backdrop = document.querySelector('[data-slot="drawer-backdrop"]') as HTMLElement;

    expect(backdrop.className).toContain('z-top');
    expect((drawer.parentElement as HTMLElement).className).toContain('z-top');
    expect(drawer.className).not.toMatch(/\bz-\d/);
  });

  it('sends focus into the drawer on open, closes on Escape, and restores focus to the opener', async () => {
    const onClose = vi.fn();
    const drawer = (isOpen: boolean) => (
      <>
        <button type="button">Open navigation</button>
        <Drawer isOpen={isOpen} onClose={onClose} placement="left" title="Navigation">
          Content
        </Drawer>
      </>
    );

    const { rerender } = render(drawer(false));

    const opener = screen.getByRole('button', { name: 'Open navigation' });
    opener.focus();

    rerender(drawer(true));

    const panel = await screen.findByRole('dialog');
    // The popup itself, not its close button: a screen reader then announces
    // the drawer's own title rather than "Close drawer, button".
    await waitFor(() => expect(document.activeElement).toBe(panel));

    fireEvent.keyDown(panel, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();

    rerender(drawer(false));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('locks body scrolling while open and restores the previous value on close', async () => {
    document.body.style.overflowY = 'auto';
    const { rerender } = render(
      <Drawer isOpen onClose={vi.fn()} title="Filters">
        Content
      </Drawer>,
    );

    await screen.findByRole('dialog');
    expect(document.body.style.overflowY).toBe('hidden');
    // Without the gutter reservation the page jumps by the width of its
    // scrollbar as the drawer opens — the layout shift #241 rules out.
    expect(document.documentElement.style.scrollbarGutter).toBe('stable');

    rerender(
      <Drawer isOpen={false} onClose={vi.fn()} title="Filters">
        Content
      </Drawer>,
    );

    await waitFor(() => expect(document.body.style.overflowY).toBe('auto'));
  });

  it('closes when the backdrop itself is clicked, but not when the panel is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose} title="Filters">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    const backdrop = document.querySelector('[data-slot="drawer-backdrop"]') as HTMLElement;

    press(drawer);
    expect(onClose).not.toHaveBeenCalled();

    press(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('leaves the backdrop inert when closeOnBackdropClick is off', async () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose} title="Filters" closeOnBackdropClick={false}>
        Content
      </Drawer>,
    );

    await screen.findByRole('dialog');
    press(document.querySelector('[data-slot="drawer-backdrop"]') as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the rest of the page from assistive technology while open', async () => {
    render(
      <main data-testid="page">
        <Drawer isOpen onClose={vi.fn()} title="Navigation">
          Content
        </Drawer>
      </main>,
    );

    await screen.findByRole('dialog');

    const page = screen.getByTestId('page');
    const hidden = page.closest('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    expect(hidden?.contains(page)).toBe(true);
  });

  it('forwards its ref to the panel and spreads unrecognised props onto it', async () => {
    let node: HTMLDivElement | null = null;
    render(
      <Drawer
        isOpen
        onClose={vi.fn()}
        title="Filters"
        ref={(el) => {
          node = el;
        }}
        data-testid="panel"
      >
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    // The forwarded ref has to survive the merge `initialFocus` needs, which
    // is the whole reason `usePopupRef` exists.
    expect(node).toBe(drawer);
    expect(drawer.getAttribute('data-testid')).toBe('panel');
  });

  it('merges a caller’s width rather than emitting both', async () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="Filters" className="max-w-md">
        Content
      </Drawer>,
    );

    const drawer = await screen.findByRole('dialog');
    expect(drawer.className).toContain('max-w-md');
    expect(drawer.className).not.toContain('max-w-sm');
  });
});

/**
 * The invariant the whole overlay set inherits, asked of the drawer from both
 * sides: with a drawer on top of a modal, and with an alert on top of a
 * drawer.
 *
 * It is the same claim `Modal.test.tsx` makes and is written in the same
 * idiom, because the mechanism is the same one — Base UI's dialog stack.
 * `Drawer` adds no Escape handling of its own, and this is what says so: a
 * `document`-level listener, which is what the hand-rolled dialog had and what
 * an off-canvas panel is most likely to reach for, would close both surfaces
 * and fail here.
 */
describe('Drawer stacking', () => {
  function DrawerOverModal({ onModalClose }: { onModalClose: () => void }) {
    const [filtering, setFiltering] = useState(false);
    return (
      <Modal isOpen onClose={onModalClose} title="Reports">
        <Button onClick={() => setFiltering(true)}>Filter results</Button>
        <Drawer
          isOpen={filtering}
          onClose={() => setFiltering(false)}
          title="Filters"
        >
          Content
        </Drawer>
      </Modal>
    );
  }

  it('closes only the drawer when it is raised over a modal', async () => {
    const onModalClose = vi.fn();
    render(<DrawerOverModal onModalClose={onModalClose} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Filter results' }));

    const drawer = await screen.findByRole('dialog', { name: '[ Filters ]' });
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(drawer, { key: 'Escape' });

    // The drawer goes; the modal underneath it stays, and its `onClose` is
    // never reached. One Escape, one surface.
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '[ Filters ]' })).toBeNull(),
    );
    expect(onModalClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '[ Reports ]' })).toBeTruthy();
  });

  function AlertOverDrawer({ onDrawerClose }: { onDrawerClose: () => void }) {
    const [confirming, setConfirming] = useState(false);
    return (
      <Drawer isOpen onClose={onDrawerClose} placement="left" title="Navigation">
        <Button onClick={() => setConfirming(true)}>Sign out</Button>
        <AlertDialog
          isOpen={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => setConfirming(false)}
          title="Sign out"
          confirmLabel="SIGN OUT"
        >
          Unsaved drafts are kept.
        </AlertDialog>
      </Drawer>
    );
  }

  it('closes only the alert when one is raised over a drawer', async () => {
    const onDrawerClose = vi.fn();
    render(<AlertOverDrawer onDrawerClose={onDrawerClose} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    const alert = await screen.findByRole('alertdialog');
    await waitFor(() => expect(alert.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(alert, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onDrawerClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '[ Navigation ]' })).toBeTruthy();
  });
});

/** Base UI dismisses on a pointer sequence, not a bare `mouseDown`. */
function press(target: HTMLElement) {
  fireEvent.pointerDown(target, { pointerType: 'mouse' });
  fireEvent.mouseDown(target);
  fireEvent.click(target);
}
