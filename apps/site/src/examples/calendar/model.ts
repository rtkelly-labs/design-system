/**
 * Calendar model: seeded events, UTC date arithmetic and the two layout
 * algorithms a calendar needs (overlap columns inside a day, lanes across a
 * week). Pure and deterministic: a fixed epoch, no clock, no locale formatting.
 *
 * Time is minutes since 1970-01-01T00:00Z. A day is an integer count of days
 * from the same epoch. All-day events are stored as whole-day minute ranges so
 * one overlap test serves both kinds.
 */

export type CalendarId = 'work' | 'team' | 'personal' | 'health' | 'holiday';
/** Colour roles a calendar may wear. Roles only, never hue names. */
export type CalendarRole = 'primary' | 'secondary' | 'tertiary' | 'success' | 'quiet';

export interface CalendarDef {
  id: CalendarId;
  label: string;
  /** One letter that repeats the colour, so colour is never the only cue. */
  code: string;
  role: CalendarRole;
}

export const CALENDARS: CalendarDef[] = [
  { id: 'work', label: 'WORK', code: 'W', role: 'primary' },
  { id: 'team', label: 'TEAM', code: 'T', role: 'secondary' },
  { id: 'personal', label: 'PERSONAL', code: 'P', role: 'tertiary' },
  { id: 'health', label: 'HEALTH', code: 'H', role: 'success' },
  { id: 'holiday', label: 'HOLIDAYS', code: 'D', role: 'quiet' },
];

export interface CalEvent {
  id: string;
  title: string;
  cal: CalendarId;
  /** Start, minutes since epoch. */
  s: number;
  /** End (exclusive), minutes since epoch. */
  e: number;
  allDay: boolean;
  where?: string;
  note?: string;
}

