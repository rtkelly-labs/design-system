import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlogPost } from './BlogPost';

/**
 * `readingTime` and `tags` used to default to `'5 min read'` and a three-item
 * sample set — content rather than configuration, so a post omitting them
 * published a claim nobody made, in a header indistinguishable from one that
 * had supplied them (#93).
 *
 * These assert the *absence*, which is the part that regressed silently: a
 * default reappearing would still render a perfectly plausible header.
 */
function renderPost(props: Partial<React.ComponentProps<typeof BlogPost>> = {}) {
  return render(
    <BlogPost title="Where a theme stops applying" date="2026-08-11" {...props}>
      <p>Body</p>
    </BlogPost>,
  );
}

describe('BlogPost metadata', () => {
  it('shows no reading time when none was measured', () => {
    renderPost();
    expect(screen.queryByText(/min read/i)).toBeNull();
  });

  it('shows no tags when none were supplied', () => {
    const { container } = renderPost();
    expect(container.textContent).not.toContain('#');
  });

  it('treats an empty tag array the same as no tags', () => {
    const { container } = renderPost({ tags: [] });
    expect(container.textContent).not.toContain('#');
  });

  it('renders each value it is actually given', () => {
    renderPost({ readingTime: '9 min read', tags: ['css', 'design-systems'] });
    expect(screen.getByText('9 min read')).toBeTruthy();
    expect(screen.getByText('#css')).toBeTruthy();
    expect(screen.getByText('#design-systems')).toBeTruthy();
  });

  it('still defaults the byline, which is the one metadata a personal site can assume', () => {
    renderPost();
    expect(screen.getByText('Ryan Kelly')).toBeTruthy();
  });

  it('lets a guest post override that byline', () => {
    renderPost({ author: 'A Guest' });
    expect(screen.getByText('A Guest')).toBeTruthy();
    expect(screen.queryByText('Ryan Kelly')).toBeNull();
  });
});
