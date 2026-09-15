import type * as T from '../types';
import type { DBSchema } from 'idb';

export interface Schema extends DBSchema {
  incomeSources: {
    key: string;
    value: T.IncomeSource;
    indexes: { deletedAt: string };
  };
  incomeEntries: {
    key: string;
    value: T.IncomeEntry;
    indexes: { deletedAt: string; cycleId: string; date: string };
  };
  buckets: {
    key: string;
    value: T.Bucket;
    indexes: { deletedAt: string };
  };
  cycles: {
    key: string;
    value: T.Cycle;
    indexes: { deletedAt: string };
  };
  allocations: {
    key: string;
    value: T.Allocation;
    indexes: { deletedAt: string; cycleId: string };
  };
  transactions: {
    key: string;
    value: T.Transaction;
    indexes: { deletedAt: string; cycleId: string; taskId: string; date: string };
  };
  recurringExpenses: {
    key: string;
    value: T.RecurringExpense;
    indexes: { deletedAt: string };
  };
  projects: {
    key: string;
    value: T.Project;
    indexes: { deletedAt: string };
  };
  tasks: {
    key: string;
    value: T.Task;
    indexes: { deletedAt: string };
  };
  taskOccurrences: {
    key: string;
    value: T.TaskOccurrence;
    indexes: { deletedAt: string; taskId: string; date: string };
  };
  timerSessions: {
    key: string;
    value: T.TimerSession;
    indexes: { deletedAt: string; taskId: string };
  };
  shoppingItems: {
    key: string;
    value: T.ShoppingItem;
    indexes: { deletedAt: string; cycleId: string };
  };
  scheduledNotifications: {
    key: string;
    value: T.ScheduledNotification;
    indexes: { deletedAt: string };
  };
  settings: {
    key: string;
    value: T.Settings;
    indexes: { deletedAt: string };
  };
}
