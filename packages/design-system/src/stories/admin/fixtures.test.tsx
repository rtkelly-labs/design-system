import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/Toast';
import { ContentStudio, FinanceConsole } from './fixtures';

/**
 * Issue 249's claim is that one `AppShell` holds two unrelated admin
 * applications with no change to the shell between them. Pixels show the
 * layouts; these pin the parts a screenshot cannot: the landmarks each one
 * ends up with, the sync notification `AdminDashboardLayout` used to own, and
 * that the finance content really did leave the package.
 */
describe('admin applications on AppShell', () => {
  it.each([
    ['FinanceConsole', <FinanceConsole key="f" />, 'Admin console'],
    ['ContentStudio', <ContentStudio key="c" />, 'Content studio'],
  ])('%s has one main, a named sidebar and a named header', (_, app, name) => {
    render(app);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('complementary', { name })).toBeTruthy();
    expect(screen.getByRole('banner', { name })).toBeTruthy();
  });

  it('follows the finance console navigation', () => {
    render(<FinanceConsole />);
    const nav = screen.getByRole('navigation', { name: 'Admin' });
    fireEvent.click(within(nav).getByRole('button', { name: /Rule engine/ }));
    expect(screen.getByRole('main', { name: 'Rule engine' })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Rule engine/ }).getAttribute('aria-current')).toBe('page');
  });

  it('nests the content studio tree', () => {
    render(<ContentStudio />);
    const nav = screen.getByRole('navigation', { name: 'Content' });
    const posts = within(nav).getByRole('button', { name: /Posts/ });
    expect(posts.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('table', { name: 'Posts' })).toBeTruthy();
  });
});

describe('the finance console’s sync', () => {
  it('announces a requested sync when a ToastProvider is present', async () => {
    const onSync = vi.fn();
    render(
      <ToastProvider>
        <FinanceConsole onSync={onSync} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /TRIGGER SYNC/ }));

    expect(onSync).toHaveBeenCalledTimes(1);
    const region = await screen.findByRole('region', { name: 'Notifications' });
    const toast = await screen.findByRole('dialog', { name: 'SYNC REQUESTED' });
    expect(region.contains(toast)).toBe(true);
    expect(toast.getAttribute('data-intent')).toBe('info');
  });

  it('shows one toast however many times the button is pressed', async () => {
    render(
      <ToastProvider>
        <FinanceConsole />
      </ToastProvider>,
    );

    const button = screen.getByRole('button', { name: /TRIGGER SYNC/ });
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByRole('dialog', { name: 'SYNC REQUESTED' });
    expect(screen.getAllByRole('dialog', { name: 'SYNC REQUESTED' })).toHaveLength(1);
  });

  it('still works without a provider', () => {
    const onSync = vi.fn();
    render(<FinanceConsole onSync={onSync} />);

    fireEvent.click(screen.getByRole('button', { name: /TRIGGER SYNC/ }));

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
  });
});

describe('the package', () => {
  it('ships no admin application', () => {
    const index = readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');
    expect(index).not.toMatch(/admin/i);
  });
});
