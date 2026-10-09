import { create } from 'zustand';
import { dbAdapter } from './db';
import { getSupabaseClient, isSupabaseConfigured } from '@/data/supabase/client';
import type { ExportData } from '@/data/adapter';
import type { Base } from '@/data/types';

type Collection = keyof ExportData['collections'];

const COLLECTIONS: Collection[] = [
  'incomeSources',
  'incomeEntries',
  'buckets',
  'cycles',
  'allocations',
  'transactions',
  'recurringExpenses',
  'projects',
  'tasks',
  'taskOccurrences',
  'timerSessions',
  'shoppingItems',
  'scheduledNotifications',
  'scheduleBlocks',
  'settings',
];
const OWNER_KEY = 'samar-cloud-owner';
const RESET_KEY = 'samar-cloud-reset';

interface CloudState {
  userId: string | null;
  email: string | null;
  status: 'local' | 'idle' | 'syncing' | 'synced' | 'error';
  message: string | null;
  lastSync: string | null;
}

export const useCloudStore = create<CloudState>(() => ({
  userId: null,
  email: null,
  status: isSupabaseConfigured() ? 'idle' : 'local',
  message: null,
  lastSync: null,
}));

export function requestCloudSync(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('samar:sync'));
}

export function markCloudReset(): void {
  const owner = useCloudStore.getState().userId ?? localStorage.getItem(OWNER_KEY);
  if (owner) localStorage.setItem(RESET_KEY, owner);
}

type CloudRow = { collection: Collection; record_id: string; payload: Base };

async function readCloudRows(userId: string): Promise<CloudRow[]> {
  const client = getSupabaseClient();
  const rows: CloudRow[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await client
      .from('records')
      .select('collection,record_id,payload')
      .eq('user_id', userId)
      .order('collection')
      .order('record_id')
      .range(from, from + 499);
    if (error) throw error;
    rows.push(...((data ?? []) as CloudRow[]));
    if (!data || data.length < 500) break;
  }
  return rows;
}

let activeSync: Promise<boolean> | null = null;
let syncAgain = false;

/** Push local edits, then pull the account's rows into IndexedDB. */
export function syncCloud(onPulled: () => Promise<void>): Promise<boolean> {
  if (activeSync) {
    syncAgain = true;
    return activeSync;
  }
  activeSync = runSync(onPulled).finally(() => {
    activeSync = null;
    if (syncAgain) {
      syncAgain = false;
      requestCloudSync();
    }
  });
  return activeSync;
}

async function runSync(onPulled: () => Promise<void>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const state = useCloudStore.getState();
  if (!state.userId) return false;
  const userId = state.userId;
  const priorOwner = localStorage.getItem(OWNER_KEY);
  if (priorOwner && priorOwner !== userId) {
    useCloudStore.setState({
      status: 'error',
      message: 'Questo browser contiene dati di un altro account. Accedi con quello originale.',
    });
    return false;
  }
  localStorage.setItem(OWNER_KEY, userId);
  useCloudStore.setState({ status: 'syncing', message: null });

  try {
    const client = getSupabaseClient();
    const firstSyncKey = `samar-cloud-ready:${userId}`;
    const firstSync = localStorage.getItem(firstSyncKey) !== '1';
    const resetting = localStorage.getItem(RESET_KEY) === userId;

    if (resetting) {
      const { error } = await client.from('records').delete().eq('user_id', userId);
      if (error) throw error;
      localStorage.removeItem(RESET_KEY);
    }

    const cloudBefore = firstSync && !resetting ? await readCloudRows(userId) : [];
    const cloudHasSettings = cloudBefore.some((row) => row.collection === 'settings');
    const local = (await dbAdapter.exportAll()).collections;
    const pending = await dbAdapter.pendingChanges();
    const changed = new Set(pending.map((entry) => `${entry.entity}:${entry.entityId}`));
    const toUpload: {
      user_id: string;
      collection: Collection;
      record_id: string;
      payload: Base;
      updated_at: string;
    }[] = [];

    for (const collection of COLLECTIONS) {
      // A fresh device creates default settings locally during hydration. The
      // account's existing settings take precedence over that temporary row.
      if (firstSync && cloudHasSettings && collection === 'settings') continue;
      for (const record of local[collection] as Base[]) {
        if (!firstSync && !resetting && !changed.has(`${collection}:${record.id}`)) continue;
        toUpload.push({
          user_id: userId,
          collection,
          record_id: record.id,
          payload: record,
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (let from = 0; from < toUpload.length; from += 100) {
      const { error } = await client.from('records').upsert(toUpload.slice(from, from + 100), {
        onConflict: 'user_id,collection,record_id',
      });
      if (error) throw error;
    }

    if (localStorage.getItem(RESET_KEY) === userId) return false;

    const remote = await readCloudRows(userId);
    if (localStorage.getItem(RESET_KEY) === userId) return false;
    const processed = new Set(pending.map((entry) => entry.id));
    const newerChanges = new Set(
      (await dbAdapter.pendingChanges())
        .filter((entry) => !processed.has(entry.id))
        .map((entry) => `${entry.entity}:${entry.entityId}`)
    );
    if (firstSync && cloudHasSettings) {
      await dbAdapter.replaceSettings(
        remote.filter((row) => row.collection === 'settings').map((row) => row.payload as never)
      );
    }
    for (const collection of COLLECTIONS) {
      if (firstSync && cloudHasSettings && collection === 'settings') continue;
      const records = remote
        .filter(
          (row) =>
            row.collection === collection && !newerChanges.has(`${collection}:${row.record_id}`)
        )
        .map((row) => row.payload);
      if (records.length > 0) await dbAdapter[collection].bulkUpsert(records as never[]);
    }

    await dbAdapter.clearPendingChanges(pending.map((entry) => entry.id));
    localStorage.setItem(firstSyncKey, '1');
    await onPulled();
    useCloudStore.setState({ status: 'synced', message: null, lastSync: new Date().toISOString() });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sincronizzazione non riuscita.';
    useCloudStore.setState({ status: 'error', message });
    return false;
  }
}
