import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../../theme/levels';
import { SwatchCompare } from './SwatchCompare';

const red = LEVELS.sketch.palette.red;
const blue = LEVELS.sketch.palette.blue;

describe('SwatchCompare', () => {
  it('draws one swatch per value and a dashed cell where none exists', () => {
    render(
      <SwatchCompare
        label="Light palette"
        columns={[{ name: 'red', verdict: 'lifted', tone: 'warning' }, { name: 'blue' }]}
        rows={[
          { label: 'Today', values: [red, null] },
          { label: 'Now', values: [red, blue] },
        ]}
      />,
    );
    expect(screen.getByRole('table', { name: 'Light palette' })).toBeTruthy();
    expect(screen.getAllByText(red)).toHaveLength(2);
    expect(screen.getByText(blue)).toBeTruthy();
    expect(screen.getByText('Today: no blue')).toBeTruthy();
    expect(screen.getByText('lifted')).toBeTruthy();
  });

  it('paints its ground as the requested Level', () => {
    const { container } = render(
      <SwatchCompare level="sketch" columns={[{ name: 'red' }]} rows={[{ label: 'Now', values: [red] }]} />,
    );
    expect(container.querySelector('[data-theme="sketch"]')).toBeTruthy();
  });

  it('announces an empty state', () => {
    render(<SwatchCompare columns={[]} rows={[]} />);
    expect(screen.getByText('No colours.')).toBeTruthy();
  });
});
