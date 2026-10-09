export type ID = string;
export type CalendarDate = string;
export type Instant = string;
export type Clock = string;
export type Cents = number;

export interface Base {
  id: ID;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
}

export type IncomeKind = 'salary' | 'freelance' | 'business' | 'passive' | 'gift' | 'other';

export interface IncomeSource extends Base {
  name: string;
  kind: IncomeKind;
  expectedAmount: Cents | null;
  expectedDay: number | null;
  color: string;
  isActive: boolean;
}

export interface IncomeEntry extends Base {
  sourceId: ID;
  cycleId: ID;
  amount: Cents;
  date: CalendarDate;
  note: string | null;
  status: 'expected' | 'received';
}

export type BucketKind =
  'rent' | 'bills' | 'investment' | 'savings' | 'spending' | 'buffer' | 'custom';

export type AllocationRule =
  | { type: 'fixed'; value: Cents }
  | { type: 'percent'; value: number; base: 'gross' | 'afterFixed' }
  | { type: 'remainder' };

export interface Bucket extends Base {
  name: string;
  kind: BucketKind;
  rule: AllocationRule;
  priority: number;
  targetAmount: Cents | null;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface Cycle extends Base {
  label: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
  status: 'planned' | 'active' | 'closed';
  openingBalance: Cents;
  closedAt: Instant | null;
}

export interface Allocation extends Base {
  cycleId: ID;
  bucketId: ID;
  plannedAmount: Cents;
  actualAmount: Cents;
  isLocked: boolean;
}

export interface Transaction extends Base {
  cycleId: ID;
  bucketId: ID | null;
  type: 'expense' | 'income' | 'transfer';
  amount: Cents;
  date: CalendarDate;
  description: string;
  category: string | null;
  shoppingItemId: ID | null;
  taskId: ID | null;
}

export interface RecurringExpense extends Base {
  name: string;
  amount: Cents;
  dayOfMonth: number;
  bucketId: ID;
  createsTask: boolean;
  isActive: boolean;
}

export interface Project extends Base {
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: 'active' | 'paused' | 'done' | 'archived';
  order: number;
}

export type TaskKind = 'simple' | 'habit' | 'timed' | 'goal';

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  byWeekday: number[] | null;
  byMonthDay: number[] | null;
  timeOfDay: Clock | null;
  startsOn: CalendarDate;
  endsOn: CalendarDate | null;
}

export interface Reminder {
  id: ID;
  mode: 'atTime' | 'beforeDue';
  at: Clock | null;
  offsetMinutes: number | null;
  enabled: boolean;
}

export interface Task extends Base {
  projectId: ID | null;
  title: string;
  notes: string | null;
  kind: TaskKind;
  status: 'todo' | 'doing' | 'done' | 'dropped';
  priority: 0 | 1 | 2 | 3;
  dueAt: Instant | null;
  order: number;
  tags: string[];
  recurrence: Recurrence | null;
  timer: { targetSeconds: number; minSeconds: number } | null;
  shoppingItemId: ID | null;
  reminders: Reminder[];
  completedAt: Instant | null;
}

export interface TaskOccurrence extends Base {
  taskId: ID;
  date: CalendarDate;
  status: 'pending' | 'done' | 'skipped';
  secondsLogged: number;
  completedAt: Instant | null;
}

export interface TimerSession extends Base {
  taskId: ID;
  occurrenceId: ID;
  startedAt: Instant;
  endedAt: Instant | null;
  seconds: number;
  reachedMinimum: boolean;
}

export interface ShoppingItem extends Base {
  name: string;
  url: string | null;
  estimatedCost: Cents;
  actualCost: Cents | null;
  deadline: CalendarDate | null;
  priority: 0 | 1 | 2 | 3;
  status: 'wanted' | 'planned' | 'bought' | 'dropped';
  bucketId: ID | null;
  cycleId: ID | null;
  projectId: ID | null;
  boughtAt: Instant | null;
}

export interface ScheduledNotification extends Base {
  refType: 'task' | 'occurrence' | 'shopping' | 'recurringExpense' | 'cycle';
  refId: ID;
  fireAt: Instant;
  title: string;
  body: string;
  deepLink: string;
  status: 'pending' | 'fired' | 'dismissed' | 'cancelled';
}

export interface Settings extends Base {
  currency: 'EUR';
  locale: 'it-IT';
  weekStartsOn: 1;
  cycleMode: 'calendarMonth' | 'paydayToPayday';
  paydayAnchor: number;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  quietHours: { from: Clock; to: Clock } | null;
}

export interface OutboxEntry {
  id: ID;
  entity: string;
  entityId: ID;
  op: 'create' | 'update' | 'remove';
  payload: any;
  createdAt: Instant;
  syncedAt: Instant | null;
}

export type ScheduleKind = 'work' | 'break' | 'gym' | 'custom';

/**
 * One block of the day, in the only collection the agenda has.
 *
 * A row is either the weekly template (`date: null`, repeating on the weekdays
 * in `byWeekday`) or a single-day exception (`date` set): `templateId` names
 * the template it replaces, `skipped` removes that template for the day, and
 * both null means a block that belongs to that date alone.
 */
export interface ScheduleBlock extends Base {
  title: string;
  kind: ScheduleKind;
  start: Clock;
  end: Clock;
  /** ISO weekdays, 1 = Monday to 7 = Sunday. Empty on an exception. */
  byWeekday: number[];
  date: CalendarDate | null;
  templateId: ID | null;
  skipped: boolean;
}
