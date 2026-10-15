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

  it('maps error and warn lines to the editor roles, not muted output', () => {
    const { container } = render(<Terminal>{[
      '$ pnpm build',
      '✗ build failed',
      'Error: Cannot find module',
      'FAIL src/a.test.ts',
      '⚠ deprecated flag',
      'warn: peer dependency',
      'Warning: slow',
      'errors: 0',
      'plain output',
    ].join('\n')}</Terminal>);
    const kinds = [...container.querySelectorAll('code[data-kind]')].map((c) => c.getAttribute('data-kind'));
    expect(kinds).toEqual(['command', 'error', 'error', 'error', 'warn', 'warn', 'warn', 'output', 'output']);
    const line = (text: string) => screen.getByText(text).closest('code')!;
    expect(line('✗ build failed').className).toContain('text-editor-error');
    expect(line('FAIL src/a.test.ts').className).toContain('text-editor-error');
    expect(line('⚠ deprecated flag').className).toContain('text-editor-warning');
    expect(line('warn: peer dependency').className).toContain('text-editor-warning');
    expect(line('errors: 0').className).toContain('text-content-muted');
    expect(line('plain output').className).not.toContain('text-editor');
  });

  it('keeps the other line kinds as they were', () => {
    render(<Terminal>{'$ cmd\n# note\n✓ ok'}</Terminal>);
    expect(screen.getByText('cmd').closest('code')!.className).toContain('text-content-primary');
    expect(screen.getByText('# note').closest('code')!.className).toContain('text-content-muted');
    expect(screen.getByText('✓ ok').closest('code')!.className).toContain('text-accent-primary');
  });

  it('supports a custom prompt and keeps the surface focusable', () => {
    render(<Terminal prompt="❯">❯ build</Terminal>);
    expect(screen.getByLabelText('Shell terminal output').getAttribute('tabindex')).toBe('0');
    expect(screen.getByText('build')).toBeTruthy();
  });
});
