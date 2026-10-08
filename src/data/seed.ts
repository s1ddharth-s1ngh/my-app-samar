import type * as T from './types';
import { defaultScheduleBlocks } from './defaults';
import { computeAllocations } from '@/domain/allocation';
import { computeCycleBounds, describeCycle, todayCalendarDate } from '@/domain/cycles';

function createBase(): T.Base {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
}

export function generateSeedData(): any {
  // We return collections object
  const stipendioId = crypto.randomUUID();
  const freelanceId = crypto.randomUUID();

  const incomeSources: T.IncomeSource[] = [
    {
      ...createBase(),
      id: stipendioId,
      name: 'Stipendio',
      kind: 'salary',
      expectedAmount: 250000,
      expectedDay: 27,
      color: '#4caf50',
      isActive: true,
    },
    {
      ...createBase(),
      id: freelanceId,
      name: 'Lavori extra',
      kind: 'freelance',
      expectedAmount: 50000,
      expectedDay: null,
      color: '#ff9800',
      isActive: true,
    },
  ];

  const bucketAffittoId = crypto.randomUUID();
  const bucketBolletteId = crypto.randomUUID();
  const bucketInvestimentiId = crypto.randomUUID();
  const bucketRisparmioId = crypto.randomUUID();
  const bucketSpeseId = crypto.randomUUID();

  const buckets: T.Bucket[] = [
    {
      ...createBase(),
      id: bucketAffittoId,
      name: 'Affitto',
      kind: 'rent',
      rule: { type: 'fixed', value: 80000 },
      priority: 1,
      targetAmount: null,
      color: '#f44336',
      icon: 'home',
      isActive: true,
    },
    {
      ...createBase(),
      id: bucketBolletteId,
      name: 'Bollette',
      kind: 'bills',
      rule: { type: 'fixed', value: 20000 },
      priority: 2,
      targetAmount: null,
      color: '#2196f3',
      icon: 'zap',
      isActive: true,
    },
    {
      ...createBase(),
      id: bucketInvestimentiId,
      name: 'Investimenti',
      kind: 'investment',
      rule: { type: 'percent', value: 15, base: 'afterFixed' },
      priority: 3,
      targetAmount: null,
      color: '#9c27b0',
      icon: 'trending-up',
      isActive: true,
    },
    {
      ...createBase(),
      id: bucketRisparmioId,
      name: 'Risparmio',
      kind: 'savings',
      rule: { type: 'percent', value: 10, base: 'afterFixed' },
      priority: 4,
      targetAmount: null,
      color: '#00bcd4',
      icon: 'piggy-bank',
      isActive: true,
    },
    {
      ...createBase(),
      id: bucketSpeseId,
      name: 'Spese',
      kind: 'spending',
      rule: { type: 'remainder' },
      priority: 5,
      targetAmount: null,
      color: '#ffeb3b',
      icon: 'shopping-cart',
      isActive: true,
    },
  ];

  const project1Id = crypto.randomUUID();
  const project2Id = crypto.randomUUID();

  const projects: T.Project[] = [
    {
      ...createBase(),
      id: project1Id,
      name: 'Casa',
      description: 'Ristrutturazione',
      color: '#ff5722',
      icon: 'home',
      status: 'active',
      order: 1,
    },
    {
      ...createBase(),
      id: project2Id,
      name: 'Side Project',
      description: 'App React',
      color: '#3f51b5',
      icon: 'code',
      status: 'active',
      order: 2,
    },
  ];

  const shopping1Id = crypto.randomUUID();
  const shoppingItems: T.ShoppingItem[] = [
    {
      ...createBase(),
      id: shopping1Id,
      name: 'Nuova sedia',
      url: null,
      estimatedCost: 35000,
      actualCost: null,
      deadline: '2026-12-31',
      priority: 1,
      status: 'planned',
      bucketId: bucketSpeseId,
      cycleId: null,
      projectId: project1Id,
      boughtAt: null,
    },
    {
      ...createBase(),
      name: 'Libro TS',
      url: null,
      estimatedCost: 4000,
      actualCost: null,
      deadline: null,
      priority: 2,
      status: 'wanted',
      bucketId: null,
      cycleId: null,
      projectId: project2Id,
      boughtAt: null,
    },
    {
      ...createBase(),
      name: 'Monitor',
      url: null,
      estimatedCost: 40000,
      actualCost: null,
      deadline: null,
      priority: 3,
      status: 'wanted',
      bucketId: null,
      cycleId: null,
      projectId: null,
      boughtAt: null,
    },
    {
      ...createBase(),
      name: 'Regalo',
      url: null,
      estimatedCost: 5000,
      actualCost: null,
      deadline: null,
      priority: 0,
      status: 'wanted',
      bucketId: null,
      cycleId: null,
      projectId: null,
      boughtAt: null,
    },
  ];

  const tasks: T.Task[] = [
    // 1 Abitudine
    {
      ...createBase(),
      projectId: null,
      title: 'Leggere 10 pag',
      notes: null,
      kind: 'habit',
      status: 'todo',
      priority: 2,
      dueAt: null,
      order: 1,
      tags: [],
      recurrence: {
        freq: 'daily',
        interval: 1,
        byWeekday: null,
        byMonthDay: null,
        timeOfDay: null,
        startsOn: '2026-01-01',
        endsOn: null,
      },
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    // 2 Abitudine
    {
      ...createBase(),
      projectId: project1Id,
      title: 'Pulire cucina',
      notes: null,
      kind: 'habit',
      status: 'todo',
      priority: 1,
      dueAt: null,
      order: 2,
      tags: [],
      recurrence: {
        freq: 'daily',
        interval: 1,
        byWeekday: null,
        byMonthDay: null,
        timeOfDay: null,
        startsOn: '2026-01-01',
        endsOn: null,
      },
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    // 3 Timer
    {
      ...createBase(),
      projectId: project2Id,
      title: 'Programmare',
      notes: null,
      kind: 'timed',
      status: 'todo',
      priority: 0,
      dueAt: null,
      order: 3,
      tags: [],
      recurrence: {
        freq: 'daily',
        interval: 1,
        byWeekday: null,
        byMonthDay: null,
        timeOfDay: null,
        startsOn: '2026-01-01',
        endsOn: null,
      },
      timer: { targetSeconds: 3600, minSeconds: 600 },
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    // Simple tasks
    {
      ...createBase(),
      projectId: project1Id,
      title: 'Chiamare idraulico',
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 1,
      dueAt: null,
      order: 4,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    {
      ...createBase(),
      projectId: project2Id,
      title: 'Scrivere README',
      notes: null,
      kind: 'simple',
      status: 'doing',
      priority: 0,
      dueAt: null,
      order: 5,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    {
      ...createBase(),
      projectId: null,
      title: 'Comprare sedia',
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 2,
      dueAt: null,
      order: 6,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: shopping1Id,
      reminders: [],
      completedAt: null,
    },
    {
      ...createBase(),
      projectId: null,
      title: 'Comprare pane',
      notes: null,
      kind: 'simple',
      status: 'done',
      priority: 3,
      dueAt: null,
      order: 7,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: new Date().toISOString(),
    },
    {
      ...createBase(),
      projectId: project1Id,
      title: 'Misurare muro',
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 2,
      dueAt: null,
      order: 8,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    {
      ...createBase(),
      projectId: project2Id,
      title: 'Commit T1.7',
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 0,
      dueAt: null,
      order: 9,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
    {
      ...createBase(),
      projectId: null,
      title: 'Ritirare pacco',
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 1,
      dueAt: null,
      order: 10,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
    },
  ];

  const settings: T.Settings = {
    ...createBase(),
    currency: 'EUR',
    locale: 'it-IT',
    weekStartsOn: 1,
    cycleMode: 'calendarMonth',
    paydayAnchor: 27,
    theme: 'dark',
    notificationsEnabled: false,
    quietHours: null,
  };

  // The sample cycle is the one that contains today: a hardcoded date would
  // hand the user a cycle that expired before they ever opened the app.
  const bounds = computeCycleBounds(todayCalendarDate(), settings.cycleMode, settings.paydayAnchor);
  const cycleId = crypto.randomUUID();
  const cycles: T.Cycle[] = [
    {
      ...createBase(),
      id: cycleId,
      label: describeCycle(bounds, settings.cycleMode),
      ...bounds,
      status: 'active',
      openingBalance: 500000,
      closedAt: null,
    },
  ];

  const incomeEntries: T.IncomeEntry[] = [
    {
      ...createBase(),
      sourceId: stipendioId,
      cycleId,
      amount: 250000,
      date: bounds.startDate,
      note: null,
      status: 'received',
    },
  ];

  // Run the real engine, so the sample data shows the split the rules produce
  // rather than an empty one the user would have to trigger by hand.
  const totalIncome =
    cycles[0]!.openingBalance + incomeEntries.reduce((acc, entry) => acc + entry.amount, 0);

  const spesa: T.Transaction = {
    ...createBase(),
    cycleId,
    bucketId: bucketSpeseId,
    type: 'expense',
    amount: 5000,
    date: bounds.startDate,
    description: 'Spesa al mercato',
    category: 'Alimentari',
    shoppingItemId: null,
    taskId: null,
  };
  const transactions: T.Transaction[] = [spesa];

  const allocations: T.Allocation[] = computeAllocations({ totalIncome, buckets }).lines.map(
    (line) => ({
      ...createBase(),
      cycleId,
      bucketId: line.bucketId,
      plannedAmount: line.plannedAmount,
      actualAmount: line.bucketId === spesa.bucketId ? spesa.amount : 0,
      isLocked: false,
    })
  );

  return {
    incomeSources,
    incomeEntries,
    buckets,
    cycles,
    allocations,
    transactions,
    recurringExpenses: [],
    projects,
    tasks,
    taskOccurrences: [],
    timerSessions: [],
    shoppingItems,
    scheduledNotifications: [],
    scheduleBlocks: defaultScheduleBlocks(),
    settings: [settings],
  };
}
