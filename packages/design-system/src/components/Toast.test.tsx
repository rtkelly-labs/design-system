import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useOptionalToast, useToast } from './Toast';
import type { ToastApi, ToastProviderProps } from './Toast';
import { DEFAULT_TIMEOUT, MS_PER_WORD, NOTICE_MS, resolveLifetime } from './toastLifetime';

/**
 * `Toast` is a queue, a live region and a lifetime, and each of those is a
 * behaviour with a right answer independent of pixels — so each is asserted
 * here rather than left to a story.
 *
 * The mechanisms are Base UI's, and the tests are written against what a user
 * meets rather than against the primitive: the region's attributes, the order
 * the toasts are in, whether one is still there after its time, what focus
 * does. A test that passed because the primitive was mocked would assert
 * nothing about the component a consumer imports.
 */

/** Captures the API from inside the provider, the way a consumer's component would. */
function Capture({ onReady }: { onReady: (api: ToastApi) => void }) {
  const api = useToast();
  useEffect(() => onReady(api), [api, onReady]);
  return null;
}

function mount(props: Omit<ToastProviderProps, 'children'> = {}) {
  let api: ToastApi | undefined;
  const utils = render(
    <ToastProvider {...props}>
      <button type="button">Page control</button>
      <Capture onReady={(a) => { api = a; }} />
    </ToastProvider>,
  );
  const get = (): ToastApi => {
    if (!api) throw new Error('provider did not mount');
    return api;
  };
  return { ...utils, api: get };
}

const region = () => screen.getByRole('region', { name: 'Notifications' });
const toasts = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="toast"]'));
const titles = () =>
  toasts().map((t) => t.querySelector('[data-slot="toast-title"]')?.textContent?.replace(/[[\]]/g, '').trim());

describe('Toast — the live region', () => {
  /*
   * The requirement the issue calls the one that matters. A live region
   * inserted at the same moment as its content announces nothing, so the
   * region has to be in the document — empty, already polite — before the
   * first toast is shown.
   */
  it('renders the region on mount, before any toast exists, already polite', async () => {
    mount();

    const live = await screen.findByRole('region', { name: 'Notifications' });

    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.getAttribute('data-slot')).toBe('toast-viewport');
    expect(toasts()).toHaveLength(0);
  });

  /*
   * A toast shown from a child's mount effect — "Signed in", "Draft restored".
   * A child's effects run before its parent's, so any design in which the
   * provider starts listening in an effect drops exactly this toast, silently.
   * This one was found in the stories, not in a test; it is a test now.
   */
  it('shows a toast fired from a descendant on mount', async () => {
    function OnMount() {
      const toast = useToast();
      useEffect(() => {
        toast.show({ title: 'Signed in', timeout: 0 });
      }, [toast]);
      return null;
    }
    render(
      <ToastProvider>
        <OnMount />
      </ToastProvider>,
    );

    expect(await screen.findByRole('dialog', { name: 'Signed in' })).not.toBeNull();
  });

  it('names the region from `label`', async () => {
    mount({ label: 'Build notifications' });
    expect(await screen.findByRole('region', { name: 'Build notifications' })).not.toBeNull();
  });

  /*
   * Politeness per intent. The three non-danger intents are announced by the
   * polite region they are inserted into; `danger` is copied into a
   * `role="alert"`, which announces assertively on insertion, and its visible
   * copy is hidden from the polite region so it is not read twice.
   */
  it.each(['info', 'success', 'warning'] as const)('announces `%s` politely', async (intent) => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ intent, title: `A ${intent} toast`, timeout: 0 });
    });

    const [item] = toasts();
    expect(region().contains(item)).toBe(true);
    expect(item.getAttribute('aria-hidden')).toBeNull();
    expect(item.getAttribute('role')).toBe('dialog');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces `danger` assertively, and only once', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ intent: 'danger', title: 'Deploy failed', description: 'Step 3 of 5.', timeout: 0 });
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Deploy failed');
    expect(alert.textContent).toContain('Step 3 of 5.');
    // The alert is outside the polite region — otherwise it would be read by
    // both — and the visible copy inside the region is hidden from it.
    expect(region().contains(alert)).toBe(false);
    const [item] = toasts();
    expect(item.getAttribute('role')).toBe('alertdialog');
    // Only the text is hidden from the polite region, never the toast: hiding
    // the root would hide its controls with it (see the next test).
    expect(item.getAttribute('aria-hidden')).not.toBe('true');
    expect(item.querySelector('[data-slot="toast-title"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(item.querySelector('[data-slot="toast-description"]')?.getAttribute('aria-hidden')).toBe('true');

    // Focusing the toast still names it from the hidden text, and the alert
    // copy is withdrawn once the visible toast is the one being read.
    act(() => item.focus());
    fireEvent.focus(item);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.getByRole('alertdialog', { name: /Deploy failed/ })).toBe(item);
  });

  it('never leaves a focusable control inside a hidden subtree, danger included', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({
        intent: 'danger',
        title: 'Deploy failed',
        action: { label: 'Retry', onClick: () => {} },
        timeout: 0,
      });
    });

    const [item] = toasts();
    const focusable = item.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])');
    expect(focusable.length).toBeGreaterThan(0);
    for (const el of focusable) {
      expect(el.closest('[aria-hidden="true"]')).toBeNull();
    }
    expect(screen.getByRole('button', { name: /Retry/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeTruthy();
  });

  /*
   * The dismiss control stays in the accessibility tree. Base UI hides it
   * until the stack is hovered or focused; a tabbable control hidden from the
   * tree is what axe's `aria-hidden-focus` exists to catch, and a screen
   * reader's virtual cursor could not find it.
   */
  it('keeps the dismiss control exposed while the stack is at rest', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Copied', timeout: 0 });
    });

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(close.getAttribute('aria-hidden')).toBe('false');
  });

  it('marks each toast with its intent', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ intent: 'success', title: 'Saved', timeout: 0 });
    });

    const [item] = toasts();
    expect(item.getAttribute('data-intent')).toBe('success');
    expect(item.className).toContain('border-intent-success');
    // The icon carries the intent for a reader who cannot tell the colours
    // apart, and says nothing to a screen reader, which has the title.
    expect(item.querySelector('[data-slot="toast-icon"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('names each toast by its title, without the brackets', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Draft saved', timeout: 0 });
    });

    expect(screen.getByRole('dialog', { name: 'Draft saved' })).not.toBeNull();
  });
});

