import { readFileSync } from 'node:fs';
import path from 'node:path';

import { THEME_LEVELS } from '../src/theme/levels';

/** Shared between the walkthrough spec and anything else reading the story list. */

export interface StoryEntry {
  id: string;
  /** Storybook group, e.g. `Foundations/Card`. */
  title: string;
  /** Story name within the group, e.g. `Default`. */
  name: string;
}

export const REPO_ROOT = path.resolve(__dirname, '..');
export const STORYBOOK_INDEX = path.join(REPO_ROOT, 'storybook-static', 'index.json');

/**
 * Every level the system ships, re-exported from the ladder rather than
 * re-listed. Capturing all of them is the point of the walkthrough: a token
 * change that reads fine on `midnight` can be unusable on `bright`, and a pixel
 * diff against a single-level baseline will never surface that.
 *
 * Adding a rung to `src/theme/levels.ts` widens this matrix automatically.
 */
export const THEMES = THEME_LEVELS;

export type Theme = (typeof THEMES)[number];

/**
 * Read the story list out of Storybook's own build index, so new stories are
 * picked up without touching this file.
 */
export function loadStories(): StoryEntry[] {
  let raw: string;
  try {
    raw = readFileSync(STORYBOOK_INDEX, 'utf8');
  } catch {
    throw new Error(
      `Storybook index not found at ${STORYBOOK_INDEX}. Run \`pnpm build-storybook\` first.`,
    );
  }

  const parsed = JSON.parse(raw) as {
    entries: Record<string, { id: string; title: string; name: string; type?: string }>;
  };

  return Object.values(parsed.entries)
    .filter((entry) => entry.type === 'story')
    .map(({ id, title, name }) => ({ id, title, name }))
    .sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));
}
