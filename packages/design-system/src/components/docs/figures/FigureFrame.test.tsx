import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FigureFrame,
  AsciiFrameBody,
  AsciiFrameProse,
  listItems,
  textOf,
} from './FigureFrame';

describe('FigureFrame', () => {
  it('renders an accessible titled frame with semantic design-system classes', () => {
    render(
      <FigureFrame title="FLOW">
        <AsciiFrameBody>
          <AsciiFrameProse>
            <p>request reaches middleware</p>
          </AsciiFrameProse>
          <span className="sr-only">A request flow.</span>
        </AsciiFrameBody>
      </FigureFrame>,
    );

    const frame = screen.getByRole('figure', { name: 'FLOW' });
    expect(frame).toBeTruthy();
    expect(screen.getByText('[ FLOW ]')).toBeTruthy();
    expect(frame.className).toContain('border-edge-strong');
    expect(frame.className).toContain('bg-surface-base');
    expect(screen.getByText('A request flow.')).toBeTruthy();
  });

  it('extracts text from Markdown list items without coupling callers to DOM helpers', () => {
    const items = listItems(
      <ul>
        <li>request</li>
        <li>middleware</li>
      </ul>,
    );
    expect(items).toHaveLength(2);
    expect(textOf(items[0])).toBe('request');
    expect(textOf(items[1])).toBe('middleware');
  });
});
