/**
 * Seeded board fixture. Fixed "today" and hand-formatted dates: no Date.now,
 * no toLocaleString, so server and client render the same markup.
 */

export type ColumnId = 'backlog' | 'doing' | 'review' | 'done' | 'blocked';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type LabelId = 'ui' | 'api' | 'infra' | 'docs' | 'a11y' | 'perf';

export interface Column {
  id: ColumnId;
  title: string;
  /** Soft work-in-progress limit. Exceeding it warns; it does not refuse. */
  wip?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string | null;
  priority: Priority;
  labels: LabelId[];
  /** ISO date, YYYY-MM-DD. */
  due: string | null;
}

export const TODAY = '2026-10-14';

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'BACKLOG' },
  { id: 'doing', title: 'IN_PROGRESS', wip: 3 },
  { id: 'review', title: 'REVIEW', wip: 4 },
  { id: 'done', title: 'DONE' },
  { id: 'blocked', title: 'BLOCKED' },
];

export const ASSIGNEES = ['AK', 'MR', 'JT', 'SO', 'PL'] as const;

export const LABELS: Record<LabelId, { text: string; accent: 'primary' | 'secondary' | 'tertiary' | 'quiet' | 'info' | 'warning' | 'success' }> = {
  ui: { text: 'ui', accent: 'primary' },
  api: { text: 'api', accent: 'secondary' },
  infra: { text: 'infra', accent: 'tertiary' },
  docs: { text: 'docs', accent: 'quiet' },
  a11y: { text: 'a11y', accent: 'success' },
  perf: { text: 'perf', accent: 'warning' },
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatDue(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}`;
}

export function isOverdue(iso: string): boolean {
  return iso < TODAY;
}

export const TASKS: Task[] = [
  { id: 'DS-101', title: 'Define offline retry policy for the sync worker', description: 'Exponential backoff, cap at five attempts, surface the final failure in the activity feed.', assignee: 'AK', priority: 'P1', labels: ['api'], due: '2026-10-20' },
  { id: 'DS-102', title: 'Audit focus order on the settings drawer', description: 'Tab order skips the close control when the drawer opens from the keyboard.', assignee: 'MR', priority: 'P2', labels: ['a11y', 'ui'], due: '2026-10-12' },
  { id: 'DS-103', title: 'Write the migration guide for the 2.0 token rename, including every deprecated alias, the codemod invocation, the manual steps the codemod cannot do, and the rollback path', description: 'Long on purpose: this title exercises wrapping in a 280px column.', assignee: 'JT', priority: 'P3', labels: ['docs'], due: null },
  { id: 'DS-104', title: 'Spike: virtualise the activity feed', description: 'Measure 10k rows before committing to a library.', assignee: null, priority: 'P2', labels: ['perf'], due: null },
  { id: 'DS-105', title: 'Rotate staging signing keys', description: 'Runbook step 4 needs the new key id in the secrets store first.', assignee: 'SO', priority: 'P0', labels: ['infra'], due: '2026-10-15' },
  { id: 'DS-106', title: 'Card detail modal', description: 'Edit title, description, assignee, priority. Keyboard complete.', assignee: 'AK', priority: 'P1', labels: ['ui', 'a11y'], due: '2026-10-18' },
  { id: 'DS-107', title: 'Pagination cursor on /tasks', description: 'Opaque cursor, 50 per page.', assignee: 'PL', priority: 'P2', labels: ['api'], due: '2026-10-16' },
  { id: 'DS-108', title: 'Replace the polling loop with server events', description: 'Behind a flag until the load test passes.', assignee: 'MR', priority: 'P1', labels: ['api', 'perf', 'infra'], due: '2026-10-22' },
  { id: 'DS-109', title: 'Empty-state copy pass', description: 'Terse. No exclamation marks.', assignee: 'JT', priority: 'P3', labels: ['docs', 'ui'], due: null },
  { id: 'DS-110', title: 'Contrast sweep on sketch theme', description: 'Every role pair against the scrim.', assignee: 'SO', priority: 'P2', labels: ['a11y'], due: '2026-10-10' },
  { id: 'DS-111', title: 'Ship the changelog feed', description: 'RSS and JSON.', assignee: 'PL', priority: 'P3', labels: ['docs'], due: '2026-10-08' },
  { id: 'DS-112', title: 'Upgrade to Node 24', description: 'CI matrix and Dockerfile.', assignee: 'AK', priority: 'P2', labels: ['infra'], due: '2026-10-05' },
  { id: 'DS-113', title: 'Board column reorder', description: 'Needs product answer on whether columns are per-user.', assignee: 'MR', priority: 'P2', labels: ['ui'], due: null },
  { id: 'DS-114', title: 'Vendor SSO sandbox credentials', description: 'Waiting on the vendor ticket.', assignee: 'SO', priority: 'P1', labels: ['infra', 'api'], due: '2026-10-17' },
  { id: 'DS-115', title: 'Print stylesheet for the roadmap', description: 'One page, A4 and Letter.', assignee: 'JT', priority: 'P3', labels: ['ui', 'docs'], due: null },
];

export const INITIAL_ORDER: Record<ColumnId, string[]> = {
  backlog: ['DS-101', 'DS-102', 'DS-103', 'DS-104', 'DS-115'],
  doing: ['DS-105', 'DS-106', 'DS-107', 'DS-108'],
  review: ['DS-109', 'DS-110', 'DS-113', 'DS-114'],
  done: ['DS-111', 'DS-112'],
  blocked: [],
};
