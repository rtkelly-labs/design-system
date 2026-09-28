import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Terminal } from './Terminal';

describe('Terminal', () => {
  it('classifies commands, comments, success, and output lines', () => {
    render(<Terminal>{`$ pnpm test\n# checking\n✓ passed\n2 tests`}</Terminal>);
    expect(screen.getByText('pnpm test')).toBeTruthy();
    expect(screen.getByText('# checking')).toBeTruthy();
    expect(screen.getByText('✓ passed')).toBeTruthy();
    expect(screen.getByText('2 tests')).toBeTruthy();
  });

  it('supports a custom prompt and keeps the surface focusable', () => {
    render(<Terminal prompt="❯">❯ build</Terminal>);
    expect(screen.getByLabelText('Shell terminal output').getAttribute('tabindex')).toBe('0');
    expect(screen.getByText('build')).toBeTruthy();
  });
});
