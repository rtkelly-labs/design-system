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
});
