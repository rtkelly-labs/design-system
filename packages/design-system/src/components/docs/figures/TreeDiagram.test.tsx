import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TreeDiagram, Node } from './TreeDiagram';

describe('TreeDiagram', () => {
  it('renders nested explicit nodes and announces the count', () => {
    render(<TreeDiagram><Node label="src"><Node label="FigureFrame.tsx" meta="12 KB" accent /></Node></TreeDiagram>);
    expect(screen.getByText('FigureFrame.tsx')).toBeTruthy();
    expect(screen.getByText('12 KB')).toBeTruthy();
    expect(screen.getByText('Tree with 2 nodes.')).toBeTruthy();
  });

  it('renders an empty tree', () => {
    render(<TreeDiagram />);
    expect(screen.getByText('Tree with 0 nodes.')).toBeTruthy();
  });
});
