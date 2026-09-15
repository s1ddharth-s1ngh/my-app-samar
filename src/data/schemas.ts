import { z } from 'zod';
import type * as T from './types';

// Regex per data ISO (es. 2026-09-15T10:00:00Z)
const instantRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
// Regex per CalendarDate (es. 2026-09-15)
const calendarDateRegex = /^\d{4}-\d{2}-\d{2}$/;
// Regex per Clock (es. 10:30)
const clockRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const instantSchema = z.string().regex(instantRegex, 'Deve essere un ISO 8601');
export const calendarDateSchema = z
  .string()
  .regex(calendarDateRegex, 'Deve essere nel formato YYYY-MM-DD');
export const clockSchema = z.string().regex(clockRegex, 'Deve essere nel formato HH:mm');
export const idSchema = z.string().uuid('Deve essere un UUID valido');
export const centsSchema = z
  .number({ message: 'Deve essere un numero' })
  .int('Deve essere un numero intero (centesimi)')
  .min(0, 'Non può essere negativo');

export const baseSchema = z.object({
  id: idSchema,
  createdAt: instantSchema,
  updatedAt: instantSchema,
  deletedAt: instantSchema.nullable(),
});

export const incomeSourceSchema = baseSchema.extend({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  kind: z.enum(['salary', 'freelance', 'business', 'passive', 'gift', 'other']),
  expectedAmount: centsSchema.nullable(),
  expectedDay: z.number().int().min(1, 'Minimo 1').max(31, 'Massimo 31').nullable(),
  color: z.string().min(1),
  isActive: z.boolean(),
}) satisfies z.ZodType<T.IncomeSource>;

export const incomeEntrySchema = baseSchema.extend({
  sourceId: idSchema,
  cycleId: idSchema,
  amount: centsSchema,
  date: calendarDateSchema,
  note: z.string().nullable(),
  status: z.enum(['expected', 'received']),
}) satisfies z.ZodType<T.IncomeEntry>;

const allocationRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed'), value: centsSchema }),
  z.object({
    type: z.literal('percent'),
    value: z.number().min(0, 'Minimo 0%').max(100, 'Massimo 100%'),
    base: z.enum(['gross', 'afterFixed']),
  }),
  z.object({ type: z.literal('remainder') }),
]) satisfies z.ZodType<T.AllocationRule>;

export const bucketSchema = baseSchema.extend({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  kind: z.enum(['rent', 'bills', 'investment', 'savings', 'spending', 'buffer', 'custom']),
  rule: allocationRuleSchema,
  priority: z.number().int().min(0),
  targetAmount: centsSchema.nullable(),
  color: z.string().min(1),
  icon: z.string().min(1),
  isActive: z.boolean(),
}) satisfies z.ZodType<T.Bucket>;

export const cycleSchema = baseSchema
  .extend({
    label: z.string().min(1),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    status: z.enum(['planned', 'active', 'closed']),
    openingBalance: centsSchema,
    closedAt: instantSchema.nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La data di fine non può precedere la data di inizio',
    path: ['endDate'],
  }) satisfies z.ZodType<T.Cycle>;

export const allocationSchema = baseSchema.extend({
  cycleId: idSchema,
  bucketId: idSchema,
  plannedAmount: centsSchema,
  actualAmount: centsSchema,
  isLocked: z.boolean(),
}) satisfies z.ZodType<T.Allocation>;

export const transactionSchema = baseSchema.extend({
  cycleId: idSchema,
  bucketId: idSchema.nullable(),
  type: z.enum(['expense', 'income', 'transfer']),
  amount: centsSchema,
  date: calendarDateSchema,
  description: z.string().min(1, 'La descrizione è obbligatoria'),
  category: z.string().nullable(),
  shoppingItemId: idSchema.nullable(),
  taskId: idSchema.nullable(),
}) satisfies z.ZodType<T.Transaction>;

export const recurringExpenseSchema = baseSchema.extend({
  name: z.string().min(1),
  amount: centsSchema,
  dayOfMonth: z.number().int().min(1, 'Minimo 1').max(31, 'Massimo 31'),
  bucketId: idSchema,
  createsTask: z.boolean(),
  isActive: z.boolean(),
}) satisfies z.ZodType<T.RecurringExpense>;

