import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUTHOR, deriveInitials, resolveAuthor } from './author';

describe('deriveInitials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(deriveInitials('Ryan Kelly')).toBe('RK');
  });

  it('gives a one-word name one letter rather than inventing a second', () => {
    expect(deriveInitials('Prince')).toBe('P');
  });

  it('skips the middle of a three-word name', () => {
    expect(deriveInitials('Ada King Lovelace')).toBe('AL');
  });

  it('uppercases, and ignores surrounding and repeated whitespace', () => {
    expect(deriveInitials('  bell   hooks ')).toBe('BH');
  });

  it('splits on whitespace only, so a hyphenated name is one word', () => {
    expect(deriveInitials('Jean-Luc Picard')).toBe('JP');
  });

  it('takes a whole code point, not half a surrogate pair', () => {
    expect(deriveInitials('\u{1D49C}da Lovelace')).toBe('\u{1D49C}L');
  });

  it("uppercases without the runtime's locale, so server and client agree", () => {
    // A Turkish runtime maps `i` to dotted `İ` under locale-aware casing.
    const spy = vi
      .spyOn(String.prototype, 'toLocaleUpperCase')
      .mockImplementation(function (this: string) {
        return this.replace(/i/g, 'İ').toUpperCase();
      });
    try {
      expect(deriveInitials('ipek yilmaz')).toBe('IY');
    } finally {
      spy.mockRestore();
    }
  });

  it('gives an empty name no initials', () => {
    expect(deriveInitials('   ')).toBe('');
  });

  it('derives the default author as RK, which is what the card always showed', () => {
    expect(deriveInitials(DEFAULT_AUTHOR.name)).toBe('RK');
  });
});

describe('resolveAuthor', () => {
  it('is the default when absent', () => {
    expect(resolveAuthor(undefined)).toBe(DEFAULT_AUTHOR);
  });

  it('is the default when a string names the default author', () => {
    expect(resolveAuthor(DEFAULT_AUTHOR.name)).toBe(DEFAULT_AUTHOR);
  });

  it('is just the name for any other string', () => {
    expect(resolveAuthor('A Guest')).toEqual({ name: 'A Guest' });
  });

  it('is the object itself, with nothing merged in from the default', () => {
    const author = { name: 'Ryan Kelly' };
    expect(resolveAuthor(author)).toBe(author);
  });
});
