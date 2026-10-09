import { describe, it, expect } from 'vitest';
import type { Task } from '@/data/types';
import { formatCalendarDate } from './cycles';
import { atClock, daysToDeadline, goalDueInstant, reminderTimes } from './goals';

function goal(partial: Partial<Task>): Task {
  return {
    id: 'g1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    projectId: null,
    title: 'Obiettivo',
    notes: null,
    kind: 'goal',
    status: 'todo',
    priority: 0,
    dueAt: null,
    order: 0,
    tags: [],
    recurrence: null,
    timer: null,
    shoppingItemId: null,
    reminders: [],
    completedAt: null,
    ...partial,
  };
}

const weekly = (byWeekday: number[], endsOn: string | null, startsOn = '2026-03-02') => ({
  freq: 'weekly' as const,
  interval: 1,
  byWeekday,
  byMonthDay: null,
  timeOfDay: '20:00',
  startsOn,
  endsOn,
});

// Monday 2 March 2026, 08:00 local.
const MONDAY_MORNING = atClock('2026-03-02', '08:00');

describe('reminderTimes', () => {
  it('rings only on the chosen weekdays, at the chosen hour', () => {
    const times = reminderTimes(
      goal({ recurrence: weekly([1, 3, 5], '2026-03-31') }),
      MONDAY_MORNING,
      14
    );

    expect(times.map((t) => formatCalendarDate(t.at))).toEqual([
      '2026-03-02', // lunedì
      '2026-03-04', // mercoledì
      '2026-03-06', // venerdì
      '2026-03-09',
      '2026-03-11',
      '2026-03-13',
    ]);
    expect(times.every((t) => t.at.getHours() === 20)).toBe(true);
  });

  it('stops at the deadline, not at the horizon', () => {
    const times = reminderTimes(
      goal({ recurrence: weekly([1, 2, 3, 4, 5, 6, 7], '2026-03-05') }),
      MONDAY_MORNING,
      60
    );

    expect(times).toHaveLength(4);
    expect(formatCalendarDate(times.at(-1)!.at)).toBe('2026-03-05');
  });

  it('drops a time already past today', () => {
    // 21:00 on the Monday: that evening's 20:00 has gone.
    const times = reminderTimes(
      goal({ recurrence: weekly([1], '2026-03-31') }),
      atClock('2026-03-02', '21:00'),
      14
    );

    expect(formatCalendarDate(times[0]!.at)).toBe('2026-03-09');
  });

  it('puts "la sera prima" at 20:00 the day before the deadline', () => {
    const times = reminderTimes(
      goal({
        dueAt: goalDueInstant('2026-03-20'),
        reminders: [{ id: 'r1', mode: 'beforeDue', at: null, offsetMinutes: 780, enabled: true }],
      }),
      MONDAY_MORNING,
      60
    );

    expect(times).toHaveLength(1);
    expect(times[0]!.at.getDate()).toBe(19);
    expect(times[0]!.at.getHours()).toBe(20);
    expect(times[0]!.source).toBe('beforeDue');
  });

  it('ignores a disabled reminder and an empty recurrence', () => {
    expect(
      reminderTimes(
        goal({
          dueAt: goalDueInstant('2026-03-20'),
          recurrence: weekly([], '2026-03-31'),
          reminders: [
            { id: 'r1', mode: 'beforeDue', at: null, offsetMinutes: 780, enabled: false },
          ],
        }),
        MONDAY_MORNING,
        60
      )
    ).toEqual([]);
  });

  it('merges both sources in chronological order', () => {
    const times = reminderTimes(
      goal({
        dueAt: goalDueInstant('2026-03-06'),
        recurrence: weekly([1, 3, 5], '2026-03-06'),
        reminders: [{ id: 'r1', mode: 'beforeDue', at: null, offsetMinutes: 780, enabled: true }],
      }),
      MONDAY_MORNING,
      60
    );

    expect(times.map((t) => `${t.at.getDate()} ${t.source}`)).toEqual([
      '2 recurring',
      '4 recurring',
      '5 beforeDue',
      '6 recurring',
    ]);
  });
});

describe('daysToDeadline', () => {
  it('counts whole days, and goes negative once past', () => {
    const task = goal({ dueAt: goalDueInstant('2026-03-10') });

    expect(daysToDeadline(task, '2026-03-02')).toBe(8);
    expect(daysToDeadline(task, '2026-03-10')).toBe(0);
    expect(daysToDeadline(task, '2026-03-12')).toBe(-2);
  });

  // 29 March 2026 is the spring-forward night in Europe: a naive hour count
  // would read 23h as "0 days".
  it('survives the daylight-saving night', () => {
    expect(daysToDeadline(goal({ dueAt: goalDueInstant('2026-03-30') }), '2026-03-29')).toBe(1);
  });
});
