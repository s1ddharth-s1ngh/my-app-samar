import type { CalendarDate, Clock, Task } from '@/data/types';
import { todayCalendarDate } from '@/domain/cycles';
import { goalDueDate, goalDueInstant } from '@/domain/goals';
import { WEEKDAY_LABELS } from '@/domain/schedule';
import { newId, nowInstant } from '@/lib/record';

/**
 * The editor's shape, and how it maps onto a `Task` with `kind: 'goal'`.
 *
 * Two switches rather than a mode: the recurring nudges and the warning before
 * the deadline are independent, so "both" costs nothing.
 */
export interface GoalForm {
  title: string;
  notes: string;
  dueDate: CalendarDate;
  recurring: boolean;
  byWeekday: number[];
  timeOfDay: Clock;
  beforeDue: boolean;
  offsetMinutes: string;
}

export const EMPTY_GOAL_FORM: GoalForm = {
  title: '',
  notes: '',
  dueDate: '',
  recurring: true,
  byWeekday: [1, 3, 5],
  timeOfDay: '20:00',
  beforeDue: true,
  offsetMinutes: '780',
};

export const WEEKDAY_PRESETS: { label: string; days: number[] }[] = [
  { label: 'Ogni giorno', days: [1, 2, 3, 4, 5, 6, 7] },
  { label: '3 volte', days: [1, 3, 5] },
  { label: '1 volta', days: [1] },
];

/** Offsets from the deadline, which always sits at 09:00 of its day. */
export const BEFORE_DUE_OPTIONS = [
  { value: '780', label: 'La sera prima, alle 20:00' },
  { value: '1440', label: 'Il giorno prima, alle 9:00' },
  { value: '4320', label: 'Tre giorni prima' },
  { value: '10080', label: 'Una settimana prima' },
];

export function toGoalForm(task: Task): GoalForm {
  const reminder = task.reminders.find((r) => r.mode === 'beforeDue' && r.enabled);

  return {
    title: task.title,
    notes: task.notes ?? '',
    dueDate: goalDueDate(task) ?? '',
    recurring: (task.recurrence?.byWeekday?.length ?? 0) > 0,
    byWeekday: task.recurrence?.byWeekday ?? EMPTY_GOAL_FORM.byWeekday,
    timeOfDay: task.recurrence?.timeOfDay ?? EMPTY_GOAL_FORM.timeOfDay,
    beforeDue: reminder !== undefined,
    offsetMinutes: String(reminder?.offsetMinutes ?? EMPTY_GOAL_FORM.offsetMinutes),
  };
}

/** The fields a goal owns. Everything else on the task keeps its value. */
export function toGoalFields(form: GoalForm, today: CalendarDate = todayCalendarDate()) {
  return {
    title: form.title.trim(),
    notes: form.notes.trim() === '' ? null : form.notes.trim(),
    kind: 'goal' as const,
    dueAt: goalDueInstant(form.dueDate),
    recurrence: form.recurring
      ? {
          freq: 'weekly' as const,
          interval: 1,
          byWeekday: [...form.byWeekday].sort((a, b) => a - b),
          byMonthDay: null,
          timeOfDay: form.timeOfDay,
          startsOn: today,
          endsOn: form.dueDate,
        }
      : null,
    reminders: form.beforeDue
      ? [
          {
            id: newId(),
            mode: 'beforeDue' as const,
            at: null,
            offsetMinutes: Number(form.offsetMinutes),
            enabled: true,
          },
        ]
      : [],
    updatedAt: nowInstant(),
  };
}

export function validateGoalForm(form: GoalForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.title.trim() === '') errors.title = 'Il titolo è obbligatorio.';
  if (form.dueDate === '') errors.dueDate = 'Un obiettivo ha una data.';
  if (form.recurring && form.byWeekday.length === 0) {
    errors.byWeekday = 'Scegli almeno un giorno.';
  }
  if (!form.recurring && !form.beforeDue) {
    errors.beforeDue = 'Senza nessuno dei due non ti arriva niente.';
  }

  return errors;
}

/** "lun, mer, ven alle 20:00 · la sera prima" */
export function cadenceLabel(task: Task): string {
  const parts: string[] = [];
  const days = task.recurrence?.byWeekday ?? [];

  if (days.length > 0 && task.recurrence?.timeOfDay) {
    const when =
      days.length === 7
        ? 'ogni giorno'
        : days.map((day) => WEEKDAY_LABELS[day - 1]?.toLowerCase()).join(', ');
    parts.push(`${when} alle ${task.recurrence.timeOfDay}`);
  }

  const reminder = task.reminders.find((r) => r.mode === 'beforeDue' && r.enabled);
  if (reminder) {
    const option = BEFORE_DUE_OPTIONS.find((o) => o.value === String(reminder.offsetMinutes));
    parts.push((option?.label ?? 'prima della scadenza').toLowerCase());
  }

  return parts.length > 0 ? parts.join(' · ') : 'nessun promemoria';
}

const FIRE_FORMAT = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatFireTime(at: Date): string {
  return FIRE_FORMAT.format(at);
}
