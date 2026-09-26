import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title bracketed, in the system’s voice', () => {
    render(<EmptyState title="No results" />);

    expect(screen.getByText('[ No results ]')).toBeDefined();
  });

  // Every slot but the title is optional, because the two empties — a filter
  // that matched nothing and an application with nothing in it — need
  // different parts of the component.
  it('renders nothing for the slots it is not given', () => {
    const { container } = render(<EmptyState title="No results" />);

    expect(container.querySelector('[data-slot="empty-state-icon"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-state-description"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-state-action"]')).toBeNull();
  });

  it('renders the icon, description, children and action when given them', () => {
    render(
      <EmptyState
        icon={<span data-testid="glyph">[/]</span>}
        title="Nothing here yet"
        description="Create a rule to see it listed."
        action={<Button variant="primary">NEW RULE</Button>}
      >
        <p data-testid="hint">Or import an existing set.</p>
      </EmptyState>,
    );

    expect(screen.getByTestId('glyph')).toBeDefined();
    expect(screen.getByText('Create a rule to see it listed.')).toBeDefined();
    expect(screen.getByTestId('hint')).toBeDefined();
    expect(screen.getByRole('button', { name: 'NEW RULE' })).toBeDefined();
  });

  /*
   * The description takes nodes, so it cannot be a `<p>`: a block element
   * inside a paragraph is invalid HTML that the parser repairs by closing the
   * paragraph early, which moves the rest of the description out of the box.
   */
  it('keeps block content inside the description slot', () => {
    const { container } = render(
      <EmptyState
        title="No results"
        description={
          <ul>
            <li>Try a shorter query</li>
          </ul>
        }
      />,
    );

    const description = container.querySelector('[data-slot="empty-state-description"]');

    expect(description?.querySelector('li')?.textContent).toBe('Try a shorter query');
  });

  // The component cannot know the right heading level for a card body, a table
  // and a dialog, and a wrong one breaks the outline a screen reader user
  // navigates by.
  it('does not invent a heading level', () => {
    render(<EmptyState title="No results" />);

    expect(screen.queryByRole('heading')).toBeNull();
  });

  // Where the caller does know — the empty state is the section, or the page —
  // `headingLevel` says so, and the title is that heading.
  it('renders the title as a heading at the level it is given', () => {
    render(<EmptyState title="Page not found" headingLevel={1} />);

    expect(screen.getByRole('heading', { level: 1, name: '[ Page not found ]' })).toBeDefined();
  });

  it('forwards its ref and spreads unrecognised props onto the box', () => {
    const ref = createRef<HTMLDivElement>();
    render(<EmptyState ref={ref} title="No results" data-testid="empty" />);

    expect(ref.current?.dataset.slot).toBe('empty-state');
    expect(screen.getByTestId('empty')).toBeDefined();
  });

  it('merges a caller className onto the box', () => {
    render(<EmptyState title="No results" className="bg-surface-base" data-testid="empty" />);

    const box = screen.getByTestId('empty');

    expect(box.className).toContain('bg-surface-base');
    expect(box.className).not.toContain('bg-surface-raised');
  });
});
