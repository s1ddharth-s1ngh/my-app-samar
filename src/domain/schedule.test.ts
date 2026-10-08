import { describe, it, expect } from 'vitest';
import type { ScheduleBlock } from '@/data/types';
import { blocksForDate, dayWindow, isoWeekday, layoutDay, minutesOfDay } from './schedule';

let counter = 0;

function block(partial: Partial<ScheduleBlock>): ScheduleBlock {
  counter += 1;
  return {
    id: `block-${counter}`,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
    deletedAt: null,
    title: 'Blocco',
    kind: 'custom',
    start: '09:00',
    end: '10:00',
    byWeekday: [],
    date: null,
    templateId: null,
    skipped: false,
    ...partial,
  };
}

// 2026-10-05 is a Monday, 2026-10-10 a Saturday.
const MONDAY = '2026-10-05';
const TUESDAY = '2026-10-06';
const SATURDAY = '2026-10-10';

describe('isoWeekday', () => {
  it('counts Monday as 1 and Sunday as 7', () => {
    expect(isoWeekday(MONDAY)).toBe(1);
    expect(isoWeekday(SATURDAY)).toBe(6);
    expect(isoWeekday('2026-10-11')).toBe(7);
  });
});

describe('blocksForDate', () => {
  const work = block({
    title: 'Lavoro',
    kind: 'work',
    start: '08:30',
    end: '17:00',
    byWeekday: [1, 2, 3, 4, 5],
  });
  const lunch = block({
    title: 'Pranzo',
    kind: 'break',
    start: '12:30',
    end: '13:00',
    byWeekday: [1, 2, 3, 4, 5],
  });

  it('returns the weekday templates, ordered by start', () => {
    expect(blocksForDate([lunch, work], MONDAY).map((b) => b.title)).toEqual(['Lavoro', 'Pranzo']);
  });

  it('leaves a weekday the template does not cover empty', () => {
    expect(blocksForDate([work, lunch], SATURDAY)).toEqual([]);
  });

  it('lets a one-day exception replace its template', () => {
    const shortDay = block({
      title: 'Lavoro (mezza giornata)',
      start: '08:30',
      end: '12:30',
      date: MONDAY,
      templateId: work.id,
    });

    const monday = blocksForDate([work, lunch, shortDay], MONDAY);
    expect(monday.map((b) => b.title)).toEqual(['Lavoro (mezza giornata)', 'Pranzo']);

    // The other days keep the template untouched.
    expect(blocksForDate([work, lunch, shortDay], TUESDAY).map((b) => b.title)).toEqual([
      'Lavoro',
      'Pranzo',
    ]);
  });

  it('removes a template from the one day a skip names', () => {
    const skip = block({ date: MONDAY, templateId: lunch.id, skipped: true });
    expect(blocksForDate([work, lunch, skip], MONDAY).map((b) => b.title)).toEqual(['Lavoro']);
  });

  it('adds a one-off block that belongs to no template', () => {
    const gym = block({
      title: 'Palestra',
      kind: 'gym',
      start: '18:00',
      end: '19:30',
      date: SATURDAY,
    });
    expect(blocksForDate([work, gym], SATURDAY).map((b) => b.title)).toEqual(['Palestra']);
  });

  it('ignores soft-deleted rows', () => {
    const dead = { ...work, deletedAt: '2026-10-04T08:00:00Z' };
    expect(blocksForDate([dead, lunch], MONDAY).map((b) => b.title)).toEqual(['Pranzo']);
  });
});

describe('layoutDay', () => {
  it('gives overlapping blocks their own lane and a shared column count', () => {
    const work = block({ start: '08:30', end: '17:00' });
    const lunch = block({ start: '12:30', end: '13:00' });

    const laid = layoutDay([lunch, work]);
    expect(laid.map((l) => [l.block.id, l.lane, l.lanes])).toEqual([
      [work.id, 0, 2],
      [lunch.id, 1, 2],
    ]);
  });

  it('keeps consecutive blocks in a single column', () => {
    const morning = block({ start: '09:00', end: '10:00' });
    const afternoon = block({ start: '14:00', end: '15:00' });

    expect(layoutDay([morning, afternoon]).every((l) => l.lane === 0 && l.lanes === 1)).toBe(true);
  });

  it('reuses a lane once its previous block has ended', () => {
    const long = block({ start: '09:00', end: '12:00' });
    const first = block({ start: '09:30', end: '10:00' });
    const second = block({ start: '10:30', end: '11:00' });

    const laid = layoutDay([long, first, second]);
    expect(laid.map((l) => l.lane)).toEqual([0, 1, 1]);
    expect(laid.every((l) => l.lanes === 2)).toBe(true);
  });
});

describe('dayWindow', () => {
  it('leaves an hour of air around the day', () => {
    expect(dayWindow([block({ start: '08:30', end: '17:00' })])).toEqual({
      fromHour: 7,
      toHour: 18,
    });
  });

  it('falls back to a working window when the day is empty', () => {
    expect(dayWindow([])).toEqual({ fromHour: 7, toHour: 22 });
  });

  it('never runs past midnight at either end', () => {
    expect(dayWindow([block({ start: '00:10', end: '23:50' })])).toEqual({
      fromHour: 0,
      toHour: 24,
    });
  });
});

describe('minutesOfDay', () => {
  it('reads a clock as minutes since midnight', () => {
    expect(minutesOfDay('08:30')).toBe(510);
    expect(minutesOfDay('00:00')).toBe(0);
  });
});
