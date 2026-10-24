'use client';

/**
 * Calendar: week, day, month and agenda views over seeded events.
 *
 * Built only from `@rtkelly-labs/design-system`: Tabs for the view switch,
 * Popover for event detail, Modal for create, Menu for options and actions,
 * Checkbox for calendar visibility. Everything temporal (the time grid, overlap
 * columns, the now marker, all-day lanes, the month grid, the mini navigator)
 * is composed here from divs, because the package has no calendar primitive.
 * Calendar colours are roles, repeated by a letter code and a dashed edge for
 * the quiet role, so colour is never the only signal.
 */

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Menu,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  Modal,
  Popover,
  Select,
  Tabs,
  TabsList,
  TabsTab,
} from '@rtkelly-labs/design-system';
import {
  CALENDARS,
  MIN_DAY,
  MONTHS,
  NOW_MIN,
  SEED_EVENTS,
  TODAY,
  WEEKDAYS,
  dayLabel,
  eventsOnDay,
  hhmm,
  isoDay,
  layoutDay,
  layoutLanes,
  monthLabel,
  parseHhmm,
  parseIsoDay,
  parts,
  rangeLabel,
  startOfWeek,
  weekdayOf,
  whenLabel,
  dayIndex,
} from './model';
import type { CalEvent, CalendarDef, CalendarId, CalendarRole } from './model';

/* ---------- colour by role: literal classes so Tailwind can see them ---------- */

const ROLE: Record<CalendarRole, { block: string; bar: string; swatch: string; ink: string }> = {
  primary: {
    block: 'border-l-accent-primary bg-[color-mix(in_oklab,var(--ds-accent-primary)_16%,var(--ds-surface-raised))]',
    bar: 'bg-accent-primary text-content-inverse',
    swatch: 'bg-accent-primary',
    ink: 'text-accent-primary',
  },
  secondary: {
    block: 'border-l-accent-secondary bg-[color-mix(in_oklab,var(--ds-accent-secondary)_16%,var(--ds-surface-raised))]',
    bar: 'bg-accent-secondary text-content-inverse',
    swatch: 'bg-accent-secondary',
    ink: 'text-accent-secondary',
  },
  tertiary: {
    block: 'border-l-accent-tertiary bg-[color-mix(in_oklab,var(--ds-accent-tertiary)_16%,var(--ds-surface-raised))]',
    bar: 'bg-accent-tertiary text-content-inverse',
    swatch: 'bg-accent-tertiary',
    ink: 'text-accent-tertiary',
  },
  success: {
    block: 'border-l-intent-success bg-[color-mix(in_oklab,var(--ds-intent-success)_16%,var(--ds-surface-raised))]',
    bar: 'bg-intent-success text-content-inverse',
    swatch: 'bg-intent-success',
    ink: 'text-intent-success',
  },
  quiet: {
    block: 'border-l-accent-quiet bg-[color-mix(in_oklab,var(--ds-accent-quiet)_16%,var(--ds-surface-raised))] border-dashed',
    bar: 'bg-accent-quiet text-content-inverse',
    swatch: 'bg-accent-quiet',
    ink: 'text-accent-quiet',
  },
};
const calOf = (id: CalendarId): CalendarDef => CALENDARS.find((c) => c.id === id) as CalendarDef;

type View = 'week' | 'day' | 'month' | 'agenda';
type Density = 'compact' | 'cozy';
const HOUR_PX: Record<Density, number> = { compact: 36, cozy: 52 };
const GUTTER = 52;
const MAX_LANES = 3;

/* ---------- the event surface: one button, three shapes ---------- */

interface EventButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ev: CalEvent;
  shape: 'block' | 'bar' | 'row';
  continuesLeft?: boolean;
  continuesRight?: boolean;
  /** Show the clock time before the title. */
  showTime?: boolean;
  /** Hide the label and keep only the coloured bar (narrow month cells). */
  glyphOnly?: boolean;
}

