import type { CalendarDate, Cycle, Settings } from '@/data/types';

/**
 * Cycles are the temporal container of every money movement. This module is
 * pure: it turns a reference day plus the user's settings into boundaries, and
 * says whether the active cycle still covers today.
 *
 * Calendar dates are 'YYYY-MM-DD' strings handled at local midnight — never
 * `new Date(string)`, which would parse them as UTC and shift the day.
 */

export interface CycleBounds {
  startDate: CalendarDate;
  endDate: CalendarDate;
}

export function formatCalendarDate(date: Date): CalendarDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCalendarDate(value: CalendarDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function todayCalendarDate(now: Date = new Date()): CalendarDate {
  return formatCalendarDate(now);
}

/** Day 0 of the following month is the last day of this one. */
export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** February never has a 31st: the anchor falls back to the last day available. */
export function clampDayToMonth(year: number, monthIndex: number, day: number): number {
  return Math.min(Math.max(day, 1), lastDayOfMonth(year, monthIndex));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthAfter(year: number, monthIndex: number): { year: number; monthIndex: number } {
  return monthIndex === 11
    ? { year: year + 1, monthIndex: 0 }
    : { year, monthIndex: monthIndex + 1 };
}

function monthBefore(year: number, monthIndex: number): { year: number; monthIndex: number } {
  return monthIndex === 0
    ? { year: year - 1, monthIndex: 11 }
    : { year, monthIndex: monthIndex - 1 };
}

/**
 * The cycle that contains `reference`.
 *
 * - `calendarMonth`: the 1st through the last day of the month.
 * - `paydayToPayday`: the anchor day through the day before the next anchor,
 *   with the anchor clamped in every month it lands in.
 */
export function computeCycleBounds(
  reference: CalendarDate,
  mode: Settings['cycleMode'],
  anchor: number
): CycleBounds {
  const referenceDate = parseCalendarDate(reference);
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();

  if (mode === 'calendarMonth') {
    return {
      startDate: formatCalendarDate(new Date(year, monthIndex, 1)),
      endDate: formatCalendarDate(new Date(year, monthIndex, lastDayOfMonth(year, monthIndex))),
    };
  }

  const anchorThisMonth = clampDayToMonth(year, monthIndex, anchor);
  const startMonth =
    referenceDate.getDate() >= anchorThisMonth
      ? { year, monthIndex }
      : monthBefore(year, monthIndex);

  const startDay = clampDayToMonth(startMonth.year, startMonth.monthIndex, anchor);
  const start = new Date(startMonth.year, startMonth.monthIndex, startDay);

  const endMonth = monthAfter(startMonth.year, startMonth.monthIndex);
  const nextAnchorDay = clampDayToMonth(endMonth.year, endMonth.monthIndex, anchor);
  const end = addDays(new Date(endMonth.year, endMonth.monthIndex, nextAnchorDay), -1);

  return { startDate: formatCalendarDate(start), endDate: formatCalendarDate(end) };
}

/** The cycle that picks up the day after `bounds` ends. */
export function nextCycleBounds(
  bounds: CycleBounds,
  mode: Settings['cycleMode'],
  anchor: number
): CycleBounds {
  const dayAfter = formatCalendarDate(addDays(parseCalendarDate(bounds.endDate), 1));
  return computeCycleBounds(dayAfter, mode, anchor);
}

export function isWithinCycle(bounds: CycleBounds, date: CalendarDate): boolean {
  return date >= bounds.startDate && date <= bounds.endDate;
}

/** Inclusive on both ends: a cycle from the 1st to the 31st lasts 31 days. */
export function cycleLengthInDays(bounds: CycleBounds): number {
  const start = parseCalendarDate(bounds.startDate).getTime();
  const end = parseCalendarDate(bounds.endDate).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Days already gone, capped to the cycle length. The start day counts as one. */
export function daysElapsed(bounds: CycleBounds, today: CalendarDate): number {
  if (today < bounds.startDate) return 0;
  const length = cycleLengthInDays(bounds);
  if (today > bounds.endDate) return length;
  const start = parseCalendarDate(bounds.startDate).getTime();
  const current = parseCalendarDate(today).getTime();
  return Math.round((current - start) / 86_400_000) + 1;
}

const LABEL_MONTH = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });
const LABEL_DAY = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

/** "Ottobre 2026" for a calendar month, "15 ott → 14 nov" otherwise. */
export function describeCycle(bounds: CycleBounds, mode: Settings['cycleMode']): string {
  const start = parseCalendarDate(bounds.startDate);
  if (mode === 'calendarMonth') {
    const label = LABEL_MONTH.format(start);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return `${LABEL_DAY.format(start)} → ${LABEL_DAY.format(parseCalendarDate(bounds.endDate))}`;
}

export type CycleAction = 'none' | 'createFirst' | 'closeAndOpen';

export interface CycleState {
  action: CycleAction;
  activeCycle: Cycle | null;
  suggestedBounds: CycleBounds;
  suggestedLabel: string;
}

/**
 * What the app should propose on open. Never acts on its own: closing a cycle
 * is always the user's call.
 */
export function evaluateCycleState(
  cycles: Cycle[],
  settings: Pick<Settings, 'cycleMode' | 'paydayAnchor'>,
  today: CalendarDate = todayCalendarDate()
): CycleState {
  const activeCycle = cycles.find((cycle) => cycle.status === 'active' && !cycle.deletedAt) ?? null;
  const bounds = computeCycleBounds(today, settings.cycleMode, settings.paydayAnchor);
  const suggestedLabel = describeCycle(bounds, settings.cycleMode);

  if (!activeCycle) {
    return { action: 'createFirst', activeCycle: null, suggestedBounds: bounds, suggestedLabel };
  }

  if (today > activeCycle.endDate) {
    const next = nextCycleBounds(
      { startDate: activeCycle.startDate, endDate: activeCycle.endDate },
      settings.cycleMode,
      settings.paydayAnchor
    );
    return {
      action: 'closeAndOpen',
      activeCycle,
      suggestedBounds: next,
      suggestedLabel: describeCycle(next, settings.cycleMode),
    };
  }

  return { action: 'none', activeCycle, suggestedBounds: bounds, suggestedLabel };
}