describe('Toast — the queue', () => {
  /*
   * Several at once, newest first. DOM order is visual order, so this is also
   * the order Tab walks them in.
   */
  it('stacks simultaneous toasts newest first', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'First', timeout: 0 });
      api().show({ title: 'Second', timeout: 0 });
      api().show({ title: 'Third', timeout: 0 });
    });

    expect(titles()).toEqual(['Third', 'Second', 'First']);
  });

  /*
   * Past the limit the oldest are queued, not discarded: hidden and inert
   * while the ones ahead of them are up, and back as soon as one of those
   * closes.
   */
  it('queues toasts past the limit, and releases them as others close', async () => {
    const { api } = mount({ limit: 2 });
    await screen.findByRole('region');

    let newest = '';
    act(() => {
      api().show({ title: 'First', timeout: 0 });
      api().show({ title: 'Second', timeout: 0 });
      newest = api().show({ title: 'Third', timeout: 0 });
    });

    const oldest = toasts()[2];
    expect(oldest.hasAttribute('data-limited')).toBe(true);
    expect(oldest.hasAttribute('inert')).toBe(true);
    expect(oldest.className).toContain('data-[limited]:hidden');

    act(() => {
      api().dismiss(newest);
    });

    await waitFor(() => expect(titles()).toEqual(['Second', 'First']));
    expect(toasts()[1].hasAttribute('data-limited')).toBe(false);
  });

  it('updates a toast in place when shown again with the same id', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ id: 'save', title: 'Saving', timeout: 0 });
    });
    act(() => {
      api().show({ id: 'save', intent: 'success', title: 'Saved', timeout: 0 });
    });

    expect(titles()).toEqual(['Saved']);
    expect(toasts()[0].getAttribute('data-intent')).toBe('success');
  });
});

