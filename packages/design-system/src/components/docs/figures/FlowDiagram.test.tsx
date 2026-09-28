import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlowDiagram } from './FlowDiagram';

describe('FlowDiagram', () => {
  it('renders Markdown paths and an accessible summary', () => {
    render(<FlowDiagram label="PUBLISH"><ul><li>write → <strong>ship</strong></li></ul></FlowDiagram>);
    expect(screen.getByText('write')).toBeTruthy();
    expect(screen.getByText('ship')).toBeTruthy();
    expect(screen.getByText(/Flow with 1 path/)).toBeTruthy();
  });

  it('renders an empty state without throwing', () => {
    render(<FlowDiagram />);
    expect(screen.getByText('Empty flow.')).toBeTruthy();
  });
});