const EventButton = forwardRef<HTMLButtonElement, EventButtonProps>(function EventButton(
  { ev, shape, continuesLeft, continuesRight, showTime, glyphOnly, className = '', style, ...rest },
  ref,
) {
  const cal = calOf(ev.cal);
  const role = ROLE[cal.role];
  const d0 = Math.floor(ev.s / MIN_DAY);
  const time = ev.allDay ? '' : hhmm(ev.s - d0 * MIN_DAY);
  const label = `${ev.title}, ${whenLabel(ev)}, ${cal.label} calendar`;
  const base =
    'block w-full min-w-0 cursor-pointer overflow-hidden text-left font-mono text-xs leading-4 '
    + 'hover:shadow-hard-sm focus-visible:z-30';
  if (shape === 'bar') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={`${base} ${role.bar} ${continuesLeft ? 'border-l-0' : ''} h-[var(--lane)] truncate px-1 font-bold ${className}`}
        style={style}
        {...rest}
      >
        <span className={glyphOnly ? 'max-md:sr-only' : ''}>
          {continuesLeft ? '< ' : ''}
          {ev.title}
          {continuesRight ? ' >' : ''}
        </span>
      </button>
    );
  }
  if (shape === 'row') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={`${base} flex items-center gap-3 border border-l-4 border-edge-subtle px-3 py-2 text-sm text-content-primary ${role.block} ${className}`}
        style={style}
        {...rest}
      >
        <span className="w-24 shrink-0 text-content-secondary">{ev.allDay ? 'ALL DAY' : `${time} - ${hhmm(ev.e - Math.floor((ev.e - 1) / MIN_DAY) * MIN_DAY)}`}</span>
        <span className="min-w-0 flex-1 truncate font-bold">{ev.title}</span>
        <span className="shrink-0 font-bold">[{cal.code}]</span>
      </button>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={`${ev.title} / ${whenLabel(ev)}`}
      className={`${base} border border-l-4 border-edge-subtle px-1 text-content-primary ${role.block} ${className}`}
      style={style}
      {...rest}
    >
      <span className={`block ${glyphOnly ? 'max-md:sr-only' : ''}`}>
        <span className="font-bold">{continuesLeft ? '< ' : ''}{ev.title}</span>
        {showTime && time ? <span className="ml-1 text-content-secondary">{time}</span> : null}
        {continuesRight ? <span className="text-content-secondary"> &gt;</span> : null}
      </span>
    </button>
  );
});

/** An event's detail popover. The trigger is the event itself. */
function EventPopover({
  ev,
  trigger,
  onDelete,
  onDuplicate,
}: {
  ev: CalEvent;
  trigger: ReactNode;
  onDelete: (id: string) => void;
  onDuplicate: (ev: CalEvent) => void;
}) {
  const cal = calOf(ev.cal);
  return (
    <Popover trigger={trigger as never} title={ev.title} side="right" align="start">
      <dl className="m-0 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 font-mono text-xs">
        <dt className="text-content-muted">WHEN</dt>
        <dd className="m-0">{whenLabel(ev)}</dd>
        <dt className="text-content-muted">CALENDAR</dt>
        <dd className="m-0 flex items-center gap-2">
          <span aria-hidden className={`inline-block size-3 ${ROLE[cal.role].swatch}`} />
          [{cal.code}] {cal.label}
        </dd>
        {ev.where ? (<><dt className="text-content-muted">WHERE</dt><dd className="m-0">{ev.where}</dd></>) : null}
        {ev.note ? (<><dt className="text-content-muted">NOTES</dt><dd className="m-0">{ev.note}</dd></>) : null}
      </dl>
      <div className="mt-4">
        <Menu trigger={<Button appearance="raised" size="sm">ACTIONS</Button>}>
          <MenuItem onClick={() => onDuplicate(ev)}>Duplicate to next day</MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger" onClick={() => onDelete(ev.id)}>Delete</MenuItem>
        </Menu>
      </div>
    </Popover>
  );
}

/* ---------- mini month navigator ---------- */

function addMonths(day: number, n: number): number {
  const { y, m } = parts(day);
  return dayIndex(y, m + n, 1);
}

function monthCells(anchor: number): { first: number; weeks: number } {
  const { y, m } = parts(anchor);
  const first = startOfWeek(dayIndex(y, m, 1));
  const last = dayIndex(y, m + 1, 0);
  return { first, weeks: Math.ceil((last - first + 1) / 7) };
}

