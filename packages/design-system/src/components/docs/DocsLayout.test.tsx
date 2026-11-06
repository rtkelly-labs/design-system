import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DocsLayout } from './DocsLayout';

describe('DocsLayout', () => {
  it('hands Escape to the drawer while the drawer is open', () => {
    const onCloseSidebar = vi.fn();
    render(
      <DocsLayout sidebar={<nav>NAV</nav>} sidebarOpen={true} onCloseSidebar={onCloseSidebar}>
        <p>CONTENT</p>
      </DocsLayout>,
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onCloseSidebar).toHaveBeenCalledTimes(1);
  });

  it('does not claim Escape while the drawer is closed', () => {
    const onCloseSidebar = vi.fn();
    render(
      <DocsLayout sidebar={<nav>NAV</nav>} sidebarOpen={false} onCloseSidebar={onCloseSidebar}>
        <p>CONTENT</p>
      </DocsLayout>,
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onCloseSidebar).not.toHaveBeenCalled();
  });

  it('hides the closed drawer below lg so its links leave the tab order (issue 309)', () => {
    const { container, rerender } = render(
      <DocsLayout sidebar={<a href="/x">Link</a>}>Body</DocsLayout>,
    );
    const aside = container.querySelector('.docs-layout-sidebar');
    expect(aside?.className).toContain('max-lg:invisible');

    rerender(
      <DocsLayout sidebar={<a href="/x">Link</a>} sidebarOpen>
        Body
      </DocsLayout>,
    );
    expect(aside?.className).not.toContain('max-lg:invisible');
  });
});
