import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { childrenToText, Slugger, slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Getting Started')).toBe('getting-started');
  });

  it('trims surrounding whitespace before slugging', () => {
    expect(slugify('  Spaced Out  ')).toBe('spaced-out');
  });

  it('strips punctuation rather than replacing it', () => {
    // github-slugger removes these outright, so "what's" becomes "whats" —
    // not "what-s". Anchors built here have to land on the same ids
    // rehype-slug generated at build time.
    expect(slugify("What's New?")).toBe('whats-new');
    expect(slugify('foo.bar')).toBe('foobar');
    expect(slugify('a (b) [c] {d}')).toBe('a-b-c-d');
  });

  it('strips smart quotes and dashes', () => {
    expect(slugify('“Quoted” — Dashed – ‘Here’')).toBe('quoted--dashed--here');
  });

  it('collapses no characters: repeated spaces become repeated hyphens', () => {
    // Faithful to github-slugger, which maps each whitespace char to one
    // hyphen rather than collapsing runs.
    expect(slugify('a  b')).toBe('a--b');
  });

  it('preserves accented latin and CJK', () => {
    expect(slugify('Café Über')).toBe('café-über');
    expect(slugify('日本語 見出し')).toBe('日本語-見出し');
  });

  it('keeps digits and hyphens', () => {
    expect(slugify('Section 2 - Part 3')).toBe('section-2---part-3');
  });

  it('returns an empty string for punctuation-only input', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
  });

  it('maps tabs and newlines to hyphens like any other whitespace', () => {
    expect(slugify('a\tb\nc')).toBe('a-b-c');
  });
});

describe('Slugger', () => {
  it('returns the bare slug the first time', () => {
    expect(new Slugger().slug('Overview')).toBe('overview');
  });

  it('suffixes repeats with an incrementing counter', () => {
    const slugger = new Slugger();

    expect(slugger.slug('Overview')).toBe('overview');
    expect(slugger.slug('Overview')).toBe('overview-1');
    expect(slugger.slug('Overview')).toBe('overview-2');
  });

  it('counts headings that differ only by punctuation as the same slug', () => {
    const slugger = new Slugger();

    expect(slugger.slug('Set-up')).toBe('set-up');
    expect(slugger.slug('Set up')).toBe('set-up-1');
  });

  it('tracks each distinct heading independently', () => {
    const slugger = new Slugger();

    expect(slugger.slug('A')).toBe('a');
    expect(slugger.slug('B')).toBe('b');
    expect(slugger.slug('A')).toBe('a-1');
    expect(slugger.slug('B')).toBe('b-1');
  });

  it('never emits a duplicate across a realistic document', () => {
    const slugger = new Slugger();
    const headings = ['Intro', 'Usage', 'Intro', 'API', 'Usage', 'Intro'];
    const slugs = headings.map((h) => slugger.slug(h));

    expect(new Set(slugs).size).toBe(headings.length);
  });

  it('starts over after reset', () => {
    const slugger = new Slugger();

    slugger.slug('Overview');
    slugger.reset();

    expect(slugger.slug('Overview')).toBe('overview');
  });

  // Sluggers are per-document precisely because sharing one would desynchronise
  // the second page's anchors from its rendered HTML.
  it('does not leak counts between separate instances', () => {
    expect(new Slugger().slug('Overview')).toBe('overview');
    expect(new Slugger().slug('Overview')).toBe('overview');
  });
});

describe('childrenToText', () => {
  it('passes strings and numbers through', () => {
    expect(childrenToText('hello')).toBe('hello');
    expect(childrenToText(42)).toBe('42');
  });

  it('ignores nullish and boolean nodes', () => {
    expect(childrenToText(null)).toBe('');
    expect(childrenToText(undefined)).toBe('');
    expect(childrenToText(false)).toBe('');
    expect(childrenToText(true)).toBe('');
  });

  it('concatenates arrays without separators', () => {
    expect(childrenToText(['a', 'b', 'c'])).toBe('abc');
  });

  it('flattens nested elements', () => {
    // The docstring case: <h2>The <code>tvs</code> CLI</h2> must slug to
    // "the-tvs-cli", which only works if the element's text is recovered.
    const heading = ['The ', createElement('code', null, 'tvs'), ' CLI'];

    expect(childrenToText(heading)).toBe('The tvs CLI');
    expect(slugify(childrenToText(heading))).toBe('the-tvs-cli');
  });

  it('recurses through deeply nested elements', () => {
    const node = createElement(
      'span',
      null,
      createElement('strong', null, createElement('em', null, 'deep')),
    );

    expect(childrenToText(node)).toBe('deep');
  });

  it('skips boolean short-circuits inside children', () => {
    expect(childrenToText(['a', false, 'b', null, 'c'])).toBe('abc');
  });

  it('returns empty for an element with no children', () => {
    expect(childrenToText(createElement('br'))).toBe('');
  });

  // Documented limitation, asserted so it stays a known one: a component that
  // renders its text internally is invisible here. This is why AnchorHeading
  // also accepts an explicit `id`.
  it('cannot see text rendered inside a component', () => {
    const Opaque = () => createElement('span', null, 'invisible');

    expect(childrenToText(createElement(Opaque))).toBe('');
  });
});
