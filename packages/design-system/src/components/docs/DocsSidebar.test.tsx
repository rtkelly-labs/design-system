import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsSidebar } from './DocsSidebar';

describe('DocsSidebar', () => {
  it('drops the navigation rail on paper', () => {
    render(<DocsSidebar nav={[{ label: 'Intro', href: '/docs' }]} />);
    expect(screen.getByRole('navigation', { name: 'Documentation' }).className)
      .toContain('print:hidden');
  });
});
