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

  it('fits a frame on Enter, and back out from the breadcrumb and Escape', () => {
    const onZoomedChange = vi.fn();
    const onWindowChange = vi.fn();
    render(<Flamegraph profile={profile} onZoomedChange={onZoomedChange} onWindowChange={onWindowChange} />);
    fireEvent.keyDown(frame(/^handle,/), { key: 'Enter' });
    expect(onZoomedChange).toHaveBeenLastCalledWith('main;handle');
    expect(onWindowChange.mock.lastCall?.[0]).toMatchObject({ start: 0.2, end: 1 });
    expect(screen.queryByRole('treeitem', { name: /^gc,/ })).toBeNull();
    expect(frame(/^handle,/).getAttribute('aria-selected')).toBe('true');
    const crumbs = screen.getByRole('navigation', { name: 'Zoom path' });
    fireEvent.click(within(crumbs).getByRole('button', { name: 'main' }));
    expect(onZoomedChange).toHaveBeenLastCalledWith('main');
    fireEvent.keyDown(frame(/^main,/), { key: 'Escape' });
    expect(onZoomedChange).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(frame(/^gc,/), { key: 'Enter' });
    expect(onZoomedChange).toHaveBeenLastCalledWith('main;gc');
  });

  it('selects on click — the frame outlined and its stack kept, the rest dimmed — and clears on a second click', () => {
    const onSelectedChange = vi.fn();
    render(<Flamegraph profile={profile} onSelectedChange={onSelectedChange} />);
    fireEvent.click(frame(/^parse,/));
    expect(onSelectedChange).toHaveBeenLastCalledWith('main;handle;parse');
    expect(frame(/^parse,/).getAttribute('aria-selected')).toBe('true');
    expect(frame(/^handle,/).getAttribute('class')).not.toContain('opacity-30');
    expect(frame(/^render,/).getAttribute('class')).toContain('opacity-30');
    expect(frame(/^gc,/).getAttribute('class')).toContain('opacity-30');
    const details = screen.getByRole('region', { name: 'Frame details' });
    expect(details.getAttribute('aria-live')).toBe('polite');
    expect(details.textContent).toContain('self 30 samples · 30%');
    // Selecting does not zoom; the panel offers it.
    expect(screen.queryByRole('navigation', { name: 'Zoom path' })).toBeNull();
    fireEvent.click(within(details).getByRole('button', { name: 'Zoom to frame' }));
    expect(screen.getByRole('navigation', { name: 'Zoom path' })).toBeTruthy();
    fireEvent.click(frame(/^parse,/));
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('region', { name: 'Frame details' })).toBeNull();
  });

  it('zooms and resets from the controls and keys, back to the default window rather than the whole profile', () => {
    const { container } = render(<Flamegraph profile={profile} defaultWindow={[0.2, 0.6]} />);
    const root = container.querySelector('[data-slot="flamegraph"]')!;
    expect(root.getAttribute('data-window')).toBe('0.2000 0.6000');
    expect(container.querySelector('[data-slot="minimap"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(root.getAttribute('data-window')).toBe('0.3000 0.5000');
    fireEvent.click(screen.getByRole('button', { name: 'Fit all' }));
    expect(root.getAttribute('data-window')).toBe('0.0000 1.0000');
    expect(container.querySelector('[data-slot="minimap"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(root.getAttribute('data-window')).toBe('0.2000 0.6000');
    fireEvent.keyDown(frame(/^all,/), { key: '-' });
    expect(root.getAttribute('data-window')).toBe('0.0000 0.8000');
    fireEvent.keyDown(frame(/^all,/), { key: '0' });
    expect(root.getAttribute('data-window')).toBe('0.2000 0.6000');
  });

  it('hides levels outside the depth window behind markers that pan to them', () => {
    const { container } = render(<Flamegraph profile={profile} orientation="flame" defaultDepth={[1, 2]} />);
    expect(screen.queryByRole('treeitem', { name: /^all,/ })).toBeNull();
    expect(screen.queryByRole('treeitem', { name: /^parse,/ })).toBeNull();
    const deeper = screen.getByRole('button', { name: /1 level hidden deeper/ });
    expect(deeper.textContent).toBe('▲ 1 level');
    expect(screen.getByRole('button', { name: /1 level hidden shallower/ }).textContent).toBe('▼ 1 level');
    fireEvent.click(deeper);
    expect(container.querySelector('[data-slot="flamegraph"]')!.getAttribute('data-depth')).toBe('2 3');
    expect(frame(/^parse,/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'More levels' })[0]);
    expect(container.querySelector('[data-slot="flamegraph"]')!.getAttribute('data-depth')).toBe('0 3');
  });

  it('renders a pre-zoomed, clipped window statically', () => {
    const html = renderToStaticMarkup(<Flamegraph profile={profile} defaultWindow={[0.1, 0.6]} defaultSelectedId="main;handle;parse" />);
    expect(html).toMatch(/data-frame-id="main;gc"[^>]*data-clipped="true"/);
    expect(html).toContain('data-slot="minimap"');
    expect(html).toContain('aria-selected="true"');
    expect(html).not.toContain('data-slot="flamegraph-controls"');
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
    expect(screen.getAllByRole('list', { name: 'Colour key' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/gone from the candidate/).textContent).toContain('legacy (5 samples)');
    unmount();
    render(<Flamegraph profile={buildFlame('a 1', { unit: 'ms' })} baseline={baseline} mode="diff" />);
    expect(screen.getByText(/cannot be compared/)).toBeTruthy();
  });

  it('lists the hottest frames, and a row selects its frame and opens the details panel', () => {
    const onSelectedChange = vi.fn();
    render(<Flamegraph profile={profile} list="always" onSelectedChange={onSelectedChange} />);
    const list = screen.getByRole('region', { name: 'Hottest frames' });
    const rows = within(list).getAllByRole('button');
    expect(rows.map((row) => row.textContent?.split('self')[0])).toEqual(['render', 'parse', 'gc']);
    fireEvent.click(rows[1]);
    expect(onSelectedChange).toHaveBeenLastCalledWith('main;handle;parse');
    expect(rows[1].getAttribute('aria-current')).toBe('true');
    expect(frame(/^parse,/).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('region', { name: 'Frame details' }).textContent).toContain('self 30 samples · 30%');
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

  it('draws a flame — root at the bottom — at every width, with labels hidden in a narrow container without script', () => {
    const wide = buildFlame('main;Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke 90\nmain;gc 10');
    const html = renderToStaticMarkup(<Flamegraph profile={wide} />);
    expect(html).toContain('data-orientation="flame"');
    expect(html).not.toContain('-scale-y-100');
    // Narrow, the overview is bars only: every label is hidden by the container query.
    expect(html).toMatch(/@max-\[560px\]:hidden[^>]*>Microsoft\.AspNetCore\.Routing\.EndpointMiddleware\.Invoke<\/text>/);
    expect(html).not.toMatch(/<text(?![^>]*@max-\[560px\]:hidden)[^>]*>(?!total|self|Δ)/);
  });

  it('fills frames from the warm palette by default, and from the surfaces with palette="theme"', () => {
    const { container, rerender } = render(<Flamegraph profile={profile} />);
    const fill = () => container.querySelector('[data-frame-id="main;handle;parse"] rect')!.getAttribute('class')!;
    expect(fill()).toMatch(/fill-intent-danger|fill-intent-warning|color-mix\(in_oklch,var\(--color-intent-danger\)/);
    rerender(<Flamegraph profile={profile} palette="theme" />);
    expect(fill()).toContain('fill-surface-raised');
    rerender(<Flamegraph profile={profile} palette="package" />);
    expect(fill()).toContain('accent-quiet');
  });

  it('says so when there is nothing to draw', () => {
    render(<Flamegraph profile={buildFlame([])} />);
    expect(screen.getByText('No samples to display.')).toBeTruthy();
  });
});
