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

/**
 * The author card was hard-coded (issue 250): a guest post rendered "Written
 * by A Guest" beside Ryan's initials and Ryan's one-line bio. The default stays
 * — a consumer passing nothing gets the card it always got — but every field
 * is now the consumer's to set.
 */
describe('BlogPost author card', () => {
  const card = (container: HTMLElement) => container.querySelector('footer') as HTMLElement;

  it('renders the default author when none is given', () => {
    const { container } = renderPost();
    const footer = card(container);
    expect(footer.textContent).toContain('RK');
    expect(footer.textContent).toContain('Written by Ryan Kelly');
    expect(footer.textContent).toContain('ryankelly.dev • Systems Architecture & Brutalist UI');
    expect(footer.querySelector('a')).toBeNull();
  });

  it("renders the default author's name as a string exactly as omitting the prop", () => {
    const omitted = renderPost().container.innerHTML;
    const named = renderPost({ author: 'Ryan Kelly' }).container.innerHTML;
    expect(named).toBe(omitted);
  });

  it("gives a guest string only its own name, never the default's bio or initials", () => {
    const { container } = renderPost({ author: 'A Guest' });
    const footer = card(container);
    expect(footer.textContent).toContain('AG');
    expect(footer.textContent).toContain('Written by A Guest');
    expect(footer.textContent).not.toContain('ryankelly.dev');
    expect(footer.textContent).not.toContain('RK');
  });

  it('takes every field from an author object', () => {
    const { container } = renderPost({
      author: { name: 'Ada King Lovelace', url: 'https://example.com/ada', description: 'Analyst' },
    });
    const footer = card(container);
    expect(screen.getByText('Ada King Lovelace', { selector: 'span' })).toBeTruthy();
    expect(footer.textContent).toContain('AL');
    expect(footer.textContent).toContain('Analyst');
    const link = screen.getByRole('link', { name: 'Ada King Lovelace' });
    expect(link.getAttribute('href')).toBe('https://example.com/ada');
    expect(footer.textContent).not.toContain('ryankelly.dev');
  });

  it('prefers explicit initials to derived ones', () => {
    const { container } = renderPost({ author: { name: 'Ada King Lovelace', initials: 'AKL' } });
    expect(card(container).textContent).toContain('AKL');
  });

  it('renders the avatar in place of the initials', () => {
    const { container } = renderPost({
      author: { name: 'Ada Lovelace', avatar: <span data-testid="avatar">pic</span> },
    });
    const footer = card(container);
    expect(footer.querySelector('[data-testid="avatar"]')).not.toBeNull();
    expect(footer.textContent).not.toContain('AL');
  });

  it('leaves the name unlinked and the description out when neither is given', () => {
    const { container } = renderPost({ author: { name: 'Ada Lovelace' } });
    const footer = card(container);
    expect(footer.querySelector('a')).toBeNull();
    expect(footer.querySelectorAll('span')).toHaveLength(0);
  });

  it('lets the authorCard slot replace the card while the byline keeps the author', () => {
    const { container } = renderPost({
      author: { name: 'Ada Lovelace' },
      authorCard: <p>Two authors</p>,
    });
    expect(card(container).textContent).toBe('Two authors');
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  });

  it('drops the footer when authorCard is null', () => {
    const { container } = renderPost({ authorCard: null });
    expect(container.querySelector('footer')).toBeNull();
  });
});
