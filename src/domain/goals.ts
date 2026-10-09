import type { CalendarDate, Clock, Task } from '@/data/types';
import { formatCalendarDate, parseCalendarDate } from './cycles';
import { isoWeekday, minutesOfDay, shiftDate } from './schedule';

/**
 * When a goal rings.
 *
 * A goal is a `Task` with `kind: 'goal'`: its `dueAt` is the deadline and the
 * reminders come from two independent sources, either or both of which can be
 * off.
 *
 *   recurrence   the weekly nudges, on the weekdays in `byWeekday` at
 *                `timeOfDay`, from `startsOn` until `endsOn`
 *   reminders    the ones hanging off the deadline: `offsetMinutes` before
 *                `dueAt` for `beforeDue`, a wall clock on the due day for
 *                `atTime`
 *
 * This module is pure. The form previews it and the scheduler programs it from
 * the same call, so what the form shows is what actually rings.
 */

export type ReminderSource = 'recurring' | 'beforeDue';

export interface ReminderTime {
  at: Date;
  source: ReminderSource;
}

const MS_PER_MINUTE = 60_000;

/** The deadline is a day, not a minute: every goal is due at this wall clock. */
export const GOAL_DUE_CLOCK: Clock = '09:00';

/** A local wall clock on that date. Local setters, so a DST day still lands right. */
export function atClock(date: CalendarDate, clock: Clock): Date {
  const out = parseCalendarDate(date);
  out.setHours(0, minutesOfDay(clock), 0, 0);
  return out;
}

export function isGoal(task: Task): boolean {
  return task.kind === 'goal' && !task.deletedAt;
}

/** A goal still worth ringing: not done, not dropped. */
export function isGoalOpen(task: Task): boolean {
  return task.status !== 'done' && task.status !== 'dropped';
}

export function goalDueDate(task: Task): CalendarDate | null {
  return task.dueAt ? formatCalendarDate(new Date(task.dueAt)) : null;
}

/** The instant stored on `dueAt` for a deadline picked as a plain date. */
export function goalDueInstant(date: CalendarDate): string {
  return atClock(date, GOAL_DUE_CLOCK).toISOString();
}

/**
 * Every moment this goal rings in `[from, from + horizonDays]`, in order.
 *
 * Past moments are dropped: a reminder that should have rung yesterday is not
 * programmed today.
 */
export function reminderTimes(task: Task, from: Date, horizonDays: number): ReminderTime[] {
  const out: ReminderTime[] = [];
  const until = new Date(from.getTime() + horizonDays * 24 * 60 * MS_PER_MINUTE);
  const rec = task.recurrence;

  if (rec && rec.timeOfDay && rec.byWeekday && rec.byWeekday.length > 0) {
    // ponytail: `interval` is ignored, the editor only ever writes 1. Count the
    // weeks from `startsOn` here if "ogni due settimane" ever becomes a choice.
    const today = formatCalendarDate(from);
    const last = rec.endsOn ?? formatCalendarDate(until);

    for (let date = rec.startsOn > today ? rec.startsOn : today; date <= last;) {
      const when = atClock(date, rec.timeOfDay);
      if (when > until) break;
      if (when >= from && rec.byWeekday.includes(isoWeekday(date))) {
        out.push({ at: when, source: 'recurring' });
      }
      date = shiftDate(date, 1);
    }
  }

  if (task.dueAt) {
    const due = new Date(task.dueAt);

    for (const reminder of task.reminders) {
      if (!reminder.enabled) continue;

      const when =
        reminder.mode === 'beforeDue'
          ? new Date(due.getTime() - (reminder.offsetMinutes ?? 0) * MS_PER_MINUTE)
          : reminder.at
            ? atClock(formatCalendarDate(due), reminder.at)
            : null;

      if (when && when >= from && when <= until) out.push({ at: when, source: 'beforeDue' });
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Whole days from today to the deadline: negative once it is past. */
export function daysToDeadline(task: Task, today: CalendarDate): number | null {
  const due = goalDueDate(task);
  if (!due) return null;

  const diff = parseCalendarDate(due).getTime() - parseCalendarDate(today).getTime();
  return Math.round(diff / (24 * 60 * MS_PER_MINUTE));
}

/** "fra 3 giorni", "oggi", "2 giorni fa": the deadline in words. */
export function deadlineLabel(days: number): string {
  if (days === 0) return 'oggi';
  if (days === 1) return 'domani';
  if (days > 1) return `fra ${days} giorni`;
  if (days === -1) return 'ieri';
  return `${Math.abs(days)} giorni fa`;
}
