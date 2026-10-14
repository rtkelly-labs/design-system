import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocPager } from './DocPager';

describe('DocPager', () => {
  it('drops the pager on paper', () => {
    render(<DocPager prev={{ label: 'Intro', href: '/docs/intro' }} next={{ label: 'API', href: '/docs/api' }} />);
    expect(screen.getByRole('navigation', { name: 'Page navigation' }).className)
      .toContain('print:hidden');
  });
});
