import type { ReactNode } from 'react';

/** Who wrote a post, as `BlogPost`'s byline and author card display it. */
export interface BlogAuthor {
  /** Shown in the byline row and after "Written by" in the author card. */
  name: string;
  /**
   * The letters in the author card's square. Derived from `name` when absent:
   * the first letter of the first word and of the last word, so a one-word
   * name gives one letter and a three-word name skips the middle one.
   */
  initials?: string;
  /**
   * Replaces the initials square when present — normally an `Avatar` with the
   * author's picture. Use `size="sm"` to keep the card's 40px rhythm.
   */
  avatar?: ReactNode;
  /**
   * Where the name in the author card links to. The name is plain text when
   * absent. Internal hrefs go through the `LinkProvider`'s router link.
   */
  url?: string;
  /** The line under the name in the author card. Omitted when absent. */
  description?: string;
}

// The byline of the site this package was built for. It lives here rather
// than in `BlogPost.tsx` so the component holds no author of its own: every
// field below is what a consumer who passes nothing gets, and each one is
// overridable through `BlogPost`'s `author` prop.
//
// `initials` is left to derivation, which gives `RK`, and there is no `url`:
// the card has never linked the name, and a link would move the default's
// rendering.
export const DEFAULT_AUTHOR: BlogAuthor = {
  name: 'Ryan Kelly',
  description: 'ryankelly.dev • Systems Architecture & Brutalist UI',
};

// First letter of the first word, plus first letter of the last word when
// there is more than one: `Ryan Kelly` is `RK`, `Prince` is `P`, `Ada King
// Lovelace` is `AL`. Words split on whitespace only, so `Jean-Luc Picard` is
// `JP`. Letters are taken by code point rather than UTF-16 unit, so a name
// beginning outside the BMP is not cut in half. An empty name gives `''`.
// Uppercased without a locale, so a server and the browser hydrating its
// markup agree whatever their locales are: `ipek` is `I`, never Turkish `İ`.
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = (word: string) => Array.from(word)[0] ?? '';
  const letters =
    words.length === 1 ? first(words[0]) : first(words[0]) + first(words[words.length - 1]);
  return letters.toUpperCase();
}

// A string is a name. Naming the default author gets the default author
// whole, so `author="Ryan Kelly"` renders exactly as omitting the prop does;
// any other name gets only itself, so a guest is never given the default's
// description.
export function resolveAuthor(author: string | BlogAuthor | undefined): BlogAuthor {
  if (author === undefined) return DEFAULT_AUTHOR;
  if (typeof author === 'string') {
    return author === DEFAULT_AUTHOR.name ? DEFAULT_AUTHOR : { name: author };
  }
  return author;
}
