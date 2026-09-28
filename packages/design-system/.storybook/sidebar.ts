/**
 * The sidebar vocabulary, closed on purpose — read by `preview.ts` for the sort
 * order and by `scripts/check-story-conventions.mjs` for the gate, so the two
 * cannot disagree about what a group is.
 *
 * Group order is the reading order, and it is an argument: token surfaces first,
 * product mockups last. A new group is a decision about what this system claims
 * to be, not a filing choice.
 *
 * A group that lists categories files every title one level deeper, as
 * `<Group>/<Category>/<Name>`. That exists because a flat group stops being
 * scannable: `Foundations/` reached 54 entries — tokens, form controls, charts,
 * dialogs and marketing sections in one alphabetical run — and `Docs/` reached
 * 22. Categories are ordered the way a consumer reaches for them, not
 * alphabetically, and are closed for the same reason groups are.
 *
 * Retitling a story changes its id. Snapshots are keyed by file name in
 * `tests/visual.spec.ts`, not by id, so a move between categories rewrites the
 * id strings there and regenerates nothing.
 */
export const GROUPS = ['Guides', 'Foundations', 'Components', 'Docs', 'Blog', 'Presentation', 'SaaS', 'Showcase'] as const;

export const CATEGORIES: Partial<Record<(typeof GROUPS)[number], readonly string[]>> = {
  Components: [
    'Actions & Forms',
    'Content',
    'Feedback',
    'Overlays',
    'Navigation',
    'Layout',
    'Icons',
    'Data',
    'Marketing',
    'Reports',
  ],
  Docs: ['Layout', 'Content', 'Figures'],
};

/** `parameters.options.storySort.order`: each categorised group followed by its category order. */
export function storySortOrder(): (string | string[])[] {
  const order: (string | string[])[] = ['Manifesto'];
  for (const group of GROUPS) {
    order.push(group);
    const categories = CATEGORIES[group];
    if (categories) order.push([...categories, '*']);
  }
  order.push('*');
  return order;
}