describe('Toast — dismissal', () => {
  it('closes on its dismiss control, and reports it', async () => {
    const onClose = vi.fn();
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Copied', timeout: 0, onClose });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape while focus is inside it', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Copied', timeout: 0 });
    });
    const [item] = toasts();
    act(() => item.focus());
    fireEvent.keyDown(item, { key: 'Escape' });

    await waitFor(() => expect(toasts()).toHaveLength(0));
  });

  it('dismisses everything when `dismiss` is called with no id', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'One', timeout: 0 });
      api().show({ title: 'Two', timeout: 0 });
    });
    act(() => {
      api().dismiss();
    });

    await waitFor(() => expect(toasts()).toHaveLength(0));
  });
});

describe('Toast — the lifetime', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('expires after its timeout, and not before', async () => {
    const onClose = vi.fn();
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Saved', timeout: 4000, onClose });
    });

    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(toasts()).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('expires on the default lifetime when none is given', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Saved' });
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_TIMEOUT - 100);
    });
    expect(toasts()).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    await waitFor(() => expect(toasts()).toHaveLength(0));
  });

  /*
   * The pointer half of "must not auto-dismiss out from under the pointer":
   * hovering the stack stops every clock, and leaving it restarts them with
   * the time that was left rather than a fresh lifetime.
   */
  it('pauses while the pointer is over the stack', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Saved', timeout: 4000 });
    });
    fireEvent.mouseEnter(region());

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(toasts()).toHaveLength(1);

    fireEvent.mouseLeave(region());
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    await waitFor(() => expect(toasts()).toHaveLength(0));
  });

  it('fires the action, and closes once it has', async () => {
    const onClick = vi.fn();
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Deleted', action: { label: 'UNDO', onClick } });
    });
    fireEvent.click(screen.getByRole('button', { name: /UNDO/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toasts()).toHaveLength(0));
  });

  it('does not expire at all when it carries an action, unless told to', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Deleted', action: { label: 'UNDO', onClick: vi.fn() } });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(toasts()).toHaveLength(1);
  });

  /*
   * The keyboard half. An action toast given an explicit lifetime still may
   * not expire while its action has focus — that is the moment someone is
   * about to press it — and resumes once focus leaves the stack.
   */
  it('does not expire while its action is focused, and resumes after', async () => {
    const onClick = vi.fn();
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Deleted', timeout: 3000, action: { label: 'UNDO', onClick } });
    });
    const action = screen.getByRole('button', { name: /UNDO/ });
    act(() => action.focus());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(toasts()).toHaveLength(1);

    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('resumes once focus leaves the stack', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Deleted', timeout: 3000, action: { label: 'UNDO', onClick: vi.fn() } });
    });
    const action = screen.getByRole('button', { name: /UNDO/ });
    act(() => action.focus());
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(toasts()).toHaveLength(1);

    act(() => screen.getByRole('button', { name: 'Page control' }).focus());
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    await waitFor(() => expect(toasts()).toHaveLength(0));
  });
});

describe('Toast — keyboard', () => {
  /*
   * Reaching a toast without a mouse. F6 is the landmark shortcut: from
   * anywhere on the page it moves focus into the stack and stops the clocks,
   * and from there Tab walks the toasts and their controls in visual order.
   * jsdom has no native Tab, so the step into the first toast is driven
   * through the same focus guard a real Tab lands on.
   */
  it('moves focus into the stack on F6, then to the newest toast and its action', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Older', timeout: 0 });
      api().show({ title: 'Deleted', timeout: 0, action: { label: 'UNDO', onClick: vi.fn() } });
    });

    const page = screen.getByRole('button', { name: 'Page control' });
    act(() => page.focus());
    fireEvent.keyDown(window, { key: 'F6' });
    expect(document.activeElement).toBe(region());

    const guard = region().querySelector('[data-base-ui-focus-guard]') as HTMLElement;
    expect(guard).not.toBeNull();
    act(() => {
      fireEvent.focus(guard, { relatedTarget: region() });
    });
    expect(document.activeElement).toBe(toasts()[0]);
    expect(titles()[0]).toBe('Deleted');

    // Every toast, and every control in one, is in the tab sequence.
    for (const item of toasts()) expect(item.tabIndex).toBe(0);
    const action = screen.getByRole('button', { name: /UNDO/ });
    expect(action.tabIndex).toBe(0);
    expect(toasts()[0].contains(action)).toBe(true);
  });

  it('puts the action before the dismiss control, so Tab reaches it first', async () => {
    const { api } = mount();
    await screen.findByRole('region');

    act(() => {
      api().show({ title: 'Deleted', timeout: 0, action: { label: 'UNDO', onClick: vi.fn() } });
    });

    const buttons = Array.from(toasts()[0].querySelectorAll('button'));
    expect(buttons.map((b) => b.getAttribute('data-slot'))).toEqual(['toast-action', 'toast-close']);
  });
});

