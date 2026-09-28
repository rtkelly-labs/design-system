import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Timeline, Event } from './Timeline';

describe('Timeline', () => {
  it('maps Markdown emphasis to current and upcoming states', () => {
    render(<Timeline><ul><li>09:00: done</li><li>10:00: <strong>now</strong></li><li>11:00: <em>next</em></li></ul></Timeline>);
    expect(screen.getByLabelText('10:00: now')).toBeTruthy();
    expect(screen.getByLabelText('11:00: next')).toBeTruthy();
  });

  it('accepts explicit Event items', () => {
    render(<Timeline><Event date="Mar 18" state="done">deployed</Event></Timeline>);
    expect(screen.getByText('deployed')).toBeTruthy();
    expect(screen.getByText(/1 timeline event/)).toBeTruthy();
  });
});
