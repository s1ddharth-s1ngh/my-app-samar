import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { dbAdapter } from './db';
import { syncCloud, useCloudStore } from './cloud';

type Row = {
  user_id: string;
  collection: string;
  record_id: string;
  payload: { id: string; [key: string]: unknown };
};
const remote = new Map<string, Row>();
const userId = '10a6df48-d7cb-4fbf-9532-c4187f83af51';

const client = {
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          order: () => ({
            range: async (from: number, to: number) => ({
              data: [...remote.values()].slice(from, to + 1),
              error: null,
            }),
          }),
        }),
      }),
    }),
    upsert: async (rows: Row[]) => {
      for (const row of rows) remote.set(`${row.collection}:${row.record_id}`, row);
      return { error: null };
    },
    delete: () => ({
      eq: async () => {
        remote.clear();
        return { error: null };
      },
    }),
  }),
};

vi.mock('@/data/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => client,
}));

describe('cloud synchronization', () => {
  beforeEach(async () => {
    remote.clear();
    localStorage.clear();
    await dbAdapter.init(`cloud_test_${crypto.randomUUID()}`);
    useCloudStore.setState({
      userId,
      email: 'test@example.com',
      status: 'idle',
      message: null,
      lastSync: null,
    });
  });

  it('uploads local edits, pulls remote records, and clears only synced outbox entries', async () => {
    const localId = crypto.randomUUID();
    const remoteId = crypto.randomUUID();
    const base = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    await dbAdapter.projects.create({
      id: localId,
      ...base,
      name: 'Locale',
      description: null,
      color: '#fff',
      icon: 'folder',
      status: 'active',
      order: 0,
    });
    remote.set(`projects:${remoteId}`, {
      user_id: userId,
      collection: 'projects',
      record_id: remoteId,
      payload: {
        id: remoteId,
        ...base,
        name: 'Remoto',
        description: null,
        color: '#fff',
        icon: 'folder',
        status: 'active',
        order: 1,
      },
    });

    const pulled = vi.fn(async () => {});
    expect(await syncCloud(pulled)).toBe(true);
    expect(remote.get(`projects:${localId}`)?.payload).toMatchObject({ name: 'Locale' });
    expect((await dbAdapter.projects.get(remoteId))?.name).toBe('Remoto');
    expect(await dbAdapter.pendingChanges()).toHaveLength(0);
    expect(pulled).toHaveBeenCalledOnce();
    expect(useCloudStore.getState().status).toBe('synced');
  });

  it('replaces cloud records with the full local state after a reset', async () => {
    const oldId = crypto.randomUUID();
    const newId = crypto.randomUUID();
    const base = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    remote.set(`projects:${oldId}`, {
      user_id: userId,
      collection: 'projects',
      record_id: oldId,
      payload: { id: oldId, ...base, name: 'Vecchio' },
    });
    await dbAdapter.projects.bulkUpsert([
      {
        id: newId,
        ...base,
        name: 'Nuovo',
        description: null,
        color: '#fff',
        icon: 'folder',
        status: 'active',
        order: 0,
      },
    ]);
    localStorage.setItem(`samar-cloud-ready:${userId}`, '1');
    localStorage.setItem('samar-cloud-reset', userId);

    expect(await syncCloud(async () => {})).toBe(true);
    expect(remote.has(`projects:${oldId}`)).toBe(false);
    expect(remote.get(`projects:${newId}`)?.payload).toMatchObject({ name: 'Nuovo' });
    expect(localStorage.getItem('samar-cloud-reset')).toBeNull();
  });
});
