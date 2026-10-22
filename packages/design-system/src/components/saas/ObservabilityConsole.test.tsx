import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OBSERVABILITY_LOGS, OBSERVABILITY_TRACES } from './observabilityData';
import { ObservabilityConsole } from './ObservabilityConsole';

describe('ObservabilityConsole', () => {
  it('opens on the overview with the shared time range', () => {
    render(<ObservabilityConsole />);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '1h' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('13:00 – 14:00 UTC')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Latency' })).toBeTruthy();
  });

  it('navigates between views from the sidebar', () => {
    render(<ObservabilityConsole />);
    fireEvent.click(screen.getAllByRole('button', { name: /Service map/ })[0]!);
    expect(screen.getByRole('heading', { level: 1, name: 'Service map' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Alerts/ })[0]!);
    expect(screen.getByText('INC-482 · Checkout payments failing')).toBeTruthy();
  });

  it('filters logs with the filter bar', () => {
    render(<ObservabilityConsole defaultView="logs" />);
    const payments = OBSERVABILITY_LOGS.filter((entry) => entry.service === 'payments').length;
    expect(screen.getByText(`${payments} of ${OBSERVABILITY_LOGS.length} lines`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Remove filter service = payments/ }));
    expect(screen.getByText(`${OBSERVABILITY_LOGS.length} of ${OBSERVABILITY_LOGS.length} lines`)).toBeTruthy();
  });

  it('opens a trace in the replayable viewer, and switches between failing traces', () => {
    render(<ObservabilityConsole defaultView="traces" />);
    const failing = screen.getByRole('region', { name: 'Failing traces' });
    const choices = within(failing).getAllByRole('button');
    expect(choices.length).toBeGreaterThan(1);
    fireEvent.click(choices[1]!);
    const chosen = OBSERVABILITY_TRACES.filter((trace) => trace.failed)[1]!;
    expect(screen.getByRole('region', { name: `POST /checkout · ${chosen.traceId.slice(0, 8)}` })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Replay' })).toBeTruthy();
  });
});
