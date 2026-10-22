import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IdChip, truncateId } from './IdChip';

const trace = '4bf92f3577b34da6a3ce929d0e0e4736';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IdChip', () => {
  it('shows the head of the id and names it in full, forwarding its ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<IdChip ref={ref} value={trace} label="trace" data-testid="chip" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('id-chip');
    expect(ref.current?.getAttribute('data-testid')).toBe('chip');
    expect(screen.getByText('4bf92f35…')).toBeTruthy();
    expect(screen.getByText(`trace ${trace}`).className).toContain('sr-only');
    expect(screen.getByRole('button', { name: `Copy trace ID ${trace}` })).toBeTruthy();
  });

  it('links the id when given href, keeping the copy button separate', () => {
    render(<IdChip value={trace} label="trace" href={`/traces/${trace}`} />);
    const link = screen.getByRole('link', { name: `trace ${trace}` });
    expect(link.getAttribute('href')).toBe(`/traces/${trace}`);
    expect(link.querySelector('button')).toBeNull();
  });

  it('copies the full value and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const onCopy = vi.fn();
    render(<IdChip value={trace} onCopy={onCopy} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `Copy ID ${trace}` }));
    });
    expect(writeText).toHaveBeenCalledWith(trace);
    expect(onCopy).toHaveBeenCalledWith(trace, true);
    expect(screen.getByRole('status').textContent).toBe('Copied');
    expect(screen.getByText('✓ Copied')).toBeTruthy();
  });

  it('shows a short id whole, and can drop the copy button', () => {
    render(<IdChip value="a1b2" copyable={false} />);
    expect(screen.getByText('a1b2', { selector: '[aria-hidden]' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('truncates by count, and 0 shows everything', () => {
    expect(truncateId(trace, 4)).toBe('4bf9…');
    expect(truncateId(trace, 0)).toBe(trace);
  });
});
