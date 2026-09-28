import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

function tooltip() {
  return document.querySelector<HTMLElement>('[data-slot="tooltip"]');
}

describe('Tooltip', () => {
  it('opens on keyboard focus of its trigger, and closes on blur', async () => {
    render(
      <Tooltip content="Speaker notes (N)">
        <Button aria-label="Show speaker notes">N</Button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Show speaker notes' });
    expect(tooltip()).toBeNull();

    act(() => trigger.focus());
    await waitFor(() => expect(tooltip()?.textContent).toBe('Speaker notes (N)'));

    act(() => trigger.blur());
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it('keeps the trigger’s own accessible name, and never becomes its only one', async () => {
    render(
      <Tooltip content="Fullscreen (F)" defaultOpen>
        <Button aria-label="Enter fullscreen">F</Button>
      </Tooltip>,
    );

    // The tooltip is visual. Base UI does not wire it to the trigger, so the
    // name a screen reader hears is the `aria-label` the caller gave.
    const trigger = screen.getByRole('button', { name: 'Enter fullscreen' });
    await waitFor(() => expect(tooltip()).not.toBeNull());
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('closes on Escape and leaves focus on the trigger', async () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip content="Copy link" onOpenChange={onOpenChange}>
        <Button aria-label="Copy link">⧉</Button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Copy link' });
    act(() => trigger.focus());
    await waitFor(() => expect(tooltip()).not.toBeNull());

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => expect(tooltip()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes only itself on Escape when it is open inside a Popover', async () => {
    const onPopoverChange = vi.fn();
    render(
      <Popover
        defaultOpen
        onOpenChange={onPopoverChange}
        title="Build 1482"
        trigger={<Button>DETAILS</Button>}
      >
        <Tooltip content="Re-run the failed gate">
          <Button aria-label="Re-run">↻</Button>
        </Tooltip>
      </Popover>,
    );

    const rerun = await screen.findByRole('button', { name: 'Re-run' });
    act(() => rerun.focus());
    await waitFor(() => expect(tooltip()).not.toBeNull());

    fireEvent.keyDown(rerun, { key: 'Escape' });

    await waitFor(() => expect(tooltip()).toBeNull());
    expect(onPopoverChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Build 1482' })).toBeTruthy();
  });

  it('renders nothing while disabled', async () => {
    render(
      <Tooltip content="Hidden" disabled>
        <Button aria-label="Quiet">Q</Button>
      </Tooltip>,
    );
    act(() => screen.getByRole('button', { name: 'Quiet' }).focus());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(tooltip()).toBeNull();
  });

  it('forwards its ref to the popup, spreads props, and merges a caller’s class and style', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tooltip
        ref={ref}
        content="Label"
        defaultOpen
        data-testid="tip"
        className="max-w-none"
        style={{ letterSpacing: '0.2em' }}
      >
        <Button aria-label="Label">L</Button>
      </Tooltip>,
    );

    const popup = await screen.findByTestId('tip');
    expect(ref.current).toBe(popup);
    // `max-w-none` replaces the recipe's cap rather than sitting beside it
    // for source order to arbitrate.
    expect(popup.className).toContain('max-w-none');
    expect(popup.className).not.toContain('max-w-[min(');
    expect(popup.style.letterSpacing).toBe('0.2em');
  });

  it('sits on the top layer, fades on the motion tokens, and drops the fade under reduced motion', async () => {
    render(
      <Tooltip content="Label" defaultOpen>
        <Button aria-label="Label">L</Button>
      </Tooltip>,
    );

    const popup = await waitFor(() => {
      const found = tooltip();
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    const positioner = popup.parentElement as HTMLElement;

    expect(positioner.className).toContain('z-top');
    expect(positioner.className).not.toMatch(/\bz-\d/);
    expect(popup.className).toContain('data-[starting-style]:opacity-0');
    expect(popup.className).toContain('data-[ending-style]:opacity-0');
    expect(popup.className).toContain('duration-quick');
    expect(popup.className).toContain('motion-reduce:transition-none');
  });
});
