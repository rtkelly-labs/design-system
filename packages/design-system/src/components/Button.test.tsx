import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

/**
 * The element, not the styling, is what this component decides.
 *
 * Its own documentation makes the case: "a control that *navigates* must be an
 * `<a>`, or it loses middle-click, open-in-new-tab, the status-bar URL preview,
 * and its announcement as a link to a screen reader". `href` is what selects
 * that, and nothing asserted it.
 */
describe('Button', () => {
  it('renders a button by default', () => {
    render(<Button>SAVE</Button>);
    expect(screen.getByRole('button', { name: 'SAVE' })).toBeDefined();
  });

  it('renders an anchor when given an href, because navigation is a link', () => {
    render(<Button href="/pricing">SEE PRICING</Button>);
    const link = screen.getByRole('link', { name: 'SEE PRICING' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/pricing');
  });

  /**
   * A `target="_blank"` document can reach back through `window.opener`. Modern
   * browsers imply `noopener`, but not every renderer this package ships into is
   * a modern browser — the component says so, and this holds it to it.
   */
  it('adds rel=noopener noreferrer to a new-tab link', () => {
    render(
      <Button href="https://example.com" target="_blank">
        EXTERNAL
      </Button>,
    );
    expect(screen.getByRole('link').getAttribute('rel')).toBe('noopener noreferrer');
  });

  it("lets a caller's explicit rel win", () => {
    render(
      <Button href="https://example.com" target="_blank" rel="me">
        MINE
      </Button>,
    );
    expect(screen.getByRole('link').getAttribute('rel')).toBe('me');
  });

  it('does not add a rel to a same-tab link', () => {
    render(<Button href="/docs">DOCS</Button>);
    expect(screen.getByRole('link').getAttribute('rel')).toBeNull();
  });

  it('merges a caller className rather than appending it', () => {
    render(<Button className="mt-4">SAVE</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('mt-4');
    expect(cls).toContain('border-2');
  });

  it('brackets its label without changing the accessible name', () => {
    render(<Button bracketed>SUBMIT</Button>);
    expect(screen.getByRole('button', { name: 'SUBMIT' })).toBeDefined();
  });

  it('forwards its ref to the button', () => {
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(<Button ref={ref}>SAVE</Button>);
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('forwards its ref to the anchor when it renders one', () => {
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <Button ref={ref} href="/x">
        GO
      </Button>,
    );
    expect(ref.current?.tagName).toBe('A');
  });

  it('forwards arbitrary button attributes', () => {
    render(
      <Button type="submit" disabled>
        SAVE
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.disabled).toBe(true);
  });

  // #252: a pending submit rendered exactly like a pressable one.
  it('carries a disabled treatment, and gates the press affordance on being enabled', () => {
    render(<Button disabled>SAVE</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('disabled:bg-surface-sunken');
    expect(cls).toContain('disabled:text-content-muted');
    expect(cls).toContain('disabled:shadow-none');
    expect(cls).toContain('not-disabled:not-aria-disabled:hover:shadow-hard-lg');
    expect(cls).not.toMatch(/(^|\s)hover:shadow-hard-lg/);
  });
});

/**
 * #303 disabled its submits while a request was in flight, and `disabled` on a
 * focused button drops focus to `<body>`. `pending` is the replacement: still
 * focusable, `aria-disabled`, and deaf to activation. The keyboard half — Enter
 * and Space on the button, Enter in a field — is a real browser's to prove,
 * because jsdom does not turn a keypress into a click; `tests/a11y.spec.ts`
 * drives it through the account flows. What jsdom can prove is that the click
 * every one of those becomes is cancelled.
 */
describe('Button — pending', () => {
  it('reports aria-disabled rather than the disabled attribute, and keeps its tab stop', () => {
    render(<Button pending>SAVE</Button>);
    const button = screen.getByRole('button', { name: 'SAVE' }) as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.tabIndex).toBe(0);
    expect(button.hasAttribute('data-pending')).toBe(true);
  });

  it('keeps focus when it turns pending', () => {
    const { rerender } = render(<Button pending={false}>SAVE</Button>);
    const button = screen.getByRole('button', { name: 'SAVE' });
    button.focus();
    rerender(<Button pending>SAVE</Button>);
    expect(screen.getByRole('button', { name: 'SAVE' })).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it('does not run onClick while pending, and does again once it is not', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button pending onClick={onClick}>
        SAVE
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button pending={false} onClick={onClick}>
        SAVE
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not submit its form while pending', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" pending={false}>
          SAVE
        </Button>
      </form>,
    );
    screen.getByRole('button').click();
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit" pending>
          SAVE
        </Button>
      </form>,
    );
    screen.getByRole('button').click();
    screen.getByRole('button').click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps its accessible name, with the spinner hidden from assistive technology', () => {
    render(
      <Button pending bracketed>
        SAVE
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'SAVE' });
    const spinner = button.querySelector('[data-slot="spinner"]');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(spinner?.hasAttribute('role')).toBe(false);
  });

  it('announces pendingLabel through a status region that exists before it is filled', () => {
    const { rerender } = render(
      <Button pending={false} pendingLabel="Saving your changes">
        SAVE
      </Button>,
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    expect(status.className).toContain('sr-only');

    rerender(
      <Button pending pendingLabel="Saving your changes">
        SAVE
      </Button>,
    );
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('Saving your changes');
  });

  it('adds no status region to a button that never passes pending', () => {
    render(<Button>SAVE</Button>);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('lets disabled win when both are set', () => {
    render(
      <Button disabled pending>
        SAVE
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('data-pending')).toBe(false);
  });

  it('is held in its press, not wearing the disabled treatment', () => {
    render(<Button pending>SAVE</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('translate-x-1');
    expect(cls).toContain('shadow-none');
    expect(cls).toContain('cursor-progress');
    expect(cls).not.toMatch(/(^|\s)shadow-hard-md(\s|$)/);
  });

  it('is not offered on the anchor form', () => {
    // @ts-expect-error `pending` is `never` when `href` is given.
    render(<Button href="/x" pending>GO</Button>);
    const link = screen.getByRole('link');
    expect(link.hasAttribute('pending')).toBe(false);
    expect(link.hasAttribute('aria-disabled')).toBe(false);
  });
});
