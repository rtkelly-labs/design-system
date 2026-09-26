import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { NotFoundPage, ServerErrorPage, StatusPage } from './StatusPage';

describe('StatusPage', () => {
  // One `<h1>`, and it says the state in words: a large code alone is not the
  // status to a screen reader or a search result.
  it('renders the title as the single h1, with the code as text above it', () => {
    render(<StatusPage code="503" title="Down for maintenance" />);

    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(1);
    expect(headings[0].tagName).toBe('H1');
    expect(headings[0].textContent).toBe('[ Down for maintenance ]');
    expect(screen.getByText('503')).toBeDefined();
  });

  it('renders no code slot when it is not given one', () => {
    const { container } = render(<StatusPage title="You are offline" />);

    expect(container.querySelector('[data-slot="status-page-code"]')).toBeNull();
  });

  // Inside the chrome the consumer's `<main>` is the landmark; a second one
  // nested in it would be two mains on one page.
  it('is a plain region by default, and the main landmark when standalone', () => {
    const { rerender } = render(<StatusPage title="Page not found" />);
    expect(screen.queryByRole('main')).toBeNull();

    rerender(<StatusPage title="Page not found" standalone id="main-content" />);
    expect(screen.getByRole('main').id).toBe('main-content');
  });

  it('renders the description, children and action', () => {
    render(
      <StatusPage
        title="Sign in to continue"
        description="This page is for signed-in members."
        action={<Button href="/login">SIGN IN</Button>}
      >
        <p>Reference: abc123</p>
      </StatusPage>,
    );

    expect(screen.getByText('This page is for signed-in members.')).toBeDefined();
    expect(screen.getByText('Reference: abc123')).toBeDefined();
    expect(screen.getByRole('link', { name: 'SIGN IN' }).getAttribute('href')).toBe('/login');
  });

  it('forwards its ref, spreads props and merges className on either root', () => {
    const div = createRef<HTMLElement>();
    const { rerender } = render(
      <StatusPage ref={div} title="Page not found" data-testid="page" className="pt-4" />,
    );
    expect(div.current?.tagName).toBe('DIV');
    expect(div.current?.dataset.slot).toBe('status-page');
    expect(screen.getByTestId('page').className).toContain('pt-4');

    const main = createRef<HTMLElement>();
    rerender(<StatusPage ref={main} standalone title="Page not found" />);
    expect(main.current?.tagName).toBe('MAIN');
  });
});

describe('NotFoundPage', () => {
  it('fills in the 404 copy and a link home', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { level: 1, name: '[ Page not found ]' })).toBeDefined();
    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByRole('link', { name: /GO HOME/ }).getAttribute('href')).toBe('/');
  });

  it('takes a different way home, or a different action altogether', () => {
    const { rerender } = render(<NotFoundPage homeHref="/docs" homeLabel="BACK TO DOCS" />);
    expect(screen.getByRole('link', { name: /BACK TO DOCS/ }).getAttribute('href')).toBe('/docs');

    rerender(<NotFoundPage action={<Button href="/search">SEARCH</Button>} />);
    expect(screen.queryByRole('link', { name: /GO HOME/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'SEARCH' })).toBeDefined();
  });

  it('forwards its ref', () => {
    const ref = createRef<HTMLElement>();
    render(<NotFoundPage ref={ref} />);
    expect(ref.current?.dataset.slot).toBe('status-page');
  });
});

describe('ServerErrorPage', () => {
  it('fills in the 500 copy and a link home', () => {
    render(<ServerErrorPage />);

    expect(screen.getByRole('heading', { level: 1, name: '[ Something went wrong ]' })).toBeDefined();
    expect(screen.getByText('500')).toBeDefined();
    expect(screen.getByRole('link', { name: /GO HOME/ })).toBeDefined();
  });

  it('stands in for the shell by default', () => {
    render(<ServerErrorPage />);
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('sits inside the consumer shell when standalone is false', () => {
    render(<ServerErrorPage standalone={false} />);
    expect(screen.queryByRole('main')).toBeNull();
  });

  it('overrides its copy', () => {
    render(<ServerErrorPage title="Payment service unavailable" code="502" />);
    expect(screen.getByRole('heading', { name: '[ Payment service unavailable ]' })).toBeDefined();
    expect(screen.getByText('502')).toBeDefined();
  });
});
