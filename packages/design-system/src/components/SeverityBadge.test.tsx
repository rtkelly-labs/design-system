import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { SEVERITY_ACCENTS, SeverityBadge, severityAccent } from './SeverityBadge';

describe('SeverityBadge', () => {
  it('labels and colours from the fixed vocabulary, and forwards its ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<SeverityBadge ref={ref} severity="warn" />);
    expect(screen.getByText('WARN')).toBeTruthy();
    expect(ref.current?.getAttribute('data-severity')).toBe('warn');
    expect(ref.current?.getAttribute('data-slot')).toBe('severity-badge');
  });

  it('maps every failure word to danger and falls back to quiet', () => {
    expect(['error', 'fatal', 'firing', 'critical'].map(severityAccent)).toEqual(['danger', 'danger', 'danger', 'danger']);
    expect(severityAccent('resolved')).toBe('success');
    expect(severityAccent('nonsense')).toBe('quiet');
    expect(Object.keys(SEVERITY_ACCENTS)).toHaveLength(12);
  });

  it('accepts its own text', () => {
    render(<SeverityBadge severity="firing">3 FIRING</SeverityBadge>);
    expect(screen.getByText('3 FIRING')).toBeTruthy();
  });
});
