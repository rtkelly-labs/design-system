import { EPOCH, seeded } from '@/data/fixtures';

/**
 * Seeded issue fixtures for the inbox example. Deterministic: a fixed seed and
 * the site's fixed epoch, dates formatted by hand in UTC.
 */

export const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PEOPLE = ['AK', 'BO', 'CJ', 'DM', 'EN', 'FT'] as const;
export const ME = 'AK';

export const LABELS = ['bug', 'a11y', 'tokens', 'docs', 'perf', 'infra', 'api'] as const;

export interface Issue {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  labels: readonly string[];
  comments: number;
  unread: boolean;
  updatedMs: number;
  body: string;
}

const TITLES = [
  'Focus ring clipped inside overflow-x containers',
  'Tabs: typeahead on the tablist',
  'Menu popup flips under the sticky header',
  'Contrast of quiet accent on sketch raised surface',
  'DataTable: expose row selection state',
  'Skeleton pulse ignores reduced motion in print',
  'Select list does not scroll highlighted item into view',
  'Drawer close button loses focus ring in sketch',
  'Toast stack overlaps the mobile nav',
  'Pagination: totalPages of zero renders NaN',
  'Badge truncates long labels without a title',
  'Token build is not idempotent on windows paths',
  'Checkbox indeterminate not announced by VoiceOver',
  'Document the hard-offset shadow ladder',
  'EmptyState action wraps under the icon at 320px',
  'Virtualized table loses aria-rowindex after sort',
  'ANSI export drops bright black on sketch',
  'Input helper text collides with error text',
  'Tooltip delay differs between hover and focus',
  'Release train skipped a departure after a cancelled run',
];

function stamp(ms: number): string {
  const d = new Date(ms);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())} ${months[d.getUTCMonth()]} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
export { stamp };

function build(count: number): Issue[] {
  const rng = seeded(4417);
  return Array.from({ length: count }, (_, i) => {
    const title = TITLES[i % TITLES.length] as string;
    const suffix = i >= TITLES.length ? ` (${Math.floor(i / TITLES.length) + 1})` : '';
    const labelCount = rng.int(0, 2);
    const labels = Array.from(new Set(Array.from({ length: labelCount }, () => rng.pick(LABELS))));
    const assignee = rng.next() < 0.18 ? null : rng.pick(PEOPLE);
    return {
      id: `DS-${String(1200 - i * 7).padStart(4, '0')}`,
      title: `${title}${suffix}`,
      status: rng.pick(STATUSES),
      priority: rng.pick(PRIORITIES),
      assignee,
      labels,
      comments: rng.int(0, 14),
      unread: rng.next() < 0.3,
      updatedMs: EPOCH - rng.int(1, 60 * 24 * 9) * 60_000,
      body:
        'Reproduces on the applied site at both levels. The affected surface is correct in the story ' +
        'but wrong once composed inside a scroll container. Expected: the control keeps its drawn edge ' +
        'and its focus state. Actual: the edge is clipped by the nearest overflow ancestor.',
    };
  }).sort((a, b) => b.updatedMs - a.updatedMs);
}

export const ISSUES: readonly Issue[] = build(60);
