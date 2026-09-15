import { create } from 'zustand';
import { dbAdapter } from './db';
import { useToastStore } from './toast';
import type * as T from '../data/types';

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
  settings: null,
};

export const useDataStore = create<State & Actions>((set, get) => ({
  ...initialState,

  hydrate: async () => {
    if (!(dbAdapter as any).db) {
      await dbAdapter.init();
    }
    const data = await dbAdapter.exportAll();

    set({
      isHydrated: true,
      incomeSources: data.collections.incomeSources || [],
      incomeEntries: data.collections.incomeEntries || [],
      buckets: data.collections.buckets || [],
      cycles: data.collections.cycles || [],
      allocations: data.collections.allocations || [],
      transactions: data.collections.transactions || [],
      recurringExpenses: data.collections.recurringExpenses || [],
      projects: data.collections.projects || [],
      tasks: data.collections.tasks || [],
      taskOccurrences: data.collections.taskOccurrences || [],
      timerSessions: data.collections.timerSessions || [],
      shoppingItems: data.collections.shoppingItems || [],
      scheduledNotifications: data.collections.scheduledNotifications || [],
      settings: (data.collections.settings?.[0] as T.Settings) || null,
    });
  },

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
      // Rollback
      set({ [collection]: prev } as any);
      useToastStore.getState().addToast('Non è stato possibile salvare. Riprova.', 'error');
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