function MiniMonth({ anchor, shown, onShown, onPick, weekMode }: { anchor: number; shown: number; onShown: (d: number) => void; onPick: (d: number) => void; weekMode: boolean }) {
  const { first, weeks } = monthCells(shown);
  const month = parts(shown).m;
  const ref = useRef<HTMLDivElement>(null);
  const aw = startOfWeek(anchor);
  const inShown = parts(anchor).m === month && parts(anchor).y === parts(shown).y;
  const tabDay = inShown ? anchor : dayIndex(parts(shown).y, month, 1);
  const move = (e: ReactKeyboardEvent, d: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = d + delta;
    if (parts(next).m !== month) onShown(next);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
  };
  return (
    <div className="border-2 border-edge-strong bg-surface-raised p-2">
      <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold">
        <button type="button" aria-label="Previous month" className="size-8 cursor-pointer border-2 border-edge-strong hover:bg-surface-sunken" onClick={() => onShown(addMonths(shown, -1))}>&lt;</button>
        <span aria-live="polite">[ {monthLabel(shown)} ]</span>
        <button type="button" aria-label="Next month" className="size-8 cursor-pointer border-2 border-edge-strong hover:bg-surface-sunken" onClick={() => onShown(addMonths(shown, 1))}>&gt;</button>
      </div>
      <div ref={ref} role="grid" aria-label={`Date picker, ${monthLabel(shown)}`} className="font-mono text-xs">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <span key={w} role="columnheader" aria-label={w} className="py-1 text-center text-content-muted">{w[0]}</span>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, di) => {
              const d = first + wi * 7 + di;
              const out = parts(d).m !== month;
              const sel = d === anchor;
              const inWeek = weekMode && startOfWeek(d) === aw;
              return (
                <span role="gridcell" key={d} aria-selected={sel} className={inWeek ? 'bg-surface-sunken' : ''}>
                  <button
                    type="button"
                    data-day={d}
                    tabIndex={d === tabDay ? 0 : -1}
                    aria-label={dayLabel(d)}
                    aria-current={d === TODAY ? 'date' : undefined}
                    onClick={() => onPick(d)}
                    onKeyDown={(e) => move(e, d)}
                    className={`h-8 w-full cursor-pointer text-center ${sel ? 'bg-accent-primary font-bold text-content-inverse' : d === TODAY ? 'border-2 border-accent-tertiary font-bold' : 'hover:bg-surface-sunken'} ${out && !sel ? 'text-content-muted' : ''}`}
                  >
                    {parts(d).d}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- week / day time grid ---------- */

interface SharedActions {
  onDelete: (id: string) => void;
  onDuplicate: (ev: CalEvent) => void;
  onCreate: (day: number, minOfDay: number | null) => void;
}

function TimeGrid({
  days,
  events,
  density,
  anchor,
  setAnchor,
  actions,
  openDay,
}: {
  days: number[];
  events: CalEvent[];
  density: Density;
  anchor: number;
  setAnchor: (d: number) => void;
  actions: SharedActions;
  openDay: (d: number) => void;
}) {
  const H = HOUR_PX[density];
  const ppm = H / 60;
  const n = days.length;
  const [slot, setSlot] = useState(10 * 2 + 1); // half-hour index of the keyboard cursor
  const scrollRef = useRef<HTMLDivElement>(null);
  const [liveMsg, setLiveMsg] = useState('');
  // Land at 07:00 on first paint of this view.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * H - 10;
  }, [H]);
  const lanes = useMemo(() => layoutLanes(events, days[0], n, false), [events, days, n]);
  const laneCount = lanes.reduce((m, l) => Math.max(m, l.lane + 1), 0);
  const cols = `${GUTTER}px repeat(${n}, minmax(0, 1fr))`;
  const minW = n === 1 ? 'min-w-0' : 'min-w-[640px]';

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    let s = slot;
    let d = anchor;
    switch (e.key) {
      case 'ArrowUp': s = Math.max(0, slot - 1); break;
      case 'ArrowDown': s = Math.min(47, slot + 1); break;
      case 'ArrowLeft': d = anchor - 1; break;
      case 'ArrowRight': d = anchor + 1; break;
      case 'PageUp': s = Math.max(0, slot - 8); break;
      case 'PageDown': s = Math.min(47, slot + 8); break;
      case 'Home': s = 0; break;
      case 'End': s = 47; break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        actions.onCreate(anchor, s * 30);
        return;
      default: return;
    }
    e.preventDefault();
    setSlot(s);
    if (d !== anchor) setAnchor(d);
    setLiveMsg(`${dayLabel(d)} ${hhmm(s * 30)}`);
    const el = scrollRef.current;
    if (el) {
      const y = s * 30 * ppm;
      if (y < el.scrollTop) el.scrollTop = y;
      else if (y + 15 * ppm > el.scrollTop + el.clientHeight) el.scrollTop = y + 15 * ppm - el.clientHeight;
    }
  };

  const nowY = (NOW_MIN - TODAY * MIN_DAY) * ppm;

  return (
    <div className="overflow-x-auto border-2 border-edge-strong bg-surface-raised print:overflow-visible">
      <div className={minW}>
        {/* day headers */}
        <div className="grid border-b-2 border-edge-strong" style={{ gridTemplateColumns: cols }}>
          <div />
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => openDay(d)}
              aria-label={`Open ${dayLabel(d)}`}
              aria-current={d === TODAY ? 'date' : undefined}
              className={`cursor-pointer border-l border-edge-subtle py-1 text-center font-mono text-xs hover:bg-surface-sunken ${d === TODAY ? 'bg-accent-tertiary font-bold text-content-inverse hover:bg-accent-tertiary' : ''}`}
            >
              <span className={`block ${d === TODAY ? '' : 'text-content-secondary'}`}>{WEEKDAYS[weekdayOf(d)]}</span>
              <span className="block font-display text-xl font-bold leading-6">{parts(d).d}</span>
            </button>
          ))}
        </div>
        {/* all-day row */}
        <div className="grid border-b-2 border-edge-strong" style={{ gridTemplateColumns: cols }}>
          <div className="flex items-start justify-end px-1 pt-1 font-mono text-xs text-content-muted">ALL-DAY</div>
          <div className="relative col-span-full col-start-2 grid [--lane:20px]" style={{ gridColumn: `2 / span ${n}`, gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridAutoRows: 'calc(var(--lane) + 2px)', minHeight: `calc(${Math.max(1, laneCount)} * 22px + 4px)` }}>
            {days.map((d, i) => (
              <div key={d} aria-hidden className="border-l border-edge-subtle" style={{ gridColumn: i + 1, gridRow: `1 / span ${Math.max(1, laneCount)}` }} />
            ))}
            {lanes.map((l) => (
              <div key={l.ev.id} className="z-10 px-px py-px" style={{ gridColumn: `${l.c0 + 1} / ${l.c1 + 2}`, gridRow: l.lane + 1 }}>
                <EventPopover
                  ev={l.ev}
                  {...actions}
                  trigger={<EventButton ev={l.ev} shape="bar" continuesLeft={l.clipL} continuesRight={l.clipR} />}
                />
              </div>
            ))}
          </div>
        </div>
        {/* time body */}
        <div ref={scrollRef} className="max-h-[560px] overflow-y-auto print:max-h-none print:overflow-visible">
          <div
            role="grid"
            aria-label={`Time grid, ${rangeLabel(days[0], days[n - 1])}. Arrow keys move the cursor, Enter creates an event.`}
            aria-activedescendant={`slot-${anchor}`}
            tabIndex={0}
            onKeyDown={onKey}
            className="relative grid"
            style={{ gridTemplateColumns: cols, height: 24 * H }}
          >
            {/* hour rules, one layer */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="absolute inset-x-0 border-t border-edge-subtle" style={{ top: h * H, left: GUTTER }}>
                  <div className="absolute inset-x-0 border-t border-dashed border-edge-subtle opacity-50" style={{ top: H / 2 }} />
                </div>
              ))}
            </div>
            {/* gutter */}
            <div aria-hidden className="relative">
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => {
                const nearNow = n > 0 && days.includes(TODAY) && Math.abs(h * H - nowY) < 14;
                return nearNow ? null : (
                  <span key={h} className="absolute right-1 -translate-y-1/2 font-mono text-xs text-content-muted" style={{ top: h * H }}>
                    {hhmm(h * 60)}
                  </span>
                );
              })}
              {days.includes(TODAY) ? (
                <span className="absolute right-1 z-20 -translate-y-1/2 bg-accent-tertiary px-1 font-mono text-xs font-bold text-content-inverse" style={{ top: nowY }}>
                  {hhmm(NOW_MIN - TODAY * MIN_DAY)}
                </span>
              ) : null}
            </div>
            {/* the row holding one gridcell per day */}
            <div role="row" className="contents">
              {days.map((d) => {
                const placed = layoutDay(events, d, Math.ceil(18 / ppm));
                const active = d === anchor;
                return (
                  // The cell is not a tab stop: the grid owns the keyboard
                  // (aria-activedescendant) and the click is the pointer path.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
                  <div
                    key={d}
                    id={`slot-${d}`}
                    role="gridcell"
                    aria-label={`${dayLabel(d)}${active ? `, cursor ${hhmm(slot * 30)}` : ''}`}
                    aria-selected={active}
                    className="relative z-[1] border-l border-edge-subtle"
                    onClick={(e) => {
                      if (e.target !== e.currentTarget) return;
                      const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                      setAnchor(d);
                      const s = Math.min(47, Math.max(0, Math.floor(y / ppm / 30)));
                      setSlot(s);
                      actions.onCreate(d, s * 30);
                    }}
                  >
                    {active ? (
                      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-0 border-2 border-accent-primary bg-accent-primary/10" style={{ top: slot * 30 * ppm, height: 30 * ppm }} />
                    ) : null}
                    {placed.map((p) => {
                      const overlay = p.cols >= 3;
                      const left = overlay ? p.col * (100 / (p.cols + 2)) : (p.col / p.cols) * 100;
                      const width = overlay ? 100 - left : (p.span / p.cols) * 100;
                      const style: CSSProperties = {
                        top: p.top * ppm,
                        height: p.height * ppm - 1,
                        left: `calc(${left}% + 1px)`,
                        width: `calc(${width}% - 3px)`,
                        zIndex: 10 + p.col,
                        position: 'absolute',
                      };
                      return (
                        <EventPopover
                          key={p.ev.id}
                          ev={p.ev}
                          {...actions}
                          trigger={
                            <EventButton
                              ev={p.ev}
                              shape="block"
                              showTime={p.height >= 30 && !p.contFrom}
                              continuesLeft={p.contFrom}
                              continuesRight={p.contTo}
                              className={overlay && p.col > 0 ? 'shadow-hard-sm' : ''}
                              style={style}
                            />
                          }
                        />
                      );
                    })}
                    {d === TODAY ? (
                      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-accent-tertiary" style={{ top: nowY - 1 }}>
                        <span className="absolute -left-1 -top-1 size-2.5 bg-accent-tertiary" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p role="status" className="sr-only">{liveMsg}</p>
    </div>
  );
}

/* ---------- month ---------- */

function MonthGrid({ events, anchor, setAnchor, actions, openDay }: { events: CalEvent[]; anchor: number; setAnchor: (d: number) => void; actions: SharedActions; openDay: (d: number) => void }) {
  const { first, weeks } = monthCells(anchor);
  const month = parts(anchor).m;
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: ReactKeyboardEvent, d: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      actions.onCreate(d, null);
      return;
    }
    if (!delta) return;
    e.preventDefault();
    const next = d + delta;
    setAnchor(next);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
  };
  return (
    <div className="overflow-x-auto border-2 border-edge-strong bg-surface-raised print:overflow-visible">
      <div ref={ref} role="group" aria-label={`Month, ${monthLabel(anchor)}`} className="min-w-[320px]">
        <div className="grid grid-cols-7 border-b-2 border-edge-strong" aria-hidden>
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-center font-mono text-xs text-content-secondary">{w}</span>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, wi) => {
          const wk = first + wi * 7;
          const lanes = layoutLanes(events, wk, 7, true);
          const hidden: number[] = Array(7).fill(0);
          for (const l of lanes) if (l.lane >= MAX_LANES) for (let c = l.c0; c <= l.c1; c++) hidden[c]++;
          return (
            <div
              key={wk}
              className="relative grid grid-cols-7 border-b border-edge-subtle [--lane:20px] max-md:[--lane:8px]"
              style={{ gridTemplateRows: `28px repeat(${MAX_LANES}, calc(var(--lane) + 2px)) 22px` }}
            >
              {Array.from({ length: 7 }, (_, di) => {
                const d = wk + di;
                const out = parts(d).m !== month;
                return (
                  <div
                    key={d}
                    className={`relative border-l border-edge-subtle ${out ? 'bg-surface-sunken' : ''}`}
                    style={{ gridColumn: di + 1, gridRow: '1 / -1' }}
                  >
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === anchor ? 0 : -1}
                      aria-label={dayLabel(d)}
                      aria-current={d === TODAY ? 'date' : undefined}
                      onClick={() => { setAnchor(d); actions.onCreate(d, null); }}
                      onFocus={() => setAnchor(d)}
                      onKeyDown={(e) => move(e, d)}
                      className={`absolute inset-0 flex cursor-pointer items-start justify-start text-left font-mono text-xs hover:bg-surface-sunken ${d === anchor ? 'outline-2 -outline-offset-2 outline-accent-primary' : ''}`}
                    >
                      <span className={`m-1 inline-block min-w-6 px-1 text-center font-bold ${d === TODAY ? 'bg-accent-tertiary text-content-inverse' : out ? 'text-content-muted' : ''}`}>
                        {parts(d).d === 1 ? `${MONTHS[parts(d).m - 1]} 1` : parts(d).d}
                      </span>
                    </button>
                  </div>
                );
              })}
              {lanes.filter((l) => l.lane < MAX_LANES).map((l) => (
                <div key={l.ev.id} className="z-10 px-px pt-px" style={{ gridColumn: `${l.c0 + 1} / ${l.c1 + 2}`, gridRow: l.lane + 2 }}>
                  <EventPopover
                    ev={l.ev}
                    {...actions}
                    trigger={
                      l.ev.allDay || l.c1 > l.c0 ? (
                        <EventButton ev={l.ev} shape="bar" continuesLeft={l.clipL} continuesRight={l.clipR} glyphOnly />
                      ) : (
                        <EventButton ev={l.ev} shape="block" showTime className="h-[var(--lane)] truncate max-md:h-[var(--lane)]" glyphOnly />
                      )
                    }
                  />
                </div>
              ))}
              {hidden.map((count, c) =>
                count ? (
                  <div key={c} className="z-10 px-px" style={{ gridColumn: c + 1, gridRow: MAX_LANES + 2 }}>
                    <Popover
                      trigger={<button type="button" aria-label={`${count} more events on ${dayLabel(wk + c)}`} className="h-5 w-full cursor-pointer text-left font-mono text-xs font-bold text-content-secondary hover:bg-surface-sunken"><span className="max-md:sr-only">+{count} MORE</span><span className="md:hidden" aria-hidden>+{count}</span></button> as never}
                      title={dayLabel(wk + c)}
                      side="right"
                    >
                      <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {eventsOnDay(events, wk + c).map((ev) => (
                          <li key={ev.id}>
                            <EventPopover ev={ev} {...actions} trigger={<EventButton ev={ev} shape="row" />} />
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3"><Button appearance="raised" size="sm" onClick={() => openDay(wk + c)}>OPEN DAY</Button></div>
                    </Popover>
                  </div>
                ) : null,
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- agenda ---------- */

function Agenda({ events, anchor, actions }: { events: CalEvent[]; anchor: number; actions: SharedActions }) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 21 }, (_, i) => start + i).filter((d) => eventsOnDay(events, d).length || d === TODAY);
  return (
    <div className="border-2 border-edge-strong bg-surface-raised">
      {days.map((d) => {
        const list = eventsOnDay(events, d);
        return (
          <section key={d} aria-label={dayLabel(d)} className="grid gap-2 border-b border-edge-subtle p-3 last:border-b-0 md:grid-cols-[9rem_1fr]">
            <h3 className={`m-0 font-mono text-sm font-bold ${d === TODAY ? 'text-accent-tertiary' : ''}`}>
              {d === TODAY ? '> ' : ''}{dayLabel(d)}
            </h3>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {list.length ? list.map((ev) => (
                <li key={ev.id}>
                  <EventPopover ev={ev} {...actions} trigger={<EventButton ev={ev} shape="row" />} />
                </li>
              )) : <li className="font-mono text-xs text-content-muted">NOTHING SCHEDULED</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ---------- create dialog ---------- */

interface Draft { title: string; date: string; start: string; end: string; cal: CalendarId; allDay: boolean }

function CreateModal({ draft, setDraft, errors, onClose, onSave }: { draft: Draft | null; setDraft: (d: Draft) => void; errors: Record<string, string>; onClose: () => void; onSave: () => void }) {
  const d = draft;
  const formId = useId();
  return (
    <Modal
      isOpen={d !== null}
      onClose={onClose}
      title="New event"
      footer={
        <div className="flex justify-end gap-3">
          <Button appearance="raised" variant="tertiary" onClick={onClose}>CANCEL</Button>
          <Button appearance="raised" variant="primary" bracketed type="submit" form={formId}>SAVE</Button>
        </div>
      }
    >
      {d ? (
        <form id={formId} className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <Input label="TITLE" value={d.title} error={errors.title} onChange={(e) => setDraft({ ...d, title: e.target.value })} />
          <Input label="DATE" type="date" value={d.date} error={errors.date} onChange={(e) => setDraft({ ...d, date: e.target.value })} />
          <Checkbox label="ALL DAY" checked={d.allDay} onCheckedChange={(v) => setDraft({ ...d, allDay: v })} />
          {!d.allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="START" type="time" value={d.start} error={errors.start} onChange={(e) => setDraft({ ...d, start: e.target.value })} />
              <Input label="END" type="time" value={d.end} error={errors.end} onChange={(e) => setDraft({ ...d, end: e.target.value })} />
            </div>
          ) : null}
          <Select
            label="CALENDAR"
            value={d.cal}
            onValueChange={(v) => setDraft({ ...d, cal: v as CalendarId })}
            options={CALENDARS.map((c) => ({ value: c.id, label: `[${c.code}] ${c.label}` }))}
          />
        </form>
      ) : null}
    </Modal>
  );
}

/* ---------- the app ---------- */

export default function CalendarApp() {
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchorRaw] = useState(TODAY);
  const [miniShown, setMiniShown] = useState(TODAY);
  const [events, setEvents] = useState<CalEvent[]>(SEED_EVENTS);
  const [off, setOff] = useState<CalendarId[]>([]);
  const [density, setDensity] = useState<Density>('compact');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serial, setSerial] = useState(0);
  const [toast, setToast] = useState('');

  const setAnchor = useCallback((d: number) => { setAnchorRaw(d); setMiniShown(d); }, []);
  const visible = useMemo(() => events.filter((e) => !off.includes(e.cal)), [events, off]);

  const step = (dir: -1 | 1) => {
    if (view === 'month') setAnchor(addMonths(anchor, dir));
    else if (view === 'day') setAnchor(anchor + dir);
    else setAnchor(anchor + dir * 7);
  };
  const days = view === 'day' ? [anchor] : Array.from({ length: 7 }, (_, i) => startOfWeek(anchor) + i);
  const title = view === 'month' ? monthLabel(anchor) : view === 'day' ? dayLabel(anchor) : rangeLabel(days[0], days[days.length - 1]);

  const create = (day: number, minOfDay: number | null) => {
    setErrors({});
    const s = minOfDay ?? 9 * 60;
    setDraft({ title: '', date: isoDay(day), start: hhmm(s), end: hhmm(Math.min(s + 60, 23 * 60 + 59)), cal: 'work', allDay: minOfDay === null && view === 'month' });
  };
  const save = () => {
    if (!draft) return;
    const e: Record<string, string> = {};
    const day = parseIsoDay(draft.date);
    if (!draft.title.trim()) e.title = 'Give the event a title.';
    if (day === null) e.date = 'Use a date such as 2026-10-14.';
    const a = parseHhmm(draft.start);
    const b = parseHhmm(draft.end);
    if (!draft.allDay) {
      if (a === null) e.start = 'Set a start time.';
      if (b === null) e.end = 'Set an end time.';
      if (a !== null && b !== null && b <= a) e.end = 'End must be after start.';
    }
    setErrors(e);
    if (Object.keys(e).length || day === null) return;
    const id = `n${serial + 1}`;
    setSerial(serial + 1);
    const ev: CalEvent = draft.allDay
      ? { id, title: draft.title.trim().toUpperCase(), cal: draft.cal, s: day * MIN_DAY, e: (day + 1) * MIN_DAY, allDay: true }
      : { id, title: draft.title.trim().toUpperCase(), cal: draft.cal, s: day * MIN_DAY + (a as number), e: day * MIN_DAY + (b as number), allDay: false };
    setEvents((list) => [...list, ev]);
    setAnchor(day);
    setDraft(null);
    setToast(`CREATED ${ev.title} / ${whenLabel(ev)}`);
  };
  const actions: SharedActions = {
    onDelete: (id) => { setEvents((l) => l.filter((x) => x.id !== id)); setToast('EVENT DELETED'); },
    onDuplicate: (ev) => {
      const id = `n${serial + 1}`;
      setSerial(serial + 1);
      setEvents((l) => [...l, { ...ev, id, s: ev.s + MIN_DAY, e: ev.e + MIN_DAY }]);
      setToast('EVENT DUPLICATED TO NEXT DAY');
    },
    onCreate: create,
  };
  const openDay = (d: number) => { setAnchor(d); setView('day'); };

  const onRootKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input,textarea,select,[role="dialog"],[role="menu"],[role="listbox"]')) return;
    const map: Record<string, () => void> = {
      t: () => setAnchor(TODAY),
      w: () => setView('week'),
      d: () => setView('day'),
      m: () => setView('month'),
      a: () => setView('agenda'),
      c: () => create(anchor, null),
    };
    const fn = map[e.key.toLowerCase()];
    if (fn) { e.preventDefault(); fn(); }
  };

  return (
    // The shortcut layer is a progressive enhancement over the visible controls.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="bg-surface-base text-content-primary" onKeyDown={onRootKey}>
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-edge-strong p-2 print:hidden">
        <Button appearance="raised" variant="primary" size="sm" bracketed onClick={() => create(anchor, null)}>CREATE</Button>
        <Button appearance="raised" size="sm" onClick={() => setAnchor(TODAY)}>TODAY</Button>
        <Button appearance="raised" size="sm" aria-label="Previous" onClick={() => step(-1)}>&lt;</Button>
        <Button appearance="raised" size="sm" aria-label="Next" onClick={() => step(1)}>&gt;</Button>
        <h2 className="m-0 min-w-0 flex-1 max-sm:order-last max-sm:basis-full font-display text-xl font-bold uppercase tracking-tight sm:text-2xl" aria-live="polite">{title}</h2>
        <Tabs value={view} onValueChange={(v) => setView(v as View)} accent="primary">
          <TabsList label="Calendar view">
            <TabsTab value="week">WEEK</TabsTab>
            <TabsTab value="day">DAY</TabsTab>
            <TabsTab value="month">MONTH</TabsTab>
            <TabsTab value="agenda">AGENDA</TabsTab>
          </TabsList>
        </Tabs>
        <Menu trigger={<Button appearance="raised" size="sm">OPTIONS</Button>} align="end">
          <MenuRadioGroup label="DENSITY" value={density} onValueChange={(v) => setDensity(v as Density)}>
            <MenuRadioItem value="compact">Compact (36px / hour)</MenuRadioItem>
            <MenuRadioItem value="cozy">Cozy (52px / hour)</MenuRadioItem>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem onClick={() => setOff([])}>Show all calendars</MenuItem>
          <MenuItem onClick={() => window.print()}>Print this view</MenuItem>
        </Menu>
      </div>
      <p className="m-0 hidden border-b border-edge-subtle px-3 py-1 font-mono text-xs text-content-muted print:block">
        {title} / {view.toUpperCase()}
      </p>
      <div className="grid gap-3 p-2 lg:grid-cols-[15rem_1fr]">
        <aside className="flex flex-col gap-3 print:hidden" aria-label="Calendar navigation">
          <div className="max-lg:hidden">
            <MiniMonth
              anchor={anchor}
              shown={miniShown}
              onShown={setMiniShown}
              onPick={(d) => { setAnchorRaw(d); }}
              weekMode={view === 'week'}
            />
          </div>
          <fieldset className="m-0 border-2 border-edge-strong bg-surface-raised p-2">
            <legend className="px-1 font-mono text-xs font-bold">[ CALENDARS ]</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
              {CALENDARS.map((c) => (
                <Checkbox
                  key={c.id}
                  label={`[${c.code}] ${c.label}`}
                  accent={c.role}
                  checked={!off.includes(c.id)}
                  onCheckedChange={(v) => setOff((o) => (v ? o.filter((x) => x !== c.id) : [...o, c.id]))}
                />
              ))}
            </div>
          </fieldset>
        </aside>
        <div className="min-w-0" role="region" aria-label="Calendar">
          {view === 'week' || view === 'day' ? (
            <TimeGrid key={`${view}-${density}`} days={days} events={visible} density={density} anchor={anchor} setAnchor={setAnchor} actions={actions} openDay={openDay} />
          ) : null}
          {view === 'month' ? <MonthGrid events={visible} anchor={anchor} setAnchor={setAnchor} actions={actions} openDay={openDay} /> : null}
          {view === 'agenda' ? <Agenda events={visible} anchor={anchor} actions={actions} /> : null}
          <p role="status" className="m-0 mt-2 min-h-5 font-mono text-xs text-content-secondary print:hidden">{toast ? `> ${toast}` : ''}</p>
        </div>
      </div>
      <CreateModal draft={draft} setDraft={setDraft} errors={errors} onClose={() => setDraft(null)} onSave={save} />
    </div>
  );
}
