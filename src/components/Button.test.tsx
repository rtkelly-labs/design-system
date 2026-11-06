import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
