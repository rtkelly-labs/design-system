import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import { InlineAction } from './InlineAction';
import { LinkProvider } from './LinkProvider';
import type { LinkComponentProps } from './LinkProvider';

/**
 * What this component decides is the element: a `<button>` that runs a
 * handler, or a link that navigates. The look is the same either way, so the
 * tests are about which one a reader and a keyboard get.
 */
describe('InlineAction', () => {
  it('renders a button that runs onClick', () => {
    const onClick = vi.fn();
    render(<InlineAction onClick={onClick}>view output</InlineAction>);
    const button = screen.getByRole('button', { name: 'view output' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /** A bare `<button>` in a form submits it; an inline action acts on its row. */
  it('is type="button" so it does not submit an enclosing form', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <InlineAction>retry</InlineAction>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'retry' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets the caller ask for a submit', () => {
    render(<InlineAction type="submit">send</InlineAction>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('renders a link when given an href', () => {
    render(<InlineAction href="/runs/42">open run</InlineAction>);
    const link = screen.getByRole('link', { name: 'open run' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/runs/42');
  });

  it('routes an internal href through the LinkProvider component', () => {
    function RouterLink({ children, ...props }: LinkComponentProps) {
      return (
        <a {...props} data-router="">
          {children}
        </a>
      );
    }
    render(
      <LinkProvider component={RouterLink}>
        <InlineAction href="/runs/42">open run</InlineAction>
      </LinkProvider>,
    );
    expect(screen.getByRole('link').hasAttribute('data-router')).toBe(true);
  });

  it('carries data-slot="inline-action" on both forms', () => {
    render(
      <>
        <InlineAction>act</InlineAction>
        <InlineAction href="/go">go</InlineAction>
      </>,
    );
    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('inline-action');
    expect(screen.getByRole('link').getAttribute('data-slot')).toBe('inline-action');
  });

  it('forwards its ref to whichever element it renders', () => {
    const buttonRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    const linkRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <>
        <InlineAction ref={buttonRef}>act</InlineAction>
        <InlineAction ref={linkRef} href="/go">
          go
        </InlineAction>
      </>,
    );
    expect(buttonRef.current?.tagName).toBe('BUTTON');
    expect(linkRef.current?.tagName).toBe('A');
  });

  it('is disabled with the native attribute, and does not run onClick', () => {
    const onClick = vi.fn();
    render(
      <InlineAction disabled onClick={onClick}>
        retry
      </InlineAction>,
    );
    const button = screen.getByRole('button', { name: 'retry' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('addresses colour by role, and quiet swaps the ink', () => {
    render(
      <>
        <InlineAction>loud</InlineAction>
        <InlineAction tone="quiet">soft</InlineAction>
      </>,
    );
    expect(screen.getByRole('button', { name: 'loud' }).className).toContain('text-accent-primary');
    const quiet = screen.getByRole('button', { name: 'soft' }).className;
    expect(quiet).toContain('text-content-secondary');
    expect(quiet).not.toContain('text-accent-primary');
  });

  it("merges the caller's className", () => {
    render(<InlineAction className="font-mono">id</InlineAction>);
    const className = screen.getByRole('button').className;
    expect(className).toContain('font-mono');
    expect(className).toContain('underline');
  });

  it('works as a DataTable cell', () => {
    const onOpen = vi.fn();
    const rows = [{ id: 'run-1' }, { id: 'run-2' }];
    render(
      <DataTable
        caption="Runs"
        data={rows}
        keyExtractor={(row) => row.id}
        columns={[
          { header: 'RUN', accessor: 'id' },
          {
            header: 'OUTPUT',
            accessor: (row) => <InlineAction onClick={() => onOpen(row.id)}>view output</InlineAction>,
          },
        ]}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: 'view output' });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]!);
    expect(onOpen).toHaveBeenCalledWith('run-2');
  });
});
