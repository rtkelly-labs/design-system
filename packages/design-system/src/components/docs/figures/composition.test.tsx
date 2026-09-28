import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ActivityGrid, ChangeSummary, FigureFrame, GanttChart, Timeline, UptimeStrip } from './index';

describe('documentation figure composition', () => {
  it('puts related renderers under one caption and one figure landmark', () => {
    const { container } = render(
      <FigureFrame title="INCIDENT">
        <Timeline events={[{ date: '14:02', label: 'Degraded' }]} />
        <UptimeStrip days="ok down ok" />
      </FigureFrame>,
    );

    expect(screen.getAllByRole('figure')).toHaveLength(1);
    expect(screen.getByRole('figure', { name: 'INCIDENT' })).toBeTruthy();
    expect(container.querySelectorAll('figcaption')).toHaveLength(1);
    expect(screen.getByText('Degraded')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();
  });

  it('renders a semantic visual without a frame when the author does not need one', () => {
    render(<ChangeSummary rows={[{ label: 'docs', value: '2 files', sign: 'add' }]} />);
    expect(screen.queryByRole('figure')).toBeNull();
    expect(screen.getByLabelText('add: docs 2 files')).toBeTruthy();
  });

  it('forwards refs and native attributes through the frame and date renderers', () => {
    const frameRef = createRef<HTMLElement>();
    const activityRef = createRef<HTMLElement>();
    const ganttRef = createRef<HTMLElement>();
    render(<FigureFrame ref={frameRef} title="EDITORIAL">
      <ActivityGrid ref={activityRef} data={[{ date: '2026-03-01', count: 1 }]} data-testid="activity" />
      <GanttChart ref={ganttRef} items={[{ label: 'Draft', start: '2026-03-01', end: '2026-03-02' }]} data-testid="gantt" />
    </FigureFrame>);
    expect(frameRef.current).toBe(screen.getByRole('figure', { name: 'EDITORIAL' }));
    expect(activityRef.current).toBe(screen.getByTestId('activity'));
    expect(ganttRef.current).toBe(screen.getByTestId('gantt'));
  });
});
