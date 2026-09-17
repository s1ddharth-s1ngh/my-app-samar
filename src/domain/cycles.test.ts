import { describe, it, expect } from 'vitest';
import type { Cycle } from '@/data/types';
import {
  clampDayToMonth,
  computeCycleBounds,
  cycleLengthInDays,
  daysElapsed,
  describeCycle,
  evaluateCycleState,
  isWithinCycle,
  lastDayOfMonth,
  nextCycleBounds,
  parseCalendarDate,
  todayCalendarDate,
  bucketCarriesOver,
  computeCarryOver,
} from './cycles';

function cycle(partial: Partial<Cycle>): Cycle {
  return {
    id: 'cycle-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    label: 'Test',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    status: 'active',
    openingBalance: 0,
    closedAt: null,
    ...partial,
  };
}

describe('date helpers', () => {
  it('parses a calendar date at local midnight, not UTC', () => {
    const parsed = parseCalendarDate('2026-03-15');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(15);
    expect(parsed.getHours()).toBe(0);
  });

  it('knows the length of a month, leap years included', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(28); // February 2026
    expect(lastDayOfMonth(2028, 1)).toBe(29); // February 2028, leap
    expect(lastDayOfMonth(2026, 3)).toBe(30); // April
  });

  it('clamps an anchor that the month does not have', () => {
    expect(clampDayToMonth(2026, 1, 31)).toBe(28);
    expect(clampDayToMonth(2028, 1, 31)).toBe(29);
    expect(clampDayToMonth(2026, 0, 31)).toBe(31);
    expect(clampDayToMonth(2026, 0, 0)).toBe(1);
  });

  it('formats today without touching the timezone', () => {
    expect(todayCalendarDate(new Date(2026, 8, 17))).toBe('2026-09-17');
  });
});

describe('computeCycleBounds — calendar month', () => {
  it('runs from the first to the last day', () => {
    expect(computeCycleBounds('2026-10-14', 'calendarMonth', 1)).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
  });

  it('handles February in a leap year', () => {
    expect(computeCycleBounds('2028-02-10', 'calendarMonth', 1)).toEqual({
      startDate: '2028-02-01',
      endDate: '2028-02-29',
    });
  });

  it('ignores the anchor entirely', () => {
    const withAnchor = computeCycleBounds('2026-05-05', 'calendarMonth', 27);
    const withoutAnchor = computeCycleBounds('2026-05-05', 'calendarMonth', 1);
    expect(withAnchor).toEqual(withoutAnchor);
  });
});

describe('computeCycleBounds — payday to payday', () => {
  it('runs from the anchor to the day before the next one', () => {
    expect(computeCycleBounds('2026-10-20', 'paydayToPayday', 15)).toEqual({
      startDate: '2026-10-15',
      endDate: '2026-11-14',
    });
  });

  it('goes back a month when today is before the anchor', () => {
    expect(computeCycleBounds('2026-10-03', 'paydayToPayday', 15)).toEqual({
      startDate: '2026-09-15',
      endDate: '2026-10-14',
    });
  });

  it('starts exactly on the anchor day', () => {
    expect(computeCycleBounds('2026-10-15', 'paydayToPayday', 15).startDate).toBe('2026-10-15');
  });

  it('clamps an anchor of 31 into February', () => {
    // January 31st cycle ends the day before February's clamped anchor (the 28th).
    expect(computeCycleBounds('2026-02-05', 'paydayToPayday', 31)).toEqual({
      startDate: '2026-01-31',
      endDate: '2026-02-27',
    });
    // The February cycle then starts on the clamped anchor and is continuous.
    expect(computeCycleBounds('2026-03-01', 'paydayToPayday', 31)).toEqual({
      startDate: '2026-02-28',
      endDate: '2026-03-30',
    });
  });

  it('clamps an anchor of 31 into a leap February', () => {
    expect(computeCycleBounds('2028-03-01', 'paydayToPayday', 31)).toEqual({
      startDate: '2028-02-29',
      endDate: '2028-03-30',
    });
  });

  it('crosses the end of the year', () => {
    expect(computeCycleBounds('2026-12-28', 'paydayToPayday', 27)).toEqual({
      startDate: '2026-12-27',
      endDate: '2027-01-26',
    });
    expect(computeCycleBounds('2027-01-05', 'paydayToPayday', 27)).toEqual({
      startDate: '2026-12-27',
      endDate: '2027-01-26',
    });
  });
});

describe('nextCycleBounds', () => {
  it('picks up the day after the previous cycle ends', () => {
    const october = computeCycleBounds('2026-10-10', 'calendarMonth', 1);
    expect(nextCycleBounds(october, 'calendarMonth', 1)).toEqual({
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    });
  });

  it('leaves no gap in payday mode with a clamped anchor', () => {
    let bounds = computeCycleBounds('2026-01-31', 'paydayToPayday', 31);
    for (let step = 0; step < 14; step += 1) {
      const next = nextCycleBounds(bounds, 'paydayToPayday', 31);
      const dayAfterEnd = new Date(parseCalendarDate(bounds.endDate));
      dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
      expect(next.startDate).toBe(
        `${dayAfterEnd.getFullYear()}-${String(dayAfterEnd.getMonth() + 1).padStart(2, '0')}-${String(
          dayAfterEnd.getDate()
        ).padStart(2, '0')}`
      );
      bounds = next;
    }
  });
});