export const projectSchema = baseSchema.extend({
  name: z.string().min(1),
  description: z.string().nullable(),
  color: z.string().min(1),
  icon: z.string().min(1),
  status: z.enum(['active', 'paused', 'done', 'archived']),
  order: z.number().int(),
}) satisfies z.ZodType<T.Project>;

export const recurrenceSchema = z.object({
  freq: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().min(1),
  byWeekday: z.array(z.number().int().min(0).max(6)).nullable(),
  byMonthDay: z.array(z.number().int().min(1).max(31)).nullable(),
  timeOfDay: clockSchema.nullable(),
  startsOn: calendarDateSchema,
  endsOn: calendarDateSchema.nullable(),
}) satisfies z.ZodType<T.Recurrence>;

export const reminderSchema = z.object({
  id: idSchema,
  mode: z.enum(['atTime', 'beforeDue']),
  at: clockSchema.nullable(),
  offsetMinutes: z.number().int().nullable(),
  enabled: z.boolean(),
}) satisfies z.ZodType<T.Reminder>;

export const taskSchema = baseSchema
  .extend({
    projectId: idSchema.nullable(),
    title: z.string().min(1, 'Il titolo è obbligatorio'),
    notes: z.string().nullable(),
    kind: z.enum(['simple', 'habit', 'timed']),
    status: z.enum(['todo', 'doing', 'done', 'dropped']),
    priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    dueAt: instantSchema.nullable(),
    order: z.number().int(),
    tags: z.array(z.string()),
    recurrence: recurrenceSchema.nullable(),
    timer: z
      .object({
        targetSeconds: z.number().int().min(1),
        minSeconds: z.number().int().min(0),
      })
      .nullable(),
    shoppingItemId: idSchema.nullable(),
    reminders: z.array(reminderSchema),
    completedAt: instantSchema.nullable(),
  })
  .refine((data) => !(data.kind !== 'simple' && !data.recurrence), {
    message: 'La ricorrenza è obbligatoria per le abitudini e i task con timer',
    path: ['recurrence'],
  })
  .refine((data) => !(data.kind === 'timed' && !data.timer), {
    message: "Il timer è obbligatorio per i task di tipo 'timed'",
    path: ['timer'],
  }) satisfies z.ZodType<T.Task>;

export const taskOccurrenceSchema = baseSchema.extend({
  taskId: idSchema,
  date: calendarDateSchema,
  status: z.enum(['pending', 'done', 'skipped']),
  secondsLogged: z.number().int().min(0),
  completedAt: instantSchema.nullable(),
}) satisfies z.ZodType<T.TaskOccurrence>;

export const timerSessionSchema = baseSchema.extend({
  taskId: idSchema,
  occurrenceId: idSchema,
  startedAt: instantSchema,
  endedAt: instantSchema.nullable(),
  seconds: z.number().int().min(0),
  reachedMinimum: z.boolean(),
}) satisfies z.ZodType<T.TimerSession>;

export const shoppingItemSchema = baseSchema.extend({
  name: z.string().min(1),
  url: z.string().nullable(),
  estimatedCost: centsSchema,
  actualCost: centsSchema.nullable(),
  deadline: calendarDateSchema.nullable(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(['wanted', 'planned', 'bought', 'dropped']),
  bucketId: idSchema.nullable(),
  cycleId: idSchema.nullable(),
  projectId: idSchema.nullable(),
  boughtAt: instantSchema.nullable(),
}) satisfies z.ZodType<T.ShoppingItem>;

export const scheduledNotificationSchema = baseSchema.extend({
  refType: z.enum(['task', 'occurrence', 'shopping', 'recurringExpense', 'cycle']),
  refId: idSchema,
  fireAt: instantSchema,
  title: z.string().min(1),
  body: z.string(),
  deepLink: z.string(),
  status: z.enum(['pending', 'fired', 'dismissed', 'cancelled']),
}) satisfies z.ZodType<T.ScheduledNotification>;

export const settingsSchema = baseSchema.extend({
  currency: z.literal('EUR'),
  locale: z.literal('it-IT'),
  weekStartsOn: z.literal(1),
  cycleMode: z.enum(['calendarMonth', 'paydayToPayday']),
  paydayAnchor: z.number().int().min(1).max(31),
  theme: z.enum(['light', 'dark', 'system']),
  notificationsEnabled: z.boolean(),
  quietHours: z.object({ from: clockSchema, to: clockSchema }).nullable(),
}) satisfies z.ZodType<T.Settings>;
