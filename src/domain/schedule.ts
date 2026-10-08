import type { CalendarDate, Clock, ScheduleBlock } from '@/data/types';
import { formatCalendarDate, lastDayOfMonth, parseCalendarDate } from './cycles';

/**
 * The day's shape, resolved from two kinds of row in the same collection.
 *
 *   template   `date: null`   — repeats on the weekdays listed in `byWeekday`
 *   exception  `date` set     — belongs to that single day; `templateId` says
 *                               which template it replaces (null = extra block),
 *                               `skipped` removes the template for that day
 *
 * This module is pure: it turns the rows plus a calendar date into the blocks
 * that actually happen, and into the lanes that let overlapping ones sit side
 * by side. No React, no I/O.
 */

/** ISO weekday: 1 = Monday … 7 = Sunday. `getDay()` puts Sunday at 0. */
export function isoWeekday(date: CalendarDate): number {
  return parseCalendarDate(date).getDay() || 7;
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;
export const WEEKDAY_NAMES = [
  'lunedì',
  'martedì',
  'mercoledì',
  'giovedì',
  'venerdì',
  'sabato',
  'domenica',
] as const;

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday - 1] ?? '';
}

export function minutesOfDay(clock: Clock): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function clockFromMinutes(total: number): Clock {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(total)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function durationMinutes(block: Pick<ScheduleBlock, 'start' | 'end'>): number {
  return minutesOfDay(block.end) - minutesOfDay(block.start);
}

export function isTemplate(block: ScheduleBlock): boolean {
  return block.date === null;
}

const isLive = (block: ScheduleBlock) => block.deletedAt === null;

/** Every template that repeats on this weekday, before exceptions apply. */
export function templatesForWeekday(all: ScheduleBlock[], weekday: number): ScheduleBlock[] {
  return all.filter((b) => isLive(b) && isTemplate(b) && b.byWeekday.includes(weekday));
}

/** The rows that belong to this one day: overrides, skips and one-off blocks. */
export function exceptionsForDate(all: ScheduleBlock[], date: CalendarDate): ScheduleBlock[] {
  return all.filter((b) => isLive(b) && b.date === date);
}

const byStart = (a: ScheduleBlock, b: ScheduleBlock) =>
  minutesOfDay(a.start) - minutesOfDay(b.start) || minutesOfDay(a.end) - minutesOfDay(b.end);

/**
 * The blocks that actually happen on `date`, in order: the weekday's templates
 * minus the ones an exception replaces or skips, plus that day's own blocks.
 */
export function blocksForDate(all: ScheduleBlock[], date: CalendarDate): ScheduleBlock[] {
  const exceptions = exceptionsForDate(all, date);
  const replaced = new Set(exceptions.map((e) => e.templateId).filter(Boolean));

  const templates = templatesForWeekday(all, isoWeekday(date)).filter((t) => !replaced.has(t.id));

  return [...templates, ...exceptions.filter((e) => !e.skipped)].sort(byStart);
}

export interface LaidOutBlock {
  block: ScheduleBlock;
  /** Column this block sits in, 0-based. */
  lane: number;
  /** How many columns its cluster of overlapping blocks needs. */
  lanes: number;
}

/**
 * Side-by-side columns for blocks that overlap in time — a lunch break inside
 * a work block must not hide it. Greedy: a block reuses the first lane whose
 * previous block has already ended, and a run of touching blocks shares a
 * column count so the widths line up.
 */
export function layoutDay(blocks: ScheduleBlock[]): LaidOutBlock[] {
  const out: LaidOutBlock[] = [];
  let cluster: number[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const index of cluster) out[index]!.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const block of [...blocks].sort(byStart)) {
    const start = minutesOfDay(block.start);
    const end = minutesOfDay(block.end);

    if (cluster.length > 0 && start >= clusterEnd) closeCluster();

    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    out.push({ block, lane, lanes: 1 });
    cluster.push(out.length - 1);
    clusterEnd = Math.max(clusterEnd, end);
  }

  if (cluster.length > 0) closeCluster();
  return out;
}

/**
 * The hour window the timeline draws: an hour of air around the day, and a
 * sensible working window when there is nothing to show.
 */
export function dayWindow(blocks: ScheduleBlock[]): { fromHour: number; toHour: number } {
  if (blocks.length === 0) return { fromHour: 7, toHour: 22 };

  const earliest = Math.min(...blocks.map((b) => minutesOfDay(b.start)));
  const latest = Math.max(...blocks.map((b) => minutesOfDay(b.end)));

  return {
    fromHour: Math.max(0, Math.floor(earliest / 60) - 1),
    toHour: Math.min(24, Math.ceil(latest / 60) + 1),
  };
}

/** The same date, `days` later — negative goes back. Local midnight, never UTC. */
export function shiftDate(date: CalendarDate, days: number): CalendarDate {
  const moved = parseCalendarDate(date);
  moved.setDate(moved.getDate() + days);
  return formatCalendarDate(moved);
}

export type CalendarView = 'giorno' | 'settimana' | 'mese' | 'anno';

/** Monday of the week `date` falls in — the week starts on Monday here. */
export function startOfWeek(date: CalendarDate): CalendarDate {
  return shiftDate(date, -(isoWeekday(date) - 1));
}

/** The seven dates of that week, Monday first. */
export function weekDates(date: CalendarDate): CalendarDate[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}

export function startOfMonth(date: CalendarDate): CalendarDate {
  return `${date.slice(0, 7)}-01`;
}

export function sameMonth(a: CalendarDate, b: CalendarDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/**
 * The 6x7 cells a month calendar draws: the leading days of the previous month
 * and the trailing days of the next one included, so the grid never changes
 * height from one month to the next.
 */
export function monthGridDates(date: CalendarDate): CalendarDate[] {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, index) => shiftDate(start, index));
}

/** The first day of each month of that year. */
export function monthsOfYear(date: CalendarDate): CalendarDate[] {
  const year = date.slice(0, 4);
  return Array.from(
    { length: 12 },
    (_, index) => `${year}-${String(index + 1).padStart(2, '0')}-01`
  );
}

/** One step forward or back in whatever range the current view shows. */
export function shiftRange(date: CalendarDate, view: CalendarView, step: number): CalendarDate {
  if (view === 'giorno') return shiftDate(date, step);
  if (view === 'settimana') return shiftDate(date, step * 7);

  const moved = parseCalendarDate(date);
  const dayOfMonth = moved.getDate();

  // Move on the 1st, then clamp: the 31st must not spill into the next month.
  moved.setDate(1);
  moved.setMonth(moved.getMonth() + (view === 'mese' ? step : step * 12));
  moved.setDate(Math.min(dayOfMonth, lastDayOfMonth(moved.getFullYear(), moved.getMonth())));

  return formatCalendarDate(moved);
}
