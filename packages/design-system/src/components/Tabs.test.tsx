import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsList, TabsPanel, TabsTab } from './Tabs';
import type { TabsOrientation } from './Tabs';

/**
 * The keyboard assertions here are the ones `CodeTabs.test.tsx` has carried
 * since #195, moved onto the primitive they were always about rather than
 * rewritten — the point of the extraction is that the behaviour is the same
 * behaviour, and a fresh set of tests would not have shown that.
 */

function Sections({
  orientation,
  onValueChange,
  value,
}: {
  orientation?: TabsOrientation;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <Tabs
      defaultValue="profile"
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
    >
      <TabsList label="Account settings">
        <TabsTab value="profile">Profile</TabsTab>
        <TabsTab value="notifications">Notifications</TabsTab>
        <TabsTab value="billing">Billing</TabsTab>
      </TabsList>
      <TabsPanel value="profile">Display name</TabsPanel>
      <TabsPanel value="notifications">Email digest</TabsPanel>
      <TabsPanel value="billing">Payment method</TabsPanel>
    </Tabs>
  );
}

const selectedTab = (list: HTMLElement) =>
  within(list)
    .getAllByRole('tab')
    .find((tab) => tab.getAttribute('aria-selected') === 'true');

describe('Tabs', () => {
  it('is a tablist showing one panel, selected by defaultValue', () => {
    render(<Sections />);

    const list = screen.getByRole('tablist');
    expect(list.getAttribute('aria-label')).toBe('Account settings');
    expect(selectedTab(list)?.textContent).toBe('Profile');
    expect(screen.getByRole('tabpanel').textContent).toBe('Display name');
    // Unselected panels are not in the document at all unless asked for.
    expect(screen.queryAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
  });

  it('pairs each tab with its panel by aria-controls and aria-labelledby', () => {
    render(<Sections />);

    const tab = screen.getByRole('tab', { name: 'Profile' });
    const panel = screen.getByRole('tabpanel');

    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    expect(tab.id).not.toBe('');
    expect(panel.id).not.toBe('');
  });

  it('keeps only the selected tab in the tab order', () => {
    render(<Sections />);
    const [profile, notifications, billing] = screen.getAllByRole('tab');

    expect(profile!.tabIndex).toBe(0);
    expect(notifications!.tabIndex).toBe(-1);
    expect(billing!.tabIndex).toBe(-1);

    fireEvent.click(billing!);
    expect(profile!.tabIndex).toBe(-1);
    expect(billing!.tabIndex).toBe(0);
  });

  it('moves selection and focus with the arrow keys, wrapping at the ends', () => {
    render(<Sections />);
    const list = screen.getByRole('tablist');
    const [profile, notifications, billing] = within(list).getAllByRole('tab');

    profile!.focus();
    fireEvent.keyDown(profile!, { key: 'ArrowRight' });
    expect(selectedTab(list)).toBe(notifications);
    expect(document.activeElement).toBe(notifications);

    fireEvent.keyDown(notifications!, { key: 'End' });
    expect(selectedTab(list)).toBe(billing);

    fireEvent.keyDown(billing!, { key: 'ArrowRight' });
    expect(selectedTab(list)).toBe(profile);

    fireEvent.keyDown(profile!, { key: 'ArrowLeft' });
    expect(selectedTab(list)).toBe(billing);

    fireEvent.keyDown(billing!, { key: 'Home' });
    expect(selectedTab(list)).toBe(profile);
    expect(document.activeElement).toBe(profile);
  });

  it('follows the orientation: a vertical strip traverses with ArrowUp and ArrowDown', () => {
    render(<Sections orientation="vertical" />);
    const list = screen.getByRole('tablist');
    const [profile, notifications, billing] = within(list).getAllByRole('tab');

    expect(list.getAttribute('aria-orientation')).toBe('vertical');

    profile!.focus();
    fireEvent.keyDown(profile!, { key: 'ArrowDown' });
    expect(selectedTab(list)).toBe(notifications);
    expect(document.activeElement).toBe(notifications);

    fireEvent.keyDown(notifications!, { key: 'ArrowUp' });
    expect(selectedTab(list)).toBe(profile);

    fireEvent.keyDown(profile!, { key: 'ArrowUp' });
    expect(selectedTab(list)).toBe(billing);

    // The other axis is inert, so a vertical strip inside a horizontal one
    // does not move both.
    fireEvent.keyDown(billing!, { key: 'ArrowRight' });
    expect(selectedTab(list)).toBe(billing);

    fireEvent.keyDown(billing!, { key: 'Home' });
    expect(selectedTab(list)).toBe(profile);
  });

  it('leaves a horizontal strip inert on the vertical arrows', () => {
    render(<Sections />);
    const list = screen.getByRole('tablist');
    const [profile] = within(list).getAllByRole('tab');

    expect(list.getAttribute('aria-orientation')).toBeNull();

    profile!.focus();
    fireEvent.keyDown(profile!, { key: 'ArrowDown' });
    expect(selectedTab(list)).toBe(profile);
  });

  it('switches on its own when uncontrolled', () => {
    render(<Sections />);

    fireEvent.click(screen.getByRole('tab', { name: 'Billing' }));

    expect(screen.getByRole('tabpanel').textContent).toBe('Payment method');
  });

  it('renders what it is given when controlled, and reports every device', () => {
    const onValueChange = vi.fn();
    render(<Sections value="notifications" onValueChange={onValueChange} />);

    const list = screen.getByRole('tablist');
    expect(selectedTab(list)?.textContent).toBe('Notifications');

    fireEvent.click(screen.getByRole('tab', { name: 'Billing' }));
    expect(onValueChange).toHaveBeenCalledWith('billing');
    // The caller declined to move, so the strip did not move either.
    expect(selectedTab(list)?.textContent).toBe('Notifications');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Notifications' }), { key: 'End' });
    expect(onValueChange).toHaveBeenLastCalledWith('billing');
    expect(selectedTab(list)?.textContent).toBe('Notifications');
  });

  it('keeps a panel mounted and hidden when asked', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList label="Kept">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
        </TabsList>
        <TabsPanel value="one" keepMounted>
          first
        </TabsPanel>
        <TabsPanel value="two" keepMounted>
          second
        </TabsPanel>
      </Tabs>,
    );

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(2);
    expect(panels.filter((panel) => panel.hasAttribute('hidden'))).toHaveLength(1);
  });

  it('marks selection with a fill or an edge, never a surface swap', () => {
    for (const variant of ['merged', 'underline', 'segmented'] as const) {
      const { unmount } = render(
        <Tabs defaultValue="a" variant={variant}>
          <TabsList label={variant}>
            <TabsTab value="a">a</TabsTab>
            <TabsTab value="b">b</TabsTab>
          </TabsList>
          <TabsPanel value="a">a</TabsPanel>
          <TabsPanel value="b">b</TabsPanel>
        </Tabs>,
      );
      const active = selectedTab(screen.getByRole('tablist'))!;
      const classes = active.className;
      const device =
        classes.includes('bg-[var(--tabs-accent)]') ||
        classes.includes('border-b-[var(--tabs-accent)]');
      expect(device, `${variant} selected tab carries the accent`).toBe(true);
      expect(classes.includes('bg-surface-raised'), `${variant} never selects by surface`).toBe(
        false,
      );
      unmount();
    }
  });

  it('composes refs and a caller className onto every part', () => {
    const root = createRef<HTMLDivElement>();
    const list = createRef<HTMLDivElement>();
    const tab = createRef<HTMLButtonElement>();
    const panel = createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="a" ref={root} className="mt-8" data-testid="root">
        <TabsList label="Refs" ref={list} className="px-0">
          <TabsTab value="a" ref={tab} className="uppercase">
            a
          </TabsTab>
        </TabsList>
        <TabsPanel value="a" ref={panel} className="p-4">
          body
        </TabsPanel>
      </Tabs>,
    );

    expect(root.current).toBeInstanceOf(HTMLDivElement);
    expect(root.current?.dataset.testid).toBe('root');
    expect(root.current?.className).toContain('mt-8');
    expect(list.current?.className).toContain('px-0');
    expect(tab.current?.className).toContain('uppercase');
    expect(panel.current?.className).toContain('p-4');
  });

  it('refuses to render a part outside a Tabs', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TabsTab value="orphan">orphan</TabsTab>)).toThrow(
      '<TabsTab> must be rendered inside <Tabs>.',
    );
    quiet.mockRestore();
  });

  it('skips a disabled tab when traversing, so a focusable tab always remains', () => {
    render(
      <Tabs defaultValue="profile">
        <TabsList label="Account settings">
          <TabsTab value="profile">Profile</TabsTab>
          <TabsTab value="notifications" disabled>
            Notifications
          </TabsTab>
          <TabsTab value="billing">Billing</TabsTab>
        </TabsList>
        <TabsPanel value="profile">Display name</TabsPanel>
        <TabsPanel value="notifications">Email digest</TabsPanel>
        <TabsPanel value="billing">Payment method</TabsPanel>
      </Tabs>,
    );

    const list = screen.getByRole('tablist');
    const profile = screen.getByRole('tab', { name: 'Profile' });
    profile.focus();
    fireEvent.keyDown(profile, { key: 'ArrowRight' });

    const billing = screen.getByRole('tab', { name: 'Billing' });
    expect(selectedTab(list)?.textContent).toBe('Billing');
    expect(document.activeElement).toBe(billing);
    expect(billing.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(billing, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(profile);
  });

  it('gives distinct values distinct ids, even when they differ only by whitespace', () => {
    render(
      <Tabs defaultValue="billing info">
        <TabsList label="Account settings">
          <TabsTab value="billing info">Billing info</TabsTab>
          <TabsTab value="billing-info">Billing (legacy)</TabsTab>
        </TabsList>
        <TabsPanel value="billing info">New</TabsPanel>
        <TabsPanel value="billing-info">Legacy</TabsPanel>
      </Tabs>,
    );

    const [spaced, hyphenated] = screen.getAllByRole('tab');
    expect(spaced?.id).not.toBe(hyphenated?.id);
    expect(spaced?.getAttribute('aria-controls')).not.toBe(
      hyphenated?.getAttribute('aria-controls'),
    );
    // The selected tab's pairing still resolves to its own panel.
    const panel = screen.getByRole('tabpanel');
    expect(spaced?.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(spaced?.id);
  });

  it('names the tablist itself from aria-label or aria-labelledby, not the wrapper', () => {
    const { unmount } = render(
      <Tabs defaultValue="profile">
        <TabsList aria-label="Account settings">
          <TabsTab value="profile">Profile</TabsTab>
        </TabsList>
        <TabsPanel value="profile">Display name</TabsPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tablist', { name: 'Account settings' })).toBeTruthy();
    unmount();

    render(
      <>
        <h2 id="settings-heading">Settings</h2>
        <Tabs defaultValue="profile">
          <TabsList aria-labelledby="settings-heading">
            <TabsTab value="profile">Profile</TabsTab>
          </TabsList>
          <TabsPanel value="profile">Display name</TabsPanel>
        </Tabs>
      </>,
    );
    const list = screen.getByRole('tablist', { name: 'Settings' });
    expect(list.parentElement?.getAttribute('aria-labelledby')).toBeNull();
  });
});
