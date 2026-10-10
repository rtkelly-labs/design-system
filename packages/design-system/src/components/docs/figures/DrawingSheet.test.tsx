import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { DrawingSheet, SheetSection } from './DrawingSheet';

describe('DrawingSheet', () => {
  it('draws numbered columns and lettered rows, hidden from assistive technology', () => {
    const { container } = render(<DrawingSheet columns={3} rows={2}><p>body</p></DrawingSheet>);
    const columns = container.querySelector('[data-slot="drawing-sheet-columns"]');
    const rows = container.querySelector('[data-slot="drawing-sheet-rows"]');
    expect(columns?.textContent).toBe('123');
    expect(rows?.textContent).toBe('AB');
    expect(columns?.getAttribute('aria-hidden')).toBe('true');
    expect(rows?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('drops a ruler set to zero', () => {
    const { container } = render(<DrawingSheet columns={0} rows={0} />);
    expect(container.querySelector('[data-slot="drawing-sheet-columns"]')).toBeNull();
    expect(container.querySelector('[data-slot="drawing-sheet-rows"]')).toBeNull();
  });

  it('skips I and O in row references, and numbers a second pass', () => {
    const { container } = render(<DrawingSheet columns={0} rows={26} />);
    const labels = Array.from(container.querySelectorAll('[data-slot="drawing-sheet-rows"] > span'), (cell) => cell.textContent);
    expect(labels.slice(7, 9)).toEqual(['H', 'J']);
    expect(labels).not.toContain('I');
    expect(labels).not.toContain('O');
    expect(labels.slice(24)).toEqual(['A2', 'B2']);
  });
});

describe('SheetSection', () => {
  it('is a region named by its heading, at the requested level', () => {
    render(<SheetSection index="A" title="What changed" headingLevel={2} actions={<button type="button">Comment</button>}>content</SheetSection>);
    expect(screen.getByRole('region', { name: 'What changed' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'What changed' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Comment' })).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('forwards refs on both parts', () => {
    const sheet = createRef<HTMLDivElement>();
    const section = createRef<HTMLElement>();
    render(<DrawingSheet ref={sheet} data-testid="sheet"><SheetSection ref={section} index="B" title="Checks" /></DrawingSheet>);
    expect(sheet.current).toBe(screen.getByTestId('sheet'));
    expect(section.current).toBe(screen.getByRole('region', { name: 'Checks' }));
  });
});
