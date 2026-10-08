import { newBase } from '@/lib/record';
import type { ScheduleBlock, Settings } from './types';

/** Settings the app falls back to before the user has saved anything. */
export function defaultSettings(): Settings {
  return {
    ...newBase(),
    currency: 'EUR',
    locale: 'it-IT',
    weekStartsOn: 1,
    cycleMode: 'calendarMonth',
    paydayAnchor: 27,
    theme: 'dark',
    notificationsEnabled: false,
    quietHours: null,
  };
}

/**
 * The starting week: a normal working day with a lunch break in it. Offered,
 * never forced — the agenda stays empty until you ask for these, so emptying
 * it does not make them reappear.
 */
export function defaultScheduleBlocks(): ScheduleBlock[] {
  const weekdays = [1, 2, 3, 4, 5];

  const template = (
    title: string,
    kind: ScheduleBlock['kind'],
    start: string,
    end: string
  ): ScheduleBlock => ({
    ...newBase(),
    title,
    kind,
    start,
    end,
    byWeekday: weekdays,
    date: null,
    templateId: null,
    skipped: false,
  });

  return [
    template('Lavoro', 'work', '08:30', '17:00'),
    template('Pausa pranzo', 'break', '12:30', '13:00'),
  ];
}
