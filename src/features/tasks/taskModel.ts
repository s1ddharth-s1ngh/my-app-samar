import type { ID, Task, TaskKind } from '@/data/types';
import { newBase } from '@/lib/record';

export const PRIORITY_LABELS: Record<Task['priority'], string> = {
  0: 'Nessuna',
  1: 'Bassa',
  2: 'Media',
  3: 'Urgente',
};

export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABELS) as unknown as Task['priority'][]).map(
  (value) => ({ value: String(value), label: PRIORITY_LABELS[value] })
);

export function isPriority(value: number): value is Task['priority'] {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export function parsePriority(value: string): Task['priority'] {
  const parsed = Number(value);
  return isPriority(parsed) ? parsed : 0;
}

/** A task with every field at its neutral value; callers override what they know. */
export function newTask(partial: Partial<Task> & { title: string }): Task {
  return {
    ...newBase(),
    projectId: null,
    notes: null,
    kind: 'simple' as TaskKind,
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

/** "casa, urgente" → ['casa', 'urgente']; empty entries are dropped. */
export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag !== '')
    ),
  ];
}

/** `datetime-local` wants 'YYYY-MM-DDTHH:mm' in local time, not an ISO instant. */
export function instantToLocalInput(instant: string | null): string {
  if (!instant) return '';
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function localInputToInstant(value: string): string | null {
  if (value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function nextOrder(tasks: Task[], projectId: ID | null): number {
  const siblings = tasks.filter((task) => task.projectId === projectId && !task.deletedAt);
  return siblings.reduce((max, task) => Math.max(max, task.order), -1) + 1;
}
