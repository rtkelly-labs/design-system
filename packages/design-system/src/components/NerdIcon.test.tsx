import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Glyph } from './Glyph';
import { NERD_GLYPHS, NerdIcon } from './NerdIcon';

describe('NerdIcon', () => {
  it('maps names to the codepoints the bundled font draws them with', () => {
    // Read from the font's cmap (oct-git_merge, md-kubernetes, md-aws, oct-cpu, fa-memory).
    // `\uf408` is oct-mark_github, not a merge glyph; the supplementary-plane
    // entries were once hand-typed surrogate pairs that landed on unrelated icons.
    const cp = (name: keyof typeof NERD_GLYPHS) => NERD_GLYPHS[name].codePointAt(0);
    expect(cp('git-merge')).toBe(0xf419);
    expect(cp('kubernetes')).toBe(0xf10fe);
    expect(cp('aws')).toBe(0xf0e0f);
    expect(cp('cpu')).toBe(0xf4bc);
    expect(cp('ram')).toBe(0xefc5);
  });

  it('renders named developer icon glyphs', () => {
    render(<NerdIcon name="git-branch" data-testid="branch-icon" />);

    const icon = screen.getByTestId('branch-icon');
    expect(icon.textContent).toContain(NERD_GLYPHS['git-branch']);
  });

  it('renders bracketed mode with monospace brackets', () => {
    render(<NerdIcon name="terminal" bracketed data-testid="term-icon" />);

    const icon = screen.getByTestId('term-icon');
    expect(icon.textContent).toContain('[');
    expect(icon.textContent).toContain(']');
    expect(icon.textContent).toContain(NERD_GLYPHS['terminal']);
  });

  it('sets aria-hidden by default and aria-label when label is provided', () => {
    const { rerender } = render(<NerdIcon name="search" data-testid="icon" />);
    expect(screen.getByTestId('icon').getAttribute('aria-hidden')).toBe('true');

    rerender(<NerdIcon name="search" label="Search repository" data-testid="icon" />);
    expect(screen.getByLabelText('Search repository')).toBeDefined();
  });

  it('addresses semantic roles and emits no forbidden color literals', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;

    const { container } = render(
      <NerdIcon name="database" accent="primary" size="lg" bracketed />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      expect(node.className, `${node.tagName} pins a palette entry`).not.toMatch(
        FORBIDDEN,
      );
    }
  });
});

describe('Glyph', () => {
  it('renders custom ASCII child glyph with brackets', () => {
    render(
      <Glyph bracketed accent="secondary" data-testid="ascii-glyph">
        -&gt;
      </Glyph>,
    );

    const glyph = screen.getByTestId('ascii-glyph');
    expect(glyph.textContent).toContain('[');
    expect(glyph.textContent).toContain('->');
    expect(glyph.textContent).toContain(']');
  });

  it('delegates named icons to NerdIcon', () => {
    render(<Glyph name="docker" data-testid="docker-glyph" />);

    const glyph = screen.getByTestId('docker-glyph');
    expect(glyph.textContent).toContain(NERD_GLYPHS['docker']);
  });
});
