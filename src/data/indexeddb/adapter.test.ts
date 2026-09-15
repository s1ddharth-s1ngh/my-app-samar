import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDBAdapter } from './adapter';

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;

  beforeEach(async () => {
    adapter = new IndexedDBAdapter();
    await adapter.init('test_db_' + Date.now());
  });

  it('create -> list -> update -> soft delete', async () => {
    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      name: 'Test Project',
      description: null,
      color: '#000',
      icon: 'star',
      status: 'active' as const,
      order: 1,
    };

    // Create
    await adapter.projects.create(item);

    // List
    let list = await adapter.projects.list();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Test Project');

    // Update
    await adapter.projects.update(item.id, { name: 'Updated Project' });
    list = await adapter.projects.list();
    expect(list[0].name).toBe('Updated Project');

    // Soft delete
    await adapter.projects.remove(item.id);

    // Sparisce da list
    list = await adapter.projects.list();
    expect(list.length).toBe(0);

    // Ma è ancora nel DB se cerchiamo con includeDeleted
    const all = await adapter.projects.list({ includeDeleted: true });
    expect(all.length).toBe(1);
    expect(all[0].deletedAt).not.toBeNull();
  });

  it('scrive un record in outbox per ogni mutazione', async () => {
    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      name: 'Test Outbox',
      description: null,
      color: '#000',
      icon: 'star',
      status: 'active' as const,
      order: 1,
    };

    await adapter.projects.create(item);
    await new Promise((r) => setTimeout(r, 10));
    await adapter.projects.update(item.id, { name: 'Updated' });
    await new Promise((r) => setTimeout(r, 10));
    await adapter.projects.remove(item.id);

    const db = (adapter as any).db;
    const outbox = await db.getAll('outbox');
    outbox.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt));

    expect(outbox.length).toBe(3);

    expect(outbox[0].op).toBe('create');
    expect(outbox[0].entityId).toBe(item.id);
    expect(outbox[0].entity).toBe('projects');

    expect(outbox[1].op).toBe('update');
    expect(outbox[1].payload).toEqual({ name: 'Updated' });

    expect(outbox[2].op).toBe('remove');
  });
});