describe('cycle geometry', () => {
  const bounds = { startDate: '2026-10-01', endDate: '2026-10-31' };

  it('counts both ends of the cycle', () => {
    expect(cycleLengthInDays(bounds)).toBe(31);
  });

  it('counts the elapsed days from the start day', () => {
    expect(daysElapsed(bounds, '2026-10-01')).toBe(1);
    expect(daysElapsed(bounds, '2026-10-15')).toBe(15);
    expect(daysElapsed(bounds, '2026-10-31')).toBe(31);
  });

  it('caps the elapsed days outside the cycle', () => {
    expect(daysElapsed(bounds, '2026-09-20')).toBe(0);
    expect(daysElapsed(bounds, '2026-11-05')).toBe(31);
  });

  it('knows what falls inside', () => {
    expect(isWithinCycle(bounds, '2026-10-01')).toBe(true);
    expect(isWithinCycle(bounds, '2026-10-31')).toBe(true);
    expect(isWithinCycle(bounds, '2026-11-01')).toBe(false);
  });
});

describe('describeCycle', () => {
  it('names a calendar month', () => {
    expect(describeCycle({ startDate: '2026-10-01', endDate: '2026-10-31' }, 'calendarMonth')).toBe(
      'Ottobre 2026'
    );
  });

  it('shows both ends in payday mode', () => {
    const label = describeCycle(
      { startDate: '2026-10-15', endDate: '2026-11-14' },
      'paydayToPayday'
    );
    expect(label).toContain('→');
    expect(label).toContain('15');
    expect(label).toContain('14');
  });
});

describe('evaluateCycleState', () => {
  const settings = { cycleMode: 'calendarMonth', paydayAnchor: 1 } as const;

  it('asks to create the first cycle when none exists', () => {
    const state = evaluateCycleState([], settings, '2026-10-05');
    expect(state.action).toBe('createFirst');
    expect(state.activeCycle).toBeNull();
    expect(state.suggestedBounds.startDate).toBe('2026-10-01');
  });

  it('stays quiet while the active cycle still covers today', () => {
    const state = evaluateCycleState(
      [cycle({ startDate: '2026-10-01', endDate: '2026-10-31' })],
      settings,
      '2026-10-20'
    );
    expect(state.action).toBe('none');
    expect(state.activeCycle?.id).toBe('cycle-1');
  });

  it('proposes closing once today is past the end', () => {
    const state = evaluateCycleState(
      [cycle({ startDate: '2026-10-01', endDate: '2026-10-31' })],
      settings,
      '2026-11-02'
    );
    expect(state.action).toBe('closeAndOpen');
    expect(state.suggestedBounds).toEqual({ startDate: '2026-11-01', endDate: '2026-11-30' });
  });

  it('ignores soft-deleted cycles', () => {
    const state = evaluateCycleState(
      [cycle({ deletedAt: '2026-10-02T00:00:00.000Z' })],
      settings,
      '2026-10-20'
    );
    expect(state.action).toBe('createFirst');
  });
});

describe('carry over', () => {
  it('carries every bucket except day-to-day spending', () => {
    expect(bucketCarriesOver('savings')).toBe(true);
    expect(bucketCarriesOver('rent')).toBe(true);
    expect(bucketCarriesOver('spending')).toBe(false);
  });

  it('sums what the carrying buckets did not spend', () => {
    const summary = computeCarryOver([
      { bucketId: 'a', planned: 65000, spent: 65000, carriesOver: true },
      { bucketId: 'b', planned: 20000, spent: 12000, carriesOver: true },
    ]);

    expect(summary.openingBalance).toBe(8000);
    expect(summary.forfeited).toBe(0);
  });

  it('forfeits the leftover of a bucket that does not carry over', () => {
    const summary = computeCarryOver([
      { bucketId: 'spending', planned: 40000, spent: 25000, carriesOver: false },
    ]);

    expect(summary.openingBalance).toBe(0);
    expect(summary.forfeited).toBe(15000);
  });

  it('carries an overspend forward even from a non-carrying bucket', () => {
    const summary = computeCarryOver([
      { bucketId: 'spending', planned: 40000, spent: 52000, carriesOver: false },
    ]);

    expect(summary.openingBalance).toBe(-12000);
    expect(summary.forfeited).toBe(0);
  });

  it('reports the leftover of every bucket', () => {
    const summary = computeCarryOver([
      { bucketId: 'a', planned: 100, spent: 40, carriesOver: true },
      { bucketId: 'b', planned: 100, spent: 140, carriesOver: true },
    ]);

    expect(summary.leftovers).toEqual([
      { bucketId: 'a', amount: 60 },
      { bucketId: 'b', amount: -40 },
    ]);
    expect(summary.openingBalance).toBe(20);
  });

  it('opens at zero with nothing to carry', () => {
    expect(computeCarryOver([])).toEqual({ openingBalance: 0, leftovers: [], forfeited: 0 });
  });
});