export const MIN_DAY = 1440;

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function dayIndex(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}
export function parts(day: number): { y: number; m: number; d: number } {
  const dt = new Date(day * 86_400_000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
/** Monday = 0. 1970-01-01 was a Thursday. */
export function weekdayOf(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}
export function startOfWeek(day: number): number {
  return day - weekdayOf(day);
}
const p2 = (n: number) => String(n).padStart(2, '0');
export function isoDay(day: number): string {
  const { y, m, d } = parts(day);
  return `${y}-${p2(m)}-${p2(d)}`;
}
export function parseIsoDay(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? dayIndex(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}
export function hhmm(minOfDay: number): string {
  return `${p2(Math.floor(minOfDay / 60))}:${p2(minOfDay % 60)}`;
}
export function parseHhmm(s: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export function dayLabel(day: number): string {
  const { m, d } = parts(day);
  return `${WEEKDAYS[weekdayOf(day)]} ${d} ${MONTHS[m - 1]}`;
}
export function monthLabel(day: number): string {
  const { y, m } = parts(day);
  return `${MONTHS[m - 1]} ${y}`;
}
export function rangeLabel(first: number, last: number): string {
  const a = parts(first);
  const b = parts(last);
  if (first === last) return `${a.d} ${MONTHS[a.m - 1]} ${a.y}`;
  if (a.m === b.m) return `${a.d} - ${b.d} ${MONTHS[a.m - 1]} ${a.y}`;
  return `${a.d} ${MONTHS[a.m - 1]} - ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
}
export function whenLabel(ev: CalEvent): string {
  const d0 = Math.floor(ev.s / MIN_DAY);
  if (ev.allDay) {
    const d1 = Math.floor((ev.e - 1) / MIN_DAY);
    return d0 === d1 ? `${dayLabel(d0)} / ALL DAY` : `${dayLabel(d0)} > ${dayLabel(d1)} / ALL DAY`;
  }
  const d1 = Math.floor((ev.e - 1) / MIN_DAY);
  const t0 = hhmm(ev.s - d0 * MIN_DAY);
  const t1 = hhmm(ev.e - d1 * MIN_DAY);
  return d0 === d1 ? `${dayLabel(d0)} / ${t0} - ${t1}` : `${dayLabel(d0)} ${t0} > ${dayLabel(d1)} ${t1}`;
}

/** The fixed "now": Wednesday 14 October 2026, 10:42 UTC. */
export const TODAY = dayIndex(2026, 10, 14);
export const NOW_MIN = TODAY * MIN_DAY + 10 * 60 + 42;

let seq = 0;
function timed(title: string, cal: CalendarId, date: string, from: string, to: string, where?: string, note?: string): CalEvent {
  const day = parseIsoDay(date) as number;
  // `to` may be "24:00" or run past midnight with "+1" semantics via 25:00 etc.
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return { id: `e${++seq}`, title, cal, s: day * MIN_DAY + fh * 60 + fm, e: day * MIN_DAY + th * 60 + tm, allDay: false, where, note };
}
function whole(title: string, cal: CalendarId, from: string, to: string, where?: string, note?: string): CalEvent {
  const a = parseIsoDay(from) as number;
  const b = parseIsoDay(to) as number;
  return { id: `e${++seq}`, title, cal, s: a * MIN_DAY, e: (b + 1) * MIN_DAY, allDay: true, where, note };
}

function buildSeed(): CalEvent[] {
  seq = 0;
  const out: CalEvent[] = [];
  // Daily stand-up across three weeks: many identical short events.
  for (let d = parseIsoDay('2026-10-05') as number; d <= (parseIsoDay('2026-10-23') as number); d++) {
    if (weekdayOf(d) < 5) out.push(timed('STAND-UP', 'team', isoDay(d), '09:30', '09:45', 'ROOM 2 / MEET', 'Blockers only.'));
  }
  out.push(
    // Overlap cluster on Wednesday (today): 4 events, 3 columns.
    timed('DESIGN REVIEW', 'work', '2026-10-14', '10:00', '11:00', 'ROOM 4', 'Calendar grid, final pass.'),
    timed('VENDOR CALL', 'work', '2026-10-14', '10:30', '11:30', 'MEET', 'Renewal terms.'),
    timed('1:1 / ALEX', 'team', '2026-10-14', '10:45', '12:00', 'WALK', 'Quarter goals.'),
    timed('SHIP NOTES', 'work', '2026-10-14', '11:45', '12:15', undefined, 'Draft in the release doc.'),
    timed('LUNCH', 'personal', '2026-10-14', '12:30', '13:15'),
    timed('PAIR / TOKENS', 'team', '2026-10-14', '14:00', '16:00', 'ROOM 2'),
    timed('PHYSIO', 'health', '2026-10-14', '17:15', '18:00', 'CLINIC 9', 'Bring the band.'),
    timed('QUICK SYNC', 'work', '2026-10-14', '15:00', '15:15'),
    // Monday
    timed('PLANNING', 'work', '2026-10-12', '11:00', '12:30', 'ROOM 4'),
    timed('RUN', 'health', '2026-10-12', '07:00', '07:45'),
    timed('DENTIST', 'health', '2026-10-12', '16:30', '17:30', 'CLINIC 2'),
    // Tuesday
    timed('RETRO', 'team', '2026-10-13', '13:00', '14:00', 'ROOM 2'),
    timed('GROCERIES', 'personal', '2026-10-13', '18:00', '18:45'),
    timed('INTERVIEW', 'work', '2026-10-13', '14:00', '15:00', 'MEET'),
    // Thursday, including an overnight on-call that crosses midnight.
    timed('ON-CALL HANDOVER', 'work', '2026-10-15', '09:00', '09:30'),
    timed('ARCH SYNC', 'work', '2026-10-15', '13:30', '15:30', 'ROOM 1'),
    timed('ON-CALL', 'team', '2026-10-15', '22:00', '25:30', undefined, 'Primary. Pager on.'),
    // Friday
    timed('DEMO DAY', 'work', '2026-10-16', '15:00', '16:30', 'ATRIUM'),
    timed('YOGA', 'health', '2026-10-16', '07:30', '08:15'),
    timed('DINNER / MARA', 'personal', '2026-10-16', '19:00', '21:30', 'KILN'),
    // Weekend
    timed('LONG RUN', 'health', '2026-10-17', '08:00', '10:00'),
    timed('MARKET', 'personal', '2026-10-17', '10:30', '12:00'),
    timed('FAMILY CALL', 'personal', '2026-10-18', '11:00', '12:00'),
    // All-day and multi-day
    whole('OFFSITE', 'work', '2026-10-13', '2026-10-15', 'HARBOUR HOUSE', 'Three days, no laptops in sessions.'),
    whole('RELEASE FREEZE', 'team', '2026-10-14', '2026-10-16'),
    whole('PLANT SWAP', 'personal', '2026-10-17', '2026-10-17'),
    whole('LABOUR DAY (OBSERVED)', 'holiday', '2026-10-12', '2026-10-12'),
    whole('SCHOOL BREAK', 'holiday', '2026-10-19', '2026-10-23'),
    whole('SPRINT 41', 'team', '2026-10-05', '2026-10-16'),
    whole('SPRINT 42', 'team', '2026-10-19', '2026-10-30'),
    // Other weeks, for month and agenda.
    timed('QUARTER REVIEW', 'work', '2026-10-06', '13:00', '15:00', 'ROOM 4'),
    timed('DENTAL FLOSS CLUB', 'health', '2026-10-07', '08:00', '08:30'),
    timed('BOARD PREP', 'work', '2026-10-08', '10:00', '11:30'),
    timed('PIZZA FRIDAY', 'personal', '2026-10-09', '12:30', '13:30'),
    timed('ALL HANDS', 'work', '2026-10-20', '16:00', '17:00', 'ATRIUM'),
    timed('ONBOARDING', 'work', '2026-10-21', '10:00', '12:00', 'ROOM 1'),
    timed('PRESENTATION', 'work', '2026-10-21', '11:00', '12:30', 'ROOM 4'),
    timed('1:1 / SAM', 'team', '2026-10-21', '11:30', '12:00'),
    timed('PHYSIO', 'health', '2026-10-21', '17:15', '18:00', 'CLINIC 9'),
    timed('HALLOWEEN PARTY', 'personal', '2026-10-31', '19:00', '23:00'),
    timed('PLANNING', 'work', '2026-10-26', '11:00', '12:30', 'ROOM 4'),
    timed('PLANNING', 'work', '2026-11-02', '11:00', '12:30', 'ROOM 4'),
    whole('DAYLIGHT SAVING ENDS', 'holiday', '2026-11-01', '2026-11-01'),
    whole('ANNIVERSARY', 'personal', '2026-10-28', '2026-10-28'),
  );
  for (const d of [1, 2, 3]) out.push(timed('PHYSIO', 'health', `2026-10-${p2(d)}`, '17:15', '18:00'));
  return out;
}
export const SEED_EVENTS: CalEvent[] = buildSeed();

/* ---------- layout ---------- */

export interface Placed {
  ev: CalEvent;
  /** Minutes from the top of the day grid. */
  top: number;
  height: number;
  col: number;
  cols: number;
  /** Columns this block may stretch across (>= 1) into free columns to its right. */
  span: number;
  /** Starts before / ends after this day (continuation arrows). */
  contFrom: boolean;
  contTo: boolean;
}

/**
 * Pack one day's timed events into overlap columns.
 *
 * Events that touch transitively form a cluster; each takes the first column
 * whose previous occupant has ended. Within a cluster every block is 1/cols
 * wide, then stretches right across columns that are free for its whole
 * duration. A minimum visual height keeps a 15 minute event legible, and
 * overlap is judged on the *displayed* extent so short blocks never overprint.
 */
export function layoutDay(events: CalEvent[], day: number, minVisible: number): Placed[] {
  const base = day * MIN_DAY;
  const segs = events
    .filter((ev) => !ev.allDay && ev.e > base && ev.s < base + MIN_DAY)
    .map((ev) => {
      const a = Math.max(ev.s, base) - base;
      const b = Math.min(ev.e, base + MIN_DAY) - base;
      return { ev, a, b: Math.max(b, a + minVisible), contFrom: ev.s < base, contTo: ev.e > base + MIN_DAY };
    })
    .sort((x, y) => x.a - y.a || y.b - x.b || x.ev.id.localeCompare(y.ev.id));

  const placed: Placed[] = [];
  let cluster: typeof segs = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const assigned = cluster.map((sg) => {
      let c = colEnds.findIndex((end) => end <= sg.a);
      if (c === -1) { c = colEnds.length; colEnds.push(sg.b); } else colEnds[c] = sg.b;
      return { sg, c };
    });
    const cols = colEnds.length;
    for (const { sg, c } of assigned) {
      let span = 1;
      for (let k = c + 1; k < cols; k++) {
        const blocked = assigned.some((o) => o.c === k && o.sg.a < sg.b && o.sg.b > sg.a);
        if (blocked) break;
        span++;
      }
      placed.push({ ev: sg.ev, top: sg.a, height: sg.b - sg.a, col: c, cols, span, contFrom: sg.contFrom, contTo: sg.contTo });
    }
    cluster = [];
  };
  for (const sg of segs) {
    if (cluster.length && sg.a >= clusterEnd) flush();
    if (!cluster.length) clusterEnd = sg.b;
    cluster.push(sg);
    clusterEnd = Math.max(clusterEnd, sg.b);
  }
  flush();
  return placed;
}

export interface Lane {
  ev: CalEvent;
  /** 0-based first and last column inside the row (clipped to the row). */
  c0: number;
  c1: number;
  lane: number;
  clipL: boolean;
  clipR: boolean;
}

/**
 * Lane assignment for the all-day row and for every month week. `segmentTimed`
 * puts single-day timed events into the same lanes (the month view draws them
 * as one-line chips); the week view passes false and gets all-day events only.
 */
export function layoutLanes(events: CalEvent[], firstDay: number, days: number, segmentTimed: boolean): Lane[] {
  const lastDay = firstDay + days - 1;
  const items = events
    .filter((ev) => (segmentTimed || ev.allDay) && ev.e > firstDay * MIN_DAY && ev.s < (lastDay + 1) * MIN_DAY)
    .map((ev) => {
      const d0 = Math.floor(ev.s / MIN_DAY);
      const d1 = Math.floor((ev.e - 1) / MIN_DAY);
      return { ev, d0, d1, c0: Math.max(d0, firstDay) - firstDay, c1: Math.min(d1, lastDay) - firstDay, clipL: d0 < firstDay, clipR: d1 > lastDay };
    })
    .sort((a, b) => a.d0 - b.d0 || (b.d1 - b.d0) - (a.d1 - a.d0) || Number(b.ev.allDay) - Number(a.ev.allDay) || a.ev.s - b.ev.s || a.ev.id.localeCompare(b.ev.id));
  const laneEnds: number[] = [];
  return items.map((it) => {
    let lane = laneEnds.findIndex((end) => end < it.c0);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(it.c1); } else laneEnds[lane] = it.c1;
    return { ev: it.ev, c0: it.c0, c1: it.c1, lane, clipL: it.clipL, clipR: it.clipR };
  });
}

export function eventsOnDay(events: CalEvent[], day: number): CalEvent[] {
  return events
    .filter((ev) => ev.e > day * MIN_DAY && ev.s < (day + 1) * MIN_DAY)
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.s - b.s || a.id.localeCompare(b.id));
}
