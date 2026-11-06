import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

const card = (className: string) => className.split(/\s+/);

describe('StatCard', () => {
  it('renders the title bracketed and the value plainly', () => {
    render(<StatCard title="Revenue" value="$4,280" />);

    expect(screen.getByText('[ Revenue ]')).toBeDefined();
    expect(screen.getByText('$4,280')).toBeDefined();
  });

  it('accepts a numeric value', () => {
    render(<StatCard title="Users" value={1234} />);

    expect(screen.getByText('1234')).toBeDefined();
  });

  it('omits the change and subtitle when not given', () => {
    const { container } = render(<StatCard title="Users" value={1} />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('renders the subtitle with a prompt marker', () => {
    render(<StatCard title="Users" value={1} subtitle="since Tuesday" />);

    expect(screen.getByText('> since Tuesday')).toBeDefined();
  });

  it('renders an icon when supplied, and passes it a className', () => {
    const Icon = ({ className }: { className?: string }) => (
      <svg data-testid="icon" className={className} />
    );
    render(<StatCard title="Users" value={1} icon={Icon} accent="danger" />);

    expect(screen.getByTestId('icon').getAttribute('class')).toContain('text-intent-danger');
  });

  // A change is communicated meaning, so it reads from the intent roles rather
  // than from the card's accent.
  it.each([
    ['positive', 'text-intent-success'],
    ['negative', 'text-intent-danger'],
    ['neutral', 'text-content-muted'],
  ] as const)('colours a %s change with %s', (changeType, expected) => {
    render(<StatCard title="Users" value={1} change="+12%" changeType={changeType} />);

    expect(screen.getByText('+12%').className).toContain(expected);
  });

  it('defaults an unspecified change to positive', () => {
    render(<StatCard title="Users" value={1} change="+12%" />);

    expect(screen.getByText('+12%').className).toContain('text-intent-success');
  });

  it('keeps the change intent independent of the card accent', () => {
    render(<StatCard title="Users" value={1} change="+12%" accent="danger" />);

    expect(screen.getByText('+12%').className).toContain('text-intent-success');
  });

  it('drives the hover edge from the accent', () => {
    const { container } = render(<StatCard title="Users" value={1} accent="warning" />);
    const classes = card(container.firstElementChild?.className ?? '');

    expect(classes).toContain('hover:border-intent-warning');
    expect(classes).toContain('hover:shadow-hard-intent-warning');
  });

  it('defaults to the primary accent', () => {
    const { container } = render(<StatCard title="Users" value={1} />);

    expect(container.firstElementChild?.className).toContain('hover:border-accent-primary');
  });

  it('renders a legacy accent identically to its semantic name', () => {
    const legacy = render(<StatCard title="U" value={1} accent="tertiary" />);
    const semantic = render(<StatCard title="U" value={1} accent="tertiary" />);

    expect(legacy.container.innerHTML).toBe(semantic.container.innerHTML);
  });

  it('appends a caller className without dropping its own', () => {
    const { container } = render(<StatCard title="U" value={1} className="col-span-2" />);
    const classes = card(container.firstElementChild?.className ?? '');

    expect(classes).toContain('col-span-2');
    expect(classes).toContain('border-edge-strong');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN = /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <StatCard title="U" value={1} change="+1" subtitle="s" accent="success" />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      expect(node.className, `${node.tagName} pins a palette entry`).not.toMatch(FORBIDDEN);
    }
  });
});
