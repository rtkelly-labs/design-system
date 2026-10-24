import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageTitle } from './PageTitle';

describe('PageTitle', () => {
  it('is framed and balanced by default', () => {
    render(<PageTitle>Quality gate</PageTitle>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('border-double');
    expect(heading.className).toContain('text-balance');
  });

  it('drops the frame when something else on the page leads', () => {
    render(<PageTitle framed={false}>Quality gate</PageTitle>);
    expect(screen.getByRole('heading', { level: 1 }).className).not.toContain('border-double');
  });
});
