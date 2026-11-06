import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CodeBlock } from './CodeBlock';
import { CodeTab, CodeTabs } from './CodeTabs';
import { resetCodeTabGroups } from './codeTabsStore';

function Snippets({ group, extra = false }: { group?: string; extra?: boolean }) {
  return (
    <CodeTabs group={group} label={group}>
      <CodeTab label="pnpm">pnpm add x</CodeTab>
      <CodeTab label="npm">npm install x</CodeTab>
      {extra ? <CodeTab label="yarn">yarn add x</CodeTab> : null}
    </CodeTabs>
  );
}

const selectedTab = (list: HTMLElement) =>
  within(list).getAllByRole('tab').find((tab) => tab.getAttribute('aria-selected') === 'true');

describe('CodeTabs', () => {
  beforeEach(() => {
    resetCodeTabGroups();
  });

  it('is a tablist whose first tab is selected and whose other panels are hidden', () => {
    render(<Snippets />);

    const list = screen.getByRole('tablist');
    expect(selectedTab(list)?.textContent).toBe('pnpm');
    expect(screen.getByRole('tabpanel').textContent).toContain('pnpm add x');
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(2);
  });

  it('switches every block in a group together, and leaves ungrouped blocks alone', () => {
    render(
      <>
        <Snippets group="pkg" />
        <Snippets group="pkg" />
        <Snippets />
      </>,
    );

    const lists = screen.getAllByRole('tablist');
    fireEvent.click(within(lists[0]!).getByRole('tab', { name: 'npm' }));

    expect(selectedTab(lists[0]!)?.textContent).toBe('npm');
    expect(selectedTab(lists[1]!)?.textContent).toBe('npm');
    expect(selectedTab(lists[2]!)?.textContent).toBe('pnpm');
  });

  it('falls back to its own first tab when the group chose a tab it does not have', () => {
    render(
      <>
        <Snippets group="pkg" extra />
        <Snippets group="pkg" />
      </>,
    );

    const [wide, narrow] = screen.getAllByRole('tablist');
    fireEvent.click(within(wide!).getByRole('tab', { name: 'yarn' }));

    expect(selectedTab(wide!)?.textContent).toBe('yarn');
    expect(selectedTab(narrow!)?.textContent).toBe('pnpm');
  });

  it('remembers a grouped choice across a remount', () => {
    const first = render(<Snippets group="pkg" />);
    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));
    first.unmount();

    render(<Snippets group="pkg" />);
    expect(selectedTab(screen.getByRole('tablist'))?.textContent).toBe('npm');
  });

  it('moves selection and focus with the arrow keys, wrapping at the ends', () => {
    render(<Snippets extra />);
    const list = screen.getByRole('tablist');
    const [pnpm, npm, yarn] = within(list).getAllByRole('tab');

    pnpm!.focus();
    fireEvent.keyDown(pnpm!, { key: 'ArrowRight' });
    expect(selectedTab(list)).toBe(npm);
    expect(document.activeElement).toBe(npm);

    fireEvent.keyDown(npm!, { key: 'End' });
    expect(selectedTab(list)).toBe(yarn);

    fireEvent.keyDown(yarn!, { key: 'ArrowRight' });
    expect(selectedTab(list)).toBe(pnpm);

    fireEvent.keyDown(pnpm!, { key: 'ArrowLeft' });
    expect(selectedTab(list)).toBe(yarn);

    // `Home` was the one key in the handler with no assertion behind it — the
    // rest of this model is covered above, which is what #163 turned out to be
    // wrong about.
    fireEvent.keyDown(yarn!, { key: 'Home' });
    expect(selectedTab(list)).toBe(pnpm);
    expect(document.activeElement).toBe(pnpm);
  });

  it('keeps only the selected tab in the tab order', () => {
    render(<Snippets />);
    const [pnpm, npm] = screen.getAllByRole('tab');

    expect(pnpm!.tabIndex).toBe(0);
    expect(npm!.tabIndex).toBe(-1);
  });

  it('attaches a CodeBlock rendered inside a panel, and wraps a string body in one', () => {
    render(
      <CodeTabs>
        <CodeTab label="string">plain text body</CodeTab>
        <CodeTab label="block">
          <CodeBlock title="already a block">inner</CodeBlock>
        </CodeTab>
      </CodeTabs>,
    );

    const blocks = document.querySelectorAll('.docs-codeblock');
    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      expect(block.getAttribute('data-attached')).toBe('true');
    }
  });

  it('marks selection with a fill or an edge, never a surface swap', () => {
    for (const variant of ['merged', 'underline', 'segmented'] as const) {
      const { unmount } = render(
        <CodeTabs variant={variant}>
          <CodeTab label="a">a</CodeTab>
          <CodeTab label="b">b</CodeTab>
        </CodeTabs>,
      );
      const active = selectedTab(screen.getByRole('tablist'))!;
      const classes = active.className;
      const device =
        classes.includes('bg-[var(--tabs-accent)]') ||
        classes.includes('border-b-[var(--tabs-accent)]');
      expect(device, `${variant} selected tab carries the accent`).toBe(true);
      expect(classes.includes('bg-surface-raised'), `${variant} never selects by surface`).toBe(false);
      unmount();
    }
  });

  it('reads tabs out of a fragment, so one tab set can be reused across blocks', () => {
    const set = (
      <>
        <CodeTab label="pnpm">a</CodeTab>
        <CodeTab label="npm">b</CodeTab>
      </>
    );
    render(<CodeTabs>{set}</CodeTabs>);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['pnpm', 'npm']);
  });

  it('renders a bare CodeTab as its children', () => {
    render(<CodeTab label="lonely">still visible</CodeTab>);
    expect(screen.getByText('still visible')).toBeDefined();
  });
});
