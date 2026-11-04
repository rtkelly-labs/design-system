import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LogEntry } from '../lib/logs';
import { LogViewer } from './LogViewer';
import { TimeRangeProvider, useTimeCursor } from './TimeRange';

const NOW = Date.UTC(2026, 9, 22, 14, 0);
const MIN = 60_000;

const entries: LogEntry[] = [
  { id: 'c', time: NOW - 2 * MIN, severity: 'error', message: 'payment timeout after 3000ms', service: 'payments', traceId: 'trace-1', spanId: 'span-9', fields: { route: '/pay', retry: 2, idempotent: true } },
  { id: 'a', time: NOW - 50 * MIN, severity: 'info', message: 'service started', service: 'web' },
  { id: 'b', time: NOW - 10 * MIN, severity: 'warn', message: 'slow query took 900ms', service: 'postgres' },
  { id: 'old', time: NOW - 3 * 60 * MIN, severity: 'debug', message: 'boot', service: 'web' },
];

const rowButtons = () => screen.getAllByRole('listitem').map((item) => item.querySelector('button') as HTMLButtonElement);
const rowIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="log-viewer-row"]'), (row) => row.querySelector('button')?.getAttribute('aria-label'));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LogViewer', () => {
  it('renders lines oldest first with slot, ref and spread props', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<LogViewer ref={ref} entries={entries} data-testid="logs" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('log-viewer');
    expect(screen.getByTestId('logs')).toBe(ref.current);
    expect(rowIds(container)).toEqual([
      'Oct 22 11:00:00.000 UTC, DEBUG, web, boot',
      'Oct 22 13:10:00.000 UTC, INFO, web, service started',
      'Oct 22 13:50:00.000 UTC, WARN, postgres, slow query took 900ms',
      'Oct 22 13:58:00.000 UTC, ERROR, payments, payment timeout after 3000ms',
    ]);
    expect(screen.getByRole('log').getAttribute('aria-live')).toBe('off');
    expect(container.querySelector('[data-slot="log-viewer-header"]')?.textContent).toContain('Service');
  });

  it('reverses with order="desc", hides the header and announces when asked', () => {
    const { container } = render(<LogViewer entries={entries} order="desc" showHeader={false} announce />);
    expect(rowIds(container)[0]).toContain('payment timeout');
    expect(container.querySelector('[data-slot="log-viewer-header"]')).toBeNull();
    expect(screen.getByRole('log').getAttribute('aria-live')).toBe('polite');
  });

  it('filters by severities', () => {
    const { container } = render(<LogViewer entries={entries} severities={['warn', 'error']} />);
    expect(rowIds(container)).toHaveLength(2);
  });

  it('expands a line to its fields, ids and a View trace button', () => {
    const onTraceSelect = vi.fn();
    render(<LogViewer entries={entries} onTraceSelect={onTraceSelect} />);
    const button = screen.getByRole('button', { name: /payment timeout/ });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const detail = document.getElementById(button.getAttribute('aria-controls') as string) as HTMLElement;
    expect(detail.textContent).toContain('route');
    expect(detail.textContent).toContain('/pay');
    expect(detail.textContent).toContain('trace-1');
    expect(detail.textContent).toContain('span-9');
    fireEvent.click(screen.getByRole('button', { name: 'View trace' }));
    expect(onTraceSelect).toHaveBeenCalledWith('trace-1', entries[0]);
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders no trace button without onTraceSelect', () => {
    render(<LogViewer entries={entries} defaultExpanded={['c']} />);
    expect(screen.queryByRole('button', { name: 'View trace' })).toBeNull();
    expect(screen.getByText('trace-1')).toBeTruthy();
  });

  it('highlights query matches with <mark>, case-insensitively', () => {
    const { container } = render(<LogViewer entries={entries} query="TIMEOUT" />);
    const marks = Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent);
    expect(marks).toEqual(['timeout']);
    expect(rowIds(container)).toHaveLength(4);
  });

  it('is one tab stop with roving focus, and toggles from the keyboard', () => {
    render(<LogViewer entries={entries} />);
    const buttons = rowButtons();
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1]);
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    expect(rowButtons().map((button) => button.tabIndex)).toEqual([-1, 0, -1, -1]);
    fireEvent.keyDown(buttons[1], { key: 'End' });
    expect(document.activeElement).toBe(buttons[3]);
    fireEvent.keyDown(buttons[3], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[3]);
    fireEvent.keyDown(buttons[3], { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(buttons[0], { key: 'PageDown' });
    expect(document.activeElement).toBe(buttons[3]);
    fireEvent.keyDown(buttons[3], { key: 'PageUp' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' });
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    // Enter and Space are the native button's click.
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('states why it is empty', () => {
    const { rerender } = render(<LogViewer entries={[]} />);
    expect(screen.getByText(/No log lines in this range\./)).toBeTruthy();
    rerender(<LogViewer entries={[]} query="nothing" />);
    expect(screen.getByText(/No log lines match\./)).toBeTruthy();
    rerender(<LogViewer entries={[]} emptyText="Quiet." />);
    expect(screen.getByText(/Quiet\./)).toBeTruthy();
  });
});

describe('LogViewer inside a TimeRangeProvider', () => {
  function CursorProbe() {
    const state = useTimeCursor()!;
    return (
      <>
        <output data-testid="cursor">{state.cursor ?? 'none'}</output>
        <button type="button" onClick={() => state.setCursor(NOW - 9 * MIN)}>chart hover</button>
        <button type="button" onClick={() => state.setCursor(NOW + MIN)}>chart past end</button>
      </>
    );
  }

  it('shows only lines in the shared window unless followRange is false', () => {
    const { container, rerender } = render(<TimeRangeProvider now={NOW}><LogViewer entries={entries} /></TimeRangeProvider>);
    expect(rowIds(container)).toHaveLength(3);
    rerender(<TimeRangeProvider now={NOW}><LogViewer entries={entries} followRange={false} /></TimeRangeProvider>);
    expect(rowIds(container)).toHaveLength(4);
  });

  it('says the range is empty when the window holds nothing', () => {
    render(<TimeRangeProvider now={NOW + 24 * 60 * MIN}><LogViewer entries={entries} /></TimeRangeProvider>);
    expect(screen.getByText(/No log lines in this range\./)).toBeTruthy();
  });

  it('moves the shared cursor on hover and releases it on leave', () => {
    render(<TimeRangeProvider now={NOW}><LogViewer entries={entries} /><CursorProbe /></TimeRangeProvider>);
    fireEvent.mouseEnter(screen.getAllByRole('listitem')[1]);
    expect(screen.getByTestId('cursor').textContent).toBe(String(NOW - 10 * MIN));
    fireEvent.mouseLeave(screen.getByRole('log'));
    expect(screen.getByTestId('cursor').textContent).toBe('none');
  });

  it('marks the line nearest a cursor set elsewhere, only inside the lines’ span', () => {
    const { container } = render(<TimeRangeProvider now={NOW}><LogViewer entries={entries} /><CursorProbe /></TimeRangeProvider>);
    expect(container.querySelector('[data-cursor]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'chart hover' }));
    const marked = container.querySelectorAll('[data-cursor]');
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent).toContain('slow query');
    fireEvent.click(screen.getByRole('button', { name: 'chart past end' }));
    expect(container.querySelector('[data-cursor]')).toBeNull();
  });
});

describe('LogViewer tail mode', () => {
  function geometry(el: HTMLElement, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
  }

  it('stays at the bottom while pinned, and offers a jump once scrolled away', () => {
    const base = entries.slice(0, 3);
    const { rerender } = render(<LogViewer entries={base} follow />);
    const log = screen.getByRole('log');
    geometry(log, { scrollHeight: 1000, clientHeight: 300 });
    rerender(<LogViewer entries={[...base, { id: 'n1', time: NOW - MIN, severity: 'info', message: 'new' }]} follow />);
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole('button', { name: /Jump to latest/ })).toBeNull();

    // The reader scrolls up: no more auto-scroll, and new lines are counted.
    log.scrollTop = 100;
    fireEvent.scroll(log);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeTruthy();
    const more = [...base, { id: 'n1', time: NOW - MIN, severity: 'info', message: 'new' }, { id: 'n2', time: NOW, severity: 'info', message: 'newer' }, { id: 'n3', time: NOW + 1, severity: 'info', message: 'newest' }] satisfies LogEntry[];
    rerender(<LogViewer entries={more} follow />);
    expect(log.scrollTop).toBe(100);
    const jump = screen.getByRole('button', { name: 'Jump to latest (2 new)' });
    fireEvent.click(jump);
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole('button', { name: /Jump to latest/ })).toBeNull();
  });

  it('starts the roving stop on the latest line', () => {
    render(<LogViewer entries={entries} follow />);
    expect(rowButtons().map((button) => button.tabIndex)).toEqual([-1, -1, -1, 0]);
  });
});

describe('LogViewer virtualized', () => {
  // jsdom has no layout; give the scroll box the height it declared, as
  // DataTable's tests do, so the virtualizer computes a window.
  function stubViewport(height: number) {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
  }
  const many: LogEntry[] = Array.from({ length: 5000 }, (_, index) => ({
    id: `l${index}`,
    time: NOW + index * 1000,
    severity: index % 50 === 0 ? 'error' : 'info',
    message: `line ${index}`,
    service: 'api',
  }));

  it('renders a window of a large stream with true positions', () => {
    stubViewport(360);
    render(<LogViewer entries={many} />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(5);
    expect(items.length).toBeLessThan(60);
    expect(items[0].getAttribute('aria-setsize')).toBe('5000');
    expect(items[0].getAttribute('aria-posinset')).toBe('1');
  });

  it('renders a small list directly', () => {
    render(<LogViewer entries={entries} />);
    expect(screen.getAllByRole('listitem')[0].getAttribute('aria-setsize')).toBeNull();
  });

  it('moves focus to a line the window had not drawn', async () => {
    stubViewport(360);
    render(<LogViewer entries={many} />);
    const first = rowButtons()[0];
    first.focus();
    await act(async () => {
      fireEvent.keyDown(first, { key: 'End' });
    });
    const log = screen.getByRole('log');
    // The line is not drawn yet: the box holds the stop meanwhile.
    expect(document.activeElement).toBe(log);
    expect(log.tabIndex).toBe(0);
    // The window reaches the end (jsdom does not scroll by itself).
    await act(async () => {
      log.scrollTop = 5000 * 32;
      fireEvent.scroll(log);
    });
    expect(document.activeElement?.getAttribute('aria-label')).toContain('line 4999');
    expect(log.tabIndex).toBe(-1);
  });
});
