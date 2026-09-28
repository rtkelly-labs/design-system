import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Step, Steps } from './Steps';

describe('Steps', () => {
  it('renders explicit steps and their body content', () => {
    render(<Steps><Step title="Copy">Copy the source.</Step><Step title="Register" state="now">Export the component.</Step></Steps>);
    expect(screen.getByText('Copy')).toBeTruthy();
    expect(screen.getByText('Export the component.')).toBeTruthy();
    expect(screen.getByText('2 steps.')).toBeTruthy();
  });

  it('renders an empty procedure', () => {
    render(<Steps />);
    expect(screen.getByText('Empty procedure.')).toBeTruthy();
  });
});