describe('Toast — motion', () => {
  /*
   * Reduced motion: no slide, no fade, still announced. jsdom evaluates no
   * media queries, so the first half is asserted where it lives — the
   * `motion-reduce` clause in the recipe — and the second by showing a toast
   * with `prefers-reduced-motion` reporting `reduce` and finding it in the
   * polite region all the same.
   */
  it('transitions in and out, and not at all under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const { api } = mount();
      await screen.findByRole('region');
      act(() => {
        api().show({ title: 'Saved', timeout: 0 });
      });

      const [item] = toasts();
      expect(item.className).toContain('data-[starting-style]:opacity-0');
      expect(item.className).toContain('data-[starting-style]:translate-y-2');
      expect(item.className).toContain('data-[ending-style]:opacity-0');
      expect(item.className).toContain('duration-quick');
      expect(item.className).toContain('ease-brutalist');
      expect(item.className).toContain('motion-reduce:transition-none');
      expect(region().contains(item)).toBe(true);
      expect(region().getAttribute('aria-live')).toBe('polite');
    } finally {
      window.matchMedia = original;
    }
  });

  it('takes its stacking value from the layer scale', async () => {
    mount();
    const live = await screen.findByRole('region');
    expect(live.className).toContain('z-top');
    expect(live.className).not.toMatch(/\bz-\d/);
  });

  it('merges a caller className into the region', async () => {
    mount({ className: 'bottom-8' });
    const live = await screen.findByRole('region');
    expect(live.className).toContain('bottom-8');
    expect(live.className).not.toContain('bottom-4');
  });
});

describe('useToast', () => {
  it('throws outside a provider', () => {
    function Orphan() {
      useToast();
      return null;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });

  it('has an optional form that returns null outside a provider', () => {
    let seen: ToastApi | null | undefined;
    function Probe() {
      const api = useOptionalToast();
      useEffect(() => {
        seen = api;
      }, [api]);
      return null;
    }
    render(<Probe />);
    expect(seen).toBeNull();
  });
});

describe('resolveLifetime', () => {
  it('takes an explicit timeout as given, including 0', () => {
    expect(resolveLifetime({ title: 'x', timeout: 1234 }, DEFAULT_TIMEOUT)).toBe(1234);
    expect(resolveLifetime({ title: 'x', timeout: 0 }, DEFAULT_TIMEOUT)).toBe(0);
  });

  it('persists a toast with an action unless told otherwise', () => {
    expect(resolveLifetime({ title: 'x', action: {} }, DEFAULT_TIMEOUT)).toBe(0);
    expect(resolveLifetime({ title: 'x', action: {}, timeout: 8000 }, DEFAULT_TIMEOUT)).toBe(8000);
  });

  it('persists everything when the provider says 0', () => {
    expect(resolveLifetime({ title: 'x' }, 0)).toBe(0);
  });

  it('uses the provider default for short text', () => {
    expect(resolveLifetime({ title: 'Saved', description: 'Draft saved.' }, DEFAULT_TIMEOUT)).toBe(
      DEFAULT_TIMEOUT,
    );
  });

  it('raises the lifetime to the reading time of long text', () => {
    const description = Array.from({ length: 30 }, () => 'word').join(' ');
    expect(resolveLifetime({ title: 'Two words', description }, DEFAULT_TIMEOUT)).toBe(
      NOTICE_MS + 32 * MS_PER_WORD,
    );
  });

  it('counts nothing for a description that is not text', () => {
    expect(resolveLifetime({ title: 'Saved', description: { node: true } }, 1000)).toBe(
      NOTICE_MS + 1 * MS_PER_WORD,
    );
  });
});
