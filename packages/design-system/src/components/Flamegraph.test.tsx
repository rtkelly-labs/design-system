import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildFlame } from '../lib/flame';
import { Flamegraph } from './Flamegraph';

const profile = buildFlame('main;handle;parse 30\nmain;handle;render 50\nmain;gc 20');
const frame = (name: RegExp) => screen.getByRole('treeitem', { name });

describe('Flamegraph', () => {
  it('renders a tree of frames described in words, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Flamegraph ref={ref} profile={profile} />);
    expect(ref.current?.getAttribute('data-slot')).toBe('flamegraph');
    const tree = screen.getByRole('tree', { name: 'Flame graph' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(6);
    expect(frame(/^render,/).getAttribute('aria-label')).toBe('render, total 50 samples, 50% of all, self 50 samples');
    expect(frame(/^parse,/).getAttribute('aria-level')).toBe('4');
  });

  it('renders meaningfully as static markup, with native tooltips and no script', () => {
    const html = renderToStaticMarkup(<Flamegraph profile={profile} defaultZoomedId="main;handle" />);
    expect(html).toContain('data-slot="flamegraph-chart"');
    expect(html).toContain('<title>parse, total 30 samples, 30% of all, self 30 samples</title>');
    expect(html).toContain('aria-current="location"');
    expect(html).not.toContain('data-slot="flamegraph-tooltip"');
  });

  it('zooms on click and on Enter, and back out from the breadcrumb and Escape', () => {
    const onZoomedChange = vi.fn();
    render(<Flamegraph profile={profile} onZoomedChange={onZoomedChange} />);
    fireEvent.click(frame(/^handle,/));
    expect(onZoomedChange).toHaveBeenLastCalledWith('main;handle');
    expect(screen.queryByRole('treeitem', { name: /^gc,/ })).toBeNull();
    const crumbs = screen.getByRole('navigation', { name: 'Zoom path' });
    fireEvent.click(within(crumbs).getByRole('button', { name: 'main' }));
    expect(onZoomedChange).toHaveBeenLastCalledWith('main');
    fireEvent.keyDown(frame(/^main,/), { key: 'Escape' });
    expect(onZoomedChange).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(frame(/^gc,/), { key: 'Enter' });
    expect(onZoomedChange).toHaveBeenLastCalledWith('main;gc');
  });

  it('moves a single tab stop with the arrow keys, following the orientation', () => {
    render(<Flamegraph profile={profile} />);
    const root = frame(/^all,/);
    expect(root.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(root, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(frame(/^main,/));
    fireEvent.keyDown(frame(/^main,/), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(frame(/^gc,/));
    fireEvent.keyDown(frame(/^gc,/), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(frame(/^handle,/));
    fireEvent.keyDown(frame(/^handle,/), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(frame(/^main,/));
    expect(screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('flips vertical keys in icicle orientation', () => {
    render(<Flamegraph profile={profile} orientation="icicle" />);
    fireEvent.keyDown(frame(/^all,/), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(frame(/^main,/));
  });

  it('highlights search matches and reports their share', () => {
    render(<Flamegraph profile={profile} search="PAR" />);
    expect(frame(/^parse,/).getAttribute('data-match')).toBe('true');
    expect(frame(/^render,/).getAttribute('data-match')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('“PAR” matches 1 frame: 30 samples, 30% of all.');
  });

  it('paints a diff by tone, lists removed frames, and refuses incomparable profiles', () => {
    const baseline = buildFlame('main;handle;parse 30\nmain;handle;render 50\nmain;gc 20\nmain;legacy 5');
    const candidate = buildFlame('main;handle;parse 40\nmain;handle;render 50\nmain;gc 20\nmain;audit 6');
    const { unmount } = render(<Flamegraph profile={candidate} baseline={baseline} mode="diff" />);
    expect(frame(/^parse,/).getAttribute('data-tone')).toBe('grew-large');
    expect(frame(/^parse,/).getAttribute('aria-label')).toContain('self +10 samples (+33.3%) against the baseline');
    expect(frame(/^audit,/).getAttribute('data-tone')).toBe('new');
    expect(frame(/^render,/).getAttribute('data-tone')).toBe('same');
    expect(screen.getByRole('list', { name: 'Colour key' })).toBeTruthy();
    expect(screen.getByText(/gone from the candidate/).textContent).toContain('legacy (5 samples)');
    unmount();
    render(<Flamegraph profile={buildFlame('a 1', { unit: 'ms' })} baseline={baseline} mode="diff" />);
    expect(screen.getByText(/cannot be compared/)).toBeTruthy();
  });

  it('lists the hottest frames, and a row zooms the graph and opens the details panel', () => {
    const onZoomedChange = vi.fn();
    render(<Flamegraph profile={profile} list="always" onZoomedChange={onZoomedChange} />);
    const list = screen.getByRole('region', { name: 'Hottest frames' });
    const rows = within(list).getAllByRole('button');
    expect(rows.map((row) => row.textContent?.split('self')[0])).toEqual(['render', 'parse', 'gc']);
    fireEvent.click(rows[1]);
    expect(onZoomedChange).toHaveBeenLastCalledWith('main;handle;parse');
    expect(rows[1].getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('region', { name: 'Frame details' }).textContent).toContain('self 30 samples · 30%');
    expect(screen.getByRole('navigation', { name: 'Zoom path' })).toBeTruthy();
  });

  it('keeps the list in the markup for a narrow container by default, and leaves it out with never', () => {
    const { container, rerender } = render(<Flamegraph profile={profile} />);
    expect(container.querySelector('[data-slot="flamegraph-list"]')?.className).toContain('@max-[560px]:flex');
    rerender(<Flamegraph profile={profile} list="never" />);
    expect(container.querySelector('[data-slot="flamegraph-list"]')).toBeNull();
  });

  it('ranks a diff by change, removed frames included, with the delta on each row', () => {
    const baseline = buildFlame('main;handle;parse 30\nmain;handle;render 50\nmain;legacy 5');
    const candidate = buildFlame('main;handle;parse 40\nmain;handle;render 50\nmain;audit 6');
    render(<Flamegraph profile={candidate} baseline={baseline} mode="diff" list="always" />);
    const items = within(screen.getByRole('region', { name: 'Largest changes' })).getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-frame-id'))).toEqual(['main;handle;parse', 'main;audit', 'main;legacy']);
    expect(items[0].textContent).toContain('self +10 samples (+33.3%)');
    expect(items[2].textContent).toContain('removed · was 5 samples');
    expect(within(items[2]).queryByRole('button')).toBeNull();
  });

  it('adapts a default orientation in a narrow container without script, and honours an explicit one', () => {
    const wide = buildFlame('main;Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke 90\nmain;gc 10');
    const html = renderToStaticMarkup(<Flamegraph profile={wide} />);
    expect(html).toContain('@max-[560px]:-scale-y-100');
    // A label that fits at 960px but not on a phone gets a narrow stand-in.
    expect(html).toContain('>Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke</text>');
    expect(html).toMatch(/hidden @max-\[560px\]:inline[^>]*>Microsoft\.AspNetCore\.Routing\.EndpointMid[^<]*…<\/text>/);
    expect(renderToStaticMarkup(<Flamegraph profile={wide} orientation="flame" />)).not.toContain('-scale-y-100');
  });

  it('says so when there is nothing to draw', () => {
    render(<Flamegraph profile={buildFlame([])} />);
    expect(screen.getByText('No samples to display.')).toBeTruthy();
  });
});
