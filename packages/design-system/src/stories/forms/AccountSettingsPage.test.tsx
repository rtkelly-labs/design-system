import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AccountSettingsPage } from './AccountSettingsPage';

it('labels each deletion section with its own heading when samples render together', () => {
  render(<><AccountSettingsPage focusOnAppear={false} /><AccountSettingsPage focusOnAppear={false} /></>);
  const sections = screen.getAllByRole('region', { name: 'Delete account' });
  expect(sections).toHaveLength(2);
  const ids = sections.map((section) => {
    const heading = within(section).getByRole('heading', { name: 'Delete account' });
    expect(document.getElementById(section.getAttribute('aria-labelledby')!)).toBe(heading);
    return heading.id;
  });
  expect(new Set(ids).size).toBe(2);
});
