import { create } from 'zustand';
import { dbAdapter } from './db';
import { useToastStore } from './toast';
import { defaultSettings } from '../data/defaults';
import type * as T from '../data/types';

/** Soft-deleted rows stay in IndexedDB but must never reach a screen. */
function live<R extends { deletedAt: T.Instant | null }>(rows: R[] | undefined): R[] {
  return (rows ?? []).filter((row) => !row.deletedAt);
}

/** Set by `hydrate`, so concurrent calls queue instead of racing. */
let hydration: Promise<void> | null = null;

async function runHydrate(): Promise<void> {
  if (!(dbAdapter as any).db) {
    await dbAdapter.init();
  }
  const c = (await dbAdapter.exportAll()).collections;

  // Without settings the app is unusable: the cycle banner hides itself when
  // they are missing, and that banner is the only way to open a first cycle.
  let settings = c.settings?.[0] ?? null;
  if (!settings) {
    settings = defaultSettings();
    await dbAdapter.settings.create(settings);
  }

  useDataStore.setState({
    isHydrated: true,
    incomeSources: live(c.incomeSources),
    incomeEntries: live(c.incomeEntries),
    buckets: live(c.buckets),
    cycles: live(c.cycles),
    allocations: live(c.allocations),
    transactions: live(c.transactions),
    recurringExpenses: live(c.recurringExpenses),
    projects: live(c.projects),
    tasks: live(c.tasks),
    taskOccurrences: live(c.taskOccurrences),
    timerSessions: live(c.timerSessions),
    shoppingItems: live(c.shoppingItems),
    scheduledNotifications: live(c.scheduledNotifications),
    scheduleBlocks: live(c.scheduleBlocks),
    settings,
  });
}

interface State {
  isHydrated: boolean;
  incomeSources: T.IncomeSource[];
  incomeEntries: T.IncomeEntry[];
  buckets: T.Bucket[];
  cycles: T.Cycle[];
  allocations: T.Allocation[];
  transactions: T.Transaction[];
  recurringExpenses: T.RecurringExpense[];
  projects: T.Project[];
  tasks: T.Task[];
  taskOccurrences: T.TaskOccurrence[];
  timerSessions: T.TimerSession[];
  shoppingItems: T.ShoppingItem[];
  scheduledNotifications: T.ScheduledNotification[];
  scheduleBlocks: T.ScheduleBlock[];
  settings: T.Settings | null;
}

type CollectionName = keyof Omit<State, 'isHydrated' | 'settings'>;

interface Actions {
  hydrate: () => Promise<void>;
  createItem: <K extends CollectionName>(collection: K, item: State[K][0]) => Promise<void>;
  updateItem: <K extends CollectionName>(
    collection: K,
    id: string,
    data: Partial<State[K][0]>
  ) => Promise<void>;
  removeItem: <K extends CollectionName>(collection: K, id: string) => Promise<void>;
  restoreItem: <K extends CollectionName>(collection: K, id: string) => Promise<void>;
  updateSettings: (settings: T.Settings) => Promise<void>;
  loadSeed: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const initialState: State = {
  isHydrated: false,
  incomeSources: [],
  incomeEntries: [],
  buckets: [],
  cycles: [],
  allocations: [],
  transactions: [],
  recurringExpenses: [],
  projects: [],
  tasks: [],
  taskOccurrences: [],
  timerSessions: [],
  shoppingItems: [],
  scheduledNotifications: [],
  scheduleBlocks: [],
  settings: null,
};

export const useDataStore = create<State & Actions>((set, get) => ({
  ...initialState,

  // Serialized: StrictMode mounts twice, and two concurrent runs would each see
  // no settings row and each create one.
  hydrate: () => (hydration = (hydration ?? Promise.resolve()).then(runHydrate)),

  createItem: async (collection, item) => {
    const prev = get()[collection];
    // Optimistic update
    set({ [collection]: [...prev, item] } as any);

    try {
      await (dbAdapter[collection] as any).create(item);
    } catch (err) {
      // Rollback
      set({ [collection]: prev } as any);
      useToastStore.getState().addToast('Non è stato possibile salvare. Riprova.', 'error');
      throw err;
    }
  },

  updateItem: async (collection, id, data) => {
    const prev = get()[collection] as any[];
    const index = prev.findIndex((item) => item.id === id);
    if (index === -1) return;

    const updatedItem = { ...prev[index], ...data };
    const next = [...prev];
    next[index] = updatedItem;

    // Optimistic update
    set({ [collection]: next } as any);

    try {
      await (dbAdapter[collection] as any).update(id, data);
    } catch (err) {
      // Rollback
      set({ [collection]: prev } as any);
      useToastStore.getState().addToast('Non è stato possibile salvare. Riprova.', 'error');
      throw err;
    }
  },

  removeItem: async (collection, id) => {
    const prev = get()[collection] as any[];
    const next = prev.filter((item) => item.id !== id);

    // Optimistic update
    set({ [collection]: next } as any);

    try {
      await (dbAdapter[collection] as any).remove(id);
    } catch (err) {
      set({ [collection]: prev } as unknown as Partial<State>);
      useToastStore.getState().addToast('Non è stato possibile eliminare. Riprova.', 'error');
      throw err;
    }
  },

  restoreItem: async (collection, id) => {
    try {
      await (dbAdapter[collection] as any).update(id, { deletedAt: null });
      const record = await (dbAdapter[collection] as any).get(id);

      const prev = get()[collection];
      set({
        [collection]: [...prev, record],
      } as unknown as Partial<State>);
    } catch (err) {
      useToastStore.getState().addToast('Non è stato possibile ripristinare.', 'error');
      throw err;
    }
  },

  updateSettings: async (settings) => {
    const prev = get().settings;
    set({ settings });

    try {
      const existing = await dbAdapter.settings.list();
      if (existing.length > 0) {
        await dbAdapter.settings.update(existing[0].id, settings);
      } else {
        await dbAdapter.settings.create(settings);
      }
    } catch (err) {
      set({ settings: prev });
      useToastStore.getState().addToast('Non è stato possibile salvare. Riprova.', 'error');
      throw err;
    }
  },

  loadSeed: async () => {
    const { generateSeedData } = await import('../data/seed');
    const seed = generateSeedData();
    const exportData = { version: 1, timestamp: new Date().toISOString(), collections: seed };
    await dbAdapter.importAll(exportData, 'replace');
    await get().hydrate();
    useToastStore.getState().addToast('Dati di esempio caricati con successo.', 'info');
  },

  resetAll: async () => {
    const emptyCollections = {
      incomeSources: [],
      incomeEntries: [],
      buckets: [],
      cycles: [],
      allocations: [],
      transactions: [],
      recurringExpenses: [],
      projects: [],
      tasks: [],
      taskOccurrences: [],
      timerSessions: [],
      shoppingItems: [],
      scheduledNotifications: [],
      scheduleBlocks: [],
      settings: [],
      outbox: [],
    };
    const exportData = {
      version: 1,
      timestamp: new Date().toISOString(),
      collections: emptyCollections,
    };
    await dbAdapter.importAll(exportData, 'replace');
    await get().hydrate();
    useToastStore.getState().addToast('Tutti i dati sono stati eliminati.', 'info');
  },
}));
