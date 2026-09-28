import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UptimeStrip } from './UptimeStrip';

describe('UptimeStrip', () => {
  it('calculates uptime while excluding empty slots', () => {
    render(<UptimeStrip days="ok ok degraded down empty" from="Mar 1" to="Mar 5" />);
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText(/50 percent uptime over 4 days, Mar 1 to Mar 5/)).toBeTruthy();
  });

  it('supports a short row and zero known days', () => {
    render(<UptimeStrip days={[]} columns={7} />);
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('0 percent uptime over 0 days.')).toBeTruthy();
  });
});
